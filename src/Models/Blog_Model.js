const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CommentSchema = require('./Comments_Model');

const BlogSchema = new Schema(
    {
        author: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        dp_link: {
            type: String,
            required: true,
            default: 'none',
        },
        message: {
            type: String,
            required: true,
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        tags: [
            {
                type: Number,
                required: true,
            },
        ],
        comments: [CommentSchema],
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true,
        },
    },
);

const Blog = mongoose.model('Blog', BlogSchema);
module.exports = Blog;
