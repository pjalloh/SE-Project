import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const algo = 'HS256';
const privateKey = "09653d64f8cfa3dd59c30985c43c65254b91697afc514f34bd48b6033c1f003b8b448336a9c6a468b681e0c85eb14bfeb6e8e2076c4bc78f1ed6f40256ce7fb5";
const publicKey = privateKey;
const keyTimeout = "1h";

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export default {
    authenticate,
    login,
    addUser
}

async function authenticate(db, authValue) {
    if (!authValue || authValue === "") {
        return {
            error: "NoToken",
            message: "No token provided"
        };
    }
    try {
        const decoded = jwt.verify(authValue, publicKey); // Throws an error if token has expired
        
        // Check if user exists in DB
        if (!await validateUser(db, decoded.username)) {
            throw new Error("Invalid user");
        }
        
        // IMPORTANT: Return username on success for use in server.js
        return {
            ok: true,
            username: decoded.username // <-- ADDED: Return the username
        };
    } catch (err) {
        return {
            error: err.name || "InvalidToken",
            message: err.message
        };
    }
}

async function login(db, username, password) {
    const passHash = await validateUser(db, username);
    if (passHash) {
        if (bcrypt.compareSync(password, passHash)) {
            const payload = {
                username
            };
            const options = {
                algorithm: algo,
                expiresIn: keyTimeout
            };
            const token = jwt.sign(payload, privateKey, options);
            return {
                token
            };
        }
        return {
            error: "Invalid username or password"
        };
    }
    return {
        error: "Invalid username or password"
    };
}

async function validateUser(db, username) {
    try {
        const query = `SELECT password_hash FROM users WHERE username = ?`;
        const row = await db.get(query, [username]);
        return row ? row.password_hash : "";
    } catch (error) {
        return "";
    }
}

async function addUser(db, username, password) {
    if (!username || !password) {
        return {
            error: "Missing username or password"
        };
    }

    const existingUser = await validateUser(db, username);
    if (existingUser) {
        return {
            error: "User already exists"
        };
    }

    try {
        const passHash = bcrypt.hashSync(password, 10);
        const query = `INSERT INTO users (username, password_hash) VALUES (?, ?)`;
        await db.run(query, [username, passHash]);
        return {};
    } catch (error) {
        return {
            error: "Error adding user: " + error.message
        };
    }
}