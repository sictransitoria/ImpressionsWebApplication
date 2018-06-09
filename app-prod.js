// Node.js Variables
const express = require('express');
const ejs = require('ejs');
const sharp = require('sharp');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const db = require('./db');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Protect Yoself
const dotenv = require('dotenv');
require('dotenv').config();
dotenv.load();

// Enviornment Variables
const DB_DATAB = process.env.DB_DATAB
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
// const DB_HOST = process.env.DB_HOST;
const DB_POST = process.env.DB_POST;
const DB_DIAL = process.env.DB_DIAL;

// Sequelize Variables
const Sequelize = require('sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Passport Variables
const LocalStrategy = require('passport-local').Strategy;
const Strategy = require('passport-local').Strategy;
const passport = require('passport');

// Server Port
const PORT = process.env.PORT || 3000;

// Connect to Database
const Op = Sequelize.Op
const sequelize = new Sequelize(process.env.DATABASE_URL, {
	// host: '',
	// port: DB_POST,
	protocol: 'postgres',
	ssl: true,
	dialect: 'postgres',
	operatorsAliases: {
	  $and: Op.and,
	  $or: Op.or,
	  $eq: Op.eq,
	  $like: Op.like,
	  $ilike: Op.iLike
	}
});

// Create a Table
const Pic = sequelize.define('pic', {
	image: Sequelize.STRING,
	comment: Sequelize.STRING
});

// Storage Object Definition
const storage = multer.diskStorage({
	destination: './public/uploads',
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
});

// Create a New Express Application.
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));

// Upload Process Definition
const upload = multer({storage: storage}).single('image');

// Upload Photo to live-gallery.ejs & \\public\thumbnails
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
  		id: req.body.id,
  		image: req.file.filename,
  		comment: req.body.comment
  	  })
  	   .then(() => {
  	   	 return res.redirect('/')
  	})
  })
});

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
		console.log("********* Serialize User *********")
      done(null, user)
});

// Convert ID in Cookie to User Details
	passport.deserializeUser(function(obj,done){
		console.log("-- deserializeUser --");
		console.log(obj)	
			done(null, obj);
});

// * Start Passport Local Config *

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

// Create a New User
			let newUser = req.body;
			User.create(newUser)
			.then((user)=>{
			   console.log("Yay!!! User created")
			    return done(null, user);
			})

		}	 
	})
}

// * End of Passport Sign-up *

// * Start of Passport Login *

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
        } else if (password !== user.password){
						return done(null, false)
					} else {
			   console.log("You've logged in.");
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

// * Passport Middleware *

// Must be Initialized in order for Passport to work.
  app.use(passport.initialize());
  app.use(passport.session());

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


// Logging, Parsing, and Session Handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Routes

app.get('/', (req, res) => {
  Pic.findAll().then((rows) => {
  	return rows
  })
  .then((rows) => {
  	return res.render('live-gallery', {rows})
  })
})

app.get('/register', (req, res)=>{
	return res.render('register');
});

app.get('/login',
  function(req, res){
    res.render('login');
});

app.post('/login', function(req,res,next){
		passport.authenticate('local-login', function(err, user){
			console.log("Another login for user  :" + req.user)
			if (err || user == false) {
				return res.render('login', {message: "Incorrect Username/Password"})
			} else {
				req.login(user, function(err){
					console.log("Getting req.user :"+ req.user)
					return res.render('profile', {user: req.user})
				})
			}
		})(req, res, next);
});


app.post('/signup', function(req,res, next){
	passport.authenticate('local-signup', function(err, user){
		if (err) {
			return next(err);
		} else {
			return res.redirect('/login')
		}
	})(req, res, next);
});

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
  	console.log("**** The req.user ****" + req.user)
  	User.findById(req.user.id).then((user)=>{
     res.render('profile', { user: user.dataValues});
    })
  })

app.get('/logout',
  function(req, res){
    res.render('logout', { user: req.user });
  });

// Edit a Record
app.get('/edit/:id', (req, res) => {
	let id = req.params.id
	Pic.findById(id)
	.then(row => {
		return row;
	})
	.then(row => {
		return res.render('upload', {id});
	})
})

// Update a Photo after clicking 'Edit'
app.post('/upload/:id', (req, res) => {
	console.log(req.body.image);
	upload(req, res, (err) => {
	  if (err) {
	  console.log(err)
	}
	  console.log("File for Sharp" + req.file.path)
	 sharp(req.file.path)
	.resize(400, 400)
	.toFile('public/thumbnails/' + req.file.filename, function(err) {

	})
	Pic.findOne({
		where: {
			id: req.params.id
		}
	})
  	.then((row) => {
  		row.update({
  			image: req.file.filename,
  			comment: req.body.comment
  		})
  	})
  	   .then((row) => {
  	   return res.redirect('/');
  	})
  })
});

// Delete a Photo
app.post('/delete/:id', (req, res) => {
	let id = req.params.id
	Pic.findById(id)
	.then(row => row.destroy(row))
	.then(() => {
		return res.redirect('/');
	})
});

// Loud and Clear
app.listen(PORT, ()=>{
	console.log('Listening on port:', PORT)
});

// TAK
