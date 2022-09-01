const router = require('express').Router();
const SuggestTag = require('../Models/Suggest_Tag_Model');
const none_null = require('../Utils/None_Null_Checker');


// Suggest Tag
// INFO REQUIRED:
// tag_name
router.post('/', async (req, res) => {
    const tag_name = req.body.tag_name;

    if (none_null(tag_name) === false) {
        try {
            await SuggestTag.aggregate([
                {
                    $match: {
                        tag_name: tag_name
                    }
                },
                {
                    $project: {
                        tag_name: 1
                    }
                }
            ])
                .catch(err => {
                    res.json({
                        status: "error",
                        code: "ERR-BLGD-065"
                    });
                })
                .then(async result => {
                    if (result?.length === 0) {
                        const suggest_tag = new SuggestTag({
                            tag_name: tag_name
                        });
                        try {
                            await suggest_tag.save()
                                .catch(err => {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-064"
                                    });
                                })
                                .then(response => {
                                    if (response) {
                                        res.json({
                                            status: "success"
                                        });
                                    } else {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-064"
                                        });
                                    }
                                });
                        } catch (error) {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-064"
                            });
                        }
                    } else {
                        res.json({
                            status: "success"
                        });
                    }
                });
        } catch (err) {
            res.json({
                status: "error",
                code: "ERR-BLGD-065"
            });
        }
    } else {
        res.json({
            status: "error",
            code: "ERR-BLGD-063"
        });
    }
});


module.exports = router;