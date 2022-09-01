const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors('*'));


mongoose.connect(process.env.NODE_DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .catch(err => {
        console.log(`MongoDB Connection Error -> `, err);
    })
    .then(result => {
        if (result) {
            const PORT = process.env.PORT || 8080;
            app.listen(parseInt(PORT), () => {
                console.log(`Blogged Server is live.`);
            });
        }
    });

const blogRouter = require("./src/Routes/Blog.routes");
app.use(`${process.env.NODE_API_INIT}/blogs`, blogRouter);

const userRouter = require("./src/Routes/User.routes");
app.use(`${process.env.NODE_API_INIT}/users`, userRouter);

const feedbackRouter = require("./src/Routes/Feedback.routes");
app.use(`${process.env.NODE_API_INIT}/feedbacks`, feedbackRouter);

const advertRouter = require("./src/Routes/Advert.routes");
app.use(`${process.env.NODE_API_INIT}/adverts`, advertRouter);

const bloggedConfigRouter = require("./src/Routes/BloggedConfig.routes");
app.use(`${process.env.NODE_API_INIT}/bloggedadmin`, bloggedConfigRouter);

const TagRouter = require("./src/Routes/Tag.routes");
app.use(`${process.env.NODE_API_INIT}/tags`, TagRouter);

const SuggestTagRouter = require("./src/Routes/SuggestTag.routes");
app.use(`${process.env.NODE_API_INIT}/suggesttags`, SuggestTagRouter);