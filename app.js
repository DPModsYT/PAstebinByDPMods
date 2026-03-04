import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ⚠️ REPLACE THIS ENTIRE OBJECT WITH YOUR FIREBASE CONFIG ⚠️
 const firebaseConfig = {
    apiKey: "AIzaSyCYuvJy2B54DCF0XfjP0nkLKBrxDnR5S28",
    authDomain: "gamer-aadil.firebaseapp.com",
    databaseURL: "https://gamer-aadil.firebaseio.com",
    projectId: "gamer-aadil",
    storageBucket: "gamer-aadil.firebasestorage.app",
    messagingSenderId: "420652281966",
    appId: "1:420652281966:web:4867f1a0a767a9e46af67f",
    measurementId: "G-XKLJ4RH5D2"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const linkContainer = document.getElementById('linkContainer');
const rawLinkTag = document.getElementById('rawLink');

// Listen for Auth State Changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// Handle Login
document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if(!email || !password) return alert("Please enter both email and password.");

    signInWithEmailAndPassword(auth, email, password)
        .catch(error => alert("Authentication Failed: " + error.message));
});

// Handle Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth);
    linkContainer.classList.add('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
});

// Handle JSON Saving
document.getElementById('saveBtn').addEventListener('click', () => {
    const endpointName = document.getElementById('endpointName').value.trim();
    const rawJson = document.getElementById('jsonInput').value;

    // Basic Validation
    if(!endpointName) return alert("Error: Please provide an Endpoint Name.");
    
    // Ensure no invalid characters in the Firebase node path
    if (/[.#$\[\]]/.test(endpointName)) {
        return alert("Error: Endpoint name cannot contain '.', '#', '$', '[', or ']'");
    }

    try {
        // 1. Verify it's valid JSON
        const parsedJson = JSON.parse(rawJson); 
        
        // 2. Save to Firebase
        set(ref(db, 'api_data/' + endpointName), parsedJson)
            .then(() => {
                // 3. Construct the Raw Link
                // Ensure there is no trailing slash on the databaseURL
                const dbUrl = firebaseConfig.databaseURL.replace(/\/$/, ""); 
                const rawUrl = `${dbUrl}/api_data/${endpointName}.json`;
                
                // 4. Update UI
                rawLinkTag.href = rawUrl;
                rawLinkTag.textContent = rawUrl;
                linkContainer.classList.remove('hidden');
            })
            .catch(error => alert("Database Error: " + error.message));

    } catch (e) {
        alert("Syntax Error: The JSON provided is invalid. Please check for missing quotes or commas.");
    }
});
