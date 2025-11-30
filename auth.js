import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// NOTE: Use a strong, securely stored secret key in a real application
const privateKey = "09653d64f8cfa3dd59c30985c43c65254b91697afc514f34bd48b6033c1f003b8b448336a9c6a468b681e0c85eb14bfeb6e8e2076c4bc78f1ed6f40256ce7fb5";
const publicKey = privateKey; // Use the same key for simplicity in this demo
const algo = 'HS256';
const keyTimeout = "1h"; // Token valid for 1 hour

/**
 * Retrieves the password hash for a given username.
 * @param {sqlite.Database} db - The database instance.
 * @param {string} username - The user's email/username.
 * @returns {Promise<string|null>} The password hash or null if user not found.
 */
async function validateUser(db, username) {
    try {
        const query = `SELECT password_hash FROM users WHERE username = ?`;
        const row = await db.get(query, [username]);
        return row ? row.password_hash : null;
    } catch (error) {
        console.error("DB Error validating user:", error.message);
        return null;
    }
}

/**
 * Authenticates a user based on a JWT token.
 * @param {sqlite.Database} db - The database instance.
 * @param {string} authValue - The JWT token.
 * @returns {Promise<{ok: boolean}|{error: string, message: string}>} Authentication result.
 */
async function authenticate(db, authValue) {
    if (!authValue || authValue === "") {
        return { error: "NoToken", message: "No token provided" };
    }
    try {
        const decoded = jwt.verify(authValue, publicKey); 
        
        const passHash = await validateUser(db, decoded.username);
        if (!passHash) {
            throw new Error("Invalid user in token payload");
        }
        
        return { ok: true, username: decoded.username };
    } catch (err) {
        // Token expired, invalid signature, or other JWT error
        return { error: "InvalidToken", message: err.message };
    }
}

/**
 * Attempts to log in a user with username and password.
 * @param {sqlite.Database} db - The database instance.
 * @param {string} username - The user's email/username.
 * @param {string} password - The plain-text password.
 * @returns {Promise<{token: string}|{error: string}>} Login result with token or error.
 */
async function login(db, username, password) {
    const passHash = await validateUser(db, username);
    
    if (passHash && bcrypt.compareSync(password, passHash)) {
        const payload = { username };
        const options = { algorithm: algo, expiresIn: keyTimeout };
        const token = jwt.sign(payload, privateKey, options);
        return { token };
    }
    
    return { error: "Invalid username or password" };
}

/**
 * Registers a new user.
 * @param {sqlite.Database} db - The database instance.
 * @param {string} username - The user's email/username.
 * @param {string} password - The plain-text password.
 * @returns {Promise<{}|{error: string}>} Registration result or error.
 */
async function addUser(db, username, password) {
    if (!username || !password) {
        return { error: "Missing username or password" };
    }
    
    // Basic validation
    if (password.length < 6) {
        return { error: "Password must be at least 6 characters long" };
    }

    const existingUser = await validateUser(db, username);
    if (existingUser) {
        return { error: "User already exists" };
    }

    try {
        const passHash = bcrypt.hashSync(password, 10);
        const query = `INSERT INTO users (username, password_hash) VALUES (?, ?)`;
        await db.run(query, [username, passHash]);
        return {};
    } catch (error) {
        console.error("DB Error adding user:", error.message);
        return { error: "Database error during user creation" };
    }
}

export default { authenticate, login, addUser };