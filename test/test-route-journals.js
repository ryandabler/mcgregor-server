////////////////////////////
// Initialize
////////////////////////////
const chai     = require("chai");
const chaiHTTP = require("chai-http");
const mongoose = require("mongoose");
const faker    = require("faker");
const jwt      = require("jsonwebtoken");

const { app, runServer, closeServer } = require("../src/server");
const { User, Journal, Crop } = require("../src/models");
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
describe("Journal API", function() {
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

                const crop = generateCropData(userId);
                return Crop.create(crop);
            })
            .then(crop => {
                return seedJournalData(userId, crop._id);
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
    
    describe("'/journals' endpoint", function() {
        describe("GET method", function() {
            it("Should return all journals of a user", function() {
                let TEST_USER_count;
                
                return chai.request(app)
                            .get("/api/journal")
                            .set("Authorization", `Bearer ${authToken}`)
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body.journal).to.be.a("array");

                        res.body.journal.forEach(function(journal) {
                            expect(journal).to.have.keys("id", "date", "scope", "text");
                        });

                        TEST_USER_count = res.body.journal.length;
                        return Journal.count();
                    })
                    .then(function(count) {
                        expect(TEST_USER_count).to.be.lessThan(count);
                    });
            });
            
            it("Should return a particular journal of a user", function() {
                let userId, journal;
                return User.find( { username: TEST_USER.username } )
                    .then(function(_user) {
                        userId = _user[0]._id;

                        return Journal.findOne( { userId } );
                    })
                    .then(function(_journal) {
                        journal = _journal;

                        return chai.request(app)
                            .get(`/api/journal/${journal._id}`)
                            .set("Authorization", `Bearer ${authToken}`)
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body.journal).to.be.a("array");
                        expect(res.body.journal[0]).to.be.a("object");
                        expect(res.body.journal.length).to.equal(1);
                    });
            });

            it("Should not return a journal without a JWT", function() {
                let userId, journal;
                return User.find( { username: TEST_USER.username } )
                    .then(function(_user) {
                        userId = _user[0]._id;

                        return Journal.findOne( { userId } );
                    })
                    .then(function(_journal) {
                        journal = _journal;

                        return chai.request(app)
                            .get(`/api/journal/${journal._id}`)
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");
                    });
            });

            it("Should not return a journal of another user", function() {
                return User.find( { username: { $ne: TEST_USER.username } } )
                    .then(function(_user) {
                        const userId = _user[0]._id;

                        return Journal.findOne( { userId } );
                    })
                    .then(function(_journal) {
                        return chai.request(app)
                            .get(`/api/journal/${_journal._id}`)
                            .set("Authorization", `Bearer ${authToken}`)
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body.journal).to.be.a("array");
                        expect(res.body.journal.length).to.equal(0);
                    });
            });
        });

        describe("POST method", function() {
            it("Should create a journal", function() {
                let userId;
                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        userId = user._id;

                        return Crop.findOne( { userId } );
                    })
                    .then(function(crop) {
                        const journal = generateJournalData(userId, crop._id);

                        return chai.request(app)
                            .post("/api/journal")
                            .send(journal)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(201);
                        expect(res).to.be.json;
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.have.keys("id", "date", "scope", "text");
                    });
            });

            it("Should not create a journal without a JWT", function() {
                let userId;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        userId = user._id;

                        return Crop.findOne( { userId } );
                    })
                    .then(function(crop) {
                        const journal = generateJournalData(userId, crop._id);

                        return chai.request(app)
                            .post("/api/journal")
                            .send(journal)
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");
                    });
            });
        });

        describe("DELETE method", function() {
            it("Should delete a journal", function() {
                let journalId;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;

                        return Journal.findOne( { userId } )
                    })
                    .then(function(journal) {
                        journalId = journal._id;
                        return chai.request(app)
                            .delete(`/api/journal/${journalId}`)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(204);
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.be.empty;

                        return Journal.findById(journalId);
                    })
                    .then(function(journal) {
                        expect(journal).to.be.null;
                    });
            });

            it("Should not delete a journal without a JWT", function() {
                let journalId;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;

                        return Journal.findOne( { userId } )
                    })
                    .then(function(journal) {
                        journalId = journal._id;
                        return chai.request(app)
                            .delete(`/api/journal/${journalId}`);
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");

                        return Journal.findById(journalId);
                    })
                    .then(function(journal) {
                        expect(journal).to.not.be.null;
                    });
            });

            it("Should not delete another user's journal", function() {
                let journalId;

                return User.findOne( { username: { $ne: TEST_USER.username } } )
                    .then(function(user) {
                        const userId = user._id;

                        return Journal.findOne( { userId } )
                    })
                    .then(function(journal) {
                        journalId = journal._id;
                        return chai.request(app)
                            .delete(`/api/journal/${journalId}`)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(204);
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.be.empty;

                        return Journal.findById(journalId);
                    })
                    .then(function(journal) {
                        expect(journal).to.not.be.null;
                    });
            });
        });

        describe("PUT method", function() {
            it("Should edit a journal", function() {
                const updatedjournal = {
                    text: "Abacus"
                };
                let journalId;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;

                        return Journal.findOne( { userId } )
                    })
                    .then(function(journal) {
                        journalId = journal._id;
                        updatedjournal.id = journalId;

                        return chai.request(app)
                            .put(`/api/journal/${journalId}`)
                            .send(updatedjournal)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.be.empty;

                        return Journal.findById(journalId);
                    })
                    .then(function(_journal) {
                        const journal = _journal.serialize();
                        expect(journal).to.deep.include(updatedjournal);
                    });
            });

            it("Should not edit a journal without a JWT", function() {
                const updatedJournal = {
                    name: "Abacus",
                    planting_depth: 1.5
                };
                let origJournal;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;

                        return Journal.findOne( { userId } )
                    })
                    .then(function(journal) {
                        origJournal = journal;
                        updatedJournal.id = origJournal._id;

                        return chai.request(app)
                            .put(`/api/journal/${origJournal._id}`)
                            .send(updatedJournal);
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");

                        return Journal.findById(origJournal._id);
                    })
                    .then(function(_journal) {
                        expect(_journal).to.deep.equal(origJournal);
                    });
            });

            it("Should not edit another user's journal", function() {
                const updatedJournal = {
                    name: "Abacus",
                    planting_depth: 1.5
                };
                let origJournal;

                return User.findOne( { username: { $ne: TEST_USER.username } } )
                    .then(function(user) {
                        const userId = user._id;

                        return Journal.findOne( { userId } )
                    })
                    .then(function(journal) {
                        origJournal = journal;
                        updatedJournal.id = origJournal._id;

                        return chai.request(app)
                            .put(`/api/journal/${origJournal._id}`)
                            .send(updatedJournal)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.be.empty;

                        return Journal.findById(origJournal._id);
                    })
                    .then(function(journal) {
                        expect(journal).to.deep.equal(origJournal);
                    });
            });
        });
    });
});