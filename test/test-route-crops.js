////////////////////////////
// Initialize
////////////////////////////
const chai     = require("chai");
const chaiHTTP = require("chai-http");
const mongoose = require("mongoose");
const faker    = require("faker");
const jwt      = require("jsonwebtoken");

const { app, runServer, closeServer } = require("../src/server");
const { User, Crop } = require("../src/models");
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

function tearDownDb() {
    return mongoose.connection.dropDatabase();
}

////////////////////////////
// Test suite
////////////////////////////
describe("Crops API", function() {
    const { username, password } = TEST_USER;
    const user = { username, password };
    let authToken;

    before(function() {
        console.log("running server");
        return runServer(TEST_DATABASE_URL);
    });
    
    beforeEach(function() {
        return User.hashPassword(TEST_USER.password)
            .then(password => {
                const { username, email } = TEST_USER;
                return User.create( { username, email, password } );
            })
            .then(user => {
                const { _id } = user;
                return seedCropData(_id);
            })
            .then(data => {
                return User.create({
                    username: faker.internet.userName(),
                    password: faker.internet.password(),
                    email: faker.internet.email()
                });
            })
            .then(user => {
                const { _id } = user;
                return seedCropData(_id);
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
    
    describe("'/crops' endpoint", function() {
        describe("GET method", function() {
            it("Should return all crops of a user", function() {
                let TEST_USER_count;
                
                return chai.request(app)
                            .get("/api/crops")
                            .set("Authorization", `Bearer ${authToken}`)
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body.crops).to.be.a("array");

                        res.body.crops.forEach(function(crop) {
                            expect(crop).to.have.keys("id", "name", "variety", "plant_date",
                                "germination_days", "harvest_days", "planting_depth", "row_spacing",
                                "seed_spacing");
                        });

                        TEST_USER_count = res.body.crops.length;
                        return Crop.count();
                    })
                    .then(function(count) {
                        expect(TEST_USER_count).to.be.lessThan(count);
                    });
            });
            
            it("Should return a particular crop of a user", function() {
                let userId, crop;
                return User.find( { username: TEST_USER.username } )
                    .then(function(_user) {
                        userId = _user[0]._id;

                        return Crop.findOne( { userId } );
                    })
                    .then(function(_crop) {
                        crop = _crop;

                        return chai.request(app)
                            .get(`/api/crops/${crop._id}`)
                            .set("Authorization", `Bearer ${authToken}`)
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body.crops).to.be.a("array");
                        expect(res.body.crops[0]).to.be.a("object");
                        expect(res.body.crops.length).to.equal(1);
                    });
            });

            it("Should not return a crop without a JWT", function() {
                let userId, crop;
                return User.find( { username: TEST_USER.username } )
                    .then(function(_user) {
                        userId = _user[0]._id;

                        return Crop.findOne( { userId } );
                    })
                    .then(function(_crop) {
                        crop = _crop;

                        return chai.request(app)
                            .get(`/api/crops/${crop._id}`)
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");
                    });
            });

            it("Should not return a crop of another user", function() {
                return User.find( { username: { $ne: TEST_USER.username } } )
                    .then(function(_user) {
                        const userId = _user[0]._id;

                        return Crop.findOne( { userId } );
                    })
                    .then(function(_crop) {
                        return chai.request(app)
                            .get(`/api/crops/${_crop._id}`)
                            .set("Authorization", `Bearer ${authToken}`)
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body.crops).to.be.a("array");
                        expect(res.body.crops.length).to.equal(0);
                    });
            });
        });

        describe("POST method", function() {
            it("Should create a crop", function() {
                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;
                        const crop = generateCropData(userId);

                        return chai.request(app)
                            .post("/api/crops")
                            .send(crop)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(201);
                        expect(res).to.be.json;
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.have.keys("id", "name", "variety",
                            "plant_date", "germination_days", "harvest_days",
                            "planting_depth", "row_spacing", "seed_spacing");
                    });
            });

            it("Should not create a crop without a JWT", function() {
                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;
                        const crop = generateCropData(userId);

                        return chai.request(app)
                            .post("/api/crops")
                            .send(crop)
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");
                    });
            });
        });

        describe("DELETE method", function() {
            it("Should delete a crop", function() {
                let cropId;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;

                        return Crop.findOne( { userId } )
                    })
                    .then(function(crop) {
                        cropId = crop._id;
                        return chai.request(app)
                            .delete(`/api/crops/${cropId}`)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(204);
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.be.empty;

                        return Crop.findById(cropId);
                    })
                    .then(function(crop) {
                        expect(crop).to.be.null;
                    });
            });

            it("Should not delete a crop without a JWT", function() {
                let cropId;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;

                        return Crop.findOne( { userId } )
                    })
                    .then(function(crop) {
                        cropId = crop._id;
                        return chai.request(app)
                            .delete(`/api/crops/${cropId}`);
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");

                        return Crop.findById(cropId);
                    })
                    .then(function(crop) {
                        expect(crop).to.not.be.null;
                    });
            });

            it("Should not delete another user's crop", function() {
                let cropId;

                return User.findOne( { username: { $ne: TEST_USER.username } } )
                    .then(function(user) {
                        const userId = user._id;

                        return Crop.findOne( { userId } )
                    })
                    .then(function(crop) {
                        cropId = crop._id;
                        return chai.request(app)
                            .delete(`/api/crops/${cropId}`)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(204);
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.be.empty;

                        return Crop.findById(cropId);
                    })
                    .then(function(crop) {
                        expect(crop).to.not.be.null;
                    });
            });
        });

        describe("PUT method", function() {
            it("Should edit a crop", function() {
                const updatedCrop = {
                    name: "Abacus",
                    planting_depth: 1.5
                };
                let cropId;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;

                        return Crop.findOne( { userId } )
                    })
                    .then(function(crop) {
                        cropId = crop._id;
                        updatedCrop.id = cropId;

                        return chai.request(app)
                            .put(`/api/crops/${cropId}`)
                            .send(updatedCrop)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.be.empty;

                        return Crop.findById(cropId);
                    })
                    .then(function(_crop) {
                        const crop = _crop.serialize();
                        expect(crop).to.deep.include(updatedCrop);
                    });
            });

            it("Should not edit a crop without a JWT", function() {
                const updatedCrop = {
                    name: "Abacus",
                    planting_depth: 1.5
                };
                let origCrop;

                return User.findOne( { username: TEST_USER.username } )
                    .then(function(user) {
                        const userId = user._id;

                        return Crop.findOne( { userId } )
                    })
                    .then(function(crop) {
                        origCrop = crop;
                        updatedCrop.id = origCrop._id;

                        return chai.request(app)
                            .put(`/api/crops/${origCrop._id}`)
                            .send(updatedCrop);
                    })
                    .catch(function(err) {
                        expect(err.response).to.have.status(401);
                        expect(err.response.text).to.equal("Unauthorized");

                        return Crop.findById(origCrop._id);
                    })
                    .then(function(_crop) {
                        expect(_crop).to.deep.equal(origCrop);
                    });
            });

            it("Should not edit another user's crop", function() {
                const updatedCrop = {
                    name: "Abacus",
                    planting_depth: 1.5
                };
                let origCrop;

                return User.findOne( { username: { $ne: TEST_USER.username } } )
                    .then(function(user) {
                        const userId = user._id;

                        return Crop.findOne( { userId } )
                    })
                    .then(function(crop) {
                        origCrop = crop;
                        updatedCrop.id = origCrop._id;

                        return chai.request(app)
                            .put(`/api/crops/${origCrop._id}`)
                            .send(updatedCrop)
                            .set("Authorization", `Bearer ${authToken}`);
                    })
                    .then(function(res) {
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.a("object");
                        expect(res.body).to.be.empty;

                        return Crop.findById(origCrop._id);
                    })
                    .then(function(crop) {
                        expect(crop).to.deep.equal(origCrop);
                    });
            });
        });
    });
});