var fs = require("fs"),
    path = require("path"),
    crypto = require("crypto");

/**
 * @class
 * Holocene database
 */
function Holocene() {

    this.datadir = null;

}

/**
 * Create a new database.
 * @param {function} done
 */
Holocene.prototype.createDb = function(done) {
    var datadir = this.datadir;

    // ensure datadir is set
    if (!datadir) return done(new Error("datadir not set"));
    
    // ensure datadir exists
    if (fs.stat(datadir, function(err, stats) {
        if (err) return done(err);
        if (!stats.isDirectory()) done(new Error("datadir not a directory"));
        
        var dbName = crypto.randomBytes(16).toString("hex"),
            dbPath = path.join(datadir, dbName);
        
        fs.mkdir(dbPath, 0770, function(err) {
            if (err) done(err);
            fs.chmod(dbPath, 02770, function(err) {
                done(null, dbName);            
            });
        });
    }));
}

/** module exports */
module.exports = Holocene;
