import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const AUTH_DB_PATH = "authenticate.db";

async function initializeAuthDb() {
    try {
        const db = await open({
            filename: path.join(process.cwd(), AUTH_DB_PATH),
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            );
        `);

        console.log("Database initialized:", AUTH_DB_PATH);
        return db;

    } catch (err) {
        console.error("Error initializing database:", err);
        throw err;
    }
}

export { initializeAuthDb };
