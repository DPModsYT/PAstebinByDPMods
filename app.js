import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Your exact Firebase Config
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const linkContainer = document.getElementById('linkContainer');
const rawLinkTag = document.getElementById('rawLink');
const endpointsContainer = document.getElementById('endpointsContainer');
const endpointNameInput = document.getElementById('endpointName');
const jsonInputArea = document.getElementById('jsonInput');
const copyBtn = document.getElementById('copyBtn');

let currentUserUid = null;

// Listen for Auth State Changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadUserEndpoints();
    } else {
        currentUserUid = null;
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// Load Metadata for Sidebar (Dates & Views)
function loadUserEndpoints() {
    if (!currentUserUid) return;
    
    // We only load the metadata to save bandwidth, not the heavy JSONs
    const metaRef = ref(db, 'api_metadata/' + currentUserUid);
    
    onValue(metaRef, (snapshot) => {
        const metaData = snapshot.val();
        endpointsContainer.innerHTML = ''; 
        
        if (metaData) {
            const keys = Object.keys(metaData);
            
            // Sort to show newest first
            keys.sort((a, b) => new Date(metaData[b].updatedAt) - new Date(metaData[a].updatedAt));

            keys.forEach(key => {
                const itemData = metaData[key];
                const item = document.createElement('div');
                item.className = 'endpoint-item';
                
                // Construct the visual item with SVG icons
                item.innerHTML = `
                    <div class="endpoint-title">${key}</div>
                    <div class="endpoint-meta">
                        <div class="meta-group">
                            <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                            ${itemData.updatedAt || 'Unknown Date'}
                        </div>
                        <div class="meta-group">
                            <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                            ${itemData.views || 0}
                        </div>
                    </div>
                `;
                
                // When clicked, fetch the actual JSON data and load it into the editor
                item.addEventListener('click', () => {
                    endpointNameInput.value = key;
                    jsonInputArea.value = "Fetching data...";
                    
                    get(ref(db, `api_data/${currentUserUid}/${key}`)).then((dataSnapshot) => {
                        if (dataSnapshot.exists()) {
                            jsonInputArea.value = JSON.stringify(dataSnapshot.val(), null, 2);
                            showLink(key);
                        } else {
                            jsonInputArea.value = "Error: Data not found.";
                        }
                    });
                });
                
                endpointsContainer.appendChild(item);
            });
        } else {
            endpointsContainer.innerHTML = '<p style="font-size: 0.9rem; color: #94a3b8;">No endpoints yet.</p>';
        }
    });
}

function showLink(endpointName) {
    const dbUrl = firebaseConfig.databaseURL.replace(/\/$/, ""); 
    const rawUrl = `${dbUrl}/api_data/${currentUserUid}/${endpointName}.json`;
    rawLinkTag.href = rawUrl;
    rawLinkTag.textContent = rawUrl;
    linkContainer.classList.remove('hidden');
    
    // Reset copy button text
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy';
}

// Copy Button Logic
copyBtn.addEventListener('click', () => {
    const linkToCopy = rawLinkTag.href;
    navigator.clipboard.writeText(linkToCopy).then(() => {
        copyBtn.innerHTML = 'Copied! ✅';
        setTimeout(() => {
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy';
        }, 2000);
    });
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
    endpointNameInput.value = '';
    jsonInputArea.value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
});

// Handle JSON Saving & Metadata updating
document.getElementById('saveBtn').addEventListener('click', () => {
    const endpointName = endpointNameInput.value.trim();
    const rawJson = jsonInputArea.value;

    if(!endpointName) return alert("Error: Please provide an Endpoint Name.");
    if (/[.#$\[\]]/.test(endpointName)) return alert("Error: Endpoint name cannot contain '.', '#', '$', '[', or ']'");
    if (!currentUserUid) return alert("You must be logged in.");

    try {
        const parsedJson = JSON.parse(rawJson); 
        
        // Get current date/time formatted nicely for India (IST)
        const currentDate = new Date().toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        // Update both paths simultaneously
        const updates = {};
        updates[`api_data/${currentUserUid}/${endpointName}`] = parsedJson;
        updates[`api_metadata/${currentUserUid}/${endpointName}/updatedAt`] = currentDate;
        
        // Only set views to 0 if we are creating a new endpoint to prevent overwriting an existing count
        get(ref(db, `api_metadata/${currentUserUid}/${endpointName}/views`)).then((snapshot) => {
            if (!snapshot.exists()) {
                updates[`api_metadata/${currentUserUid}/${endpointName}/views`] = 0;
            }
            
            update(ref(db), updates)
                .then(() => {
                    showLink(endpointName);
                    alert("JSON deployed securely!");
                })
                .catch(error => alert("Database Error: " + error.message));
        });

    } catch (e) {
        alert("Syntax Error: The JSON provided is invalid. Check for trailing commas or missing quotes.");
    }
});
