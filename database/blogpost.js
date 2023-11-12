const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
    title: String,
    description: String,
    authorid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    postedAt: { type: Date, default: Date.now },
    category:String,
    rating:[ {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rated: {
                type: Number,
                required: true
            }
        }],
    comments: [ {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            comment: {
                type: String,
                required: true
            }
        }],
    isActive:
    {
        type:Boolean,
        default:true,
    }
});

const Blog = mongoose.model('Blog', BlogPostSchema);

module.exports = Blog;
