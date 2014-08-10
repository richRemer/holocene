var fs = require("fs.extra"),
    path = require("path"),
    crypto = require("crypto");

/**
 * @class
 * Holocene database.
 * @param {object} [opts]
 */
function Holocene(opts) {
    opts = opts || {};
    this.datadir = opts.datadir || "/tmp";
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

    if (!this.datadir) return done(new Error("datadir not set"))
    var dbPath = path.join(this.datadir, name);
        
    fs.mkdir(dbPath, 0770, function(err) {
        if (err) return done(err, name);
        
        fs.chmod(dbPath, 02770, function(err) {
            done(null, name);
        });
    });
};

/**
 * Drop a database.  The callback gets any error as its argument.
 * @param {string} name
 * @param {function} done
 */
Holocene.prototype.dropDb = function(name, done) {
    var dbPath = path.join(this.datadir, name);

    fs.rmrf(dbPath, function(err) {
        if (err) return done(err);
        done();
    });
};

/** module exports */
module.exports = Holocene;
