const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const BloggedConfigSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            required: true,
            default: ObjectId(process.env.NODE_MASTER_MONGO_CONFIG_ID),
        },
        enable_ads: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: false,
    },
);

const BloggedConfig = mongoose.model('BloggedConfig', BloggedConfigSchema);
module.exports = BloggedConfig;
