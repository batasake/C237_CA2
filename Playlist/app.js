const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// views folder and EJS engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Connecting to database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Republic_C207',
  database: 'C237_usersdb',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// Middleware to parse form data (urlencoded) and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Static files for CSS, JS, images
app.use(express.static('public'));

// Session middleware
app.use(
  session({
    secret: 'secret', // Change this for production to something secret!
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // Session expires in 7 days
  })
);

// Flash middleware for showing messages
app.use(flash());

// Middleware to check if user is logged in
const checkAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to view this resource');
  res.redirect('/login');
};

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied');
  res.redirect('/dashboard');
};

// ROUTES

// Home page
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user, messages: req.flash('success') });
});

// Register page
app.get('/register', (req, res) => {
  res.render('register', {
    messages: req.flash('error'),
    formData: req.flash('formData')[0] || {},
  });
});

// Validate registration form data
const validateRegistration = (req, res, next) => {
  const { username, email, password, address, contact } = req.body;
  if (!username || !email || !password || !address || !contact) {
    req.flash('error', 'All fields are required');
    req.flash('formData', req.body);
    return res.redirect('/register');
  }
  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters');
    req.flash('formData', req.body);
    return res.redirect('/register');
  }
  next();
};

// Handle registration POST
app.post('/register', validateRegistration, (req, res) => {
  const { username, email, password, address, contact, role } = req.body;
  const sql =
    'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
  db.query(sql, [username, email, password, address, contact, role || 'user'], (err) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Registration failed, please try again.');
      req.flash('formData', req.body);
      return res.redirect('/register');
    }
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', {
    messages: req.flash('success'),
    errors: req.flash('error'),
  });
});

// Handle login POST
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/login');
  }
  const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
  db.query(sql, [email, password], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      req.session.user = results[0];
      req.flash('success', 'Login successful');
      res.redirect('/dashboard');
    } else {
      req.flash('error', 'Invalid email or password');
      res.redirect('/login');
    }
  });
});

// Dashboard page (show user playlists)
app.get('/dashboard', checkAuthenticated, (req, res) => {
  const sql = 'SELECT * FROM playlists WHERE user_id = ?';
  db.query(sql, [req.session.user.id], (err, playlists) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Could not load playlists');
      return res.render('dashboard', {
        user: req.session.user,
        playlists: [],
        errors: req.flash('error'),
        messages: req.flash('success'),
      });
    }
    res.render('dashboard', {
      user: req.session.user,
      playlists: playlists || [],
      errors: req.flash('error'),
      messages: req.flash('success'),
    });
  });
});

// Admin dashboard
app.get('/admin', checkAuthenticated, checkAdmin, (req, res) => {
  res.render('admin', { user: req.session.user, errors: req.flash('error') });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// Create playlist POST
app.post('/playlists', checkAuthenticated, (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    req.flash('error', 'Playlist name cannot be empty');
    return res.redirect('/dashboard');
  }
  const sql = 'INSERT INTO playlists (name, user_id) VALUES (?, ?)';
  db.query(sql, [name.trim(), req.session.user.id], (err) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Could not create playlist');
      return res.redirect('/dashboard');
    }
    req.flash('success', 'Playlist created!');
    res.redirect('/dashboard');
  });
});

// Add song POST
app.post('/songs', checkAuthenticated, (req, res) => {
  const { playlist_id, song_name, artist_name } = req.body;
  if (!playlist_id || !song_name || !artist_name) {
    req.flash('error', 'All song fields are required');
    return res.redirect('/dashboard');
  }
  const sql = 'INSERT INTO songs (playlist_id, title, artist) VALUES (?, ?, ?)';
  db.query(sql, [playlist_id, song_name.trim(), artist_name.trim()], (err) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Could not add song');
      return res.redirect('/dashboard');
    }
    req.flash('success', 'Song added!');
    res.redirect('/dashboard');
  });
});

// 404 handler (catch all)
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});