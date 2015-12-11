var cb = new Codebird;
cb.setConsumerKey("", ""); // according to your twitter account
cb.setToken("", ""); // according to your twitter account

var influencersList = ["EventsUncovered", "helloendless", "themiceblog","lizkingevents"]; // put here your competitor's account names
var ourFollowersList = [];
var followersList = [];
var tweetsList = [];
var influencer = 0;
var followerShowing = -1;
var loaded = 0;
var numOfTweets = 10;
var tweet = -1;
var follower;

// Set follower in all followers list to the last saved in local storage, if nothing is saved set to -1
if ((localStorage.getItem('currentFollower') === null) || (localStorage.getItem('currentFollower') === NaN)) {
	localStorage.setItem('currentFollower', -1);
}
follower = localStorage.getItem('currentFollower');

// Get the list of zolirobag followers
function ourFollowers() {
		cb.__call(
		"followers_ids",
		{screen_name: "zolirobag"}, 
		    function (reply) {
		        ourFollowersList = reply.ids;
		        if ( ourFollowersList.length === 'undefined' ) {
		        	window.alert('Too many requests, please wait a few minutes');
		        	return;
		        }
		        console.log("our followers:29", ourFollowersList.length);
		        getInfluencerFollowers(influencersList, influencer);
			}
		);
}

// Get an influencer's followers
function getInfluencerFollowers(list,index){
		cb.__call(
		    "followers_ids",
		    {screen_name:list[index]}, 
		    function (reply) {
		    	console.log("getInfluencerFollowers:41");
		        followersList = reply.ids;
		      	loadNext();
			}
		);
}

// load another 5 followers tweets
function readyUsers() {
	for (var i = 0; i < 10; i++) {
		loadNext();
	}
}

// check if a user is already following zolirobag
function checkFollowing() {
	for (var i = 0; i < ourFollowersList.length; i++) {
		if (ourFollowersList[i] === followersList[follower]) {
			return true;
		}
	}
	return false;
}

// get up to 10 latest tweets from a user
function loadNext() {
	follower++;
	
	// Check if there are no more followers from this influencer - then move to next influencer
	if ( follower > followersList.length-1 ) {
		follower = -1;
		influencer++;
		getInfluencerFollowers(influencersList,influencer);
	}

	// check if we this user is already following us
	var wefollow = checkFollowing();
	while (wefollow) {
	    follower++;
	    wefollow = checkFollowing();
	}

	cb.__call(
		"users_show",
		{user_id:followersList[follower]},
		function (reply) {

			// check that the user is not protected
			if ( reply.protected ) {
				nextUser(1);
				return;
			}

			else {
				cb.__call(
				"statuses_userTimeline",
				{user_id:reply.id,
				count:numOfTweets,
				include_rts:'false'},
					function (reply) {
						console.log(reply);
						tweetsList.push(reply);
						loaded++;
						// Check if this is the first follower to show on screen
						if ( followerShowing === -1 ) {
							nextUser(1);
						}

		  			}
				);
			}

		}
	);
}

/* get the next user according to direction
if direction is bigger than 0, move to the next follower
if direction is smaller than 0, move to the previous follower
*/
function nextUser(direction) {

	// Check if direction is bigger than 0, move forward
	if ( direction > 0 ) {
		followerShowing++;
		tweet = -1;

		console.log('loaded :130 ', loaded);
		console.log('followerShowing :131 ', followerShowing);
		// Get more tweets loaded in background if there are less than 5 followers tweets loaded
		if ((loaded - followerShowing ) < 10 ) {
	 		readyUsers();
		}

	}

	// Direction is smaller than 0, move to previous follower
	else {
		followerShowing--;
		tweet = -1;
	}
	var current = parseInt(localStorage.getItem('currentFollower'));
	current++;
	localStorage.setItem('currentFollower', current);
	console.log('local storage : ' + localStorage.getItem('currentFollower'));
	nextTweet(1);
}

// Show the next tweet for the current showing follower
function nextTweet(direction) {

	// Check if direction is smaller than 0, move to previous tweet
	if (direction < 0 ) {
		tweet = tweet - 1;

		// If there are no previous tweets, move to previous follower
		if (tweet < 0) {
			nextUser(-1);
		}

	}

	else {
		tweet++;

		// If there no more tweets from this user - move to next user
		if (tweet > (tweetsList[followerShowing].length - 1) ){ 
			nextUser(1);
		}

	}
	
	$('#image').html("<img id='profimg' src=" + tweetsList[followerShowing][tweet].user.profile_image_url +" class='img-thumbnail'>");
	$('#name').html("<p>" + tweetsList[followerShowing][tweet].user.name + "</p>");
	$('#screenname').html("<p> <a target='_blank' href='https://twitter.com/" + tweetsList[followerShowing][tweet].user.screen_name + "' > @" + tweetsList[followerShowing][tweet].user.screen_name + "</a></p>");
	$('#bio').html("<p>" + tweetsList[followerShowing][tweet].user.description + "</p>");
	$('#text').html("<p>" + tweetsList[followerShowing][tweet].text + "</p>");
	$('#time').html("<p>" + tweetsList[followerShowing][tweet].created_at + "</p>");
	if (tweetsList[followerShowing][tweet].favorited) {
		$('#favorite').html("<span class='glyphicon glyphicon-star'></span>");
	}
	else {
		$('#favorite').html("<span class='glyphicon glyphicon-star-empty'></span>");
	}	
}

// Favorite the current showing tweet
function favoriteTweet() {
	console.log(tweetsList[followerShowing][tweet].id);

	// If the tweet is already favorited, un-favorite it
	if (tweetsList[followerShowing][tweet].favorited) {
		cb.__call(
			"favorites_destroy",
			{id:tweetsList[followerShowing][tweet].id_str},
			function (reply) {
				tweetsList[followerShowing][tweet] = reply;

			}
		);
		$('#favorite').html("<span class='glyphicon glyphicon-star-empty'></span>");
	}

	// Otherwise, favorite it
	else {
		cb.__call(
			"favorites_create",
			{id:tweetsList[followerShowing][tweet].id_str},
			function (reply) {
				tweetsList[followerShowing][tweet] = reply;
			}
		);
		$('#favorite').html("<span class='glyphicon glyphicon-star'></span>");
	}

}

// Clear local storage, begin from first follower of first influencer
function clearPointer() {
	localStorage.clear();
	localStorage.setItem('currentFollower', -1);
	follower = -1;
	tweet =-1;
	followerShowing = -1;
	loaded = -1;
	influencer = 0;
	ourFollowers();
}

// Run
ourFollowers();
