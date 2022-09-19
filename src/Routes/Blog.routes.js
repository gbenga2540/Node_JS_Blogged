const router = require('express').Router();
const { cloudinary } = require('../Config/Cloudinary');
require('dotenv').config();
const verifyJWTbody = require('../Utils/Verify_JWT_Body');
const verifyJWTHeader = require('../Utils/Verify_JWT_Header');
const verifyJWTHeaderIA = require('../Utils/Verify_JWT_Header_IA');
const none_null = require('../Utils/None_Null_Checker');
const none_null_arr = require('../Utils/None_Null_Arr_Checker');
const none_null_bool = require('../Utils/None_Null_Bool_Checker');
const none_null_dp = require('../Utils/None_Null_Checker_DP');
const invalid_arr_tags_checker = require('../Utils/Invalid_Arr_Tags_Checker');
const pagination_indexer = require('../Utils/Pagination_Indexer');
const Blog = require('../Models/Blog_Model');
const User = require('../Models/User_Model');
const ObjectId = require('mongodb').ObjectId;


// Creates a new Blog
// INFO REQUIRED:
// token
// Blog's title
// Blog's dp -> send none if image isn't to be uploaded
// Blogs's message
router.post('/create', verifyJWTbody, async (req, res) => {
    try {
        const author = req.uid;
        const title = req.body.title;
        const message = req.body.message;
        const dp = none_null_dp(req.body.dp);
        const tags = req.body.tags;
        const processed_tags = none_null_arr(tags) ? [] : tags;

        if (none_null(title) === false && none_null(message) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(author)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    const blog = new Blog({
                                        author: author,
                                        title: title,
                                        dp_link: "none",
                                        message: message,
                                        tags: processed_tags
                                    });

                                    try {
                                        await blog.save()
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-024"
                                                });
                                            })
                                            .then(async result => {
                                                if (result) {
                                                    const bid = result?.id;
                                                    try {
                                                        await User.findByIdAndUpdate(author, { $addToSet: { blogs: ObjectId(bid) } })
                                                            .catch(err => {
                                                                res.json({
                                                                    status: "error",
                                                                    code: "ERR-BLGD-050"
                                                                });
                                                            })
                                                            .then(async user_add_blog_res => {
                                                                if (user_add_blog_res === null || user_add_blog_res === undefined) {
                                                                    res.json({
                                                                        status: "error",
                                                                        code: "ERR-BLGD-050"
                                                                    });
                                                                } else {
                                                                    if (none_null(dp)) {
                                                                        res.json({
                                                                            status: "success"
                                                                        });
                                                                    } else {
                                                                        try {
                                                                            await cloudinary.uploader.upload(dp, {
                                                                                folder: `${process.env.NODE_CLOUDINARY_BLOGS_FOLDER}`,
                                                                                public_id: `${bid}`
                                                                            }, async (error, response) => {
                                                                                if (error) {
                                                                                    res.json({
                                                                                        status: "error",
                                                                                        code: "ERR-BLGD-025"
                                                                                    });
                                                                                } else {
                                                                                    if (response) {
                                                                                        const imageurl = response?.url;
                                                                                        try {
                                                                                            await Blog.findByIdAndUpdate(bid, { dp_link: imageurl })
                                                                                                .catch(err => {
                                                                                                    res.json({
                                                                                                        status: "error",
                                                                                                        code: "ERR-BLGD-027"
                                                                                                    });
                                                                                                })
                                                                                                .then(data => {
                                                                                                    if (data === null || data === undefined) {
                                                                                                        res.json({
                                                                                                            status: "error",
                                                                                                            code: "ERR-BLGD-027"
                                                                                                        });
                                                                                                    } else {
                                                                                                        res.json({
                                                                                                            status: "success"
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                        } catch (err) {
                                                                                            res.json({
                                                                                                status: "error",
                                                                                                code: "ERR-BLGD-027"
                                                                                            });
                                                                                        }
                                                                                    } else {
                                                                                        res.json({
                                                                                            status: "error",
                                                                                            code: "ERR-BLGD-026"
                                                                                        });
                                                                                    }
                                                                                }
                                                                            });
                                                                        } catch (err) {
                                                                            res.json({
                                                                                status: "error",
                                                                                code: "ERR-BLGD-025"
                                                                            });
                                                                        }
                                                                    }

                                                                }
                                                            });
                                                    } catch (error) {
                                                        res.json({
                                                            status: "error",
                                                            code: "ERR-BLGD-050"
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-024"
                                                    });
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-024"
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-022"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-016"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-016"
                            });
                        }
                    });
            } catch (err) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-023"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-071"
            });
        }
    } catch (err) {
        res.json({
            status: "error",
            code: "ERR-BLGD-023"
        });
    }
});

// Edits a Blog Post
// INFO REQUIRED:
// token
// Blog's ID
// Blog's Title
// Blog's Message
// Blog's dp -> send none if image isn't to be uploaded
router.patch('/edit', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const bid = req.body.bid;
        const title = req.body.title;
        const message = req.body.message;
        const dp = none_null_dp(req.body.dp);
        const tags = req.body.tags;
        const processed_tags = none_null_arr(tags) ? [] : tags;

        if (none_null(bid) === false && none_null(title) === false && none_null(message) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1,
                            dp_link: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await Blog.aggregate([
                                            {
                                                $match: {
                                                    _id: ObjectId(bid)
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    author: 1
                                                }
                                            }
                                        ])
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-038"
                                                });
                                            })
                                            .then(async blog_response => {
                                                if (blog_response !== null || blog_response !== undefined) {
                                                    if (blog_response?.length > 0) {
                                                        if (blog_response[0]?.author?.toString() === uid) {
                                                            try {
                                                                await Blog.findByIdAndUpdate(bid,
                                                                    {
                                                                        title: title,
                                                                        message: message,
                                                                        tags: processed_tags
                                                                    }
                                                                )
                                                                    .catch(err => {
                                                                        res.json({
                                                                            status: "error",
                                                                            code: "ERR-BLGD-044"
                                                                        });
                                                                    })
                                                                    .then(async response => {
                                                                        if (response === null || response === undefined) {
                                                                            res.json({
                                                                                status: "error",
                                                                                code: "ERR-BLGD-044"
                                                                            });
                                                                        } else {
                                                                            if (none_null(dp)) {
                                                                                if (none_null(result[0]?.dp_link) === false) {
                                                                                    try {
                                                                                        await cloudinary.uploader.destroy(`${process.env.NODE_CLOUDINARY_BLOGS_FOLDER}${bid}`, async (error, data) => {
                                                                                            if (error) {
                                                                                                res.json({
                                                                                                    status: "error",
                                                                                                    code: "ERR-BLGD-045"
                                                                                                });
                                                                                            } else {
                                                                                                if (data?.result === "not found" || data?.result === "ok") {
                                                                                                    try {
                                                                                                        await Blog.findByIdAndUpdate(bid, { dp_link: "none" })
                                                                                                            .catch(err => {
                                                                                                                res.json({
                                                                                                                    status: "error",
                                                                                                                    code: "ERR-BLGD-027"
                                                                                                                });
                                                                                                            })
                                                                                                            .then(response => {
                                                                                                                if (response === null || response === undefined) {
                                                                                                                    res.json({
                                                                                                                        status: "error",
                                                                                                                        code: "ERR-BLGD-027"
                                                                                                                    });
                                                                                                                } else {
                                                                                                                    res.json({
                                                                                                                        status: "success"
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                    } catch (err) {
                                                                                                        res.json({
                                                                                                            status: "error",
                                                                                                            code: "ERR-BLGD-027"
                                                                                                        });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.json({
                                                                                                        status: "error",
                                                                                                        code: "ERR-BLGD-045"
                                                                                                    });
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                    } catch (err) {
                                                                                        res.json({
                                                                                            status: "error",
                                                                                            code: "ERR-BLGD-045"
                                                                                        });
                                                                                    }
                                                                                } else {
                                                                                    try {
                                                                                        await Blog.findByIdAndUpdate(bid, { dp_link: "none" })
                                                                                            .catch(err => {
                                                                                                res.json({
                                                                                                    status: "error",
                                                                                                    code: "ERR-BLGD-027"
                                                                                                });
                                                                                            })
                                                                                            .then(response => {
                                                                                                if (response === null || response === undefined) {
                                                                                                    res.json({
                                                                                                        status: "error",
                                                                                                        code: "ERR-BLGD-027"
                                                                                                    });
                                                                                                } else {
                                                                                                    res.json({
                                                                                                        status: "success"
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                    } catch (err) {
                                                                                        res.json({
                                                                                            status: "error",
                                                                                            code: "ERR-BLGD-027"
                                                                                        });
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                try {
                                                                                    await cloudinary.uploader.upload(dp, {
                                                                                        folder: `${process.env.NODE_CLOUDINARY_BLOGS_FOLDER}`,
                                                                                        public_id: `${bid}`
                                                                                    }, async (error, response) => {
                                                                                        if (error) {
                                                                                            res.json({
                                                                                                status: "error",
                                                                                                code: "ERR-BLGD-025"
                                                                                            });
                                                                                        } else {
                                                                                            if (response) {
                                                                                                const imageurl = response?.url;
                                                                                                try {
                                                                                                    await Blog.findByIdAndUpdate(bid, { dp_link: imageurl })
                                                                                                        .catch(err => {
                                                                                                            res.json({
                                                                                                                status: "error",
                                                                                                                code: "ERR-BLGD-027"
                                                                                                            });
                                                                                                        })
                                                                                                        .then(data => {
                                                                                                            if (data === null || data === undefined) {
                                                                                                                res.json({
                                                                                                                    status: "error",
                                                                                                                    code: "ERR-BLGD-027"
                                                                                                                });
                                                                                                            } else {
                                                                                                                res.json({
                                                                                                                    status: "success"
                                                                                                                });
                                                                                                            }
                                                                                                        });
                                                                                                } catch (err) {
                                                                                                    res.json({
                                                                                                        status: "error",
                                                                                                        code: "ERR-BLGD-027"
                                                                                                    });
                                                                                                }
                                                                                            } else {
                                                                                                res.json({
                                                                                                    status: "error",
                                                                                                    code: "ERR-BLGD-026"
                                                                                                });
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                } catch (err) {
                                                                                    res.json({
                                                                                        status: "error",
                                                                                        code: "ERR-BLGD-025"
                                                                                    });
                                                                                }
                                                                            }
                                                                        }
                                                                    });
                                                            } catch (error) {
                                                                res.json({
                                                                    status: "error",
                                                                    code: "ERR-BLGD-044"
                                                                });
                                                            }
                                                        } else {
                                                            res.json({
                                                                status: "error",
                                                                code: "ERR-BLGD-048"
                                                            });
                                                        }
                                                    } else {
                                                        res.json({
                                                            status: "error",
                                                            code: "ERR-BLGD-038"
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-038"
                                                    });
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-038"
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-022"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-016"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-016"
                            });
                        }
                    });
            } catch (err) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-044"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-071"
            });
        }
    } catch (err) {
        res.json({
            status: "error",
            code: "ERR-BLGD-044"
        });
    }
});

// Deletes a Blog Post
// INFO REQUIRED:
// token
// Blog's ID
router.delete('/delete', verifyJWTHeader, async (req, res) => {
    try {
        const uid = req?.uid;
        const bid = req.headers.bid;

        if (none_null(bid) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    })
                    .then(async result => {
                        if (result !== undefined || result !== null) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await Blog.aggregate([
                                            {
                                                $match: {
                                                    _id: ObjectId(bid)
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    author: 1,
                                                    dp_link: 1,
                                                    likes: 1
                                                }
                                            }
                                        ])
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-038"
                                                });
                                            })
                                            .then(async blog_response => {
                                                if (blog_response !== undefined || blog_response !== null) {
                                                    if (blog_response?.length > 0) {
                                                        const author = blog_response[0]?.author?.toString();
                                                        if (author === uid) {
                                                            if (none_null_dp(blog_response[0]?.dp_link) !== "none") {
                                                                try {
                                                                    await cloudinary.uploader.destroy(`${process.env.NODE_CLOUDINARY_BLOGS_FOLDER}${bid}`, async (error, data) => {
                                                                        if (error) {
                                                                            res.json({
                                                                                status: "error",
                                                                                code: "ERR-BLGD-045"
                                                                            });
                                                                        } else {
                                                                            if (data?.result === "not found" || data?.result === "ok") {
                                                                                try {
                                                                                    await User.updateMany({ _id: { $in: blog_response[0]?.likes } }, { $pull: { likes: ObjectId(bid) } })
                                                                                        .catch(err => {
                                                                                            res.json({
                                                                                                status: "error",
                                                                                                code: "ERR-BLGD-047"
                                                                                            });
                                                                                        })
                                                                                        .then(async del_likes_res => {
                                                                                            if (del_likes_res?.acknowledged) {
                                                                                                try {
                                                                                                    await User.findByIdAndUpdate(author, { $pull: { blogs: ObjectId(bid) } })
                                                                                                        .catch(err => {
                                                                                                            res.json({
                                                                                                                status: "error",
                                                                                                                code: "ERR-BLGD-050"
                                                                                                            });
                                                                                                        })
                                                                                                        .then(async user_del_blog_res => {
                                                                                                            try {
                                                                                                                await Blog.findByIdAndDelete(bid)
                                                                                                                    .catch(err => {
                                                                                                                        res.json({
                                                                                                                            status: "error",
                                                                                                                            code: "ERR-BLGD-047"
                                                                                                                        });
                                                                                                                    })
                                                                                                                    .then(del_blog_res => {
                                                                                                                        if (del_blog_res !== null || del_blog_res !== undefined) {
                                                                                                                            res.json({
                                                                                                                                status: "success"
                                                                                                                            });
                                                                                                                        } else {
                                                                                                                            res.json({
                                                                                                                                status: "error",
                                                                                                                                code: "ERR-BLGD-047"
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                            } catch (error) {
                                                                                                                res.json({
                                                                                                                    status: "error",
                                                                                                                    code: "ERR-BLGD-047"
                                                                                                                });
                                                                                                            }
                                                                                                        });
                                                                                                } catch (error) {
                                                                                                    res.json({
                                                                                                        status: "error",
                                                                                                        code: "ERR-BLGD-050"
                                                                                                    });
                                                                                                }
                                                                                            } else {
                                                                                                res.json({
                                                                                                    status: "error",
                                                                                                    code: "ERR-BLGD-047"
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                } catch (error) {
                                                                                    res.json({
                                                                                        status: "error",
                                                                                        code: "ERR-BLGD-047"
                                                                                    });
                                                                                }
                                                                            } else {
                                                                                res.json({
                                                                                    status: "error",
                                                                                    code: "ERR-BLGD-045"
                                                                                });
                                                                            }
                                                                        }
                                                                    });
                                                                } catch (error) {
                                                                    res.json({
                                                                        status: "error",
                                                                        code: "ERR-BLGD-045"
                                                                    });
                                                                }
                                                            } else {
                                                                try {
                                                                    await User.updateMany({ _id: { $in: blog_response[0]?.likes } }, { $pull: { likes: ObjectId(bid) } })
                                                                        .catch(err => {
                                                                            res.json({
                                                                                status: "error",
                                                                                code: "ERR-BLGD-047"
                                                                            });
                                                                        })
                                                                        .then(async del_likes_res => {
                                                                            if (del_likes_res?.acknowledged) {
                                                                                try {
                                                                                    await User.findByIdAndUpdate(author, { $pull: { blogs: ObjectId(bid) } })
                                                                                        .catch(err => {
                                                                                            res.json({
                                                                                                status: "error",
                                                                                                code: "ERR-BLGD-050"
                                                                                            });
                                                                                        })
                                                                                        .then(async user_del_blog_res => {
                                                                                            try {
                                                                                                await Blog.findByIdAndDelete(bid)
                                                                                                    .catch(err => {
                                                                                                        res.json({
                                                                                                            status: "error",
                                                                                                            code: "ERR-BLGD-047"
                                                                                                        });
                                                                                                    })
                                                                                                    .then(del_blog_res => {
                                                                                                        if (del_blog_res !== null || del_blog_res !== undefined) {
                                                                                                            res.json({
                                                                                                                status: "success"
                                                                                                            });
                                                                                                        } else {
                                                                                                            res.json({
                                                                                                                status: "error",
                                                                                                                code: "ERR-BLGD-047"
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                            } catch (error) {
                                                                                                res.json({
                                                                                                    status: "error",
                                                                                                    code: "ERR-BLGD-047"
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                } catch (error) {
                                                                                    res.json({
                                                                                        status: "error",
                                                                                        code: "ERR-BLGD-050"
                                                                                    });
                                                                                }
                                                                            } else {
                                                                                res.json({
                                                                                    status: "error",
                                                                                    code: "ERR-BLGD-047"
                                                                                });
                                                                            }
                                                                        });
                                                                } catch (error) {
                                                                    res.json({
                                                                        status: "error",
                                                                        code: "ERR-BLGD-047"
                                                                    });
                                                                }
                                                            }
                                                        } else {
                                                            res.json({
                                                                status: "error",
                                                                code: "ERR-BLGD-049"
                                                            });
                                                        }
                                                    } else {
                                                        res.json({
                                                            status: "error",
                                                            code: "ERR-BLGD-038"
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-038"
                                                    });
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-038"
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-022"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-016"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-016"
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-047"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-071"
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-047"
        });
    }
});

// Like a Blog Post
// INFO REQUIRED:
// token
// Blog's ID
router.patch('/like', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const bid = req.body.bid;

        if (none_null(bid) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await Blog.findByIdAndUpdate(bid, { $addToSet: { likes: ObjectId(uid) } })
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-028"
                                                });
                                            })
                                            .then(async response => {
                                                if (response === null || response === undefined) {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-030"
                                                    });
                                                } else {
                                                    try {
                                                        await User.findByIdAndUpdate(uid, { $addToSet: { likes: ObjectId(bid) } })
                                                            .catch(err => {
                                                                res.json({
                                                                    status: "error",
                                                                    code: "ERR-BLGD-028"
                                                                });
                                                            })
                                                            .then(data => {
                                                                if (data === null || data === undefined) {
                                                                    res.json({
                                                                        status: "error",
                                                                        code: "ERR-BLGD-016"
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
                                                            code: "ERR-BLGD-028"
                                                        });
                                                    }
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-028"
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-022"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-016"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-016"
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-028"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-071"
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-028"
        });
    }
});

// Unlike a Blog Post
// INFO REQUIRED:
// token
// Blog's ID
router.patch('/unlike', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const bid = req.body.bid;

        if (none_null(bid) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await Blog.findByIdAndUpdate(bid, { $pull: { likes: ObjectId(uid) } })
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-029"
                                                });
                                            })
                                            .then(async response => {
                                                if (response === null || response === undefined) {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-031"
                                                    });
                                                } else {
                                                    try {
                                                        await User.findByIdAndUpdate(uid, { $pull: { likes: ObjectId(bid) } })
                                                            .catch(err => {
                                                                res.json({
                                                                    status: "error",
                                                                    code: "ERR-BLGD-029"
                                                                });
                                                            })
                                                            .then(data => {
                                                                if (data === null || data === undefined) {
                                                                    res.json({
                                                                        status: "error",
                                                                        code: "ERR-BLGD-016"
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
                                                            code: "ERR-BLGD-029"
                                                        });
                                                    }
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-029"
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-022"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-016"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-016"
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-029"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-071"
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-029"
        });
    }
});

// Comment on a Blog Post
// INFO REQUIRED:
// token -> commenter id
// Blog's ID
// Comment
router.patch('/comment/create', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const bid = req.body.bid;
        const comment = req.body.comment;

        if (none_null(bid) === false && none_null(comment) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await Blog.findByIdAndUpdate(bid, { $push: { comments: { commenter: ObjectId(uid), comment: comment } } })
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-036"
                                                });
                                            })
                                            .then(response => {
                                                if (response === null || response === undefined) {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-036"
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
                                            code: "ERR-BLGD-036"
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-022"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-016"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-016"
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-036"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-071"
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-036"
        });
    }
});

// Edit Comment on a Blog Post
// INFO REQUIRED:
// token -> commenter id
// Blog's ID
// Comment's ID
// Comment
router.patch('/comment/edit', verifyJWTbody, async (req, res) => {
    try {
        const uid = req?.uid;
        const bid = req.body.bid;
        const cid = req.body.cid;
        const comment = req.body.comment;

        if (none_null(bid) === false && none_null(cid) === false && none_null(comment) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    })
                    .then(async result => {
                        if (result !== undefined || result !== null) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await Blog.aggregate([
                                            {
                                                $match: {
                                                    _id: ObjectId(bid)
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    comments: 1
                                                }
                                            }
                                        ])
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-038"
                                                });
                                            })
                                            .then(async blog_res => {
                                                if (blog_res !== undefined || blog_res !== null) {
                                                    if (blog_res?.length > 0) {
                                                        if (blog_res[0]?.comments?.length > 0) {
                                                            const cmtr_id = blog_res[0]?.comments?.filter(item => item?._id?.toString() === cid)?.[0]?.commenter?.toString();

                                                            if (cmtr_id === undefined || cmtr_id === null) {
                                                                res.json({
                                                                    status: "error",
                                                                    code: "ERR-BLGD-040"
                                                                });
                                                            } else {
                                                                if (uid === cmtr_id) {
                                                                    try {
                                                                        await Blog.updateOne({ _id: ObjectId(bid), "comments._id": ObjectId(cid) }, { $set: { "comments.$.comment": comment } })
                                                                            .catch(err => {
                                                                                res.json({
                                                                                    status: "error",
                                                                                    code: "ERR-BLGD-042"
                                                                                });
                                                                            })
                                                                            .then(response => {
                                                                                if (response === null || response === undefined) {
                                                                                    res.json({
                                                                                        status: "error",
                                                                                        code: "ERR-BLGD-042"
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
                                                                            code: "ERR-BLGD-042"
                                                                        });
                                                                    }
                                                                } else {
                                                                    res.json({
                                                                        status: "error",
                                                                        code: "ERR-BLGD-043"
                                                                    });
                                                                }
                                                            }

                                                        } else {
                                                            res.json({
                                                                status: "error",
                                                                code: "ERR-BLGD-039"
                                                            });
                                                        }
                                                    } else {
                                                        res.json({
                                                            status: "error",
                                                            code: "ERR-BLGD-038"
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-038"
                                                    });
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-038"
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-022"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-016"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-016"
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-042"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-071"
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-042"
        });
    }
});

// Delete Comment on a Blog Post
// INFO REQUIRED:
// token -> commenter id
// Blog's ID
// Comment's ID
router.delete('/comment/delete', verifyJWTHeader, async (req, res) => {
    try {
        const uid = req?.uid;
        const bid = req.headers.bid;
        const cid = req.headers.cid;

        if (none_null(bid) === false && none_null(cid) === false) {
            try {
                await User.aggregate([
                    {
                        $match: {
                            _id: ObjectId(uid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            email_v: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.email_v === true) {
                                    try {
                                        await Blog.aggregate([
                                            {
                                                $match: {
                                                    _id: ObjectId(bid)
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    author: 1,
                                                    comments: 1
                                                }
                                            }
                                        ])
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-038"
                                                });
                                            })
                                            .then(async blog_res => {
                                                if (result !== null || result !== undefined) {
                                                    if (blog_res?.length > 0) {
                                                        const aid = blog_res[0]?.author?.toString();

                                                        if (blog_res[0]?.comments?.length > 0) {
                                                            const cmtr_id = blog_res[0]?.comments?.filter(item => item?._id?.toString() === cid)?.[0]?.commenter?.toString();

                                                            if (cmtr_id === undefined || cmtr_id === null) {
                                                                res.json({
                                                                    status: "error",
                                                                    code: "ERR-BLGD-040"
                                                                });
                                                            } else {
                                                                if (uid === aid || uid === cmtr_id) {
                                                                    try {
                                                                        await Blog.findByIdAndUpdate(bid, { $pull: { comments: { _id: ObjectId(cid) } } })
                                                                            .catch(err => {
                                                                                res.json({
                                                                                    status: "error",
                                                                                    code: "ERR-BLGD-037"
                                                                                });
                                                                            })
                                                                            .then(response => {
                                                                                if (response === null || response === undefined) {
                                                                                    res.json({
                                                                                        status: "error",
                                                                                        code: "ERR-BLGD-037"
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
                                                                            code: "ERR-BLGD-037"
                                                                        });
                                                                    }
                                                                } else {
                                                                    res.json({
                                                                        status: "error",
                                                                        code: "ERR-BLGD-041"
                                                                    });
                                                                }
                                                            }
                                                        } else {
                                                            res.json({
                                                                status: "error",
                                                                code: "ERR-BLGD-039"
                                                            });
                                                        }
                                                    } else {
                                                        res.json({
                                                            status: "error",
                                                            code: "ERR-BLGD-038"
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        status: "error",
                                                        code: "ERR-BLGD-038"
                                                    });
                                                }
                                            });
                                    } catch (error) {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-038"
                                        });
                                    }
                                } else {
                                    res.json({
                                        status: "error",
                                        code: "ERR-BLGD-022"
                                    });
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-016"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-016"
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-037"
                });
            }
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-071"
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-037"
        });
    }
});

// Load Blog Posts specifically for a user
// INFO REQUIRED
// Users ID
// Pagination Index
router.get('/foryou', verifyJWTHeader, async (req, res) => {
    try {
        const uid = req.uid;
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 50)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 50)?.last_index;

        await User.aggregate([
            {
                $match: {
                    _id: ObjectId(uid)
                }
            },
            {
                $project: {
                    following: 1
                }
            }
        ])
            .catch(err => {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-016"
                });
            })
            .then(async user_res => {
                if (user_res !== undefined || user_res !== null) {
                    if (user_res?.length > 0) {
                        const users_following = user_res[0]?.following;
                        if (users_following?.length > 0) {
                            try {
                                await Blog.aggregate([
                                    {
                                        $match:
                                        {
                                            author: {
                                                $in: users_following
                                            }
                                        }
                                    },
                                    {
                                        $project:
                                        {
                                            _id: 1,
                                            title: 1,
                                            author: 1,
                                            dp_link: 1,
                                            likes_length: { $size: "$likes" },
                                            comments_length: { $size: "$comments" },
                                            tags: 1,
                                            liked: { $in: [ObjectId(uid), "$likes"] },
                                            createdAt: 1,
                                            updatedAt: 1,
                                        }
                                    }
                                ])
                                    .sort({ createdAt: -1 })
                                    .skip(query_f_i)
                                    .limit(query_l_i)
                                    .catch(err => {
                                        res.json({
                                            status: "error",
                                            code: "ERR-BLGD-067"
                                        });
                                    })
                                    .then(async blog_res => {
                                        if (blog_res !== null || blog_res !== undefined) {
                                            if (blog_res?.length > 0) {
                                                const authors = [];
                                                blog_res?.map(blog => authors.push(blog?.author));
                                                const authors_info = [];
                                                try {
                                                    await User.aggregate([
                                                        {
                                                            $match: {
                                                                _id: {
                                                                    $in: authors
                                                                }
                                                            }
                                                        },
                                                        {
                                                            $project: {
                                                                _id: 1,
                                                                username: 1,
                                                                verified: 1
                                                            }
                                                        }
                                                    ])
                                                        .then(res_author_name => {
                                                            if (res_author_name !== null || res_author_name !== undefined) {
                                                                if (res_author_name?.length > 0) {
                                                                    res_author_name?.map(item => authors_info.push(item));
                                                                }
                                                            }
                                                        });
                                                } catch (error) {
                                                    authors_info.push();
                                                }
                                                const blogs_arr = [];
                                                blog_res.map(item => {
                                                    const p_author_username = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.username;
                                                    const p_author_verified = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.verified;
                                                    const p_p_author_verified = none_null_bool(p_author_verified) ? false : p_author_verified;
                                                    const blog_item = {};
                                                    blog_item["bid"] = item?._id?.toString();
                                                    blog_item["aid"] = none_null(p_author_username) ? "Not Found" : item?.author?.toString();
                                                    blog_item["author"] = none_null(p_author_username) ? "Not Found" : p_author_username;
                                                    blog_item["averified"] = none_null(p_author_username) ? false : p_p_author_verified;
                                                    blog_item["isowner"] = none_null(p_author_username) ? false : item?.author?.toString() === uid;
                                                    blog_item["title"] = item?.title;
                                                    blog_item["b_dp_link"] = item?.dp_link;
                                                    blog_item["likes_l"] = item?.likes_length;
                                                    blog_item["comments_l"] = item?.comments_length;
                                                    blog_item["tags"] = item?.tags;
                                                    blog_item["liked"] = item?.liked;
                                                    blog_item["createdAt"] = item?.createdAt;
                                                    blog_item["updatedAt"] = item?.updatedAt;
                                                    blogs_arr.push(blog_item);
                                                });
                                                res.json({
                                                    status: "success",
                                                    response: blogs_arr
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
                                    })
                            } catch (error) {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-067"
                                });
                            }
                        } else {
                            res.json({
                                status: "success",
                                response: []
                            });
                        }
                    } else {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-016"
                        });
                    }
                } else {
                    res.json({
                        status: "error",
                        code: "ERR-BLGD-016"
                    });
                }
            });
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-067"
        });
    }
});

// Load Trending Blog Posts (A week)
// INFO REQUIRED
// Pagination Index
router.get('/trending', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 50)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 50)?.last_index;

        if (none_null(uid)) {
            try {
                await Blog.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gt: new Date(Date.now() - 604800000)
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            author: 1,
                            dp_link: 1,
                            likes_length: { $size: "$likes" },
                            comments_length: { $size: "$comments" },
                            tags: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        }
                    },
                    {
                        $sort: {
                            likes_length: -1
                        }
                    }
                ])
                    .skip(query_f_i)
                    .limit(query_l_i)
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-066"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                const authors = [];
                                result?.map(blog => authors.push(blog?.author));
                                const authors_info = [];
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                _id: {
                                                    $in: authors
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                username: 1,
                                                verified: 1
                                            }
                                        }
                                    ])
                                        .then(res_author_name => {
                                            if (res_author_name !== null || res_author_name !== undefined) {
                                                if (res_author_name?.length > 0) {
                                                    res_author_name?.map(item => authors_info.push(item));
                                                }
                                            }
                                        })
                                } catch (error) {
                                    authors_info.push();
                                }
                                const blogs_arr = [];
                                result.map(item => {
                                    const p_author_username = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.username;
                                    const p_author_verified = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.verified;
                                    const p_p_author_verified = none_null_bool(p_author_verified) ? false : p_author_verified;
                                    const blog_item = {};
                                    blog_item["bid"] = item?._id?.toString();
                                    blog_item["aid"] = none_null(p_author_username) ? "Not Found" : item?.author?.toString();
                                    blog_item["author"] = none_null(p_author_username) ? "Not Found" : p_author_username;
                                    blog_item["averified"] = none_null(p_author_username) ? false : p_p_author_verified;
                                    blog_item["isowner"] = false;
                                    blog_item["title"] = item?.title;
                                    blog_item["b_dp_link"] = item?.dp_link;
                                    blog_item["likes_l"] = item?.likes_length;
                                    blog_item["comments_l"] = item?.comments_length;
                                    blog_item["tags"] = item?.tags;
                                    blog_item["liked"] = false;
                                    blog_item["createdAt"] = item?.createdAt;
                                    blog_item["updatedAt"] = item?.updatedAt;
                                    blogs_arr.push(blog_item);
                                });
                                res.json({
                                    status: "success",
                                    response: blogs_arr
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
                    code: "ERR-BLGD-066"
                });
            }
        } else {
            try {
                await Blog.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gt: new Date(Date.now() - 604800000)
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            author: 1,
                            dp_link: 1,
                            likes_length: { $size: "$likes" },
                            comments_length: { $size: "$comments" },
                            tags: 1,
                            liked: { $in: [ObjectId(uid), "$likes"] },
                            createdAt: 1,
                            updatedAt: 1,
                        }
                    },
                    {
                        $sort: {
                            likes_length: -1
                        }
                    }
                ])
                    .skip(query_f_i)
                    .limit(query_l_i)
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-066"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                const authors = [];
                                result?.map(blog => authors.push(blog?.author));
                                const authors_info = [];
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                _id: {
                                                    $in: authors
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                username: 1
                                            }
                                        }
                                    ])
                                        .then(res_author_name => {
                                            if (res_author_name !== null || res_author_name !== undefined) {
                                                if (res_author_name?.length > 0) {
                                                    res_author_name?.map(item => authors_info.push(item));
                                                }
                                            }
                                        });
                                } catch (error) {
                                    authors_info.push();
                                }
                                const blogs_arr = [];
                                result.map(item => {
                                    const p_author_username = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.username;
                                    const p_author_verified = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.verified;
                                    const p_p_author_verified = none_null_bool(p_author_verified) ? false : p_author_verified;
                                    const blog_item = {};
                                    blog_item["bid"] = item?._id?.toString();
                                    blog_item["aid"] = none_null(p_author_username) ? "Not Found" : item?.author?.toString();
                                    blog_item["author"] = none_null(p_author_username) ? "Not Found" : p_author_username;
                                    blog_item["averified"] = none_null(p_author_username) ? false : p_p_author_verified;
                                    blog_item["isowner"] = none_null(p_author_username) ? false : item?.author?.toString() === uid;
                                    blog_item["title"] = item?.title;
                                    blog_item["b_dp_link"] = item?.dp_link;
                                    blog_item["likes_l"] = item?.likes_length;
                                    blog_item["comments_l"] = item?.comments_length;
                                    blog_item["tags"] = item?.tags;
                                    blog_item["liked"] = item?.liked;
                                    blog_item["createdAt"] = item?.createdAt;
                                    blog_item["updatedAt"] = item?.updatedAt;
                                    blogs_arr.push(blog_item);
                                });
                                res.json({
                                    status: "success",
                                    response: blogs_arr
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
                    code: "ERR-BLGD-066"
                });
            }
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-066"
        });
    }
});

// Load Blog likes User info
// INFO REQUIRED
// Blog's ID
// URL Query first_index
// URL Query last_index
router.get('/:bid/likes', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const bid = req.params.bid;
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 50)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 50)?.last_index;

        if (none_null(uid)) {
            try {
                await Blog.aggregate([
                    {
                        $match: {
                            _id: ObjectId(bid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            likes: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-038"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.likes?.length > 0) {
                                    try {
                                        await User.aggregate([
                                            {
                                                $match: {
                                                    _id: {
                                                        $in: result[0]?.likes
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    username: 1,
                                                    dp_link: 1,
                                                    verified: 1,
                                                    followers_l: { $size: "$followers" },
                                                    createdAt: 1
                                                }
                                            }
                                        ])
                                            .sort({ createdAt: -1 })
                                            .skip(query_f_i)
                                            .limit(query_l_i)
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-052"
                                                });
                                            })
                                            .then(response => {
                                                if (response !== null || response !== undefined) {
                                                    if (response?.length > 0) {
                                                        const new_likes_info = [];
                                                        if (response?.length > 0) {
                                                            response?.map(item => {
                                                                const user_info = {};
                                                                user_info["uid"] = item?._id?.toString();
                                                                user_info["isowner"] = false;
                                                                user_info["username"] = item?.username;
                                                                user_info["verified"] = none_null_bool(item?.verified) ? false : item?.verified;
                                                                user_info["dp_link"] = item?.dp_link;
                                                                user_info["followers"] = item?.followers_l;
                                                                user_info["followed"] = false;
                                                                new_likes_info.push(user_info);
                                                            });
                                                        }
                                                        res.json({
                                                            status: "success",
                                                            response: new_likes_info
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
                                            code: "ERR-BLGD-052"
                                        });
                                    }
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
                    code: "ERR-BLGD-052"
                });
            }
        } else {
            try {
                await Blog.aggregate([
                    {
                        $match: {
                            _id: ObjectId(bid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            likes: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-038"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                if (result[0]?.likes?.length > 0) {
                                    try {
                                        await User.aggregate([
                                            {
                                                $match: {
                                                    _id: {
                                                        $in: result[0]?.likes
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    username: 1,
                                                    verified: 1,
                                                    dp_link: 1,
                                                    followers_l: { $size: "$followers" },
                                                    followed: { $in: [ObjectId(uid), "$followers"] },
                                                    createdAt: 1
                                                }
                                            }
                                        ])
                                            .sort({ createdAt: -1 })
                                            .skip(query_f_i)
                                            .limit(query_l_i)
                                            .catch(err => {
                                                res.json({
                                                    status: "error",
                                                    code: "ERR-BLGD-052"
                                                });
                                            })
                                            .then(response => {
                                                if (response !== null || response !== undefined) {
                                                    if (response?.length > 0) {
                                                        const new_likes_info = [];
                                                        if (response?.length > 0) {
                                                            response?.map(item => {
                                                                const user_info = {};
                                                                user_info["uid"] = item?._id?.toString();
                                                                user_info["isowner"] = item?._id?.toString() === uid;
                                                                user_info["username"] = item?.username;
                                                                user_info["verified"] = none_null_bool(item?.verified) ? false : item?.verified;
                                                                user_info["dp_link"] = item?.dp_link;
                                                                user_info["followers"] = item?.followers_l;
                                                                user_info["followed"] = item?.followed;
                                                                new_likes_info.push(user_info);
                                                            });
                                                        }
                                                        res.json({
                                                            status: "success",
                                                            response: new_likes_info
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
                                            code: "ERR-BLGD-052"
                                        });
                                    }
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
                    code: "ERR-BLGD-052"
                });
            }
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-052"
        });
    }
});

// Load a specific Blog Post
// INFO REQUIRED
// Blog's ID
router.get('/:bid', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const bid = req.params.bid;

        if (none_null(uid)) {
            try {
                await Blog.aggregate([
                    {
                        $match: {
                            _id: ObjectId(bid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            author: 1,
                            dp_link: 1,
                            message: 1,
                            likes_l: { $size: "$likes" },
                            comments: 1,
                            comments_l: { $size: "$comments" },
                            tags: 1,
                            createdAt: 1,
                            updatedAt: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-038"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                _id: ObjectId(result[0]?.author)
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                username: 1,
                                                verified: 1,
                                                dp_link: 1,
                                                followers_l: { $size: "$followers" },
                                                createdAt: 1
                                            }
                                        }
                                    ])
                                        .catch(async err => {
                                            const old_comments = result[0]?.comments;
                                            const new_comments = [];
                                            const cmt_users = [];
                                            const processed_cmt_users = [];
                                            if (old_comments?.length > 0) {
                                                old_comments?.map(item => {
                                                    if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                        cmt_users?.push(item?.commenter?.toString());
                                                    }
                                                });
                                                cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                                if (processed_cmt_users?.length > 0) {
                                                    try {
                                                        await User.aggregate([
                                                            {
                                                                $match: {
                                                                    _id: { $in: processed_cmt_users }
                                                                }
                                                            },
                                                            {
                                                                $project: {
                                                                    username: 1,
                                                                    verified: 1,
                                                                    dp_link: 1
                                                                }
                                                            }
                                                        ])
                                                            .catch(err => {
                                                                old_comments?.map(item => {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: "Not Found",
                                                                        dp_link: "none",
                                                                        verified: false,
                                                                        is_c_owner: false
                                                                    });
                                                                });
                                                            })
                                                            .then(response => {
                                                                if (response?.length > 0) {
                                                                    const cmt_usernames = response;
                                                                    old_comments?.map(item => {
                                                                        const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                        if (user?.length > 0) {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: user?.[0]?.username,
                                                                                dp_link: user?.[0]?.dp_link,
                                                                                verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                                is_c_owner: false
                                                                            });
                                                                        } else {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: "Not Found",
                                                                                dp_link: "none",
                                                                                verified: false,
                                                                                is_c_owner: false
                                                                            });
                                                                        }
                                                                    });
                                                                } else {
                                                                    old_comments?.map(item => {
                                                                        new_comments?.push({
                                                                            ...item,
                                                                            username: "Not Found",
                                                                            dp_link: "none",
                                                                            verified: false,
                                                                            is_c_owner: false
                                                                        });
                                                                    });
                                                                }
                                                            });
                                                    } catch (error) {
                                                        old_comments?.map(item => {
                                                            new_comments?.push({
                                                                ...item,
                                                                username: "Not Found",
                                                                dp_link: "none",
                                                                verified: false,
                                                                is_c_owner: false
                                                            });
                                                        });
                                                    }
                                                } else {
                                                    old_comments?.map(item => {
                                                        new_comments?.push({
                                                            ...item,
                                                            username: "Not Found",
                                                            dp_link: "none",
                                                            verified: false,
                                                            is_c_owner: false
                                                        });
                                                    });
                                                }
                                                res.json({
                                                    status: "success",
                                                    response: {
                                                        bid: result[0]?._id?.toString(),
                                                        title: result[0]?.title,
                                                        author: "Not Found",
                                                        averified: false,
                                                        isowner: false,
                                                        a_id: "Not Found",
                                                        a_followed: false,
                                                        a_dp_link: "none",
                                                        a_followers: "Not Found",
                                                        a_createdAt: "Not Found",
                                                        b_dp_link: result[0]?.dp_link,
                                                        message: result[0]?.message,
                                                        likes_l: result[0]?.likes_l,
                                                        comments: new_comments?.reverse(),
                                                        comments_l: result[0]?.comments_l,
                                                        tags: result[0]?.tags,
                                                        liked: false,
                                                        createdAt: result[0]?.createdAt,
                                                        updatedAt: result[0]?.updatedAt
                                                    }
                                                });
                                            } else {
                                                res.json({
                                                    status: "success",
                                                    response: {
                                                        bid: result[0]?._id?.toString(),
                                                        title: result[0]?.title,
                                                        author: "Not Found",
                                                        averified: false,
                                                        isowner: false,
                                                        a_id: "Not Found",
                                                        a_followed: false,
                                                        a_dp_link: "none",
                                                        a_followers: "Not Found",
                                                        a_createdAt: "Not Found",
                                                        b_dp_link: result[0]?.dp_link,
                                                        message: result[0]?.message,
                                                        likes_l: result[0]?.likes_l,
                                                        comments: result[0]?.comments,
                                                        comments_l: result[0]?.comments_l,
                                                        tags: result[0]?.tags,
                                                        liked: false,
                                                        createdAt: result[0]?.createdAt,
                                                        updatedAt: result[0]?.updatedAt
                                                    }
                                                });
                                            }
                                        })
                                        .then(async response => {
                                            if (response !== null || response !== undefined) {
                                                if (response?.length > 0) {
                                                    const old_comments = result[0]?.comments;
                                                    const new_comments = [];
                                                    const cmt_users = [];
                                                    const processed_cmt_users = [];
                                                    if (old_comments?.length > 0) {
                                                        old_comments?.map(item => {
                                                            if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                                cmt_users?.push(item?.commenter?.toString());
                                                            }
                                                        });
                                                        cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                                        if (processed_cmt_users?.length > 0) {
                                                            try {
                                                                await User.aggregate([
                                                                    {
                                                                        $match: {
                                                                            _id: { $in: processed_cmt_users }
                                                                        }
                                                                    },
                                                                    {
                                                                        $project: {
                                                                            username: 1,
                                                                            verified: 1,
                                                                            dp_link: 1
                                                                        }
                                                                    }
                                                                ])
                                                                    .catch(err => {
                                                                        old_comments?.map(item => {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: "Not Found",
                                                                                dp_link: "none",
                                                                                verified: false,
                                                                                is_c_owner: false
                                                                            });
                                                                        });
                                                                    })
                                                                    .then(response => {
                                                                        if (response?.length > 0) {
                                                                            const cmt_usernames = response;
                                                                            old_comments?.map(item => {
                                                                                const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                                if (user?.length > 0) {
                                                                                    new_comments?.push({
                                                                                        ...item,
                                                                                        username: user?.[0]?.username,
                                                                                        dp_link: user?.[0]?.dp_link,
                                                                                        verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                                        is_c_owner: false
                                                                                    });
                                                                                } else {
                                                                                    new_comments?.push({
                                                                                        ...item,
                                                                                        username: "Not Found",
                                                                                        dp_link: "none",
                                                                                        verified: false,
                                                                                        is_c_owner: false
                                                                                    });
                                                                                }
                                                                            });
                                                                        } else {
                                                                            old_comments?.map(item => {
                                                                                new_comments?.push({
                                                                                    ...item,
                                                                                    username: "Not Found",
                                                                                    dp_link: "none",
                                                                                    verified: false,
                                                                                    is_c_owner: false
                                                                                });
                                                                            });
                                                                        }
                                                                    });
                                                            } catch (error) {
                                                                old_comments?.map(item => {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: "Not Found",
                                                                        dp_link: "none",
                                                                        verified: false,
                                                                        is_c_owner: false
                                                                    });
                                                                });
                                                            }
                                                        } else {
                                                            old_comments?.map(item => {
                                                                new_comments?.push({
                                                                    ...item,
                                                                    username: "Not Found",
                                                                    dp_link: "none",
                                                                    verified: false,
                                                                    is_c_owner: false
                                                                });
                                                            });
                                                        }
                                                        res.json({
                                                            status: "success",
                                                            response: {
                                                                bid: result[0]?._id?.toString(),
                                                                title: result[0]?.title,
                                                                author: response[0]?.username,
                                                                averified: response[0]?.verified,
                                                                isowner: false,
                                                                a_id: response[0]?._id?.toString(),
                                                                a_followed: false,
                                                                a_dp_link: response[0]?.dp_link,
                                                                a_followers: response[0]?.followers_l,
                                                                a_createdAt: response[0]?.createdAt,
                                                                b_dp_link: result[0]?.dp_link,
                                                                message: result[0]?.message,
                                                                likes_l: result[0]?.likes_l,
                                                                comments: new_comments?.reverse(),
                                                                comments_l: result[0]?.comments_l,
                                                                tags: result[0]?.tags,
                                                                liked: false,
                                                                createdAt: result[0]?.createdAt,
                                                                updatedAt: result[0]?.updatedAt
                                                            }
                                                        });
                                                    } else {
                                                        res.json({
                                                            status: "success",
                                                            response: {
                                                                bid: result[0]?._id?.toString(),
                                                                title: result[0]?.title,
                                                                author: response[0]?.username,
                                                                averified: response[0]?.verified,
                                                                isowner: false,
                                                                a_id: response[0]?._id?.toString(),
                                                                a_followed: false,
                                                                a_dp_link: response[0]?.dp_link,
                                                                a_followers: response[0]?.followers_l,
                                                                a_createdAt: response[0]?.createdAt,
                                                                b_dp_link: result[0]?.dp_link,
                                                                message: result[0]?.message,
                                                                likes_l: result[0]?.likes_l,
                                                                comments: result[0]?.comments,
                                                                comments_l: result[0]?.comments_l,
                                                                tags: result[0]?.tags,
                                                                liked: false,
                                                                createdAt: result[0]?.createdAt,
                                                                updatedAt: result[0]?.updatedAt
                                                            }
                                                        });
                                                    }
                                                } else {
                                                    const old_comments = result[0]?.comments;
                                                    const new_comments = [];
                                                    const cmt_users = [];
                                                    const processed_cmt_users = [];
                                                    if (old_comments?.length > 0) {
                                                        old_comments?.map(item => {
                                                            if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                                cmt_users?.push(item?.commenter?.toString());
                                                            }
                                                        });
                                                        cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                                        if (processed_cmt_users?.length > 0) {
                                                            try {
                                                                await User.aggregate([
                                                                    {
                                                                        $match: {
                                                                            _id: { $in: processed_cmt_users }
                                                                        }
                                                                    },
                                                                    {
                                                                        $project: {
                                                                            username: 1,
                                                                            verified: 1,
                                                                            dp_link: 1
                                                                        }
                                                                    }
                                                                ])
                                                                    .catch(err => {
                                                                        old_comments?.map(item => {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: "Not Found",
                                                                                dp_link: "none",
                                                                                verified: false,
                                                                                is_c_owner: false
                                                                            });
                                                                        });
                                                                    })
                                                                    .then(response => {
                                                                        if (response?.length > 0) {
                                                                            const cmt_usernames = response;
                                                                            old_comments?.map(item => {
                                                                                const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                                if (user?.length > 0) {
                                                                                    new_comments?.push({
                                                                                        ...item,
                                                                                        username: user?.[0]?.username,
                                                                                        dp_link: user?.[0]?.dp_link,
                                                                                        verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                                        is_c_owner: false
                                                                                    });
                                                                                } else {
                                                                                    new_comments?.push({
                                                                                        ...item,
                                                                                        username: "Not Found",
                                                                                        dp_link: "none",
                                                                                        verified: false,
                                                                                        is_c_owner: false
                                                                                    });
                                                                                }
                                                                            });
                                                                        } else {
                                                                            old_comments?.map(item => {
                                                                                new_comments?.push({
                                                                                    ...item,
                                                                                    username: "Not Found",
                                                                                    dp_link: "none",
                                                                                    verified: false,
                                                                                    is_c_owner: false
                                                                                });
                                                                            });
                                                                        }
                                                                    });
                                                            } catch (error) {
                                                                old_comments?.map(item => {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: "Not Found",
                                                                        dp_link: "none",
                                                                        verified: false,
                                                                        is_c_owner: false
                                                                    });
                                                                });
                                                            }
                                                        } else {
                                                            old_comments?.map(item => {
                                                                new_comments?.push({
                                                                    ...item,
                                                                    username: "Not Found",
                                                                    dp_link: "none",
                                                                    verified: false,
                                                                    is_c_owner: false
                                                                });
                                                            });
                                                        }
                                                        res.json({
                                                            status: "success",
                                                            response: {
                                                                bid: result[0]?._id?.toString(),
                                                                title: result[0]?.title,
                                                                author: "Not Found",
                                                                averified: false,
                                                                isowner: false,
                                                                a_id: "Not Found",
                                                                a_followed: false,
                                                                a_dp_link: "none",
                                                                a_followers: "Not Found",
                                                                a_createdAt: "Not Found",
                                                                b_dp_link: result[0]?.dp_link,
                                                                message: result[0]?.message,
                                                                likes_l: result[0]?.likes_l,
                                                                comments: new_comments?.reverse(),
                                                                comments_l: result[0]?.comments_l,
                                                                tags: result[0]?.tags,
                                                                liked: false,
                                                                createdAt: result[0]?.createdAt,
                                                                updatedAt: result[0]?.updatedAt
                                                            }
                                                        });
                                                    } else {
                                                        res.json({
                                                            status: "success",
                                                            response: {
                                                                bid: result[0]?._id?.toString(),
                                                                title: result[0]?.title,
                                                                author: "Not Found",
                                                                averified: false,
                                                                isowner: false,
                                                                a_id: "Not Found",
                                                                a_followed: false,
                                                                a_dp_link: "none",
                                                                a_followers: "Not Found",
                                                                a_createdAt: "Not Found",
                                                                b_dp_link: result[0]?.dp_link,
                                                                message: result[0]?.message,
                                                                likes_l: result[0]?.likes_l,
                                                                comments: result[0]?.comments,
                                                                comments_l: result[0]?.comments_l,
                                                                tags: result[0]?.tags,
                                                                liked: false,
                                                                createdAt: result[0]?.createdAt,
                                                                updatedAt: result[0]?.updatedAt
                                                            }
                                                        });
                                                    }
                                                }
                                            } else {
                                                const old_comments = result[0]?.comments;
                                                const new_comments = [];
                                                const cmt_users = [];
                                                const processed_cmt_users = [];
                                                if (old_comments?.length > 0) {
                                                    old_comments?.map(item => {
                                                        if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                            cmt_users?.push(item?.commenter?.toString());
                                                        }
                                                    });
                                                    cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                                    if (processed_cmt_users?.length > 0) {
                                                        try {
                                                            await User.aggregate([
                                                                {
                                                                    $match: {
                                                                        _id: { $in: processed_cmt_users }
                                                                    }
                                                                },
                                                                {
                                                                    $project: {
                                                                        username: 1,
                                                                        verified: 1,
                                                                        dp_link: 1
                                                                    }
                                                                }
                                                            ])
                                                                .catch(err => {
                                                                    old_comments?.map(item => {
                                                                        new_comments?.push({
                                                                            ...item,
                                                                            username: "Not Found",
                                                                            dp_link: "none",
                                                                            verified: false,
                                                                            is_c_owner: false
                                                                        });
                                                                    });
                                                                })
                                                                .then(response => {
                                                                    if (response?.length > 0) {
                                                                        const cmt_usernames = response;
                                                                        old_comments?.map(item => {
                                                                            const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                            if (user?.length > 0) {
                                                                                new_comments?.push({
                                                                                    ...item,
                                                                                    username: user?.[0]?.username,
                                                                                    dp_link: user?.[0]?.dp_link,
                                                                                    verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                                    is_c_owner: false
                                                                                });
                                                                            } else {
                                                                                new_comments?.push({
                                                                                    ...item,
                                                                                    username: "Not Found",
                                                                                    dp_link: "none",
                                                                                    verified: false,
                                                                                    is_c_owner: false
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        old_comments?.map(item => {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: "Not Found",
                                                                                dp_link: "none",
                                                                                verified: false,
                                                                                is_c_owner: false
                                                                            });
                                                                        });
                                                                    }
                                                                });
                                                        } catch (error) {
                                                            old_comments?.map(item => {
                                                                new_comments?.push({
                                                                    ...item,
                                                                    username: "Not Found",
                                                                    dp_link: "none",
                                                                    verified: false,
                                                                    is_c_owner: false
                                                                });
                                                            });
                                                        }
                                                    } else {
                                                        old_comments?.map(item => {
                                                            new_comments?.push({
                                                                ...item,
                                                                username: "Not Found",
                                                                dp_link: "none",
                                                                verified: false,
                                                                is_c_owner: false
                                                            });
                                                        });
                                                    }
                                                    res.json({
                                                        status: "success",
                                                        response: {
                                                            bid: result[0]?._id?.toString(),
                                                            title: result[0]?.title,
                                                            author: "Not Found",
                                                            averified: false,
                                                            isowner: false,
                                                            a_id: "Not Found",
                                                            a_followed: false,
                                                            a_dp_link: "none",
                                                            a_followers: "Not Found",
                                                            a_createdAt: "Not Found",
                                                            b_dp_link: result[0]?.dp_link,
                                                            message: result[0]?.message,
                                                            likes_l: result[0]?.likes_l,
                                                            comments: new_comments?.reverse(),
                                                            comments_l: result[0]?.comments_l,
                                                            tags: result[0]?.tags,
                                                            liked: false,
                                                            createdAt: result[0]?.createdAt,
                                                            updatedAt: result[0]?.updatedAt
                                                        }
                                                    });
                                                } else {
                                                    res.json({
                                                        status: "success",
                                                        response: {
                                                            bid: result[0]?._id?.toString(),
                                                            title: result[0]?.title,
                                                            author: "Not Found",
                                                            averified: false,
                                                            isowner: false,
                                                            a_id: "Not Found",
                                                            a_followed: false,
                                                            a_dp_link: "none",
                                                            a_followers: "Not Found",
                                                            a_createdAt: "Not Found",
                                                            b_dp_link: result[0]?.dp_link,
                                                            message: result[0]?.message,
                                                            likes_l: result[0]?.likes_l,
                                                            comments: result[0]?.comments,
                                                            comments_l: result[0]?.comments_l,
                                                            tags: result[0]?.tags,
                                                            liked: false,
                                                            createdAt: result[0]?.createdAt,
                                                            updatedAt: result[0]?.updatedAt
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                } catch (error) {
                                    const old_comments = result[0]?.comments;
                                    const new_comments = [];
                                    const cmt_users = [];
                                    const processed_cmt_users = [];
                                    if (old_comments?.length > 0) {
                                        old_comments?.map(item => {
                                            if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                cmt_users?.push(item?.commenter?.toString());
                                            }
                                        });
                                        cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                        if (processed_cmt_users?.length > 0) {
                                            try {
                                                await User.aggregate([
                                                    {
                                                        $match: {
                                                            _id: { $in: processed_cmt_users }
                                                        }
                                                    },
                                                    {
                                                        $project: {
                                                            username: 1,
                                                            verified: 1,
                                                            dp_link: 1
                                                        }
                                                    }
                                                ])
                                                    .catch(err => {
                                                        old_comments?.map(item => {
                                                            new_comments?.push({
                                                                ...item,
                                                                username: "Not Found",
                                                                dp_link: "none",
                                                                verified: false,
                                                                is_c_owner: false
                                                            });
                                                        });
                                                    })
                                                    .then(response => {
                                                        if (response?.length > 0) {
                                                            const cmt_usernames = response;
                                                            old_comments?.map(item => {
                                                                const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                if (user?.length > 0) {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: user?.[0]?.username,
                                                                        dp_link: user?.[0]?.dp_link,
                                                                        verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                        is_c_owner: false
                                                                    });
                                                                } else {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: "Not Found",
                                                                        dp_link: "none",
                                                                        verified: false,
                                                                        is_c_owner: false
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            old_comments?.map(item => {
                                                                new_comments?.push({
                                                                    ...item,
                                                                    username: "Not Found",
                                                                    dp_link: "none",
                                                                    verified: false,
                                                                    is_c_owner: false
                                                                });
                                                            });
                                                        }
                                                    });
                                            } catch (error) {
                                                old_comments?.map(item => {
                                                    new_comments?.push({
                                                        ...item,
                                                        username: "Not Found",
                                                        dp_link: "none",
                                                        verified: false,
                                                        is_c_owner: false
                                                    });
                                                });
                                            }
                                        } else {
                                            old_comments?.map(item => {
                                                new_comments?.push({
                                                    ...item,
                                                    username: "Not Found",
                                                    dp_link: "none",
                                                    verified: false,
                                                    is_c_owner: false
                                                });
                                            });
                                        }
                                        res.json({
                                            status: "success",
                                            response: {
                                                bid: result[0]?._id?.toString(),
                                                title: result[0]?.title,
                                                author: "Not Found",
                                                averified: false,
                                                isowner: false,
                                                a_id: "Not Found",
                                                a_followed: false,
                                                a_dp_link: "none",
                                                a_followers: "Not Found",
                                                a_createdAt: "Not Found",
                                                b_dp_link: result[0]?.dp_link,
                                                message: result[0]?.message,
                                                likes_l: result[0]?.likes_l,
                                                comments: new_comments?.reverse(),
                                                comments_l: result[0]?.comments_l,
                                                tags: result[0]?.tags,
                                                liked: false,
                                                createdAt: result[0]?.createdAt,
                                                updatedAt: result[0]?.updatedAt
                                            }
                                        });
                                    } else {
                                        res.json({
                                            status: "success",
                                            response: {
                                                bid: result[0]?._id?.toString(),
                                                title: result[0]?.title,
                                                author: "Not Found",
                                                averified: false,
                                                isowner: false,
                                                a_id: "Not Found",
                                                a_followed: false,
                                                a_dp_link: "none",
                                                a_followers: "Not Found",
                                                a_createdAt: "Not Found",
                                                b_dp_link: result[0]?.dp_link,
                                                message: result[0]?.message,
                                                likes_l: result[0]?.likes_l,
                                                comments: result[0]?.comments,
                                                comments_l: result[0]?.comments_l,
                                                tags: result[0]?.tags,
                                                liked: false,
                                                createdAt: result[0]?.createdAt,
                                                updatedAt: result[0]?.updatedAt
                                            }
                                        });
                                    }
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-038"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-038"
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-051"
                });
            }
        } else {
            try {
                await Blog.aggregate([
                    {
                        $match: {
                            _id: ObjectId(bid)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            author: 1,
                            dp_link: 1,
                            message: 1,
                            likes_l: { $size: "$likes" },
                            comments: 1,
                            comments_l: { $size: "$comments" },
                            tags: 1,
                            liked: { $in: [ObjectId(uid), "$likes"] },
                            createdAt: 1,
                            updatedAt: 1
                        }
                    }
                ])
                    .catch(err => {
                        res.json({
                            status: "error",
                            code: "ERR-BLGD-038"
                        });
                    })
                    .then(async result => {
                        if (result !== null || result !== undefined) {
                            if (result?.length > 0) {
                                try {
                                    await User.aggregate([
                                        {
                                            $match: {
                                                _id: ObjectId(result[0]?.author)
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                username: 1,
                                                verified: 1,
                                                dp_link: 1,
                                                followers_l: { $size: "$followers" },
                                                a_followed: { $in: [ObjectId(uid), "$followers"] },
                                                createdAt: 1
                                            }
                                        }
                                    ])
                                        .catch(async err => {
                                            const old_comments = result[0]?.comments;
                                            const new_comments = [];
                                            const cmt_users = [];
                                            const processed_cmt_users = [];
                                            if (old_comments?.length > 0) {
                                                old_comments?.map(item => {
                                                    if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                        cmt_users?.push(item?.commenter?.toString());
                                                    }
                                                });
                                                cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                                if (processed_cmt_users?.length > 0) {
                                                    try {
                                                        await User.aggregate([
                                                            {
                                                                $match: {
                                                                    _id: { $in: processed_cmt_users }
                                                                }
                                                            },
                                                            {
                                                                $project: {
                                                                    username: 1,
                                                                    verified: 1,
                                                                    dp_link: 1
                                                                }
                                                            }
                                                        ])
                                                            .catch(err => {
                                                                old_comments?.map(item => {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: "Not Found",
                                                                        dp_link: "none",
                                                                        verified: false,
                                                                        is_c_owner: false
                                                                    });
                                                                });
                                                            })
                                                            .then(response => {
                                                                if (response?.length > 0) {
                                                                    const cmt_usernames = response;
                                                                    old_comments?.map(item => {
                                                                        const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                        if (user?.length > 0) {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: user?.[0]?.username,
                                                                                dp_link: user?.[0]?.dp_link,
                                                                                verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                                is_c_owner: uid === item?.commenter?.toString()
                                                                            });
                                                                        } else {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: "Not Found",
                                                                                dp_link: "none",
                                                                                verified: false,
                                                                                is_c_owner: false
                                                                            });
                                                                        }
                                                                    });
                                                                } else {
                                                                    old_comments?.map(item => {
                                                                        new_comments?.push({
                                                                            ...item,
                                                                            username: "Not Found",
                                                                            dp_link: "none",
                                                                            verified: false,
                                                                            is_c_owner: false
                                                                        });
                                                                    });
                                                                }
                                                            });
                                                    } catch (error) {
                                                        old_comments?.map(item => {
                                                            new_comments?.push({
                                                                ...item,
                                                                username: "Not Found",
                                                                dp_link: "none",
                                                                verified: false,
                                                                is_c_owner: false
                                                            });
                                                        });
                                                    }
                                                } else {
                                                    old_comments?.map(item => {
                                                        new_comments?.push({
                                                            ...item,
                                                            username: "Not Found",
                                                            dp_link: "none",
                                                            verified: false,
                                                            is_c_owner: false
                                                        });
                                                    });
                                                }
                                                res.json({
                                                    status: "success",
                                                    response: {
                                                        bid: result[0]?._id?.toString(),
                                                        title: result[0]?.title,
                                                        author: "Not Found",
                                                        averified: false,
                                                        isowner: false,
                                                        a_id: "Not Found",
                                                        a_followed: false,
                                                        a_dp_link: "none",
                                                        a_followers: "Not Found",
                                                        a_createdAt: "Not Found",
                                                        b_dp_link: result[0]?.dp_link,
                                                        message: result[0]?.message,
                                                        likes_l: result[0]?.likes_l,
                                                        comments: new_comments?.reverse(),
                                                        comments_l: result[0]?.comments_l,
                                                        tags: result[0]?.tags,
                                                        liked: false,
                                                        createdAt: result[0]?.createdAt,
                                                        updatedAt: result[0]?.updatedAt
                                                    }
                                                });
                                            } else {
                                                res.json({
                                                    status: "success",
                                                    response: {
                                                        bid: result[0]?._id?.toString(),
                                                        title: result[0]?.title,
                                                        author: "Not Found",
                                                        averified: false,
                                                        isowner: false,
                                                        a_id: "Not Found",
                                                        a_followed: false,
                                                        a_dp_link: "none",
                                                        a_followers: "Not Found",
                                                        a_createdAt: "Not Found",
                                                        b_dp_link: result[0]?.dp_link,
                                                        message: result[0]?.message,
                                                        likes_l: result[0]?.likes_l,
                                                        comments: result[0]?.comments,
                                                        comments_l: result[0]?.comments_l,
                                                        tags: result[0]?.tags,
                                                        liked: false,
                                                        createdAt: result[0]?.createdAt,
                                                        updatedAt: result[0]?.updatedAt
                                                    }
                                                });
                                            }
                                        })
                                        .then(async response => {
                                            if (response !== null || response !== undefined) {
                                                if (response?.length > 0) {
                                                    const old_comments = result[0]?.comments;
                                                    const new_comments = [];
                                                    const cmt_users = [];
                                                    const processed_cmt_users = [];
                                                    if (old_comments?.length > 0) {
                                                        old_comments?.map(item => {
                                                            if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                                cmt_users?.push(item?.commenter?.toString());
                                                            }
                                                        });
                                                        cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                                        if (processed_cmt_users?.length > 0) {
                                                            try {
                                                                await User.aggregate([
                                                                    {
                                                                        $match: {
                                                                            _id: { $in: processed_cmt_users }
                                                                        }
                                                                    },
                                                                    {
                                                                        $project: {
                                                                            username: 1,
                                                                            verified: 1,
                                                                            dp_link: 1
                                                                        }
                                                                    }
                                                                ])
                                                                    .catch(err => {
                                                                        old_comments?.map(item => {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: "Not Found",
                                                                                dp_link: "none",
                                                                                verified: false,
                                                                                is_c_owner: false
                                                                            });
                                                                        });
                                                                    })
                                                                    .then(response => {
                                                                        if (response?.length > 0) {
                                                                            const cmt_usernames = response;
                                                                            old_comments?.map(item => {
                                                                                const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                                if (user?.length > 0) {
                                                                                    new_comments?.push({
                                                                                        ...item,
                                                                                        username: user?.[0]?.username,
                                                                                        dp_link: user?.[0]?.dp_link,
                                                                                        verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                                        is_c_owner: uid === item?.commenter?.toString()
                                                                                    });
                                                                                } else {
                                                                                    new_comments?.push({
                                                                                        ...item,
                                                                                        username: "Not Found",
                                                                                        dp_link: "none",
                                                                                        verified: false,
                                                                                        is_c_owner: false
                                                                                    });
                                                                                }
                                                                            });
                                                                        } else {
                                                                            old_comments?.map(item => {
                                                                                new_comments?.push({
                                                                                    ...item,
                                                                                    username: "Not Found",
                                                                                    dp_link: "none",
                                                                                    verified: false,
                                                                                    is_c_owner: false
                                                                                });
                                                                            });
                                                                        }
                                                                    });
                                                            } catch (error) {
                                                                old_comments?.map(item => {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: "Not Found",
                                                                        dp_link: "none",
                                                                        verified: false,
                                                                        is_c_owner: false
                                                                    });
                                                                });
                                                            }
                                                        } else {
                                                            old_comments?.map(item => {
                                                                new_comments?.push({
                                                                    ...item,
                                                                    username: "Not Found",
                                                                    dp_link: "none",
                                                                    verified: false,
                                                                    is_c_owner: false
                                                                });
                                                            });
                                                        }
                                                        res.json({
                                                            status: "success",
                                                            response: {
                                                                bid: result[0]?._id?.toString(),
                                                                title: result[0]?.title,
                                                                author: response[0]?.username,
                                                                averified: response[0]?.verified,
                                                                isowner: response[0]?._id?.toString() === uid,
                                                                a_id: response[0]?._id?.toString(),
                                                                a_followed: response[0]?.a_followed,
                                                                a_dp_link: response[0]?.dp_link,
                                                                a_followers: response[0]?.followers_l,
                                                                a_createdAt: response[0]?.createdAt,
                                                                b_dp_link: result[0]?.dp_link,
                                                                message: result[0]?.message,
                                                                likes_l: result[0]?.likes_l,
                                                                comments: new_comments?.reverse(),
                                                                comments_l: result[0]?.comments_l,
                                                                tags: result[0]?.tags,
                                                                liked: result[0]?.liked,
                                                                createdAt: result[0]?.createdAt,
                                                                updatedAt: result[0]?.updatedAt
                                                            }
                                                        });
                                                    } else {
                                                        res.json({
                                                            status: "success",
                                                            response: {
                                                                bid: result[0]?._id?.toString(),
                                                                title: result[0]?.title,
                                                                author: response[0]?.username,
                                                                averified: response[0]?.verified,
                                                                isowner: response[0]?._id?.toString() === uid,
                                                                a_id: response[0]?._id?.toString(),
                                                                a_followed: response[0]?.a_followed,
                                                                a_dp_link: response[0]?.dp_link,
                                                                a_followers: response[0]?.followers_l,
                                                                a_createdAt: response[0]?.createdAt,
                                                                b_dp_link: result[0]?.dp_link,
                                                                message: result[0]?.message,
                                                                likes_l: result[0]?.likes_l,
                                                                comments: result[0]?.comments,
                                                                comments_l: result[0]?.comments_l,
                                                                tags: result[0]?.tags,
                                                                liked: result[0]?.liked,
                                                                createdAt: result[0]?.createdAt,
                                                                updatedAt: result[0]?.updatedAt
                                                            }
                                                        });
                                                    }
                                                } else {
                                                    const old_comments = result[0]?.comments;
                                                    const new_comments = [];
                                                    const cmt_users = [];
                                                    const processed_cmt_users = [];
                                                    if (old_comments?.length > 0) {
                                                        old_comments?.map(item => {
                                                            if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                                cmt_users?.push(item?.commenter?.toString());
                                                            }
                                                        });
                                                        cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                                        if (processed_cmt_users?.length > 0) {
                                                            try {
                                                                await User.aggregate([
                                                                    {
                                                                        $match: {
                                                                            _id: { $in: processed_cmt_users }
                                                                        }
                                                                    },
                                                                    {
                                                                        $project: {
                                                                            username: 1,
                                                                            verified: 1,
                                                                            dp_link: 1
                                                                        }
                                                                    }
                                                                ])
                                                                    .catch(err => {
                                                                        old_comments?.map(item => {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: "Not Found",
                                                                                dp_link: "none",
                                                                                verified: false,
                                                                                is_c_owner: false
                                                                            });
                                                                        });
                                                                    })
                                                                    .then(response => {
                                                                        if (response?.length > 0) {
                                                                            const cmt_usernames = response;
                                                                            old_comments?.map(item => {
                                                                                const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                                if (user?.length > 0) {
                                                                                    new_comments?.push({
                                                                                        ...item,
                                                                                        username: user?.[0]?.username,
                                                                                        dp_link: user?.[0]?.dp_link,
                                                                                        verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                                        is_c_owner: uid === item?.commenter?.toString()
                                                                                    });
                                                                                } else {
                                                                                    new_comments?.push({
                                                                                        ...item,
                                                                                        username: "Not Found",
                                                                                        dp_link: "none",
                                                                                        verified: false,
                                                                                        is_c_owner: false
                                                                                    });
                                                                                }
                                                                            });
                                                                        } else {
                                                                            old_comments?.map(item => {
                                                                                new_comments?.push({
                                                                                    ...item,
                                                                                    username: "Not Found",
                                                                                    dp_link: "none",
                                                                                    verified: false,
                                                                                    is_c_owner: false
                                                                                });
                                                                            });
                                                                        }
                                                                    });
                                                            } catch (error) {
                                                                old_comments?.map(item => {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: "Not Found",
                                                                        dp_link: "none",
                                                                        verified: false,
                                                                        is_c_owner: false
                                                                    });
                                                                });
                                                            }
                                                        } else {
                                                            old_comments?.map(item => {
                                                                new_comments?.push({
                                                                    ...item,
                                                                    username: "Not Found",
                                                                    dp_link: "none",
                                                                    verified: false,
                                                                    is_c_owner: false
                                                                });
                                                            });
                                                        }
                                                        res.json({
                                                            status: "success",
                                                            response: {
                                                                bid: result[0]?._id?.toString(),
                                                                title: result[0]?.title,
                                                                author: "Not Found",
                                                                averified: false,
                                                                isowner: false,
                                                                a_id: "Not Found",
                                                                a_followed: false,
                                                                a_dp_link: "none",
                                                                a_followers: "Not Found",
                                                                a_createdAt: "Not Found",
                                                                b_dp_link: result[0]?.dp_link,
                                                                message: result[0]?.message,
                                                                likes_l: result[0]?.likes_l,
                                                                comments: new_comments?.reverse(),
                                                                comments_l: result[0]?.comments_l,
                                                                tags: result[0]?.tags,
                                                                liked: false,
                                                                createdAt: result[0]?.createdAt,
                                                                updatedAt: result[0]?.updatedAt
                                                            }
                                                        });
                                                    } else {
                                                        res.json({
                                                            status: "success",
                                                            response: {
                                                                bid: result[0]?._id?.toString(),
                                                                title: result[0]?.title,
                                                                author: "Not Found",
                                                                averified: false,
                                                                isowner: false,
                                                                a_id: "Not Found",
                                                                a_followed: false,
                                                                a_dp_link: "none",
                                                                a_followers: "Not Found",
                                                                a_createdAt: "Not Found",
                                                                b_dp_link: result[0]?.dp_link,
                                                                message: result[0]?.message,
                                                                likes_l: result[0]?.likes_l,
                                                                comments: result[0]?.comments,
                                                                comments_l: result[0]?.comments_l,
                                                                tags: result[0]?.tags,
                                                                liked: false,
                                                                createdAt: result[0]?.createdAt,
                                                                updatedAt: result[0]?.updatedAt
                                                            }
                                                        });
                                                    }
                                                }
                                            } else {
                                                const old_comments = result[0]?.comments;
                                                const new_comments = [];
                                                const cmt_users = [];
                                                const processed_cmt_users = [];
                                                if (old_comments?.length > 0) {
                                                    old_comments?.map(item => {
                                                        if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                            cmt_users?.push(item?.commenter?.toString());
                                                        }
                                                    });
                                                    cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                                    if (processed_cmt_users?.length > 0) {
                                                        try {
                                                            await User.aggregate([
                                                                {
                                                                    $match: {
                                                                        _id: { $in: processed_cmt_users }
                                                                    }
                                                                },
                                                                {
                                                                    $project: {
                                                                        username: 1,
                                                                        verified: 1,
                                                                        dp_link: 1
                                                                    }
                                                                }
                                                            ])
                                                                .catch(err => {
                                                                    old_comments?.map(item => {
                                                                        new_comments?.push({
                                                                            ...item,
                                                                            username: "Not Found",
                                                                            dp_link: "none",
                                                                            verified: false,
                                                                            is_c_owner: false
                                                                        });
                                                                    });
                                                                })
                                                                .then(response => {
                                                                    if (response?.length > 0) {
                                                                        const cmt_usernames = response;
                                                                        old_comments?.map(item => {
                                                                            const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                            if (user?.length > 0) {
                                                                                new_comments?.push({
                                                                                    ...item,
                                                                                    username: user?.[0]?.username,
                                                                                    dp_link: user?.[0]?.dp_link,
                                                                                    verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                                    is_c_owner: uid === item?.commenter?.toString()
                                                                                });
                                                                            } else {
                                                                                new_comments?.push({
                                                                                    ...item,
                                                                                    username: "Not Found",
                                                                                    dp_link: "none",
                                                                                    verified: false,
                                                                                    is_c_owner: false
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        old_comments?.map(item => {
                                                                            new_comments?.push({
                                                                                ...item,
                                                                                username: "Not Found",
                                                                                dp_link: "none",
                                                                                verified: false,
                                                                                is_c_owner: false
                                                                            });
                                                                        });
                                                                    }
                                                                });
                                                        } catch (error) {
                                                            old_comments?.map(item => {
                                                                new_comments?.push({
                                                                    ...item,
                                                                    username: "Not Found",
                                                                    dp_link: "none",
                                                                    verified: false,
                                                                    is_c_owner: false
                                                                });
                                                            });
                                                        }
                                                    } else {
                                                        old_comments?.map(item => {
                                                            new_comments?.push({
                                                                ...item,
                                                                username: "Not Found",
                                                                dp_link: "none",
                                                                verified: false,
                                                                is_c_owner: false
                                                            });
                                                        });
                                                    }
                                                    res.json({
                                                        status: "success",
                                                        response: {
                                                            bid: result[0]?._id?.toString(),
                                                            title: result[0]?.title,
                                                            author: "Not Found",
                                                            averified: false,
                                                            isowner: false,
                                                            a_id: "Not Found",
                                                            a_followed: false,
                                                            a_dp_link: "none",
                                                            a_followers: "Not Found",
                                                            a_createdAt: "Not Found",
                                                            b_dp_link: result[0]?.dp_link,
                                                            message: result[0]?.message,
                                                            likes_l: result[0]?.likes_l,
                                                            comments: new_comments?.reverse(),
                                                            comments_l: result[0]?.comments_l,
                                                            tags: result[0]?.tags,
                                                            liked: false,
                                                            createdAt: result[0]?.createdAt,
                                                            updatedAt: result[0]?.updatedAt
                                                        }
                                                    });
                                                } else {
                                                    res.json({
                                                        status: "success",
                                                        response: {
                                                            bid: result[0]?._id?.toString(),
                                                            title: result[0]?.title,
                                                            author: "Not Found",
                                                            averified: false,
                                                            isowner: false,
                                                            a_id: "Not Found",
                                                            a_followed: false,
                                                            a_dp_link: "none",
                                                            a_followers: "Not Found",
                                                            a_createdAt: "Not Found",
                                                            b_dp_link: result[0]?.dp_link,
                                                            message: result[0]?.message,
                                                            likes_l: result[0]?.likes_l,
                                                            comments: result[0]?.comments,
                                                            comments_l: result[0]?.comments_l,
                                                            tags: result[0]?.tags,
                                                            liked: false,
                                                            createdAt: result[0]?.createdAt,
                                                            updatedAt: result[0]?.updatedAt
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                } catch (error) {
                                    const old_comments = result[0]?.comments;
                                    const new_comments = [];
                                    const cmt_users = [];
                                    const processed_cmt_users = [];
                                    if (old_comments?.length > 0) {
                                        old_comments?.map(item => {
                                            if (cmt_users?.includes(item?.commenter?.toString()) === false) {
                                                cmt_users?.push(item?.commenter?.toString());
                                            }
                                        });
                                        cmt_users?.map(item => processed_cmt_users?.push(ObjectId(item)));
                                        if (processed_cmt_users?.length > 0) {
                                            try {
                                                await User.aggregate([
                                                    {
                                                        $match: {
                                                            _id: { $in: processed_cmt_users }
                                                        }
                                                    },
                                                    {
                                                        $project: {
                                                            username: 1,
                                                            verified: 1,
                                                            dp_link: 1
                                                        }
                                                    }
                                                ])
                                                    .catch(err => {
                                                        old_comments?.map(item => {
                                                            new_comments?.push({
                                                                ...item,
                                                                username: "Not Found",
                                                                dp_link: "none",
                                                                verified: false,
                                                                is_c_owner: false
                                                            });
                                                        });
                                                    })
                                                    .then(response => {
                                                        if (response?.length > 0) {
                                                            const cmt_usernames = response;
                                                            old_comments?.map(item => {
                                                                const user = cmt_usernames?.filter(usernames => usernames?._id?.toString() === item?.commenter?.toString());
                                                                if (user?.length > 0) {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: user?.[0]?.username,
                                                                        dp_link: user?.[0]?.dp_link,
                                                                        verified: none_null_bool(user?.[0]?.verified) ? false : user?.[0]?.verified,
                                                                        is_c_owner: uid === item?.commenter?.toString()
                                                                    });
                                                                } else {
                                                                    new_comments?.push({
                                                                        ...item,
                                                                        username: "Not Found",
                                                                        dp_link: "none",
                                                                        verified: false,
                                                                        is_c_owner: false
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            old_comments?.map(item => {
                                                                new_comments?.push({
                                                                    ...item,
                                                                    username: "Not Found",
                                                                    dp_link: "none",
                                                                    verified: false,
                                                                    is_c_owner: false
                                                                });
                                                            });
                                                        }
                                                    });
                                            } catch (error) {
                                                old_comments?.map(item => {
                                                    new_comments?.push({
                                                        ...item,
                                                        username: "Not Found",
                                                        dp_link: "none",
                                                        verified: false,
                                                        is_c_owner: false
                                                    });
                                                });
                                            }
                                        } else {
                                            old_comments?.map(item => {
                                                new_comments?.push({
                                                    ...item,
                                                    username: "Not Found",
                                                    dp_link: "none",
                                                    verified: false,
                                                    is_c_owner: false
                                                });
                                            });
                                        }
                                        res.json({
                                            status: "success",
                                            response: {
                                                bid: result[0]?._id?.toString(),
                                                title: result[0]?.title,
                                                author: "Not Found",
                                                averified: false,
                                                isowner: false,
                                                a_id: "Not Found",
                                                a_followed: false,
                                                a_dp_link: "none",
                                                a_followers: "Not Found",
                                                a_createdAt: "Not Found",
                                                b_dp_link: result[0]?.dp_link,
                                                message: result[0]?.message,
                                                likes_l: result[0]?.likes_l,
                                                comments: new_comments?.reverse(),
                                                comments_l: result[0]?.comments_l,
                                                tags: result[0]?.tags,
                                                liked: false,
                                                createdAt: result[0]?.createdAt,
                                                updatedAt: result[0]?.updatedAt
                                            }
                                        });
                                    } else {
                                        res.json({
                                            status: "success",
                                            response: {
                                                bid: result[0]?._id?.toString(),
                                                title: result[0]?.title,
                                                author: "Not Found",
                                                averified: false,
                                                isowner: false,
                                                a_id: "Not Found",
                                                a_followed: false,
                                                a_dp_link: "none",
                                                a_followers: "Not Found",
                                                a_createdAt: "Not Found",
                                                b_dp_link: result[0]?.dp_link,
                                                message: result[0]?.message,
                                                likes_l: result[0]?.likes_l,
                                                comments: result[0]?.comments,
                                                comments_l: result[0]?.comments_l,
                                                tags: result[0]?.tags,
                                                liked: false,
                                                createdAt: result[0]?.createdAt,
                                                updatedAt: result[0]?.updatedAt
                                            }
                                        });
                                    }
                                }
                            } else {
                                res.json({
                                    status: "error",
                                    code: "ERR-BLGD-038"
                                });
                            }
                        } else {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-038"
                            });
                        }
                    });
            } catch (error) {
                res.json({
                    status: "error",
                    code: "ERR-BLGD-051"
                });
            }
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-051"
        });
    }
});

// Load Blog Posts
// INFO REQUIRED
// Search Param
// Pagination Index
// Tags Param -> Stringified Array
router.get('/', verifyJWTHeaderIA, async (req, res) => {
    try {
        const uid = req.uid;
        const search = req.query.search;
        const new_search = none_null(search) ? "" : search;
        const processed_search = new_search?.toLowerCase()?.trim();
        const tags = none_null_arr(req.query.tags) ? "[]" : req.query.tags;
        const processed_tags = invalid_arr_tags_checker(tags);
        const pagination_index = req.query.pagination_index;
        const query_f_i = pagination_indexer(pagination_index, 50)?.first_index;
        const query_l_i = pagination_indexer(pagination_index, 50)?.last_index;
        if (none_null(uid)) {
            if (processed_tags?.length > 0) {
                try {
                    await Blog.aggregate([
                        {
                            $match: {
                                title: {
                                    $regex: processed_search, $options: 'i'
                                },
                                tags: {
                                    $in: processed_tags
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                author: 1,
                                dp_link: 1,
                                likes_l: { $size: "$likes" },
                                comments_l: { $size: "$comments" },
                                tags: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ])
                        .sort({ createdAt: -1 })
                        .skip(query_f_i)
                        .limit(query_l_i)
                        .catch(err => {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-053"
                            });
                        })
                        .then(async result => {
                            if (result !== null || result !== undefined) {
                                if (result?.length > 0) {
                                    const authors = [];
                                    result?.map(blog => authors.push(blog?.author));
                                    const authors_info = [];
                                    try {
                                        await User.aggregate([
                                            {
                                                $match: {
                                                    _id: {
                                                        $in: authors
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    username: 1,
                                                    verified: 1
                                                }
                                            }
                                        ])
                                            .then(res_author_name => {
                                                if (res_author_name !== undefined || res_author_name !== null) {
                                                    if (res_author_name?.length > 0) {
                                                        res_author_name?.map(item => authors_info.push(item));
                                                    }
                                                }
                                            });
                                    } catch (error) {
                                        authors_info.push();
                                    }
                                    const blogs_arr = [];
                                    result.map(item => {
                                        const p_author_username = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.username;
                                        const p_author_verified = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.verified;
                                        const p_p_author_verified = none_null_bool(p_author_verified) ? false : p_author_verified;
                                        const blog_item = {};
                                        blog_item["bid"] = item?._id?.toString();
                                        blog_item["aid"] = none_null(p_author_username) ? "Not Found" : item?.author?.toString();
                                        blog_item["author"] = none_null(p_author_username) ? "Not Found" : p_author_username;
                                        blog_item["averified"] = none_null(p_author_username) ? false : p_p_author_verified;
                                        blog_item["isowner"] = false;
                                        blog_item["title"] = item?.title;
                                        blog_item["b_dp_link"] = item?.dp_link;
                                        blog_item["likes_l"] = item?.likes_l;
                                        blog_item["comments_l"] = item?.comments_l;
                                        blog_item["tags"] = item?.tags;
                                        blog_item["liked"] = false;
                                        blog_item["createdAt"] = item?.createdAt;
                                        blog_item["updatedAt"] = item?.updatedAt;
                                        blogs_arr.push(blog_item);
                                    });
                                    res.json({
                                        status: "success",
                                        response: blogs_arr
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
                        code: "ERR-BLGD-053"
                    });
                }
            } else {
                try {
                    await Blog.aggregate([
                        {
                            $match: {
                                title: {
                                    $regex: processed_search, $options: 'i'
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                author: 1,
                                dp_link: 1,
                                likes_l: { $size: "$likes" },
                                comments_l: { $size: "$comments" },
                                tags: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ])
                        .sort({ createdAt: -1 })
                        .skip(query_f_i)
                        .limit(query_l_i)
                        .catch(err => {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-053"
                            });
                        })
                        .then(async result => {
                            if (result !== null || result !== undefined) {
                                if (result?.length > 0) {
                                    const authors = [];
                                    result?.map(blog => authors.push(blog?.author));
                                    const authors_info = [];
                                    try {
                                        await User.aggregate([
                                            {
                                                $match: {
                                                    _id: {
                                                        $in: authors
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    username: 1,
                                                    verified: 1
                                                }
                                            }
                                        ])
                                            .then(res_author_name => {
                                                if (res_author_name !== null || res_author_name !== undefined) {
                                                    if (res_author_name?.length > 0) {
                                                        res_author_name?.map(item => authors_info.push(item));
                                                    }
                                                }
                                            });
                                    } catch (error) {
                                        authors_info.push();
                                    }
                                    const blogs_arr = [];
                                    result.map(item => {
                                        const p_author_username = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.username;
                                        const p_author_verified = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.verified;
                                        const p_p_author_verified = none_null_bool(p_author_verified) ? false : p_author_verified;
                                        const blog_item = {};
                                        blog_item["bid"] = item?._id?.toString();
                                        blog_item["aid"] = none_null(p_author_username) ? "Not Found" : item?.author?.toString();
                                        blog_item["author"] = none_null(p_author_username) ? "Not Found" : p_author_username;
                                        blog_item["averified"] = none_null(p_author_username) ? false : p_p_author_verified;
                                        blog_item["isowner"] = false;
                                        blog_item["title"] = item?.title;
                                        blog_item["b_dp_link"] = item?.dp_link;
                                        blog_item["likes_l"] = item?.likes_l;
                                        blog_item["comments_l"] = item?.comments_l;
                                        blog_item["tags"] = item?.tags;
                                        blog_item["liked"] = false;
                                        blog_item["createdAt"] = item?.createdAt;
                                        blog_item["updatedAt"] = item?.updatedAt;
                                        blogs_arr.push(blog_item);
                                    });
                                    res.json({
                                        status: "success",
                                        response: blogs_arr
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
                        code: "ERR-BLGD-053"
                    });
                }
            }
        } else {
            if (processed_tags?.length > 0) {
                try {
                    await Blog.aggregate([
                        {
                            $match: {
                                title: {
                                    $regex: processed_search, $options: 'i'
                                },
                                tags: {
                                    $in: processed_tags
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                author: 1,
                                dp_link: 1,
                                likes_l: { $size: "$likes" },
                                comments_l: { $size: "$comments" },
                                tags: 1,
                                liked: { $in: [ObjectId(uid), "$likes"] },
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ])
                        .sort({ createdAt: -1 })
                        .skip(query_f_i)
                        .limit(query_l_i)
                        .catch(err => {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-053"
                            });
                        })
                        .then(async result => {
                            if (result !== null || result !== undefined) {
                                if (result?.length > 0) {
                                    const authors = [];
                                    result?.map(blog => authors.push(blog?.author));
                                    const authors_info = [];
                                    try {
                                        await User.aggregate([
                                            {
                                                $match: {
                                                    _id: {
                                                        $in: authors
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    username: 1,
                                                    verified: 1
                                                }
                                            }
                                        ])
                                            .then(res_author_name => {
                                                if (res_author_name !== null || res_author_name !== undefined) {
                                                    if (res_author_name?.length > 0) {
                                                        res_author_name?.map(item => authors_info.push(item));
                                                    }
                                                }
                                            });
                                    } catch (error) {
                                        authors_info.push();
                                    }
                                    const blogs_arr = [];
                                    result.map(item => {
                                        const p_author_username = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.username;
                                        const p_author_verified = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.verified;
                                        const p_p_author_verified = none_null_bool(p_author_verified) ? false : p_author_verified;
                                        const blog_item = {};
                                        blog_item["bid"] = item?._id?.toString();
                                        blog_item["aid"] = none_null(p_author_username) ? "Not Found" : item?.author?.toString();
                                        blog_item["author"] = none_null(p_author_username) ? "Not Found" : p_author_username;
                                        blog_item["averified"] = none_null(p_author_username) ? false : p_p_author_verified;
                                        blog_item["isowner"] = none_null(p_author_username) ? false : item?.author?.toString() === uid;
                                        blog_item["title"] = item?.title;
                                        blog_item["b_dp_link"] = item?.dp_link;
                                        blog_item["likes_l"] = item?.likes_l;
                                        blog_item["comments_l"] = item?.comments_l;
                                        blog_item["tags"] = item?.tags;
                                        blog_item["liked"] = item?.liked;
                                        blog_item["createdAt"] = item?.createdAt;
                                        blog_item["updatedAt"] = item?.updatedAt;
                                        blogs_arr.push(blog_item);
                                    });
                                    res.json({
                                        status: "success",
                                        response: blogs_arr
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
                        code: "ERR-BLGD-053"
                    });
                }
            } else {
                try {
                    await Blog.aggregate([
                        {
                            $match: {
                                title: {
                                    $regex: processed_search, $options: 'i'
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                author: 1,
                                dp_link: 1,
                                likes_l: { $size: "$likes" },
                                comments_l: { $size: "$comments" },
                                tags: 1,
                                liked: { $in: [ObjectId(uid), "$likes"] },
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ])
                        .sort({ createdAt: -1 })
                        .skip(query_f_i)
                        .limit(query_l_i)
                        .catch(err => {
                            res.json({
                                status: "error",
                                code: "ERR-BLGD-053"
                            });
                        })
                        .then(async result => {
                            if (result !== null || result !== undefined) {
                                if (result?.length > 0) {
                                    const authors = [];
                                    result?.map(blog => authors.push(blog?.author));
                                    const authors_info = [];
                                    try {
                                        await User.aggregate([
                                            {
                                                $match: {
                                                    _id: {
                                                        $in: authors
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    username: 1,
                                                    verified: 1
                                                }
                                            }
                                        ])
                                            .then(res_author_name => {
                                                if (res_author_name !== null || res_author_name !== undefined) {
                                                    if (res_author_name?.length > 0) {
                                                        res_author_name?.map(item => authors_info.push(item));
                                                    }
                                                }
                                            });
                                    } catch (error) {
                                        authors_info.push();
                                    }
                                    const blogs_arr = [];
                                    result.map(item => {
                                        const p_author_username = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.username;
                                        const p_author_verified = authors_info?.filter(a_info => a_info?._id?.toString() === item?.author?.toString())?.[0]?.verified;
                                        const p_p_author_verified = none_null_bool(p_author_verified) ? false : p_author_verified;
                                        const blog_item = {};
                                        blog_item["bid"] = item?._id?.toString();
                                        blog_item["aid"] = none_null(p_author_username) ? "Not Found" : item?.author?.toString();
                                        blog_item["author"] = none_null(p_author_username) ? "Not Found" : p_author_username;
                                        blog_item["averified"] = none_null(p_author_username) ? false : p_p_author_verified;
                                        blog_item["isowner"] = none_null(p_author_username) ? false : item?.author?.toString() === uid;
                                        blog_item["title"] = item?.title;
                                        blog_item["b_dp_link"] = item?.dp_link;
                                        blog_item["likes_l"] = item?.likes_l;
                                        blog_item["comments_l"] = item?.comments_l;
                                        blog_item["tags"] = item?.tags;
                                        blog_item["liked"] = item?.liked;
                                        blog_item["createdAt"] = item?.createdAt;
                                        blog_item["updatedAt"] = item?.updatedAt;
                                        blogs_arr.push(blog_item);
                                    });
                                    res.json({
                                        status: "success",
                                        response: blogs_arr
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
                        code: "ERR-BLGD-053"
                    });
                }
            }
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-053"
        });
    }
});




module.exports = router;