const express = require('express');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const db = require('./db');

const PORT = process.env.PORT || 3000;

// Configure the Local Strategy for use by Passport.
passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));

// Configure Passport Authenticated Session Persistence.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
}); 

// Create a New Express Application.
const app = express();

// Configure View Engine to Render EJS.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and Restore Authentication State.
app.use(passport.initialize());
app.use(passport.session());

// Set routes
app.get('/',
  function(req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function(req, res){
    res.render('login');
  });

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });  

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    if(req.user.admin == 'yes') {
      res.render('admin', { user: req.user })
    } else {
    res.render('profile', { user: req.user });
   }
  });

app.get('/logout',
  function(req, res){
    res.render('logout', { user: req.user });
  });

// Loud and Clear on Port 3000
app.listen(PORT, () => {
	console.log('...Server Started on Port 3000...')

});