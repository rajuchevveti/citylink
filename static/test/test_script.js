/**
 * Full Auth Test Logic (Simulating main app structure)
 * Handles role switching, registration (with business fields), and login.
 */

const AUTH_KEY = 'citylinkUsersTest'; // Mock DB Key

// --- Element References ---
let currentAuthType = 'Resident'; 
let isLoginView = false;

const statusMessage = document.getElementById('status-message');
const registrationForm = document.getElementById('registration-form');
const loginForm = document.getElementById('login-form');
const signupButton = document.getElementById('signup-button');
const loginButton = document.getElementById('login-button');
const toggleViewLink = document.getElementById('toggle-view-link');
const residentTab = document.getElementById('resident-tab');
const businessTab = document.getElementById('business-tab');
const loginResidentTab = document.getElementById('login-resident-tab');
const loginBusinessTab = document.getElementById('login-business-tab');
const nameInputReg = document.getElementById('name-input-reg');
const businessFields = document.getElementById('business-fields');


// --- Utility Functions ---

/** Generates a simple, robust unique ID for users (Fallback for crypto.randomUUID). */
function generateSimpleId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTestUsers() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
    } catch (e) {
        console.error("Failed to read test database:", e);
        return [];
    }
}

function saveTestUsers(users) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

function displayStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = `p-3 mb-4 rounded-lg font-semibold text-sm text-center ${isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`;
    statusMessage.classList.remove('hidden');
    
    // Reset buttons immediately after showing status
    signupButton.textContent = 'Register New User';
    signupButton.disabled = false;
    loginButton.textContent = 'Log In Securely';
    loginButton.disabled = false;
}


/** Switches the active state of the tabs and adjusts form fields (Resident vs Business). */
function switchAuthType(type) {
    currentAuthType = type;
    const isResident = type === 'Resident';

    // Registration Tabs (Main Tabs)
    residentTab.classList.toggle('border-indigo-600', isResident);
    residentTab.classList.toggle('text-indigo-600', isResident);
    residentTab.classList.toggle('border-transparent', !isResident);
    residentTab.classList.toggle('text-gray-500', !isResident);
    businessTab.classList.toggle('border-indigo-600', !isResident);
    businessTab.classList.toggle('text-indigo-600', !isResident);
    businessTab.classList.toggle('border-transparent', isResident);
    businessTab.classList.toggle('text-gray-500', isResident);
    
    // Login Tabs (Role Selection)
    loginResidentTab.classList.toggle('border-indigo-600', isResident);
    loginResidentTab.classList.toggle('text-indigo-600', isResident);
    loginResidentTab.classList.toggle('border-gray-300', !isResident);
    loginResidentTab.classList.toggle('text-gray-500', !isResident);
    loginBusinessTab.classList.toggle('border-indigo-600', !isResident);
    loginBusinessTab.classList.toggle('text-indigo-600', !isResident);
    loginBusinessTab.classList.toggle('border-gray-300', isResident);
    loginBusinessTab.classList.toggle('text-gray-500', isResident);


    // Toggle Form Fields visibility
    nameInputReg.placeholder = isResident ? "Full Name" : "Business Name";
    businessFields.classList.toggle('hidden', isResident);
}

/** Toggles between the Sign Up and Log In views. */
function toggleFormView(event) {
    if (event) event.preventDefault();
    isLoginView = !isLoginView;
    
    registrationForm.classList.toggle('hidden', isLoginView);
    loginForm.classList.toggle('hidden', !isLoginView);
    
    toggleViewLink.textContent = isLoginView ? 
        "Don't have an account? Sign Up" : 
        "Already have an account? Log In";
    
    // Reset role selection to Resident default when toggling
    switchAuthType('Resident'); 

    statusMessage.classList.add('hidden');
}


/** Handles the sign-up form submission. */
function handleRegistration(event) {
    event.preventDefault();
    signupButton.textContent = 'Processing...';
    signupButton.disabled = true;

    const name = nameInputReg.value.trim();
    const email = document.getElementById('email-reg').value.trim();
    const password = document.getElementById('password-reg').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const phone = document.getElementById('phone-reg').value.trim();
    const termsAgreed = document.getElementById('terms-agree-reg').checked;
    const users = getTestUsers();

    const resetBtn = () => { signupButton.textContent = 'Register New User'; signupButton.disabled = false; };

    // --- Validation Logic ---
    if (users.some(u => u.email === email)) {
        displayStatus("This email is already registered. Please log in.", true); resetBtn(); return;
    }
    if (!name || !email || !password || !confirmPassword || !phone || !termsAgreed || password.length < 6 || password !== confirmPassword) {
        displayStatus("Please correct form errors.", true); resetBtn(); return;
    }
    
    if (currentAuthType === 'Business') {
        const businessType = document.getElementById('business-type').value;
        const businessLocation = document.getElementById('business-location').value;
        if (!businessType || !businessLocation) {
            displayStatus("Please select business type and location.", true); resetBtn(); return;
        }
    }

    // --- Data Collection ---
    const user = {
        id: generateSimpleId(), // Mobile compatible ID
        name: name,
        email: email,
        password: password, 
        type: currentAuthType,
    };

    if (currentAuthType === 'Business') {
        user.businessType = document.getElementById('business-type').value;
        user.location = document.getElementById('business-location').value;
    }

    // --- Final Save & Redirect ---
    try {
        users.push(user);
        saveTestUsers(users);
        
        displayStatus(`Registration successful! Redirecting to success page.`, false);
        signupButton.textContent = 'Success!';
        
        setTimeout(() => {
            const userDataString = JSON.stringify(user, null, 2);
            // ADD STATUS PARAMETER: status=register
            window.location.href = `/test/success?user=${encodeURIComponent(userDataString)}&status=register`;
        }, 1000);

    } catch (e) {
        console.error("Storage Error:", e);
        displayStatus("FATAL ERROR: Could not save data to Local Storage.", true);
    }
}

/** Handles the login form submission. */
function handleLogin(event) {
    event.preventDefault();
    loginButton.textContent = 'Processing...';
    loginButton.disabled = true;

    const email = document.getElementById('email-login').value.trim();
    const password = document.getElementById('password-login').value;
    const users = getTestUsers();
    
    const resetBtn = () => { loginButton.textContent = 'Log In Securely'; loginButton.disabled = false; };

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Check: verify user type matches login selection
        if (user.type !== currentAuthType) {
            displayStatus(`Invalid role selection. This is a ${user.type} account.`, true);
            resetBtn(); return;
        }

        displayStatus(`Login successful! Redirecting...`, false);
        loginButton.textContent = 'Success!';

        setTimeout(() => {
            const userDataString = JSON.stringify(user, null, 2);
            // ADD STATUS PARAMETER: status=login
            window.location.href = `/test/success?user=${encodeURIComponent(userDataString)}&status=login`;
        }, 1000);

    } else {
        displayStatus("Invalid email or password.", true);
        resetBtn();
    }
}


// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // Initial display of found users
    const users = getTestUsers();
    if (users.length > 0) {
        displayStatus(`Welcome! Found ${users.length} mock users. Try logging in or registering a new role.`, false);
    } else {
        displayStatus("Test ready. No mock users found. Please register an account.", true);
    }

    // Attach event listeners
    document.getElementById('toggle-view-link').addEventListener('click', toggleFormView);
    registrationForm.addEventListener('submit', handleRegistration);
    loginForm.addEventListener('submit', handleLogin);
    
    // Role tabs (must match the buttons in test_auth.html)
    document.getElementById('resident-tab').addEventListener('click', () => switchAuthType('Resident'));
    document.getElementById('business-tab').addEventListener('click', () => switchAuthType('Business'));
    document.getElementById('login-resident-tab').addEventListener('click', () => switchAuthType('Resident'));
    document.getElementById('login-business-tab').addEventListener('click', () => switchAuthType('Business'));
    
    // Set initial state
    switchAuthType('Resident'); 
});