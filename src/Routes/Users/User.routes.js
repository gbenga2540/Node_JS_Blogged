const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { cloudinary } = require('../../Config/Cloudinary');
const verifyJWTbody = require('../../Utils/Verify_JWT_Body');
const verifyJWTHeader = require('../../Utils/Verify_JWT_Header');
const verifyJWTHeaderIA = require('../../Utils/Verify_JWT_Header_IA');
const none_null = require('../../Utils/None_Null_Checker');
const none_null_bool = require('../../Utils/None_Null_Bool_Checker');
const none_null_dp = require('../../Utils/None_Null_Checker_DP');
const pagination_indexer = require('../../Utils/Pagination_Indexer');
const generate_random_number = require('../../Utils/Generate_Random_Number');
const regex_email_checker = require('../../Utils/Email_Checker');
const User = require('../../Models/User_Model');
const Blog = require('../../Models/Blog_Model');
const ObjectId = require('mongodb').ObjectId;

// Creates a new User Account
// INFO REQUIRED:
// username
// email
// password
// display picture --> send none if image isn't to be uploaded
router.post('/auth/signup', async (req, res) => {
    try {
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;
        const dp = none_null_dp(req.body.dp);

        if (
            regex_email_checker({ email: email }) &&
            none_null(username) === false &&
            none_null(password) === false
        ) {
            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                await User.aggregate([
                    {
                        $match: {
                            email: email,
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-002',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length === 0) {
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                username: username,
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                            },
                                        },
                                    ])
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-004',
                                            });
                                        })
                                        .then(async response => {
                                            if (response?.length === 0) {
                                                const user = new User({
                                                    username: username,
                                                    email: email,
                                                    password: hashedPassword,
                                                    dp_link: 'none',
                                                });

                                                try {
                                                    await user
                                                        .save()
                                                        .catch(err => {
                                                            res.json({
                                                                status: 'error',
                                                                code: 'ERR-BLGD-006',
                                                            });
                                                        })
                                                        .then(async result => {
                                                            if (result) {
                                                                const uid =
                                                                    result?._id?.toString();
                                                                const token =
                                                                    jwt.sign(
                                                                        {
                                                                            uid: uid,
                                                                        },
                                                                        process
                                                                            .env
                                                                            .NODE_AUTH_SECRET_KEY,
                                                                    );
                                                                if (
                                                                    none_null(
                                                                        dp,
                                                                    )
                                                                ) {
                                                                    res.json({
                                                                        status: 'success',
                                                                        response:
                                                                            {
                                                                                token: token,
                                                                                uid: uid,
                                                                            },
                                                                    });
                                                                } else {
                                                                    try {
                                                                        await cloudinary.uploader.upload(
                                                                            dp,
                                                                            {
                                                                                folder: `${process.env.NODE_CLOUDINARY_USERS_FOLDER}`,
                                                                                public_id: `${uid}`,
                                                                            },
                                                                            async (
                                                                                error,
                                                                                result,
                                                                            ) => {
                                                                                if (
                                                                                    error
                                                                                ) {
                                                                                    res.json(
                                                                                        {
                                                                                            status: 'error',
                                                                                            code: 'ERR-BLGD-007',
                                                                                        },
                                                                                    );
                                                                                } else {
                                                                                    if (
                                                                                        result
                                                                                    ) {
                                                                                        const imageurl =
                                                                                            result?.url;
                                                                                        try {
                                                                                            await User.findByIdAndUpdate(
                                                                                                uid,
                                                                                                {
                                                                                                    dp_link:
                                                                                                        imageurl,
                                                                                                },
                                                                                            )
                                                                                                .catch(
                                                                                                    err => {
                                                                                                        res.json(
                                                                                                            {
                                                                                                                status: 'error',
                                                                                                                code: 'ERR-BLGD-020',
                                                                                                            },
                                                                                                        );
                                                                                                    },
                                                                                                )
                                                                                                .then(
                                                                                                    data => {
                                                                                                        if (
                                                                                                            data ===
                                                                                                                null ||
                                                                                                            data ===
                                                                                                                undefined
                                                                                                        ) {
                                                                                                            res.json(
                                                                                                                {
                                                                                                                    status: 'error',
                                                                                                                    code: 'ERR-BLGD-020',
                                                                                                                },
                                                                                                            );
                                                                                                        } else {
                                                                                                            res.json(
                                                                                                                {
                                                                                                                    status: 'success',
                                                                                                                    response:
                                                                                                                        {
                                                                                                                            token: token,
                                                                                                                            uid: uid,
                                                                                                                        },
                                                                                                                },
                                                                                                            );
                                                                                                        }
                                                                                                    },
                                                                                                );
                                                                                        } catch (err) {
                                                                                            res.json(
                                                                                                {
                                                                                                    status: 'error',
                                                                                                    code: 'ERR-BLGD-020',
                                                                                                },
                                                                                            );
                                                                                        }
                                                                                    } else {
                                                                                        res.json(
                                                                                            {
                                                                                                status: 'error',
                                                                                                code: 'ERR-BLGD-008',
                                                                                            },
                                                                                        );
                                                                                    }
                                                                                }
                                                                            },
                                                                        );
                                                                    } catch (err) {
                                                                        res.json(
                                                                            {
                                                                                status: 'error',
                                                                                code: 'ERR-BLGD-007',
                                                                            },
                                                                        );
                                                                    }
                                                                }
                                                            } else {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-BLGD-006',
                                                                });
                                                            }
                                                        });
                                                } catch (error) {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-006',
                                                    });
                                                }
                                            } else {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-005',
                                                });
                                            }
                                        });
                                } catch (error) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-004',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-003',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-003',
                            });
                        }
                    });
            } catch (err) {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-001',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-BLGD-071',
            });
        }
    } catch (err) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-001',
        });
    }
});

// Logs in a user
// INFO REQUIRED:
// email
// password
router.post('/auth/signin', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (
            regex_email_checker({ email: email }) &&
            none_null(password) === false
        ) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            email: email,
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1,
                            password: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-009',
                        });
                    })
                    .then(result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    bcrypt.compare(
                                        password,
                                        result[0]?.password,
                                        (error, response) => {
                                            if (error) {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-011',
                                                });
                                            } else {
                                                if (response) {
                                                    const uid =
                                                        result[0]?._id?.toString();
                                                    const token = jwt.sign(
                                                        { uid: uid },
                                                        process.env
                                                            .NODE_AUTH_SECRET_KEY,
                                                    );
                                                    res.json({
                                                        status: 'success',
                                                        response: {
                                                            token: token,
                                                            uid: uid,
                                                            email_v:
                                                                result[0]
                                                                    ?.email_v,
                                                        },
                                                    });
                                                } else {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-012',
                                                    });
                                                }
                                            }
                                        },
                                    );
                                } catch (error) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-011',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-010',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-010',
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-009',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-BLGD-071',
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-009',
        });
    }
});

// Sends Verification link to user account
// INFO REQUIRED:
// token
router.patch('/verifymail/send', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const user_v_code = generate_random_number(6);

        await User.aggregate([
            {
                $match: {
                    _id: ObjectId(uid),
                },
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    email_v: 1,
                },
            },
        ])
            .catch(err => {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-016',
                });
            })
            .then(async result => {
                if (result !== null || result !== undefined) {
                    if (result?.length > 0) {
                        if (result[0]?.email_v === false) {
                            const transporter = nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 587,
                                service: 'gmail',
                                secureConnection: false,
                                auth: {
                                    user: process.env.NODE_GMAIL_ACCOUNT,
                                    pass: process.env.NODE_GMAIL_PASSWORD,
                                },
                                secure: false,
                                from: process.env.NODE_GMAIL_ACCOUNT,
                                tls: {
                                    rejectUnauthourized: false,
                                    ciphers: 'SSLv3',
                                },
                            });
                            try {
                                await transporter
                                    .verify()
                                    .catch(err => {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-BLGD-017',
                                        });
                                    })
                                    .then(response => {
                                        if (response) {
                                            const mailOptions = {
                                                from: `Blogged ${process.env.NODE_GMAIL_ACCOUNT}`,
                                                to: result[0]?.email,
                                                subject:
                                                    'Verify your Email Address',
                                                text: `Hi, ${result[0]?.username[0]?.toUpperCase()}${result[0]?.username
                                                    ?.slice(1)
                                                    ?.toLowerCase()}. To verify your email address, please use the One Time Password (OTP) provided below:\n \n \n ${user_v_code}`,
                                            };
                                            try {
                                                transporter.sendMail(
                                                    mailOptions,
                                                    async (error, data) => {
                                                        if (error) {
                                                            res.json({
                                                                status: 'error',
                                                                code: 'ERR-BLGD-017',
                                                            });
                                                        } else {
                                                            if (
                                                                data?.accepted
                                                                    ?.length >
                                                                    0 &&
                                                                data?.rejected
                                                                    ?.length ===
                                                                    0
                                                            ) {
                                                                try {
                                                                    await User.findByIdAndUpdate(
                                                                        uid,
                                                                        {
                                                                            v_code: user_v_code,
                                                                        },
                                                                    )
                                                                        .catch(
                                                                            err => {
                                                                                res.json(
                                                                                    {
                                                                                        status: 'error',
                                                                                        code: 'ERR-BLGD-069',
                                                                                    },
                                                                                );
                                                                            },
                                                                        )
                                                                        .then(
                                                                            async response => {
                                                                                if (
                                                                                    response ===
                                                                                        null ||
                                                                                    response ===
                                                                                        undefined
                                                                                ) {
                                                                                    res.json(
                                                                                        {
                                                                                            status: 'error',
                                                                                            code: 'ERR-BLGD-069',
                                                                                        },
                                                                                    );
                                                                                } else {
                                                                                    res.json(
                                                                                        {
                                                                                            status: 'success',
                                                                                        },
                                                                                    );
                                                                                }
                                                                            },
                                                                        );
                                                                } catch (error) {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-BLGD-069',
                                                                    });
                                                                }
                                                            } else {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-BLGD-017',
                                                                });
                                                            }
                                                        }
                                                    },
                                                );
                                            } catch (error) {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-017',
                                                });
                                            }
                                        } else {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-017',
                                            });
                                        }
                                    });
                            } catch (error) {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-017',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-068',
                            });
                        }
                    } else {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-016',
                        });
                    }
                } else {
                    res.json({
                        status: 'error',
                        code: 'ERR-BLGD-016',
                    });
                }
            });
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-017',
        });
    }
});

// Confirms the user's Email Address
// INFO REQUIRED:
// token
// OTP
router.patch('/verifymail/confirm', verifyJWTbody, async (req, res) => {
    try {
        const uid = req.uid;
        const OTP = req.body.otp?.toString();

        if (none_null(OTP) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1,
                            v_code: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-016',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === false) {
                                    if (result[0]?.v_code === OTP) {
                                        try {
                                            await User.updateOne(
                                                { _id: ObjectId(uid) },
                                                { $set: { email_v: true } },
                                            )
                                                .catch(err => {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-018',
                                                    });
                                                })
                                                .then(response => {
                                                    if (
                                                        response?.acknowledged ===
                                                        true
                                                    ) {
                                                        res.json({
                                                            status: 'success',
                                                        });
                                                    } else {
                                                        res.json({
                                                            status: 'error',
                                                            code: 'ERR-BLGD-018',
                                                        });
                                                    }
                                                });
                                        } catch (error) {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-018',
                                            });
                                        }
                                    } else {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-BLGD-070',
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: 'success',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-016',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-016',
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-018',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-BLGD-071',
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-018',
        });
    }
});

// Sends New Numeric Password to user's email
// INFO REQUIRED:
// token
router.patch('/forgotpassword', async (req, res) => {
    try {
        const email = req?.body?.email;
        const user_new_pwd = generate_random_number(6);

        await User.aggregate([
            {
                $match: {
                    email: email,
                },
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                },
            },
        ])
            .catch(err => {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-016',
                });
            })
            .then(async result => {
                const uid = result[0]?._id?.toString();
                if (result !== null || result !== undefined) {
                    if (result?.length > 0) {
                        const transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 587,
                            service: 'gmail',
                            secureConnection: false,
                            auth: {
                                user: process.env.NODE_GMAIL_ACCOUNT,
                                pass: process.env.NODE_GMAIL_PASSWORD,
                            },
                            secure: false,
                            from: process.env.NODE_GMAIL_ACCOUNT,
                            tls: {
                                rejectUnauthourized: false,
                                ciphers: 'SSLv3',
                            },
                        });
                        try {
                            await transporter
                                .verify()
                                .catch(err => {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-072',
                                    });
                                })
                                .then(response => {
                                    if (response) {
                                        const mailOptions = {
                                            from: `Blogged ${process.env.NODE_GMAIL_ACCOUNT}`,
                                            to: result[0]?.email,
                                            subject: "Here's your new Password",
                                            text: `Hi, ${result[0]?.username[0]?.toUpperCase()}${result[0]?.username
                                                ?.slice(1)
                                                ?.toLowerCase()}. Below is the new password that has been auto-generated for you:\n \n \n ${user_new_pwd}`,
                                        };
                                        try {
                                            transporter.sendMail(
                                                mailOptions,
                                                async (error, data) => {
                                                    if (error) {
                                                        res.json({
                                                            status: 'error',
                                                            code: 'ERR-BLGD-072',
                                                        });
                                                    } else {
                                                        if (
                                                            data?.accepted
                                                                ?.length > 0 &&
                                                            data?.rejected
                                                                ?.length === 0
                                                        ) {
                                                            try {
                                                                const salt =
                                                                    await bcrypt.genSalt(
                                                                        10,
                                                                    );
                                                                const hashedPassword =
                                                                    await bcrypt.hash(
                                                                        user_new_pwd,
                                                                        salt,
                                                                    );

                                                                await User.findByIdAndUpdate(
                                                                    uid,
                                                                    {
                                                                        password:
                                                                            hashedPassword,
                                                                    },
                                                                )
                                                                    .catch(
                                                                        err => {
                                                                            res.json(
                                                                                {
                                                                                    status: 'error',
                                                                                    code: 'ERR-BLGD-073',
                                                                                },
                                                                            );
                                                                        },
                                                                    )
                                                                    .then(
                                                                        async response => {
                                                                            if (
                                                                                response ===
                                                                                    null ||
                                                                                response ===
                                                                                    undefined
                                                                            ) {
                                                                                res.json(
                                                                                    {
                                                                                        status: 'error',
                                                                                        code: 'ERR-BLGD-073',
                                                                                    },
                                                                                );
                                                                            } else {
                                                                                res.json(
                                                                                    {
                                                                                        status: 'success',
                                                                                    },
                                                                                );
                                                                            }
                                                                        },
                                                                    );
                                                            } catch (error) {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-BLGD-073',
                                                                });
                                                            }
                                                        } else {
                                                            res.json({
                                                                status: 'error',
                                                                code: 'ERR-BLGD-072',
                                                            });
                                                        }
                                                    }
                                                },
                                            );
                                        } catch (error) {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-072',
                                            });
                                        }
                                    } else {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-BLGD-072',
                                        });
                                    }
                                });
                        } catch (error) {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-072',
                            });
                        }
                    } else {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-016',
                        });
                    }
                } else {
                    res.json({
                        status: 'error',
                        code: 'ERR-BLGD-016',
                    });
                }
            });
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-072',
        });
    }
});

// Resets a user password
// INFO REQUIRED:
// token
// old password
// new password
router.patch('/resetpassword', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const oldpassword = req.body.oldpassword;
        const newpassword = req.body.newpassword;

        if (
            none_null(oldpassword) === false &&
            none_null(newpassword) === false
        ) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1,
                            password: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-016',
                        });
                    })
                    .then(result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        bcrypt.compare(
                                            oldpassword,
                                            result[0]?.password,
                                            async (err, response) => {
                                                if (err) {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-011',
                                                    });
                                                } else {
                                                    if (response) {
                                                        try {
                                                            const salt =
                                                                await bcrypt.genSalt(
                                                                    10,
                                                                );
                                                            const hashedPassword =
                                                                await bcrypt.hash(
                                                                    newpassword,
                                                                    salt,
                                                                );
                                                            await User.updateOne(
                                                                {
                                                                    _id: ObjectId(
                                                                        uid,
                                                                    ),
                                                                },
                                                                {
                                                                    $set: {
                                                                        password:
                                                                            hashedPassword,
                                                                    },
                                                                },
                                                            )
                                                                .catch(err => {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-BLGD-015',
                                                                    });
                                                                })
                                                                .then(
                                                                    response => {
                                                                        if (
                                                                            response?.matchedCount >
                                                                                0 &&
                                                                            response?.modifiedCount >
                                                                                0
                                                                        ) {
                                                                            res.json(
                                                                                {
                                                                                    status: 'success',
                                                                                },
                                                                            );
                                                                        } else {
                                                                            res.json(
                                                                                {
                                                                                    status: 'error',
                                                                                    code: 'ERR-BLGD-015',
                                                                                },
                                                                            );
                                                                        }
                                                                    },
                                                                );
                                                        } catch (error) {
                                                            res.json({
                                                                status: 'error',
                                                                code: 'ERR-BLGD-015',
                                                            });
                                                        }
                                                    } else {
                                                        res.json({
                                                            status: 'error',
                                                            code: 'ERR-BLGD-012',
                                                        });
                                                    }
                                                }
                                            },
                                        );
                                    } catch (error) {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-BLGD-011',
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-022',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-016',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-016',
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-015',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-BLGD-071',
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-015',
        });
    }
});

// Change User's Username
// INFO REQUIRED:
// token
// new username
router.patch('/updateusername', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const username = req.body.username;

        if (none_null(username) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-016',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await User.updateOne(
                                            { _id: ObjectId(uid) },
                                            { $set: { username: username } },
                                        )
                                            .catch(err => {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-019',
                                                });
                                            })
                                            .then(response => {
                                                if (
                                                    response?.matchedCount >
                                                        0 &&
                                                    response?.modifiedCount > 0
                                                ) {
                                                    res.json({
                                                        status: 'success',
                                                    });
                                                } else {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-019',
                                                    });
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-BLGD-019',
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-022',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-016',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-016',
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-019',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-BLGD-071',
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-019',
        });
    }
});

// Change User's Display Picture
// INFO REQUIRED:
// token
// new display picture -> send none if image isn't to be uploaded
router.patch('/updatedp', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const dp = none_null_dp(req.body.dp);

        await User.aggregate([
            {
                $match: {
                    _id: ObjectId(uid),
                },
            },
            {
                $project: {
                    _id: 1,
                    email_v: 1,
                },
            },
        ])
            .catch(err => {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-016',
                });
            })
            .then(async response => {
                if (response !== null || response !== undefined) {
                    if (response?.length > 0) {
                        if (response[0]?.email_v === true) {
                            if (none_null(dp)) {
                                try {
                                    await cloudinary.uploader.destroy(
                                        `${process.env.NODE_CLOUDINARY_USERS_FOLDER}${uid}`,
                                        async (error, data) => {
                                            if (error) {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-021',
                                                });
                                            } else {
                                                if (
                                                    data?.result ===
                                                        'not found' ||
                                                    data?.result === 'ok'
                                                ) {
                                                    try {
                                                        await User.updateOne(
                                                            {
                                                                _id: ObjectId(
                                                                    uid,
                                                                ),
                                                            },
                                                            {
                                                                $set: {
                                                                    dp_link:
                                                                        'none',
                                                                },
                                                            },
                                                        )
                                                            .catch(err => {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-BLGD-020',
                                                                });
                                                            })
                                                            .then(data => {
                                                                if (
                                                                    data?.matchedCount >
                                                                        0 &&
                                                                    data?.modifiedCount >
                                                                        0
                                                                ) {
                                                                    res.json({
                                                                        status: 'success',
                                                                    });
                                                                } else {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-BLGD-020',
                                                                    });
                                                                }
                                                            });
                                                    } catch (err) {
                                                        res.json({
                                                            status: 'error',
                                                            code: 'ERR-BLGD-020',
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-021',
                                                    });
                                                }
                                            }
                                        },
                                    );
                                } catch (err) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-021',
                                    });
                                }
                            } else {
                                try {
                                    await cloudinary.uploader.upload(
                                        dp,
                                        {
                                            folder: `${process.env.NODE_CLOUDINARY_USERS_FOLDER}`,
                                            public_id: `${uid}`,
                                        },
                                        async (error, result) => {
                                            if (error) {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-007',
                                                });
                                            } else {
                                                if (result) {
                                                    const imageurl =
                                                        result?.url;
                                                    try {
                                                        await User.updateOne(
                                                            {
                                                                _id: ObjectId(
                                                                    uid,
                                                                ),
                                                            },
                                                            {
                                                                $set: {
                                                                    dp_link:
                                                                        imageurl,
                                                                },
                                                            },
                                                        )
                                                            .catch(err => {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-BLGD-020',
                                                                });
                                                            })
                                                            .then(data => {
                                                                if (
                                                                    data?.matchedCount >
                                                                        0 &&
                                                                    data?.modifiedCount >
                                                                        0
                                                                ) {
                                                                    res.json({
                                                                        status: 'success',
                                                                    });
                                                                } else {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-BLGD-020',
                                                                    });
                                                                }
                                                            });
                                                    } catch (err) {
                                                        res.json({
                                                            status: 'error',
                                                            code: 'ERR-BLGD-020',
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-008',
                                                    });
                                                }
                                            }
                                        },
                                    );
                                } catch (err) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-007',
                                    });
                                }
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-022',
                            });
                        }
                    } else {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-016',
                        });
                    }
                } else {
                    res.json({
                        status: 'error',
                        code: 'ERR-BLGD-016',
                    });
                }
            });
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-020',
        });
    }
});

// Follow a Blog Author
// INFO REQUIRED:
// token
// Author's ID
router.patch('/follow', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const aid = req.body.aid;

        if (none_null(aid) === false) {
            if (uid !== aid) {
                try {
                    await User.aggregate([
                        {
                            $match: {
                                _id: ObjectId(uid),
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                email_v: 1,
                            },
                        },
                    ])
                        .catch(err => {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-016',
                            });
                        })
                        .then(async result => {
                            if (result !== null || result !== undefined) {
                                if (result?.length > 0) {
                                    if (result[0]?.email_v === true) {
                                        try {
                                            await User.findByIdAndUpdate(aid, {
                                                $addToSet: {
                                                    followers: ObjectId(uid),
                                                },
                                            })
                                                .catch(err => {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-032',
                                                    });
                                                })
                                                .then(async response => {
                                                    if (
                                                        response === null ||
                                                        response === undefined
                                                    ) {
                                                        res.json({
                                                            status: 'error',
                                                            code: 'ERR-BLGD-034',
                                                        });
                                                    } else {
                                                        try {
                                                            await User.findByIdAndUpdate(
                                                                uid,
                                                                {
                                                                    $addToSet: {
                                                                        following:
                                                                            ObjectId(
                                                                                aid,
                                                                            ),
                                                                    },
                                                                },
                                                            )
                                                                .catch(err => {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-BLGD-032',
                                                                    });
                                                                })
                                                                .then(data => {
                                                                    if (
                                                                        data ===
                                                                            null ||
                                                                        data ===
                                                                            undefined
                                                                    ) {
                                                                        res.json(
                                                                            {
                                                                                status: 'error',
                                                                                code: 'ERR-BLGD-016',
                                                                            },
                                                                        );
                                                                    } else {
                                                                        res.json(
                                                                            {
                                                                                status: 'success',
                                                                            },
                                                                        );
                                                                    }
                                                                });
                                                        } catch (error) {
                                                            res.json({
                                                                status: 'error',
                                                                code: 'ERR-BLGD-032',
                                                            });
                                                        }
                                                    }
                                                });
                                        } catch (error) {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-032',
                                            });
                                        }
                                    } else {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-BLGD-022',
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-016',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-016',
                                });
                            }
                        });
                } catch (error) {
                    res.json({
                        status: 'error',
                        code: 'ERR-BLGD-032',
                    });
                }
            } else {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-074',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-BLGD-071',
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-032',
        });
    }
});

// Unfollow a Blog Author
// INFO REQUIRED:
// token
// Author's ID
router.patch('/unfollow', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const aid = req.body.aid;

        if (none_null(aid) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-016',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await User.findByIdAndUpdate(aid, {
                                            $pull: { followers: ObjectId(uid) },
                                        })
                                            .catch(err => {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-033',
                                                });
                                            })
                                            .then(async response => {
                                                if (
                                                    response === null ||
                                                    response === undefined
                                                ) {
                                                    try {
                                                        await User.findByIdAndUpdate(
                                                            uid,
                                                            {
                                                                $pull: {
                                                                    following:
                                                                        ObjectId(
                                                                            aid,
                                                                        ),
                                                                },
                                                            },
                                                        )
                                                            .catch(err => {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-BLGD-033',
                                                                });
                                                            })
                                                            .then(data => {
                                                                if (
                                                                    data ===
                                                                        null ||
                                                                    data ===
                                                                        undefined
                                                                ) {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-BLGD-016',
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
                                                            code: 'ERR-BLGD-033',
                                                        });
                                                    }
                                                } else {
                                                    try {
                                                        await User.findByIdAndUpdate(
                                                            uid,
                                                            {
                                                                $pull: {
                                                                    following:
                                                                        ObjectId(
                                                                            aid,
                                                                        ),
                                                                },
                                                            },
                                                        )
                                                            .catch(err => {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-BLGD-033',
                                                                });
                                                            })
                                                            .then(data => {
                                                                if (
                                                                    data ===
                                                                        null ||
                                                                    data ===
                                                                        undefined
                                                                ) {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-BLGD-016',
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
                                                            code: 'ERR-BLGD-033',
                                                        });
                                                    }
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: 'error',
                                            code: 'ERR-BLGD-033',
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-022',
                                    });
                                }
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-016',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-016',
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-033',
                });
            }
        } else {
            res.json({
                status: 'error',
                code: 'ERR-BLGD-071',
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-033',
        });
    }
});

// Delete User Account
// INFO REQUIRED:
// token
router.delete('/delete', verifyJWTHeader, async (req, res) => {
    try {
        const uid = req?.uid;

        await User.aggregate([
            {
                $match: {
                    _id: ObjectId(uid),
                },
            },
            {
                $project: {
                    _id: 1,
                    email_v: 1,
                    dp_link: 1,
                    following: 1,
                    followers: 1,
                },
            },
        ])
            .catch(err => {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-016',
                });
            })
            .then(async u_result => {
                if (u_result !== null || u_result !== undefined) {
                    if (u_result?.length > 0) {
                        if (u_result[0]?.email_v === true) {
                            if (none_null(u_result[0]?.dp_link)) {
                                try {
                                    await User.updateMany(
                                        {
                                            _id: {
                                                $in: u_result[0]?.following,
                                            },
                                        },
                                        { $pull: { followers: ObjectId(uid) } },
                                    )
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-054',
                                            });
                                        })
                                        .then(async followers_res => {
                                            if (followers_res?.acknowledged) {
                                                try {
                                                    await User.updateMany(
                                                        {
                                                            _id: {
                                                                $in: u_result[0]
                                                                    ?.followers,
                                                            },
                                                        },
                                                        {
                                                            $pull: {
                                                                following:
                                                                    ObjectId(
                                                                        uid,
                                                                    ),
                                                            },
                                                        },
                                                    )
                                                        .catch(err => {
                                                            res.json({
                                                                status: 'error',
                                                                code: 'ERR-BLGD-054',
                                                            });
                                                        })
                                                        .then(
                                                            async following_res => {
                                                                if (
                                                                    following_res?.acknowledged
                                                                ) {
                                                                    try {
                                                                        await User.aggregate(
                                                                            [
                                                                                {
                                                                                    $match: {
                                                                                        _id: ObjectId(
                                                                                            uid,
                                                                                        ),
                                                                                    },
                                                                                },
                                                                                {
                                                                                    $project:
                                                                                        {
                                                                                            _id: 1,
                                                                                        },
                                                                                },
                                                                            ],
                                                                        )
                                                                            .catch(
                                                                                err => {
                                                                                    res.json(
                                                                                        {
                                                                                            status: 'error',
                                                                                            code: 'ERR-BLGD-016',
                                                                                        },
                                                                                    );
                                                                                },
                                                                            )
                                                                            .then(
                                                                                async new_u_result => {
                                                                                    if (
                                                                                        new_u_result !==
                                                                                            null ||
                                                                                        new_u_result !==
                                                                                            undefined
                                                                                    ) {
                                                                                        if (
                                                                                            new_u_result?.length >
                                                                                            0
                                                                                        ) {
                                                                                            try {
                                                                                                await User.findByIdAndDelete(
                                                                                                    uid,
                                                                                                )
                                                                                                    .catch(
                                                                                                        err => {
                                                                                                            res.json(
                                                                                                                {
                                                                                                                    status: 'error',
                                                                                                                    code: 'ERR-BLGD-054',
                                                                                                                },
                                                                                                            );
                                                                                                        },
                                                                                                    )
                                                                                                    .then(
                                                                                                        del_u_res => {
                                                                                                            if (
                                                                                                                del_u_res ===
                                                                                                                    null ||
                                                                                                                del_u_res ===
                                                                                                                    undefined
                                                                                                            ) {
                                                                                                                res.json(
                                                                                                                    {
                                                                                                                        status: 'error',
                                                                                                                        code: 'ERR-BLGD-054',
                                                                                                                    },
                                                                                                                );
                                                                                                            } else {
                                                                                                                res.json(
                                                                                                                    {
                                                                                                                        status: 'success',
                                                                                                                    },
                                                                                                                );
                                                                                                            }
                                                                                                        },
                                                                                                    );
                                                                                            } catch (error) {
                                                                                                res.json(
                                                                                                    {
                                                                                                        status: 'error',
                                                                                                        code: 'ERR-BLGD-054',
                                                                                                    },
                                                                                                );
                                                                                            }
                                                                                        } else {
                                                                                            res.json(
                                                                                                {
                                                                                                    status: 'error',
                                                                                                    code: 'ERR-BLGD-016',
                                                                                                },
                                                                                            );
                                                                                        }
                                                                                    } else {
                                                                                        res.json(
                                                                                            {
                                                                                                status: 'error',
                                                                                                code: 'ERR-BLGD-016',
                                                                                            },
                                                                                        );
                                                                                    }
                                                                                },
                                                                            );
                                                                    } catch (error) {
                                                                        res.json(
                                                                            {
                                                                                status: 'error',
                                                                                code: 'ERR-BLGD-016',
                                                                            },
                                                                        );
                                                                    }
                                                                } else {
                                                                    res.json({
                                                                        status: 'error',
                                                                        code: 'ERR-BLGD-054',
                                                                    });
                                                                }
                                                            },
                                                        );
                                                } catch (error) {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-054',
                                                    });
                                                }
                                            } else {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-054',
                                                });
                                            }
                                        });
                                } catch (error) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-054',
                                    });
                                }
                            } else {
                                try {
                                    await cloudinary.uploader.destroy(
                                        `${process.env.NODE_CLOUDINARY_USERS_FOLDER}${uid}`,
                                        async (error, data) => {
                                            if (error) {
                                                res.json({
                                                    status: 'error',
                                                    code: 'ERR-BLGD-021',
                                                });
                                            } else {
                                                if (
                                                    data?.result ===
                                                        'not found' ||
                                                    data?.result === 'ok'
                                                ) {
                                                    try {
                                                        await User.updateMany(
                                                            {
                                                                _id: {
                                                                    $in: u_result[0]
                                                                        ?.following,
                                                                },
                                                            },
                                                            {
                                                                $pull: {
                                                                    followers:
                                                                        ObjectId(
                                                                            uid,
                                                                        ),
                                                                },
                                                            },
                                                        )
                                                            .catch(err => {
                                                                res.json({
                                                                    status: 'error',
                                                                    code: 'ERR-BLGD-054',
                                                                });
                                                            })
                                                            .then(
                                                                async followers_res => {
                                                                    if (
                                                                        followers_res?.acknowledged
                                                                    ) {
                                                                        try {
                                                                            await User.updateMany(
                                                                                {
                                                                                    _id: {
                                                                                        $in: u_result[0]
                                                                                            ?.followers,
                                                                                    },
                                                                                },
                                                                                {
                                                                                    $pull: {
                                                                                        following:
                                                                                            ObjectId(
                                                                                                uid,
                                                                                            ),
                                                                                    },
                                                                                },
                                                                            )
                                                                                .catch(
                                                                                    err => {
                                                                                        res.json(
                                                                                            {
                                                                                                status: 'error',
                                                                                                code: 'ERR-BLGD-054',
                                                                                            },
                                                                                        );
                                                                                    },
                                                                                )
                                                                                .then(
                                                                                    async following_res => {
                                                                                        if (
                                                                                            following_res?.acknowledged
                                                                                        ) {
                                                                                            try {
                                                                                                await User.aggregate(
                                                                                                    [
                                                                                                        {
                                                                                                            $match: {
                                                                                                                _id: ObjectId(
                                                                                                                    uid,
                                                                                                                ),
                                                                                                            },
                                                                                                        },
                                                                                                        {
                                                                                                            $project:
                                                                                                                {
                                                                                                                    _id: 1,
                                                                                                                },
                                                                                                        },
                                                                                                    ],
                                                                                                )
                                                                                                    .catch(
                                                                                                        err => {
                                                                                                            res.json(
                                                                                                                {
                                                                                                                    status: 'error',
                                                                                                                    code: 'ERR-BLGD-016',
                                                                                                                },
                                                                                                            );
                                                                                                        },
                                                                                                    )
                                                                                                    .then(
                                                                                                        async new_u_result => {
                                                                                                            if (
                                                                                                                new_u_result !==
                                                                                                                    null ||
                                                                                                                new_u_result !==
                                                                                                                    undefined
                                                                                                            ) {
                                                                                                                if (
                                                                                                                    new_u_result?.length >
                                                                                                                    0
                                                                                                                ) {
                                                                                                                    try {
                                                                                                                        await User.findByIdAndDelete(
                                                                                                                            uid,
                                                                                                                        )
                                                                                                                            .catch(
                                                                                                                                err => {
                                                                                                                                    res.json(
                                                                                                                                        {
                                                                                                                                            status: 'error',
                                                                                                                                            code: 'ERR-BLGD-054',
                                                                                                                                        },
                                                                                                                                    );
                                                                                                                                },
                                                                                                                            )
                                                                                                                            .then(
                                                                                                                                del_u_res => {
                                                                                                                                    if (
                                                                                                                                        del_u_res ===
                                                                                                                                            null ||
                                                                                                                                        del_u_res ===
                                                                                                                                            undefined
                                                                                                                                    ) {
                                                                                                                                        res.json(
                                                                                                                                            {
                                                                                                                                                status: 'error',
                                                                                                                                                code: 'ERR-BLGD-054',
                                                                                                                                            },
                                                                                                                                        );
                                                                                                                                    } else {
                                                                                                                                        res.json(
                                                                                                                                            {
                                                                                                                                                status: 'success',
                                                                                                                                            },
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                },
                                                                                                                            );
                                                                                                                    } catch (error) {
                                                                                                                        res.json(
                                                                                                                            {
                                                                                                                                status: 'error',
                                                                                                                                code: 'ERR-BLGD-054',
                                                                                                                            },
                                                                                                                        );
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.json(
                                                                                                                        {
                                                                                                                            status: 'error',
                                                                                                                            code: 'ERR-BLGD-016',
                                                                                                                        },
                                                                                                                    );
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.json(
                                                                                                                    {
                                                                                                                        status: 'error',
                                                                                                                        code: 'ERR-BLGD-016',
                                                                                                                    },
                                                                                                                );
                                                                                                            }
                                                                                                        },
                                                                                                    );
                                                                                            } catch (error) {
                                                                                                res.json(
                                                                                                    {
                                                                                                        status: 'error',
                                                                                                        code: 'ERR-BLGD-016',
                                                                                                    },
                                                                                                );
                                                                                            }
                                                                                        } else {
                                                                                            res.json(
                                                                                                {
                                                                                                    status: 'error',
                                                                                                    code: 'ERR-BLGD-054',
                                                                                                },
                                                                                            );
                                                                                        }
                                                                                    },
                                                                                );
                                                                        } catch (error) {
                                                                            res.json(
                                                                                {
                                                                                    status: 'error',
                                                                                    code: 'ERR-BLGD-054',
                                                                                },
                                                                            );
                                                                        }
                                                                    } else {
                                                                        res.json(
                                                                            {
                                                                                status: 'error',
                                                                                code: 'ERR-BLGD-054',
                                                                            },
                                                                        );
                                                                    }
                                                                },
                                                            );
                                                    } catch (error) {
                                                        res.json({
                                                            status: 'error',
                                                            code: 'ERR-BLGD-054',
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        status: 'error',
                                                        code: 'ERR-BLGD-021',
                                                    });
                                                }
                                            }
                                        },
                                    );
                                } catch (error) {
                                    res.json({
                                        status: 'error',
                                        code: 'ERR-BLGD-021',
                                    });
                                }
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-022',
                            });
                        }
                    } else {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-016',
                        });
                    }
                } else {
                    res.json({
                        status: 'error',
                        code: 'ERR-BLGD-016',
                    });
                }
            });
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-054',
        });
    }
});

// Load User's Followers
// INFO REQUIRED
// User's ID
// URL Query first_index
// URL Query last_index
router.get('/:aid/followers', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const aid = req.params.aid;
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 20)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 20)?.last_index;

        if (none_null(uid)) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(aid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            followers: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-057',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                _id: {
                                                    $in: result[0]?.followers,
                                                },
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                username: 1,
                                                verified: 1,
                                                dp_link: 1,
                                                followers_l: {
                                                    $size: '$followers',
                                                },
                                                createdAt: 1,
                                            },
                                        },
                                    ])
                                        .sort({ createdAt: -1 })
                                        .skip(query_f_i)
                                        .limit(query_l_i)
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-057',
                                            });
                                        })
                                        .then(response => {
                                            if (
                                                response !== null ||
                                                response !== undefined
                                            ) {
                                                if (response?.length > 0) {
                                                    const new_users = [];
                                                    if (response?.length > 0) {
                                                        response.map(item => {
                                                            const user_info =
                                                                {};
                                                            user_info['uid'] =
                                                                item?._id?.toString();
                                                            user_info[
                                                                'isowner'
                                                            ] = false;
                                                            user_info[
                                                                'username'
                                                            ] = item?.username;
                                                            user_info[
                                                                'verified'
                                                            ] = none_null_bool(
                                                                item?.verified,
                                                            )
                                                                ? false
                                                                : item?.verified;
                                                            user_info[
                                                                'dp_link'
                                                            ] = item?.dp_link;
                                                            user_info[
                                                                'followers'
                                                            ] =
                                                                item?.followers_l;
                                                            user_info[
                                                                'followed'
                                                            ] = false;
                                                            new_users.push(
                                                                user_info,
                                                            );
                                                        });
                                                    }
                                                    res.json({
                                                        status: 'success',
                                                        response: new_users,
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
                                        code: 'ERR-BLGD-057',
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
                    code: 'ERR-BLGD-057',
                });
            }
        } else {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(aid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            followers: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-057',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                _id: {
                                                    $in: result[0]?.followers,
                                                },
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                username: 1,
                                                verified: 1,
                                                dp_link: 1,
                                                followers_l: {
                                                    $size: '$followers',
                                                },
                                                followed: {
                                                    $in: [
                                                        ObjectId(uid),
                                                        '$followers',
                                                    ],
                                                },
                                                createdAt: 1,
                                            },
                                        },
                                    ])
                                        .sort({ createdAt: -1 })
                                        .skip(query_f_i)
                                        .limit(query_l_i)
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-057',
                                            });
                                        })
                                        .then(response => {
                                            if (
                                                response !== null ||
                                                response !== undefined
                                            ) {
                                                if (response?.length > 0) {
                                                    const new_users = [];
                                                    if (response?.length > 0) {
                                                        response.map(item => {
                                                            const user_info =
                                                                {};
                                                            user_info['uid'] =
                                                                item?._id?.toString();
                                                            user_info[
                                                                'isowner'
                                                            ] =
                                                                item?._id?.toString() ===
                                                                uid;
                                                            user_info[
                                                                'username'
                                                            ] = item?.username;
                                                            user_info[
                                                                'verified'
                                                            ] = none_null_bool(
                                                                item?.verified,
                                                            )
                                                                ? false
                                                                : item?.verified;
                                                            user_info[
                                                                'dp_link'
                                                            ] = item?.dp_link;
                                                            user_info[
                                                                'followers'
                                                            ] =
                                                                item?.followers_l;
                                                            user_info[
                                                                'followed'
                                                            ] = item?.followed;
                                                            new_users.push(
                                                                user_info,
                                                            );
                                                        });
                                                    }
                                                    res.json({
                                                        status: 'success',
                                                        response: new_users,
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
                                        code: 'ERR-BLGD-057',
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
                    code: 'ERR-BLGD-057',
                });
            }
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-057',
        });
    }
});

// Load User's Following
// INFO REQUIRED
// User's ID
// URL Query first_index
// URL Query last_index
router.get('/:aid/following', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const aid = req.params.aid;
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 20)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 20)?.last_index;

        if (none_null(uid)) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(aid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            following: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-058',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                _id: {
                                                    $in: result[0]?.following,
                                                },
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                username: 1,
                                                verified: 1,
                                                dp_link: 1,
                                                followers_l: {
                                                    $size: '$followers',
                                                },
                                                createdAt: 1,
                                            },
                                        },
                                    ])
                                        .sort({ createdAt: -1 })
                                        .skip(query_f_i)
                                        .limit(query_l_i)
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-058',
                                            });
                                        })
                                        .then(response => {
                                            if (
                                                response !== null ||
                                                response !== undefined
                                            ) {
                                                if (response?.length > 0) {
                                                    const new_users = [];
                                                    if (response?.length > 0) {
                                                        response.map(item => {
                                                            const user_info =
                                                                {};
                                                            user_info['uid'] =
                                                                item?._id?.toString();
                                                            user_info[
                                                                'isowner'
                                                            ] = false;
                                                            user_info[
                                                                'username'
                                                            ] = item?.username;
                                                            user_info[
                                                                'verified'
                                                            ] = none_null_bool(
                                                                item?.verified,
                                                            )
                                                                ? false
                                                                : item?.verified;
                                                            user_info[
                                                                'dp_link'
                                                            ] = item?.dp_link;
                                                            user_info[
                                                                'followers'
                                                            ] =
                                                                item?.followers_l;
                                                            user_info[
                                                                'followed'
                                                            ] = false;
                                                            new_users.push(
                                                                user_info,
                                                            );
                                                        });
                                                    }
                                                    res.json({
                                                        status: 'success',
                                                        response: new_users,
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
                                        code: 'ERR-BLGD-058',
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
                    code: 'ERR-BLGD-058',
                });
            }
        } else {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(aid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            following: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-058',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                _id: {
                                                    $in: result[0]?.following,
                                                },
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                username: 1,
                                                verified: 1,
                                                dp_link: 1,
                                                followers_l: {
                                                    $size: '$followers',
                                                },
                                                followed: {
                                                    $in: [
                                                        ObjectId(uid),
                                                        '$followers',
                                                    ],
                                                },
                                                createdAt: 1,
                                            },
                                        },
                                    ])
                                        .sort({ createdAt: -1 })
                                        .skip(query_f_i)
                                        .limit(query_l_i)
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-058',
                                            });
                                        })
                                        .then(response => {
                                            if (
                                                response !== null ||
                                                result !== undefined
                                            ) {
                                                if (response?.length > 0) {
                                                    const new_users = [];
                                                    if (response?.length > 0) {
                                                        response.map(item => {
                                                            const user_info =
                                                                {};
                                                            user_info['uid'] =
                                                                item?._id?.toString();
                                                            user_info[
                                                                'isowner'
                                                            ] =
                                                                item?._id?.toString() ===
                                                                uid;
                                                            user_info[
                                                                'username'
                                                            ] = item?.username;
                                                            user_info[
                                                                'verified'
                                                            ] = none_null_bool(
                                                                item?.verified,
                                                            )
                                                                ? false
                                                                : item?.verified;
                                                            user_info[
                                                                'dp_link'
                                                            ] = item?.dp_link;
                                                            user_info[
                                                                'followers'
                                                            ] =
                                                                item?.followers_l;
                                                            user_info[
                                                                'followed'
                                                            ] = item?.followed;
                                                            new_users.push(
                                                                user_info,
                                                            );
                                                        });
                                                    }
                                                    res.json({
                                                        status: 'success',
                                                        response: new_users,
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
                                        code: 'ERR-BLGD-058',
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
                    code: 'ERR-BLGD-058',
                });
            }
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-058',
        });
    }
});

// Load User's Blogs
// INFO REQUIRED
// User's ID
// URL Query first_index
// URL Query last_index
router.get('/:aid/blogs', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const aid = req.params.aid;
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 20)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 20)?.last_index;

        if (none_null(uid)) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(aid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            verified: 1,
                            blogs: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-056',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    await Blog.aggregate([
                                        {
                                            $match: {
                                                _id: { $in: result[0]?.blogs },
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                title: 1,
                                                dp_link: 1,
                                                likes_l: { $size: '$likes' },
                                                comments_l: {
                                                    $size: '$comments',
                                                },
                                                tags: 1,
                                                createdAt: 1,
                                                updatedAt: 1,
                                            },
                                        },
                                    ])
                                        .sort({ createdAt: -1 })
                                        .skip(query_f_i)
                                        .limit(query_l_i)
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-056',
                                            });
                                        })
                                        .then(response => {
                                            if (
                                                response !== null ||
                                                response !== undefined
                                            ) {
                                                if (response?.length > 0) {
                                                    const new_blogs = [];
                                                    if (response?.length > 0) {
                                                        response.map(item => {
                                                            const blog_info =
                                                                {};
                                                            blog_info['bid'] =
                                                                item?._id?.toString();
                                                            blog_info['aid'] =
                                                                result[0]?._id?.toString();
                                                            blog_info[
                                                                'author'
                                                            ] =
                                                                result[0]?.username;
                                                            blog_info[
                                                                'averified'
                                                            ] = none_null_bool(
                                                                result[0]
                                                                    ?.verified,
                                                            )
                                                                ? false
                                                                : result[0]
                                                                      ?.verified;
                                                            blog_info[
                                                                'isowner'
                                                            ] = false;
                                                            blog_info['title'] =
                                                                item?.title;
                                                            blog_info[
                                                                'b_dp_link'
                                                            ] = item?.dp_link;
                                                            blog_info[
                                                                'likes_l'
                                                            ] = item?.likes_l;
                                                            blog_info[
                                                                'comments_l'
                                                            ] =
                                                                item?.comments_l;
                                                            blog_info['tags'] =
                                                                item?.tags;
                                                            blog_info[
                                                                'liked'
                                                            ] = false;
                                                            blog_info[
                                                                'createdAt'
                                                            ] = item?.createdAt;
                                                            blog_info[
                                                                'updatedAt'
                                                            ] = item?.updatedAt;
                                                            new_blogs.push(
                                                                blog_info,
                                                            );
                                                        });
                                                    }
                                                    res.json({
                                                        status: 'success',
                                                        response: new_blogs,
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
                                        code: 'ERR-BLGD-056',
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
                    code: 'ERR-BLGD-056',
                });
            }
        } else {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(aid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            verified: 1,
                            blogs: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-056',
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    await Blog.aggregate([
                                        {
                                            $match: {
                                                _id: { $in: result[0]?.blogs },
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                title: 1,
                                                dp_link: 1,
                                                likes_l: { $size: '$likes' },
                                                comments_l: {
                                                    $size: '$comments',
                                                },
                                                tags: 1,
                                                liked: {
                                                    $in: [
                                                        ObjectId(uid),
                                                        '$likes',
                                                    ],
                                                },
                                                createdAt: 1,
                                                updatedAt: 1,
                                            },
                                        },
                                    ])
                                        .sort({ createdAt: -1 })
                                        .skip(query_f_i)
                                        .limit(query_l_i)
                                        .catch(err => {
                                            res.json({
                                                status: 'error',
                                                code: 'ERR-BLGD-056',
                                            });
                                        })
                                        .then(response => {
                                            if (
                                                response !== null ||
                                                response !== undefined
                                            ) {
                                                if (response?.length > 0) {
                                                    const new_blogs = [];
                                                    if (response?.length > 0) {
                                                        response.map(item => {
                                                            const blog_info =
                                                                {};
                                                            blog_info['bid'] =
                                                                item?._id?.toString();
                                                            blog_info['aid'] =
                                                                result[0]?._id?.toString();
                                                            blog_info[
                                                                'author'
                                                            ] =
                                                                result[0]?.username;
                                                            blog_info[
                                                                'averified'
                                                            ] = none_null_bool(
                                                                result[0]
                                                                    ?.verified,
                                                            )
                                                                ? false
                                                                : result[0]
                                                                      ?.verified;
                                                            blog_info[
                                                                'isowner'
                                                            ] =
                                                                result[0]?._id?.toString() ===
                                                                uid;
                                                            blog_info['title'] =
                                                                item?.title;
                                                            blog_info[
                                                                'b_dp_link'
                                                            ] = item?.dp_link;
                                                            blog_info[
                                                                'likes_l'
                                                            ] = item?.likes_l;
                                                            blog_info[
                                                                'comments_l'
                                                            ] =
                                                                item?.comments_l;
                                                            blog_info['tags'] =
                                                                item?.tags;
                                                            blog_info['liked'] =
                                                                item?.liked;
                                                            blog_info[
                                                                'createdAt'
                                                            ] = item?.createdAt;
                                                            blog_info[
                                                                'updatedAt'
                                                            ] = item?.updatedAt;
                                                            new_blogs.push(
                                                                blog_info,
                                                            );
                                                        });
                                                    }
                                                    res.json({
                                                        status: 'success',
                                                        response: new_blogs,
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
                                        code: 'ERR-BLGD-056',
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
                    code: 'ERR-BLGD-056',
                });
            }
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-056',
        });
    }
});

// Load a specific Author/User
// INFO REQUIRED:
// User's ID
router.get('/:aid', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const aid = req.params.aid;

        if (none_null(uid)) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(aid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            verified: 1,
                            dp_link: 1,
                            blogs_l: { $size: '$blogs' },
                            followers_l: { $size: '$followers' },
                            following_l: { $size: '$following' },
                            createdAt: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-055',
                        });
                    })
                    .then(response => {
                        if (response !== null || response !== undefined) {
                            if (response?.length > 0) {
                                res.json({
                                    status: 'success',
                                    response: {
                                        uid: response[0]?._id?.toString(),
                                        isowner: false,
                                        username: response[0]?.username,
                                        verified: none_null_bool(
                                            response[0]?.verified,
                                        )
                                            ? false
                                            : response[0]?.verified,
                                        dp_link: response[0]?.dp_link,
                                        blogs_l: response[0]?.blogs_l,
                                        followers_l: response[0]?.followers_l,
                                        following_l: response[0]?.following_l,
                                        followed: false,
                                        createdAt: response[0]?.createdAt,
                                    },
                                });
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-055',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-055',
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-055',
                });
            }
        } else {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(aid),
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            verified: 1,
                            dp_link: 1,
                            blogs_l: { $size: '$blogs' },
                            followers_l: { $size: '$followers' },
                            following_l: { $size: '$following' },
                            followed: { $in: [ObjectId(uid), '$followers'] },
                            createdAt: 1,
                        },
                    },
                ])
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-055',
                        });
                    })
                    .then(response => {
                        if (response !== null || response !== undefined) {
                            if (response?.length > 0) {
                                res.json({
                                    status: 'success',
                                    response: {
                                        uid: response[0]?._id?.toString(),
                                        isowner: uid === aid,
                                        username: response[0]?.username,
                                        verified: none_null_bool(
                                            response[0]?.verified,
                                        )
                                            ? false
                                            : response[0]?.verified,
                                        dp_link: response[0]?.dp_link,
                                        blogs_l: response[0]?.blogs_l,
                                        followers_l: response[0]?.followers_l,
                                        following_l: response[0]?.following_l,
                                        followed: response[0]?.followed,
                                        createdAt: response[0]?.createdAt,
                                    },
                                });
                            } else {
                                res.json({
                                    status: 'error',
                                    code: 'ERR-BLGD-055',
                                });
                            }
                        } else {
                            res.json({
                                status: 'error',
                                code: 'ERR-BLGD-055',
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: 'error',
                    code: 'ERR-BLGD-055',
                });
            }
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-055',
        });
    }
});

// Load Users or Authors
// INFO REQUIRED
// Search Param
// URL Query first_index
// URL Query last_index
router.get('/', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const search = req.query.search;
        const new_search = none_null(search) ? '' : search;
        const processed_search = new_search?.toLowerCase()?.trim();
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 20)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 20)?.last_index;

        if (none_null(uid)) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            username: {
                                $regex: processed_search,
                                $options: 'i',
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            verified: 1,
                            dp_link: 1,
                            followers_l: { $size: '$followers' },
                            createdAt: 1,
                        },
                    },
                ])
                    .sort({ createdAt: -1 })
                    .skip(query_f_i)
                    .limit(query_l_i)
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-060',
                        });
                    })
                    .then(result => {
                        if (result !== null || result !== undefined) {
                            const new_users = [];
                            if (result?.length > 0) {
                                result.map(item => {
                                    const user_info = {};
                                    user_info['uid'] = item?._id?.toString();
                                    user_info['isowner'] = false;
                                    user_info['username'] = item?.username;
                                    user_info['verified'] = none_null_bool(
                                        item?.verified,
                                    )
                                        ? false
                                        : item?.verified;
                                    user_info['dp_link'] = item?.dp_link;
                                    user_info['followers'] = item?.followers_l;
                                    user_info['followed'] = false;
                                    new_users.push(user_info);
                                });
                                res.json({
                                    status: 'success',
                                    response: new_users,
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
                    code: 'ERR-BLGD-060',
                });
            }
        } else {
            try {
                await User.aggregate([
                    {
                        $match: {
                            username: {
                                $regex: processed_search,
                                $options: 'i',
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            verified: 1,
                            dp_link: 1,
                            followers_l: { $size: '$followers' },
                            followed: { $in: [ObjectId(uid), '$followers'] },
                            createdAt: 1,
                        },
                    },
                ])
                    .sort({ createdAt: -1 })
                    .skip(query_f_i)
                    .limit(query_l_i)
                    .catch(err => {
                        res.json({
                            status: 'error',
                            code: 'ERR-BLGD-060',
                        });
                    })
                    .then(result => {
                        if (result !== null || result !== undefined) {
                            const new_users = [];
                            if (result?.length > 0) {
                                result.map(item => {
                                    const user_info = {};
                                    user_info['uid'] = item?._id?.toString();
                                    user_info['isowner'] =
                                        item?._id?.toString() === uid;
                                    user_info['username'] = item?.username;
                                    user_info['verified'] = none_null_bool(
                                        item?.verified,
                                    )
                                        ? false
                                        : item?.verified;
                                    user_info['dp_link'] = item?.dp_link;
                                    user_info['followers'] = item?.followers_l;
                                    user_info['followed'] = item?.followed;
                                    new_users.push(user_info);
                                });
                                res.json({
                                    status: 'success',
                                    response: new_users,
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
                    code: 'ERR-BLGD-060',
                });
            }
        }
    } catch (error) {
        res.json({
            status: 'error',
            code: 'ERR-BLGD-060',
        });
    }
});

module.exports = router;
