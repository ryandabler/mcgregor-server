const { router: userRouter }    = require("./users");
const { router: authRouter }    = require("./authorize");
const { router: cropRouter }    = require("./crops");
const { router: journalRouter } = require("./journals");

module.exports = {
    userRouter,
    authRouter,
    cropRouter,
    journalRouter
}