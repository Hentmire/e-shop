const expressJwt = require("express-jwt");
require("dotenv").config({ path: ".env" });

const secret = process.env.secret;
const api = process.env.API_URL;

const authJwt = expressJwt({
    secret,
    algorithms: ["HS256"],
    isRevoked,
}).unless({
    path: [
        { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
        { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
        `${api}/users/login`,
        `${api}/users/register`,
    ],
});

async function isRevoked(req, payload, done) {
    if (!payload.isAdmin) {
        done(null, true);
    }

    done();
}

module.exports = authJwt;
