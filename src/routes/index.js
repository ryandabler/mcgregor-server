const { router: userRouter } = require("./users");
const { router: authRouter } = require("./authorize");

module.exports = {
    userRouter,
    authRouter
}