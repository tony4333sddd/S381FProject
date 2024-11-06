const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');

const SECRETKEY = 'I want to pass COMPS381F';

app.use(session({
  name: 'loginSession',
  keys: [SECRETKEY]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://hkmudata:Ch070401x7@cluster0.0902v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const todoSchema = new mongoose.Schema({
  task: String,
  description: String,
  completed: Boolean
});
const ToDo = mongoose.model('ToDo', todoSchema);

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.status(200).render('login', {});
});

app.post('/login', (req, res) => {
  const users = [{ name: 'admin', password: '123' }];
  users.forEach((user) => {
    if (user.name === req.body.name && user.password === req.body.password) {
      req.session.authenticated = true;
      req.session.username = req.body.name;
    }
  });
  res.redirect('/loggedAdmin');
});

app.get('/loggedAdmin', (req, res) => {
  if (req.session.authenticated) {
    res.render('loggedAdmin', { name: req.session.username });
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get('/todos', async (req, res) => {
  try {
    const todos = await ToDo.find({});
    res.render('todos', { todos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/createTodo', (req, res) => {
  const newTodo = new ToDo({
    task: req.body.task,
    description: req.body.description,
    completed: false
  });
  newTodo.save().then(() => res.redirect('/todos'));
});

app.get('/editTodo/:id', async (req, res) => {
  try {
    const todo = await ToDo.findById(req.params.id);
    res.render('editTodo', { todo });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/updateTodo/:id', async (req, res) => {
  try {
    await ToDo.findByIdAndUpdate(req.params.id, {
      task: req.body.task,
      description: req.body.description,
      completed: req.body.completed === 'on'
    });
    res.redirect('/todos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/deleteTodo/:id', async (req, res) => {
  try {
    await ToDo.findByIdAndDelete(req.params.id);
    res.redirect('/todos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/searchTodos', async (req, res) => {
  try {
    const query = {};
    if (req.query.query) {
      query.task = new RegExp(req.query.query, 'i');
    }
    if (req.query.completed) {
      query.completed = req.query.completed === 'true';
    }
    const todos = await ToDo.find(query);
    res.render('todos', { todos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(8099, () => {
  console.log('Server is running on port 8099');
});
