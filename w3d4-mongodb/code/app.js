const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

const app = express()
const PORT = process.env.PORT || 8080

// MongoDB setup
const Mongo = require('mongodb')
const MongoClient = Mongo.MongoClient
const MONGODB_URI = 'mongodb://127.0.0.1:27017/todo_app'

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride('_method'))

// Create a global variable to store the database instance
let db

// Connect to MongoDB
MongoClient.connect(
  MONGODB_URI,
  (err, mongoInstance) => {
    if (err) throw err
    console.log(`Successfully connected to DB: ${MONGODB_URI}`)
    db = mongoInstance
  }
)

// EXPRESS ROUTES //

// Just so home page doesn't 404 (annoying!)
app.get('/', (req, res) => {
  res.redirect('/todos')
})

// Fetch all todos from Mongo, filtering by the search field if present
app.get('/todos', (req, res) => {
  const query = req.query.query
  const dbQuery = query ? { desc: { $regex: `.*${query}.*` } } : {}
  // We're using promises here
  db.collection('todos')
    .find(dbQuery)
    .toArray()
    .then(results => res.render('todos/index', { todos: results }))
    .catch(error => res.send(`Something exploded! Error: ${error}`))
})

// Form to create new todo
app.get('/todos/new', (req, res) => {
  res.render('todos/new')
})

// Create new todo in Mongo
app.post('/todos', (req, res) => {
  const todo = {
    desc: req.body.desc,
    completed: false,
    priority: Number(req.body.priority)
  } // mongo doc
  db.collection('todos').insertOne(todo, (err, result) => {
    if (err) {
      res.send('Something exploded on POST /todos!')
      return
    }
    res.redirect('/todos')
  })
})

// Edit form
app.get('/todos/:id/edit', (req, res) => {
  const id = req.params.id
  let filter = { _id: Mongo.ObjectId(id) }
  db.collection('todos').findOne(filter, (err, result) => {
    res.render('todos/edit', { todo: result })
  })
})

// Update a todo
app.put('/todos/:id', (req, res) => {
  const id = req.params.id
  let filter = { _id: Mongo.ObjectId(id) }
  const todo = {
    desc: req.body.desc,
    priority: Number(req.body.priority)
  } // mongo doc
  db.collection('todos').updateOne(filter, todo, (err, result) => {
    if (err) {
      res.send('Something exploded on PUT /todos!')
      return
    }
    res.redirect('/todos')
  })
})

// Delete by (mongo) ID
app.delete('/todos/:id', (req, res) => {
  const id = req.params.id
  let filter = { _id: Mongo.ObjectId(id) }
  db.collection('todos').deleteOne(filter, (err, result) => {
    if (err) {
      res.send('Something exploded on DELETE /todos!')
      return
    }
    res.redirect('/todos')
  })
})

// END OF ROUTES //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})

// The code below here is to make sure that we close the conncetion to mongo when this node process terminates
function gracefulShutdown() {
  console.log('\nShutting down gracefully...')
  try {
    db.close()
  } catch (err) {
    throw err
  } finally {
    console.log("I'll be back.")
    process.exit()
  }
}

process.on('SIGTERM', gracefulShutdown) // listen for TERM signal .e.g. kill
process.on('SIGINT', gracefulShutdown) // listen for INT signal e.g. Ctrl-C
