# Intro to databases and MongoDB

Credit where credit is due: the following lecture notes and example app were heavily based on [Khurram Virani's original notes](https://github.com/kvirani/express_mongo_todo_example) (thanks!).

The code discussed in class can be found in [`/code`](code).

## Topics covered (Summary)

* Intro to databases (Why)
* Intro to MongoDB
  * What is document storage?
  * How it uses JavaScript
  * The data model
    * Server -> Databases -> Collections -> Docs
  * The mongo Shell
    * Using it for debugging by inspecting the data
  * Demo basic functions (subset of CRUD)
* MongoDB from Node
  * How it relates to what we see in the shell
  * client vs server model with mongo in the picture


## Introduction

### Without actual databases

Currently in our project we have a "global" object in memory to track our shortened URL records:

```javascript
var urlDatabase = {
  "abc": "http://",
  "def": "http://"
}
```

The biggest problem is that this data goes away when we restart our node process (something that we must assume can happen any time for many reasons).

This happens because the data is being stored IN MEMORY and not ON DISK.

Memory is (meant to be) volatile storage whereas disk (file system) is long term storage.

We need to serialize and persist this object to  disk ("file system").

Either binary or text files are often used to store long term info.

Ideally our app will persist this object on disk and then read/write from that file.

### Flat text files

Flat text files (like CSV files) are the simplest but least powerful approach.

CSV stands for Comma separated values. It's a text file that has each record on one line separated by commas. There is no hierarchy to the file, hence "flat".

```
"abc", "http://"
"def", "http://"
```

### JSON (or similar) format files

Another example of a textual file that can store our data is a `json` file. JSON is another approach to serializing our data (for purposes of storage or transmission), and isn't totally flat (has nested objects, etc) which is great... but doesn't solve other more critical challenges.

Example of a JSON file:

```javascript
{
  "abc": "http://",
  "def": "http://"
}
```

You can find an example of an app that persists data to disk inside [`/persistence`](persistence). It's pretty much TinyApp without the web interface.

#### Challenges

Challenges with storing and managing our own text (CSV, JSON, etc) files for user data:

- Too much work on the app developer to work with this file (Open, Read, Write, etc)
- No way to easily search data by criteria
- Concurrency: multiple apps/processes can't read/write the file without causing inconsistency. Web apps can have many users CRUDing data and so we need to be able to read/write concurrently without problems.

For reasons above, text files are not used for application data BUT are used for static / non-user data like configuration settings:

Examples:

- NPM has `package.json`
- Git has `.gitignore` and others
- For app settings we used a simple `.env` key-value file


### Enter MongoDB (or other alternatives)

MongoDB is a document storage database. It has blown up big time in the last in the Node community, becoming a popular option for many projects.

MongoDB is open source (like everything we use/teach here). It is a non-relational db and is more of an object store (objects are referred to as "documents").

The major components of Mongo are:

```
- Databases (Most apps usually have one)
  - Collections (think of it like an Array)
    - Documents (JS Objects with _id's)
```

A Mongo server has many Databases which have many collections within and these collections within have many documents.

We can store whatever we want in the documents. Here is an visual example of a todo app's mongo database, so we can see how we would use these different entities / layers to structure the data for an app like the one we are building this week:

```
- Database: todo_app_db
  - Collection: todos
    - Doc: {desc: '...', completed: true}
    - Doc: {desc: '...', completed: false}
    - Doc: {desc: '...', completed: true}
  - Collection: users
    - Doc: {username: 'kvirani', ...}
    - Doc: {username: 'rafd', ...}
    - Doc: {username: 'pjama', ...}
```

## Demo 1: Mongo shell / REPL

We went over the mongo shell. Here are the commands we ran:

```javascript
show dbs
use todos_app
db
db.todos
db.todos.insert({ desc: 'Example TODO', completed: false })
db.todos.insert({ desc: 'Example Completed TODO', completed: true })
db.todos.find()
db.todos.find({completed: true})
db.todos.find({id: ObjectId("unique-mongo-id-here")})
```

We talked about how:

- Mongo is very JS-centric. Most of the code we see in the shell above is JS code!
- Mongo has "transactional" functions on collections to allow us to CRUD (Create Read Update Delete) documents within those collections.
- There are many other functions that you can look up in the documentation (how to search, insert multiple, batch delete, batch update, etc, etc)
- Collections can just be viewed as properties of the `db` object (`db.todos` can also be written as `db.collection('todos')`) therefore their name is what uniquely identify them.
- Mongo assigns an `_id` key/property to any document so we can uniquely identify it. More on this below.

## Primary Key

The `_id` is a "Primary Key" that uniquely identifies each object (document) within our collections.

It is automatically added to any object we insert and we can use it to find single object from a collection (see example above).

## Demo 2: Simple Todo List (Express app w/ Mongo)

We walked through the Todo Node/Express app which only has index, new/create and delete functionality. It uses Mongo as its data store and we went through the `app.js` file in detail to see how it does it.

Using MongoDB from NodeJS is slightly different, due to the nature of Javascript (callbacks and whatnot). You can find basic guide to CRUD operations on Mongo on the link below:

https://docs.mongodb.com/manual/crud/

**NOTE:** Most `find()` examples will return an object that needs to be converted to an array first, so the prevalent pattern in that case will be:
```
db.collection('my_collection').find(filters).toArray((err, results) => {...})
```

On the other hand `findOne()` is more straightforward, since it only returns one result or `null`:
```
db.collection('my_collection').findOne(filters, (err, result) => {...})
```

### The `mongoInstance` (db connection)

We see that our node app connects to a specific MongoDB database when it starts and there is a single connection passed into all the other helper functions like `insert`, `remove` and `getAll`. When we connect, we get the `mongoInstance` object and assign it to a global variable `db` so we can talk to the database:

```
// Create a global variable to store the database instance
let db

// Connect to MongoDB
MongoClient.connect(
  MONGODB_URI,
  (err, mongoInstance) => {
    if (err) {
      console.log("Couldn't connect to MongoDB:", err)
      process.exit(1)
    }
    console.log(`Successfully connected to DB: ${MONGODB_URI}`)
    db = mongoInstance
  }
)
```

There are other (better) ways to do this, of course. The most popular one is to create a module that receives `db` and abstracts all database operations with functions. This will be explored on later lectures.

### Client vs Server

So far, we're used to seeing our node / express app as a Server when it comes to HTTP requests from the browser (Client).

In terms of data access and Mongo, the node/express app is actually the Client and Mongo is the Server.

```
Browser      (Client) <> Node/Express (Server)
Node/Express (Client) <> MongoDB (Server)
```

So together we have:

```
Browser      (Client) <> Node/Express (< Server / Client >) <> MongoDB (Server)
```

Here's a simplified diagram on how a server setup with Express.js and MongoDB might look like:

![Server-side diagram](https://fzero.github.io/lhl-lectures/assets/client-server-arch-with-database.svg)

## BONUS: Promises

The MongoDB npm package uses promises extensively, so it's a good idea to have a basic understanding of that.

TL;DR: instead of doing this...

```js
asyncCall("I'ma do some stuff that takes time!", (error, result) => {
  if (error) {
    console.error('Stuff exploded!')
    return
  }
  console.log(`The result is: ${result}`)
})
```

...you can do this:

```js
asyncCallWithPromises("I'ma do some stuff that takes time!")
.then((result) => console.log(`The result is: ${result}`))
.catch((error) => console.error('Stuff exploded!'))
```

Take a look at these [W4D4 lecture notes](../w4d4-promises-try-catch) for more details and examples.
