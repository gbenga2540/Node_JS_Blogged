const Schema = require('mongoose').Schema;

const CommentSchema = new Schema(
    {
        commenter: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        comment: {
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

module.exports = CommentSchema;
