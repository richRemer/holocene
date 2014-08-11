var holocene = require(".."),
    Holocene = require("../lib/holocene"),
    Database = require("../lib/database"),
    expect = require("expect.js");

describe("holocene", function() {
    it("should export a function", function() {
        expect(holocene).to.be.a("function");
    });
    
    describe("exported function", function() {
        it("should create an Express.js app object", function() {
            var app = holocene();
            expect(app.use).to.be.a("function");
            expect(app.handle).to.be.a("function");
            expect(app.listen).to.be.a("function");
            expect(app.route).to.be.a("function");
        });
    });
});

describe("Holocene", function() {
    var holo = new Holocene(),
        testdb, e;
        
    before(function(done) {
        holo.createDb("_holocene_test_db_", function(err, db) {
            testdb = db;
            e = err;
            done();
        });
    });
    
    describe(".keygen", function() {
        it("should generate a random string of hex characters", function() {
            var key1 = Holocene.keygen(),
                key2 = Holocene.keygen();
            
            expect(key1).to.be.a("string");
            expect(key1.match(/^[0-9a-f]+$/)).to.be.ok();
            expect(key1).to.not.equal(key2);
        });
    });
    
    describe(".createDb", function() {
        it("should not generate an error", function(done) {
            // e will get set in the test case "before" if there is
            // an error
            done(e);
        });
    
        it("should pass Database argument to the callback", function() {
            // testdb will get set in the test case "before"
            expect(testdb).to.be.a(Database);
        });
    
        it("should pass Error if DB already exists", function(done) {
            holo.createDb("_holocene_test_db_", function(err, db) {
                expect(err).to.be.an(Error);
                done();
            });
        });
    });
    
    describe(".dropDb", function() {
        it("should delete an existing DB", function(done) {
            holo.dropDb("_holocene_test_db_", function(err) {
                if (err) return done(err);
                holo.createDb("_holocene_test_db_", done);
            });
        });
        
        it("should not error if DB does not exist", function(done) {
            holo.dropDb(Holocene.keygen(), done);
        });
    });
    
    describe(".createDb without DB name", function() {
        it("should generate random name", function(done) {
            holo.createDb(function(err, db) {
                expect(db.name.match(/^[0-9a-f]+$/)).to.be.ok();
                if (!err) holo.dropDb(db.name);
                done(err);
            });
        });
    });
    
    describe(".openDb", function() {
        it("should open existing DB and pass DB object", function(done) {
            holo.openDb("_holocene_test_db_", function(err, db) {
                expect(db).to.be.a(Database);
                done(err);
            });
        });
    });
    
    after(function(done) {
        holo.dropDb("_holocene_test_db_", done);
    });
});
