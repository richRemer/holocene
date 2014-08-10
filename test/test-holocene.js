var holocene = require(".."),
    Holocene = require("../lib/holocene"),
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
    var db = new Holocene(),
        dbNames = [];
    
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
            db.datadir = "/tmp";
            db.createDb(Holocene.keygen(), function(err, name) {
                dbNames.push(name);
                done(err);
            });
        });
    
        it("should pass created DB name to the callback", function(done) {
            var dbName = Holocene.keygen();
            db.datadir = "/tmp";
            db.createDb(dbName, function(err, name) {
                dbNames.push(name);
                expect(name).to.equal(dbName);
                done(err);
            });
        });
    
        it("should generate random DB name as needed", function(done) {
            db.datadir = "/tmp";
            db.createDb(function(err, name) {
                dbNames.push(name);
                expect(name).to.be.a("string");
                done(err);
            });
        });
    
        it("should error if datadir is not set", function(done) {
            db.datadir = null;
            db.createDb(function(err) {
                expect(err).to.be.an(Error);
                done();
            });
        });
        
        it("should error if datadir does not exist", function(done) {
            db.datadir = "non-existent-test-directory/asdfsakjfdh";
            db.createDb(function(err) {
                expect(err).to.be.an(Error);
                done();
            });
        });
        
        it("should error if DB already exists", function(done) {
            db.createDb(dbNames[0], function(err, name) {
                expect(err).to.be.an(Error);
                done();
            });
        });
    });
    
    describe(".dropDb", function() {
        it("should delete an existing DB", function(done) {
            var dbName = dbNames[0];
            db.datadir = "/tmp";
            
            db.dropDb(dbName, function(err) {
                if (err) return done(err);

                // recreate DB to ensure it was deleted
                db.createDb(dbName, function(err) {
                    if (err) return done(err);
                    done();
                });
            });
        });
        
        it("should not error if DB does not exist", function(done) {
            db.dropDb(Holocene.keygen(), done);
        });
    });
    
    after(function(done) {
        var wait = 0;
        dbNames.forEach(function(dbName) {
            wait++;
            console.log(dbName);
            db.dropDb(dbName, function() {
                if (--wait === 0) {
                    done();
                }
            });
        });        
    });
});
