var express               = require("express"),
    mongoose              = require("mongoose"),
    passport              = require("passport"),
    bodyParser            = require("body-parser"),
    User                  = require("./models/user"),
	UserData              = require("./models/userData"),
	FreeTimes	          = require("./models/freeTime"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");
	request 	          = require("request")
    
mongoose.connect("mongodb://localhost/TennisLinkDB");

var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true})); //required for forms that post data via request
app.use(require("express-session")({ //require inline exp session
    secret: "be the best tennis player!", //used to encode and decode data during session (it's encrypted)
    resave: false,          // required
    saveUninitialized: false   //required
}));

app.use(function(req, res, next){ //This is the middleware that is run across all routes. It ensures that there is a user is loggedin before displaying the navigation
	res.locals.currUser = req.session.passport;
	next();
});



// code to set up passport to work in our app -> THESE TWO METHODS/LINES ARE REQUIRED EVERY TIME
app.use(passport.initialize());
app.use(passport.session());

//plugins from passportlocalmongoose in user.js file
passport.use(new LocalStrategy(User.authenticate())); //creating new local strategy with user authenticate from passport-local-mongoose
passport.serializeUser(User.serializeUser()); //responsible for encoding it, serializing data and putting it back into session
passport.deserializeUser(User.deserializeUser()); //responsible for reading session, taking data from session that is encoded and unencoding it

//=======================================================================================================
//EXTRAS
//=======================================================================================================
var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat - p1.lat);
  var dLong = rad(p2.lng - p1.lng);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

var updateTimeList = function(dayList, containerList){
	var newStartTime= parseInt(dayList[0].substring(0, dayList[0].indexOf(":")));
	var newEndTime = parseInt(dayList[1].substring(0, dayList[1].indexOf(":")));
	var update = false;
	for(var i = 0; i < containerList.length; i++){
		var currStartTime= parseInt(containerList[i][0].substring(0, containerList[i][0].indexOf(":")));
		var currEndTime = parseInt(containerList[i][1].substring(0, containerList[i][1].indexOf(":")));
		if(newStartTime <= currStartTime && newEndTime >= currEndTime){
			containerList[i][0] = dayList[0];
		    containerList[i][1] = dayList[1];
			update = true;
		}else if(newStartTime <= currEndTime && newStartTime >= currStartTime){
			if(newEndTime > currEndTime){
				containerList[i][1] = dayList[1];
				update = true;
			}
		}else if(newEndTime <= currEndTime && newEndTime >= currStartTime){
			if(newStartTime < currStartTime){
				containerList[i][0] = dayList[0];
				update = true;
			}	
		}
	}
	// var removeList = [];
	// for(var i = 0; i < containerList.length; i++){
	// 	for(var j = i+1; j < containerList.length; j++){
	// 		if(containerList){
			   
	// 		}
	// 	}
	// }
	if(!update){
		containerList.push(dayList);
	}
}

	var checkTime = function(time, timeList){
		for(var i = 0; i < timeList.length; i++){
			var leftBound = timeList[i][0].substring(0, timeList[i][0].indexOf(":"));
			var rightBound =  timeList[i][1].substring(0, timeList[i][1].indexOf(":"));
			if(time >= leftBound && time <= rightBound){
				return "shade";
			}
		}
		return "";
	}
//=======================================================================================================
//ROUTES
//=======================================================================================================


app.get("/", function(req, res){
    res.render("home");
});

app.get("/secret", isLoggedIn, function(req, res){
	UserData.find({username: req.session.passport.user}, function(err, userData){
		if(err){
			console.log(err);
		}else{
			url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + userData[0].city + "&key=AIzaSyB2_4SMM3Bxc-XE90LPTqao04m_XYkbsEw"
				request(url, function(error, response, body){
					if(!error && response.statusCode == 200){
						bodyObject = JSON.parse(body)
						var userPosition = bodyObject.results[0].geometry.location;
						   	UserData.find({ username: {$ne: req.session.passport.user}}, function(err, userData){
								if(err){
									console.log(err);
								}else{
									var counter = 0;
									inputData = [];
									console.log("This is userData");
									userData.forEach(function(userDat) {
										url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + userDat.city + "&key=AIzaSyB2_4SMM3Bxc-XE90LPTqao04m_XYkbsEw"
										request(url, function(error, response, body){				
											if(!error && response.statusCode == 200){
												bodyObject = JSON.parse(body)						
												var targetPosition = bodyObject.results[0].geometry.location;
												// console.log("THIS IS TARGET");
												// console.log(targetPosition);
												// console.log("This is user");
												// console.log(userPosition);
												// c;onsole.log("This is distance")
												// console.log(getDistance(userPosition, targetPosition));
												if(getDistance(userPosition, targetPosition) < (50 * 1609.34)){
													console.log("This is run");
													// console.log(userDat);
													inputData.push(userDat);
												}
												console.log("this is counter");
												console.log(counter);
												// console.log("This is inputData1");
												// console.log(inputData);
												console.log("this is userData length");
												console.log(userData.length);
											}else{
												console.log(error);
											}
											counter++;
											if(counter == userData.length){
													console.log("FUCKKKKKKKKKKKKKKKKKKK");
													console.log("This is input data");
													console.log(inputData);
													res.render("secret", {userData: inputData});
											}
										});
									});	
								}
						});
					}else{
						alert("")
						res.redirect("/appointment");
						console.log(response.statusCode);
					}
				});
		}
	});
});

app.get("/appointment", isLoggedIn, function(req, res){
	FreeTimes.findOne({username:req.user.username}, function(err, user){
			if(err){
				console.log(err);
			}else{		
				res.render("appointment", {user: user, checkTime: checkTime});
			}
	});			
});

app.post("/appointment", function(req, res){
	console.log(req.body);
	var badInput = false;
	if(req.body.updateMon && req.body.updateMon == "update"){
		if(parseInt(req.body.mondayStartTime.substring(0, req.body.mondayStartTime.indexOf(":"))) > parseInt(req.body.mondayEndTime.substring(0, 						    
		req.body.mondayEndTime.indexOf(":")))){
			console.log("monday is invalid");
			badInput = true;
		}
	}
	if(req.body.updateTues && req.body.updateTues == "update"){
		if(parseInt(req.body.tuesdayStartTime.substring(0, req.body.tuesdayStartTime.indexOf(":"))) > parseInt(req.body.tuesdayEndTime.substring(0, 						    
		req.body.tuesdayEndTime.indexOf(":")))){
			console.log("tuesday is invalid");
			badInput = true;
		}
	}
	if(req.body.updateWed && req.body.updateWed == "update"){
		if(parseInt(req.body.wednesdayStartTime.substring(0, req.body.wednesdayStartTime.indexOf(":"))) > parseInt(req.body.wednesdayEndTime.substring(0, 							req.body.wednesdayEndTime.indexOf(":")))){
			console.log("wednesday is invalid");
			badInput = true;
		}
	}
	if(req.body.updateThurs && req.body.updateThurs == "update"){
		if(parseInt(req.body.thursdayStartTime.substring(0, req.body.thursdayStartTime.indexOf(":"))) > parseInt(req.body.thursdayEndTime.substring(0, 						    
		req.body.thursdayEndTime.indexOf(":")))){
			console.log("thursday is invalid");
			badInput = true;
		}
	}
	if(req.body.updateFri && req.body.updateFri == "update"){
		if(parseInt(req.body.fridayStartTime.substring(0, req.body.fridayStartTime.indexOf(":"))) > parseInt(req.body.fridayEndTime.substring(0, 						   
		req.body.fridayEndTime.indexOf(":")))){
			console.log("friday is invalid");
			badInput = true;
		}
	}
	if(req.body.updateSat && req.body.updateSat == "update"){
		if(parseInt(req.body.saturdayStartTime.substring(0, req.body.saturdayStartTime.indexOf(":"))) > parseInt(req.body.saturdayEndTime.substring(0, 						    
		req.body.saturdayEndTime.indexOf(":")))){
			console.log("saturday is invalid");
			badInput = true;
		}
	}
	if(req.body.updateSun && req.body.updateSun == "update"){
		if(parseInt(req.body.sundayStartTime.substring(0, req.body.sundayStartTime.indexOf(":"))) > parseInt(req.body.sundayEndTime.substring(0, 						    
		req.body.sundayEndTime.indexOf(":")))){
			console.log("sunday is invalid");
			badInput = true;
		}
	}
	if(badInput){
		//pass in a variable to the ejs and make sure that the user knows that something is wrong 
	}else{
		FreeTimes.findOne({username:req.user.username}, function(err, user){
			if(err){
				console.log(err);
			}else{
				var mondayList = [];
				mondayList.push(req.body.mondayStartTime);
				mondayList.push(req.body.mondayEndTime);
				var tuesdayList = [];
				tuesdayList.push(req.body.tuesdayStartTime);
				tuesdayList.push(req.body.tuesdayEndTime);
				var wednesdayList = [];
				wednesdayList.push(req.body.wednesdayStartTime);
				wednesdayList.push(req.body.wednesdayEndTime);
				var thursdayList = [];
				thursdayList.push(req.body.thursdayStartTime);
				thursdayList.push(req.body.thursdayEndTime)
				var fridayList = [];
				fridayList.push(req.body.fridayStartTime);
				fridayList.push(req.body.fridayEndTime);
				var saturdayList = [];
				saturdayList.push(req.body.saturdayStartTime);
				saturdayList.push(req.body.saturdayEndTime)
				var sundayList = [];
				sundayList.push(req.body.sundayStartTime);
				sundayList.push(req.body.sundayEndTime);
				if(user){	
					if(req.body.updateMon && req.body.updateMon == "update"){
						updateTimeList(mondayList, user.mondayFreeTimes);
					}else if(req.body.updateTues && req.body.updateTues == "update"){
						updateTimeList(tuesdayList, user.tuesdayFreeTimes);
					}else if(req.body.updateWed && req.body.updateWed == "update"){
						updateTimeList(wednesdayList, user.wednesdayFreeTimes);
					}else if(req.body.updateThurs && req.body.updateThurs == "update"){
						updateTimeList(thursdayList, user.thursdayFreeTimes);
					}else if(req.body.updateFri && req.body.updateFri == "update"){
						updateTimeList(fridayList, user.fridayFreeTimes);
					}else if(req.body.updateSat && req.body.updateSat == "update"){
						updateTimeList(saturdayList, user.saturdayFreeTimes);
					}else if(req.body.updateSun && req.body.updateSun == "update"){
						updateTimeList(sundayList, user.sundayFreeTimes);		
					}
					
					if(req.body.updateMon && req.body.updateMon == "clear"){
						user.mondayFreeTimes = [];
					}else if(req.body.updateTues && req.body.updateTues == "clear"){
						user.tuesdayFreeTimes = [];
					}else if(req.body.updateWed && req.body.updateWed == "clear"){
						user.wednesdayFreeTimes = [];
					}else if(req.body.updateThurs && req.body.updateThurs == "clear"){
						user.thursdayFreeTimes = [];
					}else if(req.body.updateFri && req.body.updateFri == "clear"){
						user.fridayFreeTimes = [];
					}else if(req.body.updateSat && req.body.updateSat == "clear"){
						user.saturdayFreeTimes = [];
					}else if(req.body.updateSun && req.body.updateSun == "clear"){
						user.sundayFreeTimes = [];	
					}
					user.save(function(err, user){
						if(err){
							console.log(err);
						}else{
							console.log(user);
						}
					}
				);	
				}else{
					var mondayContainer = []
					if(req.body.updateMon && req.body.updateMon == "update"){
						mondayContainer.push(mondayList);
					}
					var tuesdayContainer = []
					if(req.body.updateTues && req.body.updateTues == "update"){
						tuesdayContainer.push(tuesdayList);
					}
					var wednesdayContainer = []
					if(req.body.updateWed && req.body.updateWed == "update"){
						wednesdayContainer.push(wednesdayList);
					}
					var thursdayContainer = []
					if(req.body.updateThurs && req.body.updateThurs == "update"){
						thursdayContainer.push(thursdayList);
					}
					var fridayContainer = []
					if(req.body.updateFri && req.body.updateFri == "update"){
						fridayContainer.push(fridayList);
					}
					var saturdayContainer = []
					if(req.body.updateSat && req.body.updateSat == "update"){
						saturdayContainer.push(saturdayList);
					}
					var sundayContainer = []
					if(req.body.updateSun && req.body.updateSun == "update"){
						sundayContainer.push(sundayList);
					}
					FreeTimes.create({
						mondayFreeTimes: mondayContainer,
						tuesdayFreeTimes: tuesdayContainer,
						wednesdayFreeTimes: wednesdayContainer,
						thursdayFreeTimes: thursdayContainer,
						fridayFreeTimes: fridayContainer,
						saturdayFreeTimes: saturdayContainer,
						sundayFreeTimes: sundayContainer,
						username: req.user.username,
						id: req.user._id
					}, function(err, freeTimes){
						console.log(freeTimes);
					});		
				}				
			}
		});
	}
	res.redirect("/appointment");
});

//=======================================================================================================
// AUTHENTICATION ROUTES
//=======================================================================================================

//show sign up form
app.get("/register", function(req, res){
    res.render("register");
});

//handling user sign up
app.post("/register", function(req, res){
	url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + req.body.city + "&key=AIzaSyB2_4SMM3Bxc-XE90LPTqao04m_XYkbsEw";
	request(url, function(error, response, body){
		if(!error && response.statusCode == 200){
			User.register(new User({username: req.body.username}), req.body.password, function (err, user){ //create new user object (only username is passed b/c password is not saved to database). we pass password as 2nd argument to User.register -> takes new user -> hash password (encrypts, store in database) -> it will return a new user that has everything inside of it (object)
				if(err) {
					console.log(err);
					return res.render("register");
				} 
					UserData.create({
						first_name: req.body.first_name,
						last_name: req.body.last_name,
						age: req.body.age,
						UTR: req.body.UTR,
						NTRP: req.body.NTRP,
						phone: req.body.phone,
						address: req.body.address,
						city: req.body.city,
						state: req.body.state,
						zip: req.body.zip,
						username: user.username,
						id: user._id
					}, function(err, UserData){
						if(err){
							console.log(err);
						}else{
							console.log(UserData);
						}
					});
					passport.authenticate("local")(req, res, function(){ //logs the user in and takes care of everything in session and runs serializeuser method
						res.redirect("/secret");
					});
			});
		}else{
			if(error){
				res.send(error);
			}else{
				res.redirect("/register");
			}		
		}
	});
});

// LOGIN ROUTES

//render login form
app.get("/login", function(req, res){
    res.render("login");
});


//login logic
app.post("/login", passport.authenticate("local", { //used inside app.post as (middleware - code that runs before final callback)
        successRedirect: "/secret",
        failureRedirect: "/login",
    }), function(req, res){
});

app.get("/logout", function(req, res){
    req.logout(); //logs them out via passport
    res.redirect("/");
});

function isLoggedIn(req, res, next) { //next is the next thing that needs to be called.
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(3000, function(){
	console.log("server has started...");
});