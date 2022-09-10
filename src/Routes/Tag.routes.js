const router = require('express').Router();
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Tag = require('../Models/Tag_Model');
const none_null = require('../Utils/None_Null_Checker');


// Creates Tag
// INFO REQUIRED:
// master_password
// Tag Name
router.post('/create', (req, res) => {
    try {
        const master_password = req.body.master_password;
        const tag_name = req.body.tag_name;

        if (none_null(master_password) === false) {
            if (none_null(tag_name) === false) {
                try {
                    bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                        if (error) {
                            res.json({
                                status: "error",
                                code: "ERR-M-BLGD-001"
                            });
                        } else {
                            if (response) {
                                try {
                                    await Tag.aggregate([
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
                                                code: "ERR-M-BLGD-019"
                                            });
                                        })
                                        .then(async find_one_tag_res => {
                                            if (find_one_tag_res?.length === 0) {
                                                try {
                                                    await Tag.find()
                                                        .catch(err => {
                                                            res.json({
                                                                status: "error",
                                                                code: "ERR-BLGD-061"
                                                            });
                                                        })
                                                        .then(async result => {
                                                            if (result !== null || result !== undefined) {
                                                                const tag_index = result?.length;
                                                                const processed_tag_index = parseInt(tag_index);

                                                                const tag = new Tag({
                                                                    tag_index: processed_tag_index,
                                                                    tag_name: tag_name
                                                                });

                                                                try {
                                                                    await tag.save()
                                                                        .catch(err => {
                                                                            res.json({
                                                                                status: "error",
                                                                                code: "ERR-M-BLGD-016"
                                                                            });
                                                                        })
                                                                        .then(tag_save_result => {
                                                                            if (tag_save_result) {
                                                                                res.json({
                                                                                    status: "success"
                                                                                });
                                                                            } else {
                                                                                res.json({
                                                                                    status: "error",
                                                                                    code: "ERR-M-BLGD-016"
                                                                                });
                                                                            }
                                                                        });
                                                                } catch (error) {
                                                                    res.json({
                                                                        status: "error",
                                                                        code: "ERR-M-BLGD-016"
                                                                    });
                                                                }
                                                            } else {
                                                                res.json({
                                                                    status: "error",
                                                                    code: "ERR-BLGD-061"
                                                                });
                                                            }
                                                        });
                                                } catch (error) {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-061"
                                                    });
                                                }
                                            } else {
                                                res.json({
                                                    status: "success"
                                                });
                                            }
                                        });
                                } catch (error) {
                                    res.json({
                                        status: "error",
                                        code: "ERR-M-BLGD-019"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-M-BLGD-002"
                                });
                            }
                        }
                    });
                } catch (error) {
                    res.json({
                        status: "error",
                        code: "ERR-M-BLGD-001"
                    });
                }
            } else {
                res.json({
                    status: "error",
                    code: "ERR-M-BLGD-015"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-M-BLGD-020"
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-M-BLGD-016"
        });
    }
});

// Update Tags
// INFO REQUIRED:
// master_password
// old_tag_name
// new_tag_name
router.patch('/update', (req, res) => {
    try {
        const master_password = req.body.master_password;
        const old_tag_name = req.body.old_tag_name;
        const new_tag_name = req.body.new_tag_name;

        if (none_null(master_password) === false) {
            if (none_null(old_tag_name) === false && none_null(new_tag_name) === false) {
                try {
                    bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                        if (error) {
                            res.json({
                                status: "error",
                                code: "ERR-M-BLGD-001"
                            });
                        } else {
                            if (response) {
                                try {
                                    await Tag.updateOne({ tag_name: old_tag_name }, { tag_name: new_tag_name })
                                        .catch(err => {
                                            res.json({
                                                status: "error",
                                                code: "ERR-M-BLGD-017"
                                            });
                                        })
                                        .then(tag_update_res => {
                                            if (tag_update_res === null || tag_update_res === undefined) {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-M-BLGD-017"
                                                });
                                            } else {
                                                res.json({
                                                    status: "success"
                                                });
                                            }
                                        })
                                } catch (error) {
                                    res.json({
                                        status: "error",
                                        code: "ERR-M-BLGD-017"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-M-BLGD-002"
                                });
                            }
                        }
                    });
                } catch (error) {
                    res.json({
                        status: "error",
                        code: "ERR-M-BLGD-001"
                    });
                }
            } else {
                res.json({
                    status: "error",
                    code: "ERR-M-BLGD-015"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-M-BLGD-020"
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-M-BLGD-017"
        });
    }
});

// Load Tags
router.get('/', async (req, res) => {
    try {
        await Tag.find()
            .catch(err => {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-061"
                });
            })
            .then(result => {
                if (result !== null || result !== undefined) {
                    if (result?.length > 0) {
                        res.json({
                            status: "success",
                            response: result
                        });
                    } else {
                        res.json({
                            status: "success",
                            response: []
                        });
                    }
                } else {
                    res.json({
                        status: "success",
                        response: []
                    });
                }
            });
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-061"
        });
    }
});


module.exports = router;
