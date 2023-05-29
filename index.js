const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors('*'));

mongoose.set('strictQuery', true);
mongoose
    .connect(process.env.NODE_DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
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

const blogRouter = require('./src/Routes/Blog/Blog.routes');
app.use(`${process.env.NODE_API_INIT}/blogs`, blogRouter);

const userRouter = require('./src/Routes/Users/User.routes');
app.use(`${process.env.NODE_API_INIT}/users`, userRouter);

const feedbackRouter = require('./src/Routes/Feedback/Feedback.routes');
app.use(`${process.env.NODE_API_INIT}/feedbacks`, feedbackRouter);

const advertRouter = require('./src/Routes/Advert/Advert.routes');
app.use(`${process.env.NODE_API_INIT}/adverts`, advertRouter);

const bloggedConfigRouter = require('./src/Routes/Blogged_Config/Blogged_Config.routes');
app.use(`${process.env.NODE_API_INIT}/bloggedadmin`, bloggedConfigRouter);

const TagRouter = require('./src/Routes/Tag/Tag.routes');
app.use(`${process.env.NODE_API_INIT}/tags`, TagRouter);

const SuggestTagRouter = require('./src/Routes/Suggest_Tag/Suggest_Tag.routes');
app.use(`${process.env.NODE_API_INIT}/suggesttags`, SuggestTagRouter);

const VerifyUsersRouter = require('./src/Routes/Verify_Users/Verify_Users.routes');
app.use(`${process.env.NODE_API_INIT}/verifyusers`, VerifyUsersRouter);
