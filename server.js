import express from "express";
import path from "path";
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";
import open from "open"; 

import auth from './auth.js';
import { initializeAuthDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 8080;
const SESSION_COOKIE_NAME = 'session_token';

let database; 

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.resolve(process.cwd()), {
    index: false
}));

async function validateUser(req, res, next) {
    const token = req.cookies[SESSION_COOKIE_NAME];

    const result = await auth.authenticate(database, token);

    if (result.ok) {
        req.username = result.username; 
        next();
    } else {
        console.log(`Authentication failed: ${result.message}`);
        res.clearCookie(SESSION_COOKIE_NAME, { httpOnly: true, sameSite: 'Strict' });

        res.cookie('forwardURL', req.originalUrl, { httpOnly: true, sameSite: 'Strict' });
        res.redirect("/login.html");
    }
}

// adduser handles new user registration
app.post('/adduser', async (req, res) => {
    const { username, password } = req.body;
    try {
        await auth.register(database, username, password);
        res.status(200).json({ message: 'User registered successfully. Please log in.' });
    } catch (error) {
        if (error.message.includes('User already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});

// login handles sign in and returns a session token
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const token = await auth.login(database, username, password);
        
        res.cookie(SESSION_COOKIE_NAME, token, { 
            httpOnly: true, 
            secure: false, 
            sameSite: 'Strict' 
        });

        const forwardURL = req.cookies.forwardURL || '/index.html';
        res.clearCookie('forwardURL'); 
        
        res.status(200).json({ 
            message: 'Login successful', 
            token: token,
            redirect: forwardURL 
        });

    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});


app.post('/logout', (req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME, { httpOnly: true, sameSite: 'Strict' });
    res.json({ message: 'Logged out successfully', redirect: '/login.html' });
});

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

app.get('/quiz.html', validateUser, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'quiz.html'));
});

app.get('/:city.html', validateUser, (req, res) => {
    const filePath = path.join(process.cwd(), `${req.params.city}.html`);
    res.sendFile(filePath);
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'login.html'));
});

app.get('/', (req, res) => {
    res.redirect('/index.html');
});



async function startServer() {
    try {
        database = await initializeAuthDb();
        
        app.listen(PORT, async () => {
            const url = `http://localhost:${PORT}`;
            console.log(`Server running at ${url}`);
            
            try {
                await open(`http://localhost:${PORT}/login.html`); 
            } catch (error) {
                console.error("Error opening browser automatically:", error.message);
                console.log(`Please manually navigate to: ${url}`);
            }
        });
    } catch (err) {
        console.error("Failed to start server due to DB error:", err);
    }
}

startServer();