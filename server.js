import express from "express";
import path from "path";
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";

import auth from './auth.js';
import { initializeAuthDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 8080;
const SESSION_COOKIE_NAME = 'session_token';

let database; // To hold the SQLite database instance

// --- Middleware Setup ---
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.resolve(process.cwd()))); // Serve static files (HTML, CSS, JS) from the root directory


/**
 * Middleware to validate the user's session token from the cookie.
 * If valid, calls next(). If invalid, redirects to login.
 */
async function validateUser(req, res, next) {
    const token = req.cookies[SESSION_COOKIE_NAME];

    // Attempt to authenticate with the token
    const result = await auth.authenticate(database, token);

    if (result.ok) {
        // If authentication is successful, attach username to request for later use
        req.username = result.username; 
        next();
    } else {
        // Authentication failed (no token or invalid token)
        console.log(`Authentication failed: ${result.message}`);
        // Redirect to login, but save the intended URL in a cookie
        res.cookie('forwardURL', req.originalUrl, { httpOnly: true, sameSite: 'Strict' });
        res.redirect("/login.html");
    }
}

// --- Authentication API Routes (Public) ---

// POST /adduser: Handles new user registration
app.post('/adduser', async (req, res) => {
    const { username, password } = req.body;
    const result = await auth.addUser(database, username, password);

    if (result.error) {
        console.error("Registration failed:", result.error);
        res.status(400).json({ error: result.error });
    } else {
        res.status(200).json({ message: "User created successfully" });
    }
});

// POST /login: Handles user sign-in
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await auth.login(database, username, password);

    if (result.token) {
        // Success: Set the session token cookie
        res.cookie(SESSION_COOKIE_NAME, result.token, {
            httpOnly: true,
            sameSite: 'Strict',
            // secure: true, // Use this in production with HTTPS
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        });
        
        // Check for a saved redirect URL and use it, otherwise go to index.html
        const redirectUrl = req.cookies.forwardURL || '/index.html';
        res.clearCookie('forwardURL'); // Clear the temporary redirect cookie
        
        res.status(200).json({ redirect: redirectUrl });
    } else {
        // Failure: Invalid credentials
        res.status(401).json({ error: result.error });
    }
});

// GET /logout
app.get('/logout', (req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME);
    res.redirect('/login.html');
});

// --- Application Routes (Protected) ---

// Root URL defaults to index.html if authenticated, or login.html if not
app.get('/', validateUser, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Protected routes using the validateUser middleware
app.get('/index.html', validateUser, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.get('/explore.html', validateUser, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'explore.html'));
});

app.get('/profile.html', validateUser, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'profile.html'));
});

app.get('/favorites.html', validateUser, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'favorites.html'));
});

// City-specific routes (example)
app.get('/:city.html', validateUser, (req, res) => {
    const filePath = path.join(process.cwd(), `${req.params.city}.html`);
    // NOTE: In a real app, you'd check if the file exists before serving.
    res.sendFile(filePath);
});

// Fallback for login page (must be accessible without validation)
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'login.html'));
});


// --- Server Initialization ---
async function startServer() {
    try {
        database = await initializeAuthDb();
        
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server due to DB error:", err);
        process.exit(1);
    }
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  
startServer();