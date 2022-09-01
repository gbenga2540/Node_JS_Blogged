const router = require('express').Router();
const bcrypt = require('bcryptjs');
require('dotenv').config();
const pagination_indexer = require('../Utils/Pagination_Indexer');
const none_null = require('../Utils/None_Null_Checker');
const none_null_bool = require('../Utils/None_Null_Bool_Checker');
const ObjectId = require('mongodb').ObjectId;
const BloggedConfig = require('../Models/BloggedConfig_Model');
const Feedback = require('../Models/Feedback_Model');
const SuggestTag = require('../Models/Suggest_Tag_Model');


// Creates Master Config
// INFO REQUIRED:
// master_password
router.post('/setup', async (req, res) => {
    const master_password = req.body.master_password;

    if (none_null(master_password) === false) {
        try {
            await bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                if (error) {
                    res.json({
                        status: "error",
                        code: "ERR-M-BLGD-001"
                    });
                } else {
                    if (response) {
                        try {
                            await BloggedConfig.aggregate([
                                {
                                    $match: {
                                        _id: ObjectId(process.env.NODE_MASTER_MONGO_CONFIG_ID)
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1
                                    }
                                }
                            ])
                                .catch(err => {
                                    res.json({
                                        status: "error",
                                        code: "ERR-M-BLGD-003"
                                    });
                                })
                                .then(async result => {
                                    if (result?.length === 0) {
                                        const blogged_config = new BloggedConfig({
                                            _id: ObjectId(process.env.NODE_MASTER_MONGO_CONFIG_ID)
                                        });
                                        try {
                                            await blogged_config.save()
                                                .catch(err => {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-M-BLGD-004"
                                                    });
                                                })
                                                .then(setup_res => {
                                                    if (setup_res) {
                                                        res.json({
                                                            status: "success"
                                                        });
                                                    } else {
                                                        res.json({
                                                            status: "error",
                                                            code: "ERR-M-BLGD-004"
                                                        });
                                                    }
                                                });
                                        } catch (error) {
                                            res.json({
                                                status: "error",
                                                code: "ERR-M-BLGD-004"
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
                                code: "ERR-M-BLGD-003"
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
            code: "ERR-M-BLGD-020"
        });
    }
});

// Update Admin Variables
// INFO REQUIRED:
// master_password
// Enable_Ads
router.patch('/update', async (req, res) => {
    const master_password = req.body.master_password;
    const enable_ads = req.body.enable_ads;

    if (none_null(master_password) === false) {
        if (none_null_bool(enable_ads) === false) {
            try {
                await bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                    if (error) {
                        res.json({
                            status: "error",
                            code: "ERR-M-BLGD-001"
                        });
                    } else {
                        if (response) {
                            try {
                                await BloggedConfig.aggregate([
                                    {
                                        $match: {
                                            _id: ObjectId(process.env.NODE_MASTER_MONGO_CONFIG_ID)
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1
                                        }
                                    }
                                ])
                                    .catch(err => {
                                        res.json({
                                            status: "error",
                                            code: "ERR-M-BLGD-003"
                                        });
                                    })
                                    .then(async result => {
                                        if (result?.length === 0) {
                                            res.json({
                                                status: "error",
                                                code: "ERR-M-BLGD-003"
                                            });
                                        } else {
                                            try {
                                                await BloggedConfig.findByIdAndUpdate(process.env.NODE_MASTER_MONGO_CONFIG_ID,
                                                    {
                                                        enable_ads: enable_ads
                                                    }
                                                )
                                                    .catch(err => {
                                                        res.json({
                                                            status: "error",
                                                            code: "ERR-M-BLGD-005"
                                                        });
                                                    })
                                                    .then(blogged_update_res => {
                                                        if (none_null(blogged_update_res)) {
                                                            res.json({
                                                                status: "error",
                                                                code: "ERR-M-BLGD-005"
                                                            });
                                                        } else {
                                                            res.json({
                                                                status: "success"
                                                            });
                                                        }
                                                    });
                                            } catch (error) {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-M-BLGD-005"
                                                });
                                            }
                                        }
                                    });
                            } catch (err) {
                                res.json({
                                    status: "error",
                                    code: "ERR-M-BLGD-003"
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
                code: "ERR-M-BLGD-021"
            });
        }
    } else {
        res.json({
            status: "error",
            code: "ERR-M-BLGD-020"
        });
    }
});

// Delete Admin Account
// INFO REQUIRED:
// master_password
router.delete('/delete', async (req, res) => {
    const master_password = req.headers["master_password"];

    if (none_null(master_password) === false) {
        try {
            await bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                if (error) {
                    res.json({
                        status: "error",
                        code: "ERR-M-BLGD-001"
                    });
                } else {
                    if (response) {
                        try {
                            await BloggedConfig.aggregate([
                                {
                                    $match: {
                                        _id: ObjectId(process.env.NODE_MASTER_MONGO_CONFIG_ID)
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1
                                    }
                                }
                            ])
                                .catch(err => {
                                    res.json({
                                        status: "error",
                                        code: "ERR-M-BLGD-003"
                                    });
                                })
                                .then(async result => {
                                    if (result?.length === 0) {
                                        res.json({
                                            status: "error",
                                            code: "ERR-M-BLGD-003"
                                        });
                                    } else {
                                        try {
                                            await BloggedConfig.findByIdAndDelete(process.env.NODE_MASTER_MONGO_CONFIG_ID)
                                                .catch(err => {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-M-BLGD-006"
                                                    });
                                                })
                                                .then(blogged_delete_res => {
                                                    if (none_null(blogged_delete_res)) {
                                                        res.json({
                                                            status: "error",
                                                            code: "ERR-M-BLGD-006"
                                                        });
                                                    } else {
                                                        res.json({
                                                            status: "success"
                                                        });
                                                    }
                                                });
                                        } catch (error) {
                                            res.json({
                                                status: "error",
                                                code: "ERR-M-BLGD-006"
                                            });
                                        }
                                    }
                                });
                        } catch (err) {
                            res.json({
                                status: "error",
                                code: "ERR-M-BLGD-003"
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
            code: "ERR-M-BLGD-020"
        });
    }
});

// Load Feedbacks
// INFO REQUIRED
// Pagination Index
router.get('/feedbacks', async (req, res) => {
    const master_password = req.headers["master_password"];
    const pagination_index = req.query.pagination_index;
    const query_f_i = pagination_indexer(pagination_index, 200)?.first_index;
    const query_l_i = pagination_indexer(pagination_index, 200)?.last_index;

    if (none_null(master_password) === false) {
        try {
            await bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                if (error) {
                    res.json({
                        status: "error",
                        code: "ERR-M-BLGD-001"
                    });
                } else {
                    if (response) {
                        try {
                            await Feedback.find()
                                .sort({ createdAt: -1 })
                                .skip(query_f_i)
                                .limit(query_l_i)
                                .catch(err => {
                                    res.json({
                                        status: "error",
                                        code: "ERR-M-BLGD-007"
                                    });
                                })
                                .then(async result => {
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
                                code: "ERR-M-BLGD-007"
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
            code: "ERR-M-BLGD-020"
        });
    }
});

// Load Suggested Tags
// INFO REQUIRED
// Pagination Index
router.get('/suggesttags', async (req, res) => {
    const master_password = req.headers["master_password"];
    const pagination_index = req.query.pagination_index;
    const query_f_i = pagination_indexer(pagination_index, 200)?.first_index;
    const query_l_i = pagination_indexer(pagination_index, 200)?.last_index;

    if (none_null(master_password) === false) {
        try {
            await bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                if (error) {
                    res.json({
                        status: "error",
                        code: "ERR-M-BLGD-001"
                    });
                } else {
                    if (response) {
                        try {
                            await SuggestTag.find()
                                .sort({ createdAt: -1 })
                                .skip(query_f_i)
                                .limit(query_l_i)
                                .catch(err => {
                                    res.json({
                                        status: "error",
                                        code: "ERR-M-BLGD-018"
                                    });
                                })
                                .then(async result => {
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
                                code: "ERR-M-BLGD-018"
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
            code: "ERR-M-BLGD-020"
        });
    }
});


module.exports = router;
