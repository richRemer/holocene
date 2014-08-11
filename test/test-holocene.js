var holocene = require(".."),
    Holocene = require("../lib/holocene"),
    Database = require("../lib/database"),
    Resource = require("../lib/resource"),
    expect = require("expect.js"),
    path = require("path"),
    fs = require("fs.extra");

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

describe("Resource", function() {
    var holo = new Holocene(),
        dbName = Holocene.keygen(),
        dbPath = path.join(holo.datadir, dbName),
        db = new Database(holo, dbName, dbPath),
        resName = Holocene.keygen(),
        resPath = path.join(dbPath, resName),
        res = new Resource(db, resName, resPath);
    
    before(function(done) {
        fs.mkdirp(resPath, done);
    });
    
    it("should be initialized in unlocked state", function() {
        expect(res.locked).to.not.be.ok();
    });
    
    describe(".lock", function() {
        it("should lock the resource", function(done) {
            res.lock(function(err) {
                expect(res.locked).to.be.ok();
                done(err);
            });
        });
        
        it("should emit error if already locked", function(done) {
            res.lock(function(err) {
                expect(err).to.be.an(Error);
                done();
            });
        });
    });
    
    describe(".unlock", function() {
        it("should unlock the resource", function(done) {
            res.unlock(function(err) {
                expect(res.locked).to.not.be.ok();
                done(err);
            });
        });
    });

    after(function(done) {
        fs.rmrf(dbPath, done);
    });
});

describe("Database", function() {
    var holo = new Holocene(),
        dbName = Holocene.keygen(),
        dbPath = path.join(holo.datadir, dbName);
        db = new Database(holo, dbName, dbPath),
    
    before(function(done) {
        fs.mkdir(dbPath, done);
    });
    
    it("should be initialized in unlocked state", function() {
        expect(db.locked).to.not.be.ok();
    });
    
    describe(".open", function() {
        it("should lock the database", function(done) {
            db.open(function(err) {
                expect(db.locked).to.be.ok();
                done(err);
            });
        });
        
        it("should emit error if already locked", function(done) {
            db.open(function(err) {
                expect(err).to.be.an(Error);
                done();
            });
        });
    });
    
    describe(".close", function() {
        it("should unlock the database", function(done) {
            db.close(function(err) {
                expect(db.locked).to.not.be.ok();
                done(err);
            });
        });
    });
    
    describe(".createRes", function() {
        var resName = Holocene.keygen();

        it("should create and emit a new resource", function(done) {
            db.createRes(resName, function(err, res) {
                expect(res).to.be.a(Resource);
                done(err);
            });
        });
        
        it("should emit error if resource already exists", function(done) {
            db.createRes(resName, function(err, res) {
                expect(err).to.be.an(Error);
                done();
            });
        });
    });
    
    describe(".createRes without name", function() {
        it("should generate random name", function(done) {
            db.createRes(function(err, res) {
                expect(res.name.match(/^[0-9a-f]+$/)).to.be.ok();
                done(err);
            });
        });
    });
    
    describe(".dropRes", function() {
        it("should remove resource from DB", function(done) {
            db.createRes(function(err, res) {
                if (err) done(err);
                else db.dropRes(res.name, function(err) {
                    if (err) done(err);
                    else db.createRes(res.name, done);
                });
            });
        });
    });

    describe(".lockRes", function() {
        var resName;

        it("should lock and emit existing resource", function(done) {
            db.createRes(function(err, res) {
                if (err) done(err);
                else db.lockRes(resName = res.name, done);
            });
        });

        it("should emit error if already locked", function(done) {
            db.lockRes(resName, function(err) {
                expect(err).to.be.an(Error);
                done();
            });
        });
    });

    after(function(done) {
        fs.rmrf(dbPath, done);
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
    
        it("should emit Database result", function() {
            // testdb will get set in the test case "before"
            expect(testdb).to.be.a(Database);
        });
    
        it("should emit Error if DB already exists", function(done) {
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
        
        it("should error if DB does not exist", function(done) {
            holo.dropDb(Holocene.keygen(), function(err) {
                expect(err).to.be.an(Error);
                done();
            });
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
        it("should open existing DB and emit DB result", function(done) {
            holo.openDb("_holocene_test_db_", function(err, db) {
                expect(db).to.be.a(Database);
                done(err);
            });
        });
    });

    after(function(done) {
        testdb.close(function(err) {
            if (err) throw err;
            else holo.dropDb("_holocene_test_db_", done);
        });
    });
});

