var path = require("path"),
    fs = require("fs.extra"),
    streamConcat = require("concat-stream");
    Readable = require("stream").Readable,
    Holocene = require("./holocene");

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

/**
 * Commit a change to the resource log.  This revision will supplant all
 * specified revisions and their ancestors.  If there are no conflicts, the
 * head will be pointed at the new revision.  If there is currently no default
 * type for the resource, the type will be set to the type for this change
 * (even if there is no type set).  Errors will be passed to the callback.
 * @param {string} rev
 * @param {string} [type]
 * @param {array} [supplants]
 * @param {function} done
 */
Resource.prototype.commit = function(rev, type, supplants, done) {
    // ensure this instance has the resource lock
    if (!this.locked) return done(new Error("resource not locked"));

    // process optional arguments
    if (typeof type === "array") done = supplants, supplants = type, type = null;
    else if (typeof type === "function") done = type, supplants = [], type = null;
    if (typeof supplants === "function") done = supplants, supplants = [];

    this.changelog(function(err, changes) {
        
    });
};

/**
 * Write object data to the resource and pass the resulting revision to the callback.
 * @param {object} obj
 * @param {function} done
 */
Resource.prototype.writeObject = function(obj, done) {
    var $this = this,
        content = JSON.stringify(obj);

    this.writeContent("application/json", content, function(err, rev) {
        if (err) done(err);
        else $this.lock(function(err) {
            if (err) done(err);
            else {
                $this.commit(rev, "application/json", function(err) {
                    if (err) done(err);
                    else done(null, rev);
                });
            }
        });
    });
};

/**
 * Write content to the resource and pass the resulting revision to the callback.
 * @param {string|object|Readable} content
 * @param {function} done
 */
Resource.prototype.writeContent = function(content, done) {
    var $this = this,
        rev = Holocene.keygen(),
        revPath = path.join(this.path, rev);

    // serialize non-Readable objects
    if (typeof content === "object" && !(content instanceof Readable))
        content = JSON.stringify(content);

    // handle Readable stream content
    if (content instanceof Readable) {
        content.pipe(fs.createWriteStream(revPath, {mode: 0660}));
        content.on("error", done);
        content.on("end", function() {
            done(null, rev);
        });
    }

    // handle string content
    else if (typeof content === "string") {
        fs.writeFile(revPath, content, {mode: 0660}, function(err) {
            if (err) done(err);
            else done(null, rev);
        });
    }

    // anything else is a problem
    else done(new Error("bad arg; expected string or stream.Readable"));
);

/**
 * Read object data from the resource and pass it the callback.
 * @param {function} done
 */
Resource.prototype.readObject = function(done) {
    this.readContent("application/json", function(err, type, stream) {
        if (err) return done(err);

        // dealing with JSON; parse it into an object
        stream.on("error", function(err) {
            done(err);
        }.pipe(streamConcat(function(data) {
            done(null, type, JSON.parse(data));
        }));
    });
};

/**
 * Create a stream.Readable for selected resource content and pass the type and
 * content to the callback.
 * @param {string} [type]
 * @param {function} done
 */
Resource.prototype.readContent = function(type, done) {
    if (typeof type === "function") done = type, type = null;
    
    var contentPath = path.join(this.path, type || "default");

    fs.open(contentPath, "r", function(err, fd) {
        if (err) done(err);
        done(null, type, fs.createReadStream(null, {fd: fd}));
    });
};

/** module exports */
module.exports = Resource;
