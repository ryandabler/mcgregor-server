////////////////////////////
// Initialize
////////////////////////////
const chai     = require("chai");
const chaiHTTP = require("chai-http");
const mongoose = require("mongoose");
const faker    = require("faker");
const jwt      = require("jsonwebtoken");

const { app, runServer, closeServer } = require("../src/server");
const { User } = require("../src/models");
const { TEST_DATABASE_URL, JWT_SECRET } = require("../src/config");
const TEST_USER = {
    username: "testuser",
    password: "testpw",
    email: "testuser@test.com"
}

const expect = chai.expect;
chai.use(chaiHTTP);

mongoose.Promise = global.Promise;

////////////////////////////
// Utility functions
////////////////////////////
function tearDownDb() {
    return mongoose.connection.dropDatabase();
}

////////////////////////////
// Test suite
////////////////////////////
describe("Authorization API", function() {
    this.timeout(10000);
    
    before(function() {
        console.log("running server");
        return runServer(TEST_DATABASE_URL);
    });
    
    beforeEach(function() {
        return User.hashPassword(TEST_USER.password)
            .then(password => {
                const { username, email } = TEST_USER;
                return User.create( { username, email, password } );
            });
    });
    
    after(function() {
      return closeServer();
    });
    
    afterEach(function() {
      return tearDownDb();
    });
    
    describe("'/api/auth/login' endpoint", function() {
        it("Should return a valid JWT with correct login credentials", function() {
            const { username, password } = TEST_USER;
            const user = { username, password };
            return chai.request(app)
                .post("/api/auth/login")
                .send(user)
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body.authToken).to.be.a("string");

                    const verified = jwt.verify(res.body.authToken, JWT_SECRET);
                    expect(verified).to.be.a("object");
                    expect(verified.user).to.deep.include( 
                        { username: TEST_USER.username, email: TEST_USER.email }
                    );
                    expect(verified.sub).to.equal(TEST_USER.username);
                });
        });

        it("Should not issue a JWT with improper credentials", function() {
            const { username, password } = TEST_USER;
            const user = {
                username: username.slice(0, username.length - 1),
                password
            };

            return chai.request(app)
                .post("/api/auth/refresh")
                .send(user)
                .catch(function(err) {
                    expect(err.response).to.have.status(401);
                    expect(err.response.text).to.equal("Unauthorized");
                });
        });
    });

    describe("'/api/auth/refresh' endpoint", function() {
        it("Should refresh a token with valid credentials", function() {
            const { username, password } = TEST_USER;
            const user = { username, password };
            let origJwtToken;

            return chai.request(app)
                .post("/api/auth/login")
                .send(user)
                .then(function(res1) {
                    origJwtToken = res1.body.authToken;

                    return new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), 1500)
                    });
                })
                .then(() => {
                    return chai.request(app)
                        .post("/api/auth/refresh")
                        .set("Authorization", `Bearer ${origJwtToken}`);
                })
                .then(function(res2) {
                    const newJwtToken = res2.body.authToken;
                    expect(newJwtToken).to.not.equal(origJwtToken);

                    const origPayload = jwt.verify(origJwtToken, JWT_SECRET);
                    const newPayload  = jwt.verify(newJwtToken, JWT_SECRET);
                    expect(origPayload.user).to.deep.equal(newPayload.user);
                });
        });

        it("Should not refresh an improper JWT", function() {
            const { username, password } = TEST_USER;
            const user = { username, password };

            return chai.request(app)
                .post("/api/auth/login")
                .send(user)
                .then(function(res) {
                    let { authToken } = res.body;
                    authToken = authToken.slice(0, authToken.length - 1);

                    return chai.request(app)
                        .post("/api/auth/refresh")
                        .set("Authorization", `Bearer ${authToken}`);
                })
                .catch(function(err) {
                    expect(err.response).to.have.status(401);
                    expect(err.response.text).to.equal("Unauthorized");
                });
        });
    });
});