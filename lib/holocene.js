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

    // ensure datadir is set
    if (!datadir)
        return done(new Error("datadir not set"), name);
    
    // ensure datadir exists
    if (fs.stat(datadir, function(err, stats) {
        if (err)
            return done(err, name);
        
        if (!stats.isDirectory())
            return done(new Error("datadir not a directory"), name);
        
        var dbPath = path.join(datadir, name);
        
        fs.mkdir(dbPath, 0770, function(err) {
            if (err) {
            console.log("returning", name);
                return done(err, name);            
            }
            
            fs.chmod(dbPath, 02770, function(err) {
                done(null, name);
            });
        });
    }));
};

/** module exports */
module.exports = Holocene;
