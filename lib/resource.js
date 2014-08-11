var path = require("path"),
    fs = require("fs.extra");

/**
 * @class
 * Holocene database resource.
 */
function Resource(db, name, resPath) {
    var locked = false;

    // expose read-only properties
    Object.defineProperty(this, "db", {
        enumerable: true,
        get: function() {return db;}
    });
    Object.defineProperty(this, "name", {
        enumerable: true,
        get: function() {return name;}
    });
    Object.defineProperty(this, "path", {
        enumerable: true,
        get: function() {return resPath;}
    });
    Object.defineProperty(this, "locked", {
        get: function() {return locked;}
    });
    
    /**
     * Lock the resource.  If a problem occurs, an error will be passed to
     * the callback.
     * @param {function} done
     */
    this.lock = function(done) {
        var lockPath = path.join(this.path, "lock");
        fs.symlink(".", lockPath, function(err) {
            if (err) return done(err);
            locked = true;
            done();
        });
    };
    
    /**
     * Unlock the resource.  If a problem occurs, an error will be passed to
     * the callback.
     * @param {function} done
     */
    this.unlock = function(done) {
        var lockPath = path.join(this.path, "lock");
        fs.unlink(lockPath, function(err) {
            if (err) throw err;
            locked = false;
            done();
        });
    };
    
    /**
     * Drop the resource.  If a problem occurs, an error will be passed to
     * the callback.
     * @param {function} done
     */
    this.drop = function(done) {
        // ensure this instance has the resource lock
        if (!this.locked) return done(new Error("resource not locked"));
        
        // release the lock for this instance
        locked = false;
        
        // drop the resource safely
        fs.rmrf(this.path, done);
    };
}

/** module exports */
module.exports = Resource;
