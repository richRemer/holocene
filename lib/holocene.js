var fs = require("fs.extra"),
    path = require("path"),
    crypto = require("crypto");

/**
 * @class
 * Holocene database server.
 * @param {object} [opts]
 */
function Holocene(opts) {
    opts = opts || {};
    this.path = opts.path || "/tmp";
}

/**
 * Generate a random key.
 * @return {string}
 */
Holocene.keygen = function() {
    return crypto.randomBytes(16).toString("hex");
};

/**
 * Create a new database.  If no name is provided, a random name will be
 * used.  The callback gets two arguments (err, db).
 * @param {string} [name]
 * @param {function} done
 */
Holocene.prototype.createDb = function(name, done) {
    if (typeof name === "function") done = name, name = Holocene.keygen();

    var Database = require("./database"),
        dbPath = path.join(this.path, name),
        $this = this;
        
    fs.mkdir(dbPath, 0770, function(err) {
        if (err) return done(err);
        
        fs.chmod(dbPath, 02770, function(err) {
            done(null, new Database($this, name, dbPath));
        });
    });
};

/**
 * Open an existing database.  The callback gets two arguments (err, db).
 * @param {string} name
 */
Holocene.prototype.openDb = function(name, done) {
    var Database = require("./database"),
        dbPath = path.join(this.path, name),
        db = new Database(this, name, dbPath);
    
    db.open(function(err) {
        if (err) done(err);
        else done(null, db);
    });
};

/**
 * Drop a database.  The callback gets any error as its argument.
 * @param {string} name
 * @param {function} done
 */
Holocene.prototype.dropDb = function(name, done) {
    this.openDb(name, function(err, db) {
        if (err) done(err);
        else db.drop(done);
    });
};

/** module exports */
module.exports = Holocene;
