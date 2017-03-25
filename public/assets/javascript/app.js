///////////////////////////////////////////////////////////////////////////////
// VARIABLES
///////////////////////////////////////////////////////////////////////////////

var clientId = '277172047453-p51btc78lu7fatpjn3kkk75dula5kao3';
var apiKey = 'AIzaSyBEfyrju1DaN8Tv-zALl1uBPhwNSJPycnw'
var discoveryDocs = [
	"https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
	"https://people.googleapis.com/$discovery/rest?version=v1"
];
var scopes = "https://www.googleapis.com/auth/calendar";
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var calendarId = "";
var user = {
	obj : {},
	id : "",
	photo : "",
	first : "",
	last : "",
	full : "",
	email: ""
};
var ingredients;
var pantryList = [];
var IngredientList = [];
var selectedIngredientList = [];
var name;
var test;

$(document).ready(function() {


///////////////////////////////////////////////////////////////////////////////
// GOOGLE SIGN-IN AND SIGN-OUT FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

function initClient() {
	gapi.client.init({
		apiKey: apiKey,
		discoveryDocs: discoveryDocs,
		clientId: clientId,
		scope: scopes
	}).then(function () {
		// Listen for sign-in state changes.
		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

		// Handle the initial sign-in state.
		updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		if (window.location.pathname === "/app.html") {
			signoutButton.onclick = handleSignoutClick;
		} else if (window.location.pathname === "/login.html") {
			authorizeButton.onclick = handleAuthClick;
		} else {
			console.log("strange error, man!");
		}
	});
}

function updateSigninStatus(isSignedIn) {
	if (isSignedIn) {
		if (window.location.pathname === "/login.html") {
			window.location = "app.html"
		}
		//authorizeButton.style.display = 'none';
		//signoutButton.style.display = 'block';
		getPeopleDetails();
		getCalendarId();
	} else {
		if (window.location.pathname === "/app.html") {
			window.location = "login.html"
		}
		//authorizeButton.style.display = 'block';
		//signoutButton.style.display = 'none';
	}
}

function handleAuthClick(event) {
	gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
	gapi.auth2.getAuthInstance().signOut();
}

function appendPre(message) {
	var pre = document.getElementById('content');
	var textContent = document.createTextNode(message + '\n');
	pre.appendChild(textContent);
}


///////////////////////////////////////////////////////////////////////////////
// PAGE SETUP
///////////////////////////////////////////////////////////////////////////////

$(function() {
	// SETUP
	var $list, $newItemForm, $newItemButton;
	var item = '';
	$list = $('ul');
	$newItemForm = $('#newItemForm');
	$newItemButton = $('#newItemButton');

	$('li').hide().each(function(index) {
		$(this).delay(550 * index).fadeIn(1700);
	});
	// ITEM COUNTER
	function updateCount() {
		var items = $('li[class!=complete]').length;
		$('#counter').text(items);
	}
	updateCount();

	// SETUP FORM FOR NEW ITEMS
	$newItemButton.show();
	$newItemForm.hide();
	$('#showForm').on('click', function() {
		$newItemButton.hide();
		$newItemForm.show();
	});

	// ADDING A NEW LIST ITEM
	$newItemForm.on('submit', function(e) {
		e.preventDefault();
		var text = $('input:text').val();
		$list.append('<li>' + text + '</li>');
		$('input:text').val('');
		updateCount();
		sendToFB(text);
	});

	//CLICK HANDLING - USES DELEGATION ON <ul> ELEMENT
	$list.on('click', 'li', function() {
		var $this = $(this);
		var complete = $this.hasClass('complete');
		var selectedIngredient = $(this).text();
		$('#selected-ingredients-container').prepend(`<p class='selectedIngredient'>${selectedIngredient}</p> <br>`);
		selectedIngredientList.push(selectedIngredient);
		console.log(selectedIngredientList);

		if (complete === true) {
			$this.animate({
				opacity: 0.0,
				paddingLeft: '+=180'
			}, 500, 'swing', function() {
				$this.remove();
			});
		} else {
			item = $this.text();
			$this.remove();
			$list
			// .append('<li class=\"complete\">' + item + '</li>')
			.hide().fadeIn(300);
			updateCount();
		}
	});
});

function makeSignOutButton() {
	$('#signout-button').append("Sign Out, " + user.first);
	$('#signout-button').append('<img src="' + user.photo + '" class="square">');
}

function populatePantryItems(snapshot) {
	var item = $("<li>");
	item.html(snapshot)
	$('#pantry-ul').append(item);
}


///////////////////////////////////////////////////////////////////////////////
// SPOONACULAR API CALL AND TABLE DRAW
///////////////////////////////////////////////////////////////////////////////

var getRecipe = function(){
	return $.ajax({
		url: 'https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/findByIngredients?fillIngredients=false&ingredients=' + selectedIngredientList.join(",") + '&limitLicense=false&number=5&ranking=1', // The URL to the API. You can get this in the API page of the API you intend to consume
		type: 'GET', // The HTTP Method, can be GET POST PUT DELETE etc
		data: {}, // Additional parameters here
		dataType: 'json',
		success: function(data) {
			var results = data;
			console.log(results);
			for (var i = 0; i < results.length; i++) {
				var recipe = results[i].id;
				console.log(recipe);
				$.ajax({
					url: 'https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/' + recipe + '/information?includeNutrition=false', // The URL to the API. You can get this in the API page of the API you intend to consume
					type: 'GET', // The HTTP Method, can be GET POST PUT DELETE etc
					data: {}, // Additional parameters here
					dataType: 'json',
					success: function(data) {
						var img = data.image;
						var name = data.title;
						var time = data.readyInMinutes;
						var steps = data.instructions.slice(0,400);
						var more = data.sourceUrl;
						console.log((data));
						$('#result-container').append(`
							<div class="recipes container">
								<div class="col-sm-3">
									<img src="${img}">
								</div>
								<div class="col-sm-9">
									<div class='recipe-name'>${name}</div>
									<div class='recipe-url' style="display:hidden">${more}</div>
									<div class='sub-text'> Ready in: ${time} minutes </div>
									<br>
									<div class='text'> Directions : ${steps} ... <a href="${more}">Read More...</a></div>
									<br>
									<hr>
									<div class='sub-text'>Add to calendar on:</div>
									<input type='text' placeholder='2017-03-29' style="margin:3px 0px">
									<button class="google-calendar-btn" id="cal-btn-${i}">submit</button>
								</div>
							</div>
						`);
					},
					error: function(err) {
						alert(err);
					},
					beforeSend: function(xhr) {
						xhr.setRequestHeader("X-Mashape-Authorization",
						"DrNwVlaI6BmshQBWAGcWVKEwd2Nop1lT1sHjsnhKbHXzD5wrkP"); // Enter here your Mashape key
					}
				});
			};
		},
		error: function(err) { alert(err); },
		beforeSend: function(xhr) {
			xhr.setRequestHeader("X-Mashape-Authorization", "DrNwVlaI6BmshQBWAGcWVKEwd2Nop1lT1sHjsnhKbHXzD5wrkP"); // Enter here your Mashape key
		}
	});
};


///////////////////////////////////////////////////////////////////////////////
// GOOGLE IDENTITY FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

function getPeopleDetails() {
	gapi.client.people.people.get({
		resourceName: 'people/me'
	}).then(function(response) {
		getCalendarId()
		user.obj = response.result;
		user.photo = response.result.photos[0].url;
		user.first = response.result.names[0].givenName;
		user.last = response.result.names[0].familyName;
		user.full = response.result.names[0].displayName;
		user.email = response.result.emailAddresses[0].value;
		user.id = response.result.metadata.sources[0].id
		makeSignOutButton()
	}, function(reason) {
		console.log('Error: ' + reason.result.error.message);
	});
}

///////////////////////////////////////////////////////////////////////////////
// GOOGLE CALENDAR FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

function writeExpirationCalendar(food, date) {
	var event = {
		'summary': food + " expires",
		'description': "use " + food + " by today!",
		'start': {
			'date': date
		},
		'end': {
			'date': date
		},
		'reminders': {
			'useDefault': false,
			'overrides': [
				{'method': 'email', 'minutes': 24 * 60 * 5},
				{'method': 'email', 'minutes': 24 * 60 * 2},
				{'method': 'popup', 'minutes': 24 * 60 * 1},
			]
		}
	};

	var request = gapi.client.calendar.events.insert({
		'calendarId': calendarId,
		'resource': event
	});

	request.execute(function(event) {
		appendPre('Event created: ' + event.htmlLink);
	})
}

function writeRecipeCalendar(recipe, url, date) {
	console.log("recipe is " + recipe);
	console.log("url is " + url);
	console.log("date is " + recipe);
	var event = {
		'summary': recipe,
		'description': url,
		'start': {
			'date': date
		},
		'end': {
			'date': date
		},
		'reminders': {
			'useDefault': true
		}
	};

	var request = gapi.client.calendar.events.insert({
		'calendarId': calendarId,
		'resource': event
	});

	request.execute(function(event) {
		appendPre('Event created: ' + event.htmlLink);
	})
}

function getCalendarId() {
	gapi.client.calendar.calendarList.list({
    }).then(function(response){
    	for (var i = 0; i < response.result.items.length; i++){
    		if (response.result.items[i].primary) {
    			calendarId = response.result.items[i].id;
    			break;
    		};
    	};
    });
}

function sendToFB(ing) {
	console.log(ing)
	database.ref("/users/" + user.id + "/ingredients/").push(ing);
}

///////////////////////////////////////////////////////////////////////////////
// CLICK FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

$(document).on('click', '.google-calendar-btn', function(e) {
		var parent = e.target.parentElement;
		var recipeName = parent.querySelector('.recipe-name').textContent;
		var dateValue = parent.querySelector('input').value;
		var recipeURL = parent.querySelector('.recipe-url').textContent;
		writeRecipeCalendar(recipeName, recipeURL, dateValue);
});

$("#cal-btn-submit").on('click', function(event){
	event.preventDefault();
	var food = $('#ingr-name').val().trim();
	var date = $('#expr-date').val().trim();
	writeCalEvent(food, date);
})

$('#search-btn').on('click', function(){
	$('#result-container').empty();
	getRecipe();
});

handleClientLoad();
if (this.readyState === 'complete') this.onload()
var config = {
	apiKey: "AIzaSyAjLOCnFetZBaMBqLoAxQOJiuve81ijJlU",
	authDomain: "secondchancepantry-f65c5.firebaseapp.com",
	databaseURL: "https://secondchancepantry-f65c5.firebaseio.com",
	storageBucket: "secondchancepantry-f65c5.appspot.com",
	messagingSenderId: "1083855170391"
};
firebase.initializeApp(config);
var database = firebase.database();

///////////////////////////////////////////////////////////////////////////////
// FIREBASE FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

database.ref("/users/" + user.id).on("child_added", function(childSnapshot) {
	test = childSnapshot.val();
	for (key in childSnapshot.val().ingredients) {
		populatePantryItems(childSnapshot.val().ingredients[key]);
	}
})
})



