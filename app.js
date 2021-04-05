//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session"); //required for passport use to save user sessions
const passport = require("passport");  //use for authentication
const passportLocalMongoose = require("passport-local-mongoose"); //middleware
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const password = process.env.DB_PASSWORD;
const secret = process.env.DB_SECRET;
// const uri = process.env.URI;
const uri = "mongodb+srv://vimalan:"+password+"@cluster0.nhqni.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

app.use(session({  // must be BEFORE mongoose connect
  secret: secret,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true); // needed to remove deprecated warnings

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String //need this so your databas can locate it and you wont be recreating each time to register or login.
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());  // all of these does the heavywork of salting and hashing
passport.serializeUser(function(user,done){
  done(null,user.id);
});

passport.deserializeUser(function(id,done){
  User.findById(id, function(err,user){
    done(err,user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home");
});

app.get("/auth/google", passport.authenticate('google', { scope: ['profile']})
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login",function(req,res){
  res.render("login");
});
// must have passport.authenticate(local) inside app.post.
app.post("/login",passport.authenticate("local"),function(req,res){
  res.redirect("/secrets");
});


app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets", function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/register",function(req,res){
  User.register({username: req.body.username}, req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
        passport.authenticate("local")(req,res,function(){
          res.redirect("/login"); // switch to login instead of register
        });
    }
  });


});


app.get("/submit",function(req,res){
  res.render("submit");
});


app.listen(3000, function(){
  console.log("Server started on port 3000");
});
