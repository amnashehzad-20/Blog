const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  password :String,
  email: String,
  description:String,
  token:String,
  isAdmin:{
    type:Boolean,
    default: false,
},
isActive:{
  type:Boolean,
  default:true,
},
following: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
],
notifications: [
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: String,
  },
],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
