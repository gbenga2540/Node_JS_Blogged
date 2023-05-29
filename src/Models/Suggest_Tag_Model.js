const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SuggestTagSchema = new Schema(
    {
        tag_name: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    },
);

const SuggestTag = mongoose.model('SuggestTag', SuggestTagSchema);
module.exports = SuggestTag;
