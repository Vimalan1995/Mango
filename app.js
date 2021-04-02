//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session"); //required for passport use to save user sessions
const passport = require("passport");  //use for authentication
const passportLocalMongoose = require("passport-local-mongoose"); //middleware



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
  password: String
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());  // all of these does the heavywork of salting and hashing
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("home");
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
