Holocene Graph Database
=======================
Holocene is a JSON document oriented graph database.  It has the following
goals:

 * it should be easy to embed holocene into other projects
 * holocene should be RESTful; features should look first to the
   HTTP standard as a guide 

Setup Holocene Metadata
-----------------------
By default, holocene supports JSON and HAL data and a small set of predefined
relationships.  Each database has its own metadata store which can be used to
configure the database.

### Define a relationship
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

Working with the Holocene REST API
----------------------------------

### Creating a database
Create a new database by making an HTTP PUT request to the database URI.

```
PUT /mydb HTTP/1.0
```

```
201 Created
```

### Adding a document to the database
Create a document by making an HTTP PUT request to a URI subordinate to the
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
