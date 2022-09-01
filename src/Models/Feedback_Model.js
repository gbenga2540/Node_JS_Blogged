const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema(
    {
        message: {
            type: String,
            required: true
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

const Feedback = mongoose.model('Feedback', FeedbackSchema);
module.exports = Feedback;