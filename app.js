const express = require('express');
const ejs = require('ejs');
const sharp = require('sharp');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const Sequelize = require('sequelize');

// just adding for test

// const Sequelize = require('sequelize')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const SequelizeStore = require('connect-session-sequelize')(session.Store)

// Protect yourself
const dotenv = require('dotenv')
require('dotenv').config()

// Port 3000
const PORT = process.env.PORT || 3000;

const Op = Sequelize.Op

const sequelize = new Sequelize('mockinstagram', 'postgres', 'water', {
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

// Create a Table
const Pic = sequelize.define('pic', {
	username: Sequelize.STRING,
	image: Sequelize.STRING,
	comment: Sequelize.STRING
})

sequelize.sync()

// Storage Object Definition
const storage = multer.diskStorage({
	destination: './public/uploads',
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)) //in a form
	}
})

// Upload Process Definition
const upload = multer({storage: storage}).single('image')

const app = express()

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
  		username: req.body.username,
  		image: req.file.filename,
  		comment: req.body.comment
  	  })
  	   .then(() => {
  	   	 return res.redirect('/') // Redirecting to / GET route
  	})
  })
})

app.get('/', (req, res) => {

  Pic.findAll().then((rows) => {
  	return rows
  })
  .then((rows) => {
  	return res.render('live-gallery', {rows})
  })
})
// end of upload images





//beginning of showing pictures on profile

const User = sequelize.define('user', {
	username: Sequelize.STRING,
	password: Sequelize.STRING
})

const sessionStore = new SequelizeStore({
    db: sequelize
  });

sequelize.sync()
sessionStore.sync();

//===============Sessions========================

passport.serializeUser(function(user, done) {
		console.log("*********SerializeUser*********")
      //done(null, {id: user.id, user: user.username});
      done(null, user)
});
//convert id in cookie to user details
	passport.deserializeUser(function(obj,done){
		console.log("--deserializeUser--");
		console.log(obj)
			done(null, obj);
	})

//================Start Passport Local Config==================
//Passport Sign-up
passport.use('local-signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, processSignupCallback));   // <<-- more on this to come

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

// create the new user
			let newUser = req.body; // make this more secure
			User.create(newUser)
			.then((user)=>{
			    //once user is created call done with the created user
			   // createdRecord.password = undefined;
			   console.log("Yay!!! User created")
			   // console.log(user)
			    return done(null, user);
			})

		}
	})
}
//-------------End of Passport Sign-up-----------

//-------------Start of Passport Login-----------

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
            // user exists call done() passing null and false
            return done(null, false);
        }else if(password !== user.password){
						return done(null, false)
					}else{
			   console.log("Yay!!! User is logged in")
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
/*
In an Express-based application, passport.initialize() middleware
is required to initialize Passport. If your application uses persistent
login sessions, passport.session() middleware must also be used.
*/
	app.use(passport.initialize());
  app.use(passport.session());



//=========Routes==================
app.get('/', (req, res)=>{
	if(req.user){
	res.render('login', {user: req.user})
	}else{
		res.redirect('/sign-up')
	}
})

app.get('/sign-up', (req, res)=>{
	return res.render('signin') // or sign-up
})

app.post('/sign-up', function(req, res, next){
	passport.authenticate('local-signup', function(err, user){
		if (err) {
			return next(err)
		} else {
			return res.redirect('/login') // or login
		}
	})(req, res, next);
//	})
});

app.post('/login', function(req, res, next){
		passport.authenticate('local-login', function(err, user){
			console.log("Another login for user  :" + req.user)
			if (err || user == false) {
				return res.render('login', {message: "Incorrect Username/Password"})
			} else {
				req.login(user, function(err){
					console.log("Getting req.user :"+ req.user)
					return res.render('profile', {user: req.user}) // sent to the feed
				})
			}
		})(req, res, next);
})


app.get('/login', (req, res)=>{
	return res.render('login', {message: "Please login"})
})

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
  	console.log("****The req.user****" + req.user)
  	User.findById(req.user.id).then((user)=>{
     res.render('profile', { user: user.dataValues});
    })
  })

app.get('/logout',function(req, res){
  	console.log("*****Loging out*****")
  	req.session.destroy()
    req.logout();
    res.redirect('/login');
  })

app.listen(PORT, ()=>{
	console.log(`..Server Started for Impressions..`)
})
