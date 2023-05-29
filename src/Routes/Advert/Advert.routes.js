const router = require('express').Router();
const bcrypt = require('bcryptjs');
require('dotenv').config();
const none_null = require('../../Utils/None_Null_Checker');
const none_null_dp = require('../../Utils/None_Null_Checker_DP');
const pagination_indexer = require('../../Utils/Pagination_Indexer');
const { cloudinary } = require('../../Config/Cloudinary');
const Advert = require('../../Models/Adverts_Model');
const BloggedConfig = require('../../Models/BloggedConfig_Model');

// Creates Ad
// INFO REQUIRED:
// master_password
// Advert Owner
// Advert Image -> cannot be null
// Advert URL
router.post('/create', (req, res) => {
    try {
        const master_password = req.body.master_password;
        const ad_owner = req.body.ad_owner;
        const ad_dp = none_null_dp(req.body.ad_dp);
        const ad_url = req.body.ad_url;

        if (none_null(master_password) === false) {
            if (none_null(ad_owner) === false && none_null(ad_url) === false) {
                try {
                    bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                        if (error) {
                            res.json({
                                status: 'error',
                                code: 'ERR-M-BLGD-001',
                            });
                        } else {
                            if (response) {
                                const advert = new Advert({
                                    ad_owner: ad_owner,
                                    ad_url: ad_url,
                                });

                                try {
                                    await advert
                                        .save()
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-M-BLGD-008',
                                            });
                                        })
                                        .then(async ad_save_result => {
                                            if (ad_save_result) {
                                                const ad_id = ad_save_result?.id;
                                                try {
                                                    await cloudinary.uploader.upload(
                                                        ad_dp,
                                                        {
                                                            folder: `${process.env.NODE_CLOUDINARY_ADS_FOLDER}`,
                                                            public_id: `${ad_id}`,
                                                        },
                                                        async (error, result) => {
                                                            if (error) {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-M-BLGD-009',
                                                                });
                                                            } else {
                                                                if (result) {
                                                                    const imageurl = result?.url;
                                                                    try {
                                                                        await Advert.findByIdAndUpdate(ad_id, { ad_dp_link: imageurl })
                                                                            .catch(err => {
                                                                                res.json({
                                                                                    status: 'error',
                                                                                    code: 'ERR-M-BLGD-011',
                                                                                });
                                                                            })
                                                                            .then(data => {
                                                                                if (data === null || data === undefined) {
                                                                                    res.json({
                                                                                        status: 'error',
                                                                                        code: 'ERR-M-BLGD-011',
                                                                                    });
                                                                                } else {
                                                                                    res.json({
                                                                                        status: 'success',
                                                                                    });
                                                                                }
                                                                            });
                                                                    } catch (err) {
                                                                        res.json({
                                                                            status: 'error',
                                                                            code: 'ERR-M-BLGD-011',
                                                                        });
                                                                    }
                                                                } else {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-M-BLGD-010',
                                                                    });
                                                                }
                                                            }
                                                        },
                                                    );
                                                } catch (err) {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-M-BLGD-009',
                                                    });
                                                }
                                            } else {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-M-BLGD-008',
                                                });
                                            }
                                        });
                                } catch (error) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-M-BLGD-008',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-M-BLGD-002',
                                });
                            }
                        }
                    });
                } catch (error) {
                    res.json({
                        status: 'error',
                        code: 'ERR-M-BLGD-001',
                    });
                }
            } else {
                res.json({
                    status: 'error',
                    code: 'ERR-M-BLGD-021',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-M-BLGD-020',
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-M-BLGD-008',
        });
    }
});

// Update Advert
// INFO REQUIRED:
// master_password
// Adverts ID
// Advert Owner
// Advert Image
// Advert URL
router.patch('/update', (req, res) => {
    try {
        const master_password = req.body.master_password;
        const ad_id = req.body.ad_id;
        const ad_owner = req.body.ad_owner;
        const ad_dp = none_null_dp(req.body.ad_dp);
        const ad_url = req.body.ad_url;

        if (none_null(master_password) === false) {
            if (none_null(ad_id) === false && none_null(ad_owner) === false && none_null(ad_url) === false) {
                try {
                    bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                        if (error) {
                            res.json({
                                status: 'error',
                                code: 'ERR-M-BLGD-001',
                            });
                        } else {
                            if (response) {
                                if (none_null(ad_dp)) {
                                    try {
                                        await Advert.findByIdAndUpdate(ad_id, {
                                            ad_owner: ad_owner,
                                            ad_url: ad_url,
                                        })
                                            .catch(err => {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-M-BLGD-014',
                                                });
                                            })
                                            .then(adv_update_res => {
                                                if (adv_update_res === null || adv_update_res === undefined) {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-M-BLGD-014',
                                                    });
                                                } else {
                                                    res.json({
                                                        status: 'success',
                                                    });
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-M-BLGD-014',
                                        });
                                    }
                                } else {
                                    try {
                                        await cloudinary.uploader.upload(
                                            ad_dp,
                                            {
                                                folder: `${process.env.NODE_CLOUDINARY_ADS_FOLDER}`,
                                                public_id: `${ad_id}`,
                                            },
                                            async (error, result) => {
                                                if (error) {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-M-BLGD-009',
                                                    });
                                                } else {
                                                    if (result) {
                                                        const imageurl = result?.url;
                                                        try {
                                                            await Advert.findByIdAndUpdate(ad_id, {
                                                                ad_owner: ad_owner,
                                                                ad_url: ad_url,
                                                                ad_dp_link: imageurl,
                                                            })
                                                                .catch(err => {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-M-BLGD-014',
                                                                    });
                                                                })
                                                                .then(data => {
                                                                    if (data === null || data === undefined) {
                                                                        res.json({
                                                                            status: 'error',
                                                                            code: 'ERR-M-BLGD-014',
                                                                        });
                                                                    } else {
                                                                        res.json({
                                                                            status: 'success',
                                                                        });
                                                                    }
                                                                });
                                                        } catch (err) {
                                                            res.json({
                                                                status: 'error',
                                                                code: 'ERR-M-BLGD-014',
                                                            });
                                                        }
                                                    } else {
                                                        res.json({
                                                            status: 'error',
                                                            code: 'ERR-M-BLGD-010',
                                                        });
                                                    }
                                                }
                                            },
                                        );
                                    } catch (err) {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-M-BLGD-009',
                                        });
                                    }
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-M-BLGD-002',
                                });
                            }
                        }
                    });
                } catch (error) {
                    res.json({
                        status: 'error',
                        code: 'ERR-M-BLGD-001',
                    });
                }
            } else {
                res.json({
                    status: 'error',
                    code: 'ERR-M-BLGD-021',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-M-BLGD-020',
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-M-BLGD-014',
        });
    }
});

// Delete Advert
// INFO REQUIRED:
// master_password
// Advert's ID
router.delete('/delete', (req, res) => {
    try {
        const master_password = req.headers['master_password'];
        const ad_id = req.headers['ad_id'];

        if (none_null(master_password) === false) {
            if (none_null(ad_id) === false) {
                try {
                    bcrypt.compare(master_password, process.env.NODE_MASTER_MONGO_CONFIG_PWD, async (error, response) => {
                        if (error) {
                            res.json({
                                status: 'error',
                                code: 'ERR-M-BLGD-001',
                            });
                        } else {
                            if (response) {
                                try {
                                    await cloudinary.uploader.destroy(`${process.env.NODE_CLOUDINARY_ADS_FOLDER}${ad_id}`, async (error, data) => {
                                        if (error) {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-M-BLGD-012',
                                            });
                                        } else {
                                            if (data?.result === 'not found' || data?.result === 'ok') {
                                                try {
                                                    await Advert.findByIdAndDelete(ad_id)
                                                        .catch(err => {
                                                            res.json({
                                                                status: 'error',
                                                                code: 'ERR-M-BLGD-013',
                                                            });
                                                        })
                                                        .then(del_adv_res => {
                                                            if (del_adv_res !== null || del_adv_res !== undefined) {
                                                                res.json({
                                                                    status: 'success',
                                                                });
                                                            } else {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-M-BLGD-013',
                                                                });
                                                            }
                                                        });
                                                } catch (err) {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-M-BLGD-013',
                                                    });
                                                }
                                            } else {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-M-BLGD-012',
                                                });
                                            }
                                        }
                                    });
                                } catch (err) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-M-BLGD-012',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-M-BLGD-002',
                                });
                            }
                        }
                    });
                } catch (error) {
                    res.json({
                        status: 'error',
                        code: 'ERR-M-BLGD-001',
                    });
                }
            } else {
                res.json({
                    status: 'error',
                    code: 'ERR-M-BLGD-021',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-M-BLGD-020',
            });
        }
    } catch (err) {
        res.json({
            status: 'error',
            code: 'ERR-M-BLGD-013',
        });
    }
});

// Load Adverts
// INFO REQUIRED
// URL Query first_index
// URL Query last_index
router.get('/', async (req, res) => {
    try {
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 20)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 20)?.last_index;

        await BloggedConfig.find()
            .catch(err => {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-059',
                });
            })
            .then(async config_res => {
                if (config_res !== null || config_res !== undefined) {
                    if (config_res?.length > 0) {
                        if (config_res[0]?.enable_ads) {
                            try {
                                await Advert.find()
                                    .sort({ createdAt: -1 })
                                    .skip(query_f_i)
                                    .limit(query_l_i)
                                    .catch(err => {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-BLGD-059',
                                        });
                                    })
                                    .then(result => {
                                        if (result !== null || result !== undefined) {
                                            if (result?.length > 0) {
                                                res.json({
                                                    status: 'success',
                                                    response: result,
                                                });
                                            } else {
                                                res.json({
                                                    status: 'success',
                                                    response: [],
                                                });
                                            }
                                        } else {
                                            res.json({
                                                status: 'success',
                                                response: [],
                                            });
                                        }
                                    });
                            } catch (error) {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-059',
                                });
                            }
                        } else {
                            res.json({
                                status: 'success',
                                response: [],
                            });
                        }
                    } else {
                        res.json({
                            status: 'success',
                            response: [],
                        });
                    }
                } else {
                    res.json({
                        status: 'success',
                        response: [],
                    });
                }
            });
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-059',
        });
    }
});

module.exports = router;
