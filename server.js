// npm i --save-dev nodemon
// npm run devStart
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const router = require('./router');
const express = require("express");
const nodemon = require('nodemon');


require("dotenv").config()
const app=express();

app.use(bodyParser.json());
app.use('/', router);

mongoose.connect('mongodb://127.0.0.1:27017/Blog', {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;



db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Database connected successfully');
});

app.listen(3000,()=>console.log("Server Started port 3000"))
