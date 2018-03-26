////////////////////////////
// Initialize
////////////////////////////
const chai     = require("chai");
const chaiHTTP = require("chai-http");
const mongoose = require("mongoose");
const faker    = require("faker");
const jwt      = require("jsonwebtoken");

const { app, runServer, closeServer } = require("../src/server");
const { User, Crop, Journal } = require("../src/models");
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
function generateCropData(userId) {
    return {
        name: faker.lorem.word(),
        variety: faker.lorem.word(),
        plant_date: new Date(),
        germination_days: faker.random.number(),
        harvest_days: faker.random.number(),
        planting_depth: faker.random.number(),
        row_spacing: faker.random.number(),
        seed_spacing: faker.random.number(),
        userId: userId
    };
}

function seedCropData(userId) {
    console.info("seeding crop data");
    const seedData = [];
    
    for (let n = 0; n < 10; n++) {
      seedData.push(generateCropData(userId));
    }
    
    return Crop.insertMany(seedData);
}

function generateJournalData(userId, scopeId) {
    return {
        date: new Date(),
        scope: scopeId,
        text: faker.lorem.words(),
        userId: userId
    };
  }
  
function seedJournalData(userId, scopeId) {
    console.info("seeding journal data");
    const seedData = [];
    
    for (let n = 0; n < 10; n++) {
      seedData.push(generateJournalData(userId, scopeId));
    }
    
    return Journal.insertMany(seedData);
}

function tearDownDb() {
    return mongoose.connection.dropDatabase();
}

////////////////////////////
// Test suite
////////////////////////////
describe("User API", function() {
    this.timeout(10000);
    
    const { username, password } = TEST_USER;
    const user = { username, password };
    let authToken;

    before(function() {
        console.log("running server");
        return runServer(TEST_DATABASE_URL);
    });
    
    beforeEach(function() {
        let userId;

        return User.hashPassword(TEST_USER.password)
            .then(password => {
                const { username, email } = TEST_USER;
                return User.create( { username, email, password } );
            })
            .then(_user => {
                userId = _user._id;

                return seedCropData(userId);
            })
            .then(crops => {
                return seedJournalData(userId, crops[0]._id);
            })
            .then(data => {
                return User.create({
                    username: faker.internet.userName(),
                    password: faker.internet.password(),
                    email: faker.internet.email()
                });
            })
            .then(_user => {
                userId = _user._id;

                const crop = generateCropData(userId);
                return Crop.create(crop);
            })
            .then(crop => {
                return seedJournalData(userId, crop._id);
            })
            .then(data => {
                return chai.request(app)
                    .post("/api/auth/login")
                    .send(user);
            })
            .then(res => {
                authToken = res.body.authToken;
            });
    });
    
    after(function() {
      return closeServer();
    });
    
    afterEach(function() {
      return tearDownDb();
    });
    
    describe("'/users' endpoint", function() {
        describe("GET method", function() {
            it("Should return user info", function() {
                return User.findOne( { username } )
                    .then(function(user) {
                        return chai.request(app)
                            .get(`/api/users`)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body.users).to.be.a("object");
                        expect(res.body.users).to.have.all.keys("id", "username",
                            "email", "garden", "journal");
                    });
            });
            
            it("Should not return user data without a JWT", function() {
                return User.find( { username: TEST_USER.username } )
                    .then(function(_user) {
                        userId = _user[0]._id;

                        return chai.request(app)
                            .get(`/api/users`);
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");
                    });
            });
        });

        describe("POST method", function() {
            it("Should create a user", function() {
                const newUser = {
                    username: faker.internet.userName(),
                    password: faker.internet.password(),
                    email: faker.internet.email()
                };

                return chai.request(app)
                    .post("/api/users")
                    .send(newUser)
                    .then(function(res) {
                        expect(res).to.have.status(201);
                        expect(res).to.be.json;
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.have.all.keys("id", "username", "email");
                    });
            });
        });
    });
});