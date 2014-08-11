var path = require("path"),
    fs = require("fs.extra"),
    Holocene = require("./holocene"),
    Resource = require("./resource");

/**
 * @class
 * Holocene database.
 */
function Database(holo, name, dbPath) {
    var locked = false;

    // expose read-only properties
    Object.defineProperty(this, "holo", {
        enumerable: true,
        get: function() {return holo;}
    });
    Object.defineProperty(this, "name", {
        enumerable: true,
        get: function() {return name;}
    });
    Object.defineProperty(this, "path", {
        enumerable: true,
        get: function() {return dbPath;}
    });
    Object.defineProperty(this, "locked", {
        get: function() {return locked;}
    });

    /**
     * Open the database.  If a problem occurs, an error will be passed to
     * the callback.
     * @param {function} done
     */
    this.open = function(done) {
        var lockPath = path.join(this.path, "lock");
        fs.symlink(".", lockPath, function(err) {
            if (err) return done(err);
            locked = true;
            done();
        });
    };
    
    /**
     * Close the database.  If a problem occurs, an error will be passed to
     * the callback.
     * @param {function} done
     */
    this.close = function(done) {
        var lockPath = path.join(this.path, "lock");
        fs.unlink(lockPath, function(err) {
            if (err) throw err;
            locked = false;
            done();
        });
    };
    
    /**
     * Drop the database.  If a problem occurs, an error will be passed to
     * the callback.
     * @param {function} done
     */
    this.drop = function(done) {
        // ensure this instance has the DB lock
        if (!this.locked) return done(new Error("db not open"));
        
        // release the lock for this instance
        locked = false;
        
        // drop the DB safely
        fs.rmrf(this.path, done);
    };
}

/** module exports */
module.exports = Database;
