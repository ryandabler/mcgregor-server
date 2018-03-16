const { router: userRouter } = require("./users");
const { router: authRouter } = require("./authorize");
const { router: cropRouter } = require("./crops");

module.exports = {
    userRouter,
    authRouter,
    cropRouter
}