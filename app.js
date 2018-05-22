const express = require('express');
const ejs = require('ejs');
const sharp = require('sharp');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const LocalStrategy = require('passport-local').Strategy
const Sequelize = require('sequelize');s 

// Port 3000
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, ()=>{
	console.log(`..Server Started for Impressions..`)
})
