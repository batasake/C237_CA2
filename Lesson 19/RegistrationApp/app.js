const express = require('express');
const mysql = require('mysql2');

//******** TODO: Insert code to import 'express-session' *********//
const session = require("express-session");

const flash = require('connect-flash');

const app = express();

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Republic_C207',
    database: 'C237_usersdb'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

//******** TODO: Insert code for Session Middleware below ********//
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    // session expires after 7 days of inactivity (in milliseconds)
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
}));

app.use(flash());

// Setting up EJS
app.set('view engine', 'ejs');

//******** TODO: Create a Middleware to check if user is logged in. ********//
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/login');
    }
};

//******** TODO: Create a Middleware to check if user is admin. ********//
const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin') {
        return next();
    } else {
        req.flash('error', 'Access denied');
        res.redirect('/dashboard');
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success')});
});

app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
});


//******** TODO: Create a middleware function validateRegistration ********//
const validateRegistration = (req, res, next)=>{
    // retrieve values from the form body 
    const {username, email, password, address, contact} = req.body;
    
    // -------- server-side validation --------
    // check that all fields are not empty 
    if (!username || !email || !password || !address || !contact) {
        // return res.status(400).send("All fields are required");
        req.flash("error", "All fields are required");
        req.flash("formData", req.body); 
        return res.redirect("/register");
    }

    // check password length to be 6 characters or more 
    if (password.length < 6) {
        req.flash("error", "Password must be 6 characters or more");
        req.flash("formData", req.body); 
        return res.redirect("/register");
    }

    // if all validations pass, allow request to proceed to next middleware function 
    next();
};

//******** TODO: Integrate validateRegistration into the register route. ********//
app.post('/register', validateRegistration, (req, res) => {
    //******** TODO: Update register route to include role. ********//
    const { username, email, password, address, contact, role } = req.body;

    const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
    db.query(sql, [username, email, password, address, contact, role ], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');

    });

});



//******** TODO: Insert code for login routes to render login page below ********//
app.get( '/login', (req, res) => {
    res.render( 'login', {
        messages: req.flash('success'), // retrieve success message from the session to pass to view
        errors: req.flash('error'), // retrieve error message from the session to pass to view
    });
});

//******** TODO: Insert code for login routes for form submission below ********//
app.post('/login', (req, res) => {
    // retrieve values from form body
    const {email, password} = req.body;

    // server-side validation
    // check that all fields are not empty
    if (!email || !password) {
        req.flash('error', 'All fields are required');
        return res.redirect('/login');
    }

    // formulate the sql
    const sql = "SELECT * FROM users WHERE email = ? AND password = SHA1(?)";

    // execute query to fetch data 
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            throw err;
        }
        // when no error
        if (results.length > 0) {
            // successful login
            // store user info in session
            req.session.user = results[0];
            req.flash('success', 'Login successful');
            res.redirect('/dashboard');

        } else {
            // invalid credentials
            req.flash('error', 'Invalid email or password');
            res.redirect('/login');
        }
    });
});

//******** TODO: Insert code for dashboard route to render dashboard page for users. ********//
app.get('/dashboard', checkAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user,
        errors: req.flash('error')
     });
});

//******** TODO: Insert code for admin route to render dashboard page for admin. ********//
app.get('/admin', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('admin', { user: req.session.user,
        errors: req.flash('error')
     });
});

//******** TODO: Insert code for logout route ********//
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Starting the server
app.listen(3000, () => {
    console.log('Server started on port http://localhost:3000');
});
