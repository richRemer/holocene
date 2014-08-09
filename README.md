Holocene Graph Database
=======================
Holocene is a JSON document oriented graph database.  It has the following
goals:

 * it should be easy to embed holocene into other projects
 * holocene should be RESTful; features should look first to the
   HTTP standard as a guide 

Working with Holocene
---------------------

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

