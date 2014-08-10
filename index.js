var Holocene = require("./lib/holocene"),
    express = require("express");

/**
 * Holocene constructor.
 */
function holocene() {
    var db = new Holocene(),
        app = express();
    
    /**
     * GET /mydb
     * Fetch some basic information about a database.
     */
    app.get("/:db", function(req, res) {
        
    });
        
    return app;
}

/** export the constructor */
module.exports = holocene;
