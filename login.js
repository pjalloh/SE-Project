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
            // Handle server error responses
            let message = "Error adding user.";
            try {
                // Try to parse JSON error message from the server
                const errorData = await response.json();
                message = errorData.error || message;
            } catch (e) {
                // Fallback to plain text error message
                message = await response.text() || message;
            }
            displayError(`❌ Registration failed: ${message}`);
        }
    }).catch(error => {
        console.error("Network Error during registration:", error);
        displayError("❌ A network error occurred while registering. Check server connection.");
    });
}

/**
 * Handles the user login process by sending data to the /login endpoint.
 */
function login() {
    const password = getElement("password").value;
    const username = getElement("username").value;
    displayError("Processing...");

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
        body: JSON.stringify({ username, password })
    }).then(async response => {
        if (!response.ok) {
            // Handle error response from server
            let message = "Something went wrong during login.";
            try {
                // Try to parse JSON error message from the server
                const errorData = await response.json();
                message = errorData.error || message;
            } catch (e) {
                 // Fallback to plain text error message
                 message = await response.text() || message;
            }
            throw new Error(message);
        }
        // Assuming the server returns a JSON object with a redirect field for the URL
        return response.json();
    }).then(data => {
        // Successful login, redirect to the URL provided by the server
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            displayError("Unexpected server response. No redirect URL found.");
        }
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