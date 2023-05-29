const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        dp_link: {
            type: String,
            required: true,
            default: 'none',
        },
        followers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        following: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        email_v: {
            type: Boolean,
            required: true,
            default: false,
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Blog',
            },
        ],
        blogs: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Blog',
            },
        ],
        v_code: {
            type: String,
            required: true,
            default: 'nv',
        },
        verified: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    },
);

const User = mongoose.model('User', UserSchema);
module.exports = User;
