const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TagSchema = new Schema(
    {
        tag_index: {
            type: Number,
            required: true
        },
        tag_name: {
            type: String,
            required: true
        }
    },
    {
        timestamps: false
    }
);

const Tag = mongoose.model('Tag', TagSchema);
module.exports = Tag;