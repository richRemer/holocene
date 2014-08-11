Holocene database
=================
Holocene is a JSON oriented document/graph database.  It has the following
goals:

 * it should be easy to embed holocene into other projects
 * holocene should be RESTful; features should look first to the
   HTTP standard as a guide for scalability and API 

API Flavors
-----------
There are two API flavors.  The *REST* interface is designed for database servers,
interoperability, and general use.  The *Javascript* interface is designed for
embedding into Javascript apps.

### Javascript API
To begin using the Javascript API, import the `Holocene` class from the holocene
package and create an instance.

```
var Holocene = require("holocene").Holocene(),
    holo = new Holocene();
```

  
#### Creating a new database
Use the `createDb` method of the `Holocene` object to create a new database.  Like
almost every method in the Holocene library, this method takes a callback as its
last parameter to receive any error or result.  In this case, the result is the
database object for the new database.

```
holo.createDb(function(err, db) {
    if (err) throw err;
    console.log("successfully created database named " + db.name);
});
```

The optional first argument to the `createDb` method - *`name`* - can be used to
set the database name.

```
var db;
holo.createDb("example", function(err, result) {
    if (err) throw err;
    db = result;
});
```

#### Locking and unlocking the database
Holocene makes use of advisory locks.  There is no system level locking, but you must
obtain a database lock before performing many kinds of changes to the database.  You
do **NOT** need to lock the database to update an existing resource, but you *DO* need
to lock the database to create a new resource or delete an existing one.

```
// boilerplate for executing updates inside a lock
db.lock(function(err) {
    if (err) throw err;
    
    // ...perform updates;
    
    db.unlock(function(err) {
        if (err) throw err;
    });
});
```

#### Creating a new resource
The Holocene database is made up of linked resource.  Each resource may have zero or
more documents associated with it and a number of links relating the resource to
other resources in the database or to external resources referred to by absolute URL.
To create a new resource, use the `createRes` method of the `Database` object.

```
// this snippet should go inside something like the locking boilerplate above
db.createRes(function(err, res) {
    if (err) throw err;
    console.log("successfully created resource " + res.name);
});
```

#### Creating a new relationship
Before resources can be linked, relationships must be defined for the links.  To
define a new relationship, use the `createRel` method of the `Database` object.

```
// this must occur while the DB is locked
db.createRel("parent", {"cardinality": "single"}, function(err, rel) {
    if (err) throw err;
    console.log("configured 'parent' links");
});
```

### REST API
For accessing Holocene over a network or from languages other than Javascript,
the REST API can be used.

#### Creating a new database
Create a new database by making an HTTP PUT request to the database URI.

```
PUT /mydb HTTP/1.0
```

```
201 Created
```

##### Note on Locking when using the REST API
When using the REST API, locking is implicit.  There is no REST API for locking a
database, but the database will be locked during updating.  When the database cannot
be locked, the REST API will return a ```409 Conflict``` response.

#### Creating a new resource
Create a new resource by making an HTTP PUT request to a URI subordinate to the
database URI.

```
PUT /mydb/first_doc HTTP/1.0
Content-Type: application/json
Content-Length: 13

{"foo":"you"}
```

```
201 Created
```

#### Creating a new relationship
Holocene documents can be linked using relationships.  A relationship must be
defined for the database before a link can be created with that relationship.

```
POST /mydb!rels HTTP/1.0
Content-Type: application/json
Content-Length: 

{
    "rel": "parent",
    "rev": "child"
}
```


Miscellany
----------------------------------

### Retrieving a document from the database
Make a GET request to the document URI to retrieve a document from the database.

```
GET /mydb/first_doc HTTP/1.0
```

```
200 OK
Content-Type: application/json
Content-Length: 13

{"foo":"you"}
```

### Adding a document with a link to another document
When making a PUT request, links can be provided with the Link header.

```
PUT /mydb/second_doc HTTP/1.0
Content-Type: application/json
Content-Length: 7
Link: <first_doc>; rel=parent

{"a":1}
```

```
201 Created
```

### Retrieving a document with embedded links
Some clients may find it convenient to avoid HTTP headers.  For example, a
browser-based client may have to parse HTTP headers, but JSON can be parsed
directly by javascript.  Use the Accept header to retrieve a HAL document from
database in lieu of a JSON document.

```
GET /mydb/second_doc HTTP/1.0
Content-Type: application/hal+json
```

```
200 OK
Content-Type: application/hal+json
Content-Length: 54

{"_links":{"parent":{"href":"/mydb/first_doc"}},"a":1}
```

If no Accept header is set, the default behavior is to return the links in the
HTTP header.

```
GET /mydb/second_doc HTTP/1.0
```

```
200 OK
Content-Type: application/json
Content-Length: 7
Link: </mydb/first_doc>; rel=parent

{"a":1}
```

### Creating a document with embedded links
A HAL document may be used in lieu of a JSON document in order to embed the
links into the document and avoid using HTTP headers when creating a document.

```
PUT /mydb/docs HTTP/1.0
Content-Type: application/hal+json
Content-Length: 63

{"_links":{"item":[{"href":"first_doc"},{"href":"second_doc"}]}
```

```
201 Created
```

### Traversing the graph
Append link relationships to the URL to traverse the graph and return the
result.

```
GET /mydb/second_doc/parent HTTP/1.0
```

```
200 OK
Content-Type: application/json
Content-Length: 13
Link: </mydb/first_doc>; rel=canonical

{"foo":"you"}
```

### Retrieving multiple results when traversing the graph
If a graph traversal results in multiple documents, the response will be empty,
but the result URIs can be found in the Link header.

```
GET /mydb/docs HTTP/1.0
```

```
204 No Content
Link: </mydb/first_doc>; rel=item
Link: </mydb/second_doc>; rel=item
```

### Embedding result links into a document
As with documents, graph results can be returned as a HAL document to get links
embedded into the document.

```
GET /mydb/docs HTTP/1.0
Accept: application/hal+json
```

```
200 OK
Content-Type: application/hal+json
Content-Length: 76

{"_links":{"item":[{"href":"/mydb/first_doc"},{"href":"/mydb/second_doc"}]}}
```

### Embedding the full results into a document
To save round trips to the database, result documents can be returned as a list
of embedded documents.  This can be requested by appending the "embed-doc"
query parameter to the URL.  The response will be a HAL document.

```
GET /mydb/docs?embed-doc HTTP/1.0
```

```
200 OK
Content-Type: application/hal+json
Content-Length: 167

{"_embedded":{"item":[{"_links":{"self":{"href":"/mydb/first_doc"}},"foo":"you"},{"_links":{"self":{"href":"/mydb/second_doc"},"parent":{"href":"/mydb/first_doc"}}}]}}
```
