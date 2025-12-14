/**
 * user login and registration script
 */

// Helper function to get DOM elements
const getElement = (id) => document.getElementById(id);
const errorDiv = getElement("error");

/**
 * Updates the error message display.
 * @param {string} message The message to display.
 */
function displayError(message) {
    // Check if the message is empty or just whitespace/placeholder
    if (!message || message.trim() === "") {
        errorDiv.innerHTML = "&nbsp;"; // Use non-breaking space to maintain height
    } else {
        errorDiv.innerHTML = message;
    }
}

/**
 * Handles the user registration process by sending data to the /adduser endpoint.
 */
function addUser() {
    const password = getElement("password").value;
    const username = getElement("username").value;
    displayError("Processing...");

    if (!username || !password) {
        displayError("Please enter both username (email) and password.");
        return;
    }

    // Attempt to register the new user via the server's API
    fetch("/adduser", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    }).then(async response => {
        if (response.ok) {
            // Success: Clear fields and prompt user to log in
            getElement("username").value = "";
            getElement("password").value = "";
            displayError("✅ Account created. Please log in now.");
        } else {
            // Handle registration errors
            let message = "❌ Registration failed.";
            try {
                const errorJson = await response.json();
                message = errorJson.error || message;
            } catch (e) {
                message = await response.text() || message;
            }
            throw new Error(message);
        }
    }).catch(error => {
        console.error("Registration error:", error);
        // Clean up the error message for display
        let displayMsg = error.message.startsWith('❌') ? error.message : `❌ Registration failed: ${error.message}`;
        displayError(displayMsg);
    });
}


/**
 * Handles the user login process by sending data to the /login endpoint.
 */
function login() {
    const password = getElement("password").value;
    const username = getElement("username").value;
    displayError("Logging in...");

    if (!username || !password) {
        displayError("Please enter both username (email) and password.");
        return;
    }
    
    // Attempt to log in via the server's API
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    }).then(async response => {
        if (!response.ok) {
            // Handle HTTP errors
            let message = "Login failed.";
            try {
                const errorJson = await response.json();
                message = errorJson.error || message;
            } catch (e) {
                message = await response.text() || message;
            }
            throw new Error(message);
        }
        // Assuming the server returns a JSON object with a redirect field for the URL
        return response.json();
    }).then(data => {
        // --- FIX STARTS HERE ---
        // Successful login, redirect to the URL provided by the server (data.redirect)
        if (data.redirect) {
            window.location.href = data.redirect; // Use the server-provided URL (e.g., /profile.html)
        } else {
            // Fallback just in case
            window.location.href = '/index.html'; 
        }
        // --- FIX ENDS HERE ---
    }).catch(error => {
        console.error("Login error:", error);
        displayError(`❌ Login failed: ${error.message || "An unknown error occurred."}`);
    });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Login Button Click
    getElement('loginButton').addEventListener('click', login);
    
    // 2. New User Registration Button Click
    getElement('newUser').addEventListener('click', addUser);
    
    // 3. Form Submission (Enter key/Submit button, defaults to login)
    getElement("login-form").addEventListener("submit", function(event) {
        event.preventDefault();
        login();
    });

    // 4. Enter keypress on password field for quick login
    getElement("password").addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            login();
        }
    });

    // Initial clear/set of error div placeholder
    displayError("");
});