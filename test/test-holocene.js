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
        dbName;
        
    describe(".createDb", function() {
        it("should generate DB and provide the db name", function(done) {
            db.datadir = "/tmp";
            db.createDb(function(err, name) {
                expect(name).to.be.a("string");
                dbName = name;
                done(err, name);
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
    });
});
