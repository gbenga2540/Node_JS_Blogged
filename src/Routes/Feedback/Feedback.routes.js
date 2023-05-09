const router = require('express').Router();
const Feedback = require('../../Models/Feedback_Model');
const none_null = require('../../Utils/None_Null_Checker');


// Sends Feedback
// INFO REQUIRED:
// message
router.post('/', async (req, res) => {
    try {
        const message = req.body.message;
        if (none_null(message) === false) {
            try {
                const feedback = new Feedback({
                    message: message
                });

                await feedback.save()
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-046"
                        });
                    })
                    .then(result => {
                        if (result) {
                            res.json({
                                status: "success"
                            });
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-046"
                            });
                        }
                    });
            } catch (err) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-046"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-062"
            });
        }
    } catch (err) {
        res.json({
            status: "error",
            code: "ERR-BLGD-046"
        });
    }
});


module.exports = router;