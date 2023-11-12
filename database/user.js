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
}
});

const User = mongoose.model('User', userSchema);

module.exports = User;