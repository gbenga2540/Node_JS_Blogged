const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdvertSchema = new Schema(
    {
        ad_owner: {
            type: String,
            required: true,
        },
        ad_dp_link: {
            type: String,
            required: true,
            default: 'none',
        },
        ad_url: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true,
        },
    },
);

const Advert = mongoose.model('Advert', AdvertSchema);
module.exports = Advert;
