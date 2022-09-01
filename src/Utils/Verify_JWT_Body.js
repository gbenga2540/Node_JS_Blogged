const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const token = req.body.headers["x-access-token"];
        if (token) {
            jwt.verify(token, process.env.NODE_AUTH_SECRET_KEY, (err, decoded) => {
                if (err) {
                    res.json({
                        status: "error",
                        code: "ERR-BLGD-013",
                    });
                } else {
                    req.uid = decoded.uid;
                    next();
                }
            });
        } else {
            res.json({
                status: "error",
                code: "ERR-BLGD-014",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            code: "ERR-BLGD-014",
        });
    }
}