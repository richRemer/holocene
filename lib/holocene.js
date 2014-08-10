var fs = require("fs"),
    path = require("path"),
    crypto = require("crypto");

/**
 * @class
 * Holocene database.
 * @param {object} [opts]
 */
function Holocene(opts) {
    opts = opts || {};
    this.datadir = opts.datadir;
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
 * used.  The callback gets two arguments (err, name).
 * @param {function} done
 */
Holocene.prototype.createDb = function(name, done) {
    if (typeof name === "function") done = name, name = Holocene.keygen();
    var datadir = this.datadir;

    this.verifyDatadir(function(err) {
        if (err) return done(err, name);
        
        var dbPath = path.join(datadir, name);
        
        fs.mkdir(dbPath, 0770, function(err) {
            if (err) return done(err, name);
            
            fs.chmod(dbPath, 02770, function(err) {
                done(null, name);
            });
        });
    });
};

/**
 * Verify the datadir.  If there's a problem, the callback gets an error
 * as its argument.
 * @param {function} done
 */
Holocene.prototype.verifyDatadir = function(done) {
    var datadir = this.datadir;

    // ensure datadir is set
    if (!datadir) {
        return done(new Error("datadir not set"));
    }

    // ensure datadir exists
    fs.stat(datadir, function(err, stats) {
        if (err) return done(err);
        if (!stats.isDirectory())
            return done(new Error("datadir not a directory"));
        
        done();
    });
};

/** module exports */
module.exports = Holocene;
