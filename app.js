// Node.js Variables
const express = require('express');
const ejs = require('ejs');
const sharp = require('sharp');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const db = require('./db');
const session = require('express-session')
const cookieParser = require('cookie-parser')

// Sequelize Variables
const Sequelize = require('sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store)

// Passport Variables
const LocalStrategy = require('passport-local').Strategy;
const Strategy = require('passport-local').Strategy;
const passport = require('passport');

// Protect Yoself
const dotenv = require('dotenv')
require('dotenv').config()

// Server Port
const PORT = process.env.PORT || 3000;

// Connect to 'mockinstagram' Database
const Op = Sequelize.Op
const sequelize = new Sequelize('mockinstagram', 'postgres', 'Runner4life!', {
	host: 'localhost',
	post: '5432',
	dialect: 'postgres',
	operatorsAliases: {
	  $and: Op.and,
	  $or: Op.or,
	  $eq: Op.eq,
	  $like: Op.like,
	  $ilike: Op.iLike
	}
})

// Create a Table Named 'pic'
const Pic = sequelize.define('pic', {
	image: Sequelize.STRING,
	comment: Sequelize.STRING
});

// Storage Object Definition
const storage = multer.diskStorage({
	destination: './public/uploads',
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)) //in a form
	}
})

// Create a New Express Application.
const app = express();

// Upload Process Definition
const upload = multer({storage: storage}).single('image')

app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))

// Upload Photo to feed.ejs & \\public\thumbnails
app.post('/upload', (req, res) => {
	upload(req, res, (err) => {
		if (err){
			console.log(err)
	}
	console.log(req.body)
	console.log(req.file)
	console.log("File for Sharp" + req.file.path)
	sharp(req.file.path)
	.resize(400, 400)
	.toFile('public/thumbnails/' + req.file.filename, function(err) {

	})
  	Pic.create({
  		image: req.file.filename,
  		comment: req.body.comment
  	  })
  	   .then(() => {
  	   	 return res.redirect('/') // Redirecting to / GET route
  	})
  })
});

app.get('/', (req, res) => {

  Pic.findAll().then((rows) => {
  	return rows
  })
  .then((rows) => {
  	return res.render('live-gallery', {rows})
  })
})

// End of Images

// Create a table named 'Users'
const User = sequelize.define('user', {
	lastname: Sequelize.STRING,
	firstname: Sequelize.STRING,
	username: Sequelize.STRING,
	password: Sequelize.STRING,
	cell: Sequelize.STRING,
	email: Sequelize.STRING
});


const sessionStore = new SequelizeStore({
    db: sequelize
  });

sequelize.sync()
sessionStore.sync();

// -- Sessions -- 
passport.serializeUser(function(user, done) {
		console.log("*********SerializeUser*********")
      //done(null, {id: user.id, user: user.username});
      done(null, user)
});
// Convert ID in Cookie to User Details
	passport.deserializeUser(function(obj,done){
		console.log("--deserializeUser--");
		console.log(obj)	
			done(null, obj);
});

// -- Start Passport Local Config --

// Passport Sign-up
passport.use('local-signup', new LocalStrategy({
    lastnameField: 'lastname',
    firstnameField: 'firstname',
    usernameField: 'username',
    passwordField: 'password',
    cellField: 'cell',
    emailField: 'email',
    passReqToCallback: true
}, processSignupCallback));

function processSignupCallback(req, username, password, done) {
    // first search to see if a user exists in our system with that email
    User.findOne({
        where: {
            'username' :  username
				}
    })
    .then((user)=> {
        if (user) {
            // user exists call done() passing null and false
            return done(null, false);
        } else {

// Create the New User
			let newUser = req.body;
			User.create(newUser)
			.then((user) => {
			   console.log("Yay!!! User created")
			    return done(null, user);
			})
		}	 
	})
}

//------------- End of Passport Sign-up -----------

//------------- Start of Passport Login -----------

	// Local Strategy
passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, processLoginCallback));   // <<-- more on this to come

function processLoginCallback(req, username, password, done) {
    // first search to see if a user exists in our system with that email
    User.findOne({
        where: {
            'username' :  username
				},
    })
    .then((user)=> {
        if (!user) {
            return done(null, false);
        }else if(password !== user.password){
						return done(null, false)
					}else{
			   console.log("You've logged in.")
			   // console.log(user)
			    return done(null, user);
			  }
		})

}	 

  app.use(require('morgan')('combined'));
	app.set('view engine', 'ejs')
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(express.static('public'))
	app.use(cookieParser());

	app.use(session({ 
		secret: 'keyboard cat', 
		store: sessionStore,
		resave: false, 
		saveUninitialized: false 
	}));

//================ Passport Middleware ==============

  app.use(passport.initialize());
  app.use(passport.session());

//========= Routes ==================

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

// Routes
app.get('/',
  function(req, res) {
    res.render('live-gallery', { user: req.user });
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

app.get('/sign-up', (req, res)=>{
	return res.render('sign-up')
})

app.post('/sign-up', function(req,res, next){
	passport.authenticate('local-signup', function(err, user){
		if (err) {
			return next(err);
		} else {
			return res.redirect('/login')
		}
	})(req, res, next);
//	})
});

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    if(req.user.admin == 'yes') {
      res.render('profile', { user: req.user })
    } else {
    console.log(err);
   }
  });

app.get('/logout',
  function(req, res){
    res.render('logout', { user: req.user });
  });


// Loud and Clear on Port 3000
app.listen(PORT, ()=>{
	console.log("...Server Started on Port 3000...")
})
