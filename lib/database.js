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

/**
 * Create a new resource in this database.  The callback gets two arguments
 * (err, res).
 * @param {string} [name]
 * @param {function} done
 */
Database.prototype.createRes = function(name, done) {
    if (typeof name === "function") done = name, name = Holocene.keygen();
    
    var resPath = path.join(this.path, name),
        $this = this;
        
    fs.mkdir(resPath, 0770, function(err) {
        if (err) return done(err);
        
        fs.chmod(resPath, 02770, function(err) {
            done(null, new Resource($this, name, resPath));
        });
    });
};

/**
 * Lock an existing resource in this database.  The callback gets two
 * arguments (err, res).
 * @param {string} name
 * @param {function} done
 */
Database.prototype.lockRes = function(name, done) {
    var resPath = path.join(this.path, name),
        res = new Resource(this, name, resPath);
    
    res.lock(function(err) {
        if (err) done(err);
        else done(null, res);
    });
};

/**
 * Drop a resource from this database.  If a problem occurs, an error will
 * be passed to the callback.
 * @param {string} name
 * @param {function} done
 */
Database.prototype.dropRes = function(name, done) {
    this.lockRes(name, function(err, res) {
        if (err) done(err);
        else res.drop(done);
    });
};

/** module exports */
module.exports = Database;
