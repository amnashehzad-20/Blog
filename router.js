const express = require('express');
const mongoose = require('mongoose');
const User = require('./database/user');
const jwt = require("jsonwebtoken");
const Blog = require('./database/blogpost');
const router = express.Router();
require('dotenv').config();

////----------------User Authentication Module--------///
//signup
router.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      if (!(email && password && name)) {
        return res.status(400).json({ error: "All input is required" });
      }
  
      const oldUser = await User.findOne({ email });
  
      if (oldUser) {
        return res.status(409).json({ error: "User Already Exist. Please Login" });
      }
  
      const user = await User.create({ name, email, password });
  
      return res.status(200).json({ message: "Registered" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

 // login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!(email && password)) {
      res.status(400).send("All input is required");
      return;
    }
  
    try {
      const user = await User.findOne({ email });
  
      if (user && user.password == password) {
        if (user.isActive) {
          const token = jwt.sign(
            {email:email},
            process.env.TOKEN_KEY,
            {
              expiresIn: "2h",
            }
          );
  
          // Assign token to the user and save back to the database
          user.token = token;
          
          await user.save();
        
          return res.status(200).json({user, message: "Successful login"});

        } else {
          return res.status(401).send("Your account is currently deactivated.");
        }
      } else {
        return res.status(401).send("Invalid password or email.");
      }

    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  });
  
  //authentication middleware
  let AuthenticateUser = async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({ "Message": "Authorization header is missing" });
    }
    let token = req.headers.authorization.split(' ')[1];
    console.log('authToken Key:', process.env.TOKEN_KEY,"usertoje",token);
    try {

      let DecodedData = await jwt.verify(token, process.env.TOKEN_KEY)
      if (DecodedData) {
        req.User = DecodedData;
        next()
      } else {
        res.status(404).json({ "Message": "Your Are Not Authenticated" })
      }
    } catch (err) {
      res.status(404).json({ "Message": "Your Are Not Authenticated", err })
  
    }
  }

  
//get user profile
router.get('/getProfile/:userid' , async (req, res) => {
    try {
       
        const user = await User.findById(req.params.userid); 
        if (!user) {
            return res.status(404).json({ message: 'User could not be fetched.' });
        }

        return res.json(user); 
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

//update user profile
router.put('/updateProfile/:userid',AuthenticateUser , async (req, res) => {
    try {
        const x=req.User.email;
        const user=await User.findOne({email:req.User.email})
      const updatedProfile = await User.findByIdAndUpdate(user._id, { name:req.body.name , description:req.body.description ,email:req.body.email }, { new: true });
      if (!updatedProfile) {
        return res.status(404).json({ message: 'Post not found.' });
    
      }

    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error',error: error.message });
    }
  });
//update password
router.put('/updatepassword/:userid', async (req, res) => {
   
  });


////----------Blog Post Management Module-------//// 
//create a post 
router.post('/createPost', async (req, res) => {
    try {
        const { title, description, authorid, category } = req.body;
    if (!title || !description || !authorid || !category) //validating all fields are filled
    {  
      return res.status(400).json({ message: 'All input fields are not filled.' });
    }
    const newPost = new Blog({ title, description, authorid, category });     //creating new post
      await newPost.save();       //saving the post
     return res.status(201).send(newPost);
    } catch (error) {
      return res.status(400).send(error);
    }
  });

//Read a post 
router.get('/getPost/:postid', async (req, res) => {
    try {
      const blog = await Blog.findById({_id:req.params.postid});
      if (!blog) {
        return res.status(404).json({ message: 'Blog post could not be fetched.' });
      }
     return  res.json(blog);
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

//update a post 
router.put('/updateblog/:postid',AuthenticateUser, async (req, res) => {
    try {
      const x=await User.findOne({email: req.User.email});
      const postId = req.params.postid;
      const post = await Blog.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found.' });
      }
      if(post.authorid.equals(x._id) )
{ 
      const updatedPost = await Blog.findByIdAndUpdate(post._id, { title:req.body.title , description:req.body.description ,category:req.body.category }, { new: true });
      if (!updatedPost) {
        return res.status(404).json({ message: 'Post not found.' });
    
      }
    }
    else{
      return res.status(404).json({ message: 'You cannot update the post' });
    }
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error',error:error.message });
    }
  });
//delete a post
router.delete('/deletePost/:postid',AuthenticateUser, async (req, res) => {
  const x=await User.findOne({email: req.User.email}); 
  const postId = req.params.postid;
    try {
      const post = await Blog.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found.' });
      }
  
      
 if(post.authorid.equals(x._id) )
{ 
    await Blog.findByIdAndDelete(postId);
    return res.status(200).json({ message: 'Blog post deleted successfully.' });
  } 
    else {
      return res.status(404).json({ message: 'You cannot delete the post' });

    }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
   
  });

//get all post of a certain author
router.get('/author/getPost/:authorid', async (req, res) => {
    try {
        const blogs = await Blog.find({ authorid: req.params.authorid });
      if (!blogs) {
        return res.status(404).json({ message: 'No blog posts found for this author.' });
    
      }
      res.json(blogs);
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  });


  
  //implemnetation of pagination
  router.get("/postonpage", (req, res) => { //in url need to add query eg ?page=2
    let currpage = parseInt(req.query.page) || 1; // Use query parameter for current page
    let postlimit = 2; // num of post displayed on one page
  
    Blog.find()
      .skip((currpage - 1) * postlimit)//skips the number of posts
      .limit(postlimit) //displays 8 post after skipping
      .then((blog) => {
        res.json({ blog, currentPage: currpage });
      })
      .catch((error) => {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
      });
  });
  
  //filtering posts
  router.get('/getfilteredPosts', async (req, res) => { //getfilteredPosts?filterby=Category
    try {
        const filterBy = req.query.filterBy || 'category';
        const keyword=req.query.keyword || '';
        var blogs;
        if (filterBy === 'category') {
           blogs = await Blog.find({category:keyword});
        }
        else if (filterBy === 'author') {
          blogs = await Blog.find({authorid:keyword});
        }
        else {
          return res.status(400).json({ message: 'Invalid sorting parameter.' });
        }
        return res.json(blogs);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
  });

   


//sorting posts
router.get('/getsortedPosts', async (req, res) => { //getsortedPosts?sortby=(newest/oldest/A-Z/Z-A)
    try {
      const sortBy = req.query.sortBy || 'newest';
      var blogs;
      if (sortBy === 'newest') {
         blogs = await Blog.find({}).sort({postedAt: -1});//descending order
      }
      else if (sortBy === 'oldest') {
        blogs = await Blog.find({}).sort({postedAt: 1});//ascending order
      }
       else if (sortBy === 'A-Z') {
        blogs = await Blog.find({}).sort({title: -1});
      } 
      else if (sortBy === 'Z-A') {
        blogs = await Blog.find({}).sort({title: 1});
      }
      else {
        return res.status(400).json({ message: 'Invalid sorting parameter.' });
      }
      return res.json(blogs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });




  //rating a post 
router.post('/addrating/:postid', async (req, res) => {
    try {
        const { user, rated } = req.body;
        if (rated < 1 || rated > 5) {
            return res.status(400).json({ message: 'Invalid rating. Rating must be between 1 and 5.' });
        }
        const post = await Blog.findById(req.params.postid);

        if (!post) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }

        // Check if the user has already rated this post
        const existingRating = post.rating.find(rate => rate.user.equals(user));

        if (existingRating) {
            existingRating.rated = rated;
        } else {
            post.rating.push({ user: user, rated: rated });
        }

        await post.save();

        return res.json(post);
    } catch (error) {
        console.error('Error in /addrating:', error);
        return res.status(500).json({ message: 'Internal Server Error',error: error.message });
    }
});


//commenting on a post
router.post('/postcomments/:postid', async (req, res) => {
    try {
        const { user, comment } = req.body;
        const post = await Blog.findById(req.params.postid);
        if (!post) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }
        // Check if the user has already commented on this post
        const commentExists = post.comments.find(comment => comment.user.equals(user));
        if (commentExists) {
            commentExists.rated = comment;
        } else {
            post.comments.push({ user:user, comment:comment }); //push a new obj in rating arr
        }
        await post.save();
        const author=await User.findById(post.authorid);
        author.notifications.push({
          followerId:user,
          message: 'New comment!',
        });
        await author.save();
        return res.json(post);
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' ,error:error.message});
    }
});

////----------------Search module---------------////




//Searching for post
router.get('/searchPosts', async (req, res) => { //searchPosts?searchBy=category&keyword=technology
    try {
      const searchBy = req.query.searchBy || 'author';
      const keyword=req.query.keyword || '';
      var blogs;
      if (searchBy === 'author') {
        blogs = await Blog.find({authorid: keyword});
      }
      else if (searchBy === 'category') {
        blogs = await Blog.find({ category: keyword});
      }
      else {
        return res.status(400).json({ message: 'Invalid searching parameter.' });
      }
      return res.json(blogs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error',error:error.message });
    }
  });


  const searchmiddleware = async (req, res, next) => {
    try {
      const searchBy = req.query.searchBy || 'author';
      const keyword = req.query.keyword || '';
      let blogs;
  
      if (searchBy === 'author') {
        blogs = await Blog.find({ authorid: keyword });
      } else if (searchBy === 'category') {
        blogs = await Blog.find({ category: keyword });
      } else {
        return res.status(400).json({ message: 'Invalid sorting parameter.' });
      }
  
      req.blogs = blogs;
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  };
  
  // Filtering search result
  router.get('/filterresult', searchmiddleware, async (req, res) => {
    try {
      const filterBy = req.query.filterBy || 'category';
      const keyword = req.query.keyword || '';
      let blogs;
  
      if (filterBy === 'category') {
        blogs = await Blog.find({ category: keyword });
      } else if (filterBy === 'author') {
        blogs = await Blog.find({ authorid: keyword });
      } else {
        return res.status(400).json({ message: 'Invalid sorting parameter.' });
      }
  
      return res.json(blogs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  



//sorting searchresult
router.get('/sortresult',searchmiddleware, async (req, res) => { //getsortedPosts?sortby=(newest/oldest/A-Z/Z-A)
    try {
      const sortBy = req.query.sortBy || 'postedat';
      var blogs;
      if (sortBy === 'newest') {
         blogs = await Blog.find({}).sort({postedAt: -1});//descending order
      }
      else if (sortBy === 'oldest') {
        blogs = await Blog.find({}).sort({postedAt: 1});//ascending order
      }
       else if (sortBy === 'A-Z') {
        blogs = await Blog.find({}).sort({title: -1});
      } 
      else if (sortBy === 'Z-A') {
        blogs = await Blog.find({}).sort({title: 1});
      }
      else {
        return res.status(400).json({ message: 'Invalid sorting parameter.' });
      }
      return res.json(blogs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

////--------------------------User Interaction Module---------------------------////
//follow a blogger
router.post('/follow/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const userToFollow = await User.findById(req.params.userId);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.following.includes(req.params.userId)) {
      user.following.push(req.params.userId);
      await user.save(); 

    userToFollow.notifications.push({       //follow notification
      followerId:user,
      message: 'New follower!',
    });
    await userToFollow.save();
      return res.status(200).json({ message: "You are now following this blogger." });
    } else {
      return res.status(404).json({ message: 'You are already following this blogger.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


//unfollow a blogger
router.post('/unfollow/:userId', async (req, res) => {
  try {
    const user=await User.findOne({email:req.body.email})
    const alreadyFollow = await User.findById(req.params.userId);

    if (!alreadyFollow ) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.following.includes(alreadyFollow)) {
      user.following.pull(alreadyFollow);
      await user.save();
      alreadyFollow.notifications.push({       //follow notification
        followerId:user,
        message: 'You just lost a follower!',
      });
      await alreadyFollow.save();
      return res.status(200).json({ message: "You are no longer following this blogger." });
    } else {
      return res.status(404).json({ message: 'You donot follow this blogger.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// User feed 
router.get('/userfeed',async (req, res) => {
  try {
    const user=await User.findOne({email:req.body.email})
    if (!user || !user.following || user.following.length === 0) {
      return res.status(200).json({ message: 'No posts to display in the user feed.' });
    }
    const followedId =user.following.map((blogger) => blogger._id);
    const post = await Blog.find({ authorid: followedId });
    return res.status(200).json(post);
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//notfication



///---------------------------Admin Operations------------------------------------///

//check if admin or not middleware
let isAdmin = async (req, res, next) => {
    const { email} = req.body;
  
    try {
      let user = await User.findOne({ email: email });
      if (!user || !user.isAdmin) {
        return res.json({ Message: "You do not have admin privileges" });
      }
      next();
  
    } catch (err) {
      return res.json({ Message: "Internal Server Error" });
    }
  }
//viewing all users
   router.get('/getUser',isAdmin, async (req, res) => {
    try {
      const users = await User.find({isAdmin:false});
      if (users.length === 0) {
        return res.status(404).json({ message: 'Blog post could not be fetched.' });
      }
      res.json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  //get all blog posts
 router.get('/getPost',isAdmin, async (req, res) => {
    try {
      const blogs = await Blog.find({});

      if (!blogs) {
        return res.status(404).json({ message: 'No blog posts found.' });
      }
  
      res.json(blogs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

//View a Particular Blog Post
  router.get('/adminPost/:postid',isAdmin, async (req, res) => {
    try {
      const blog = await Blog.findById({_id:req.params.postid});
      if (!blog) {
        return res.status(404).json({ message: 'Blog post could not be fetched.' });
      }
      res.json(blog);
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
//disable a User profile
router.put('/disableprofile/:userid',isAdmin, async (req, res) => {
    try {
      const updatedstatus = await User.findByIdAndUpdate(req.params.userid,  { isActive: false }, { new: true });
      if (!updatedstatus) {
        return res.status(404).json({ message: 'Profile deactivated.' });
    
      }
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  });


//Disable a post
router.put('/disableblogpost/:postid',isAdmin, async (req, res) => {
    try {
      const disabledPost = await Blog.findByIdAndUpdate( req.params.postid,{ isActive: false },{ new: true });
  
      if (!disabledPost) {
        return res.status(404).json({ message: 'Post not disabled.' });
      }
  
      return res.json(disabledPost);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  module.exports = router;
