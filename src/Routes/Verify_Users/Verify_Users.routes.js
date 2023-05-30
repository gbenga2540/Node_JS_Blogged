const router = require('express').Router();
const bcrypt = require('bcryptjs');
require('dotenv').config();
const none_null = require('../../Utils/None_Null_Checker');
const User = require('../../Models/User_Model');
const invalid_arr_checker = require('../../Utils/Invalid_Arr_Checker');

// Creates Master Config
// INFO REQUIRED:
// master_password
router.patch('/', (req, res) => {
    try {
        const master_password = req.body.master_password;
        const processed_users_to_verify = invalid_arr_checker(
            req.body.users_to_verify,
        );
        const processed_verify =
            none_null(req.body.verify) || req.body.verify === false
                ? false
                : true;

        if (none_null(master_password) === false) {
            try {
                bcrypt.compare(
                    master_password,
                    process.env.NODE_MASTER_MONGO_CONFIG_PWD,
                    async (error, response) => {
                        if (error) {
                            res.json({
                                status: 'error',
                                code: 'ERR-M-BLGD-001',
                            });
                        } else {
                            if (response) {
                                try {
                                    await User.updateMany(
                                        {
                                            username: {
                                                $in: processed_users_to_verify,
                                            },
                                        },
                                        { verified: processed_verify },
                                    )
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-M-BLGD-022',
                                            });
                                        })
                                        .then(verify_users_res => {
                                            if (
                                                verify_users_res?.acknowledged
                                            ) {
                                                res.json({
                                                    status: 'success',
                                                });
                                            } else {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-M-BLGD-022',
                                                });
                                            }
                                        });
                                } catch (error) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-M-BLGD-022',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-M-BLGD-002',
                                });
                            }
                        }
                    },
                );
            } catch (error) {
                res.json({
                    status: 'error',
                    code: 'ERR-M-BLGD-001',
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
            code: 'ERR-M-BLGD-022',
        });
    }
});

module.exports = router;
