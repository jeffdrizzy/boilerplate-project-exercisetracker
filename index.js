const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema]
});

const User = mongoose.model('User', userSchema);

app.post('/api/users', (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save((err, user) => {
    if (err) return res.json({ error: err.message });
    res.json({ username: user.username, _id: user._id });
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, 'username _id', (err, users) => {
    if (err) return res.json({ error: err.message });
    res.json(users);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const exerciseDate = req.body.date ? new Date(req.body.date) : new Date();
  User.findById(req.params._id, (err, user) => {
    if (err || !user) return res.json({ error: 'User not found' });
    const exercise = {
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: exerciseDate
    };
    user.log.push(exercise);
    user.save((err, updatedUser) => {
      if (err) return res.json({ error: err.message });
      res.json({
        username: updatedUser.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
        _id: updatedUser._id
      });
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  User.findById(req.params._id, (err, user) => {
    if (err || !user) return res.json({ error: 'User not found' });
    let log = user.log.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: new Date(e.date).toDateString()
    }));
    if (from) {
      const fromDate = new Date(from);
      log = log.filter((e) => new Date(e.date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      log = log.filter((e) => new Date(e.date) <= toDate);
    }
    if (limit) {
      log = log.slice(0, parseInt(limit));
    }
    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
