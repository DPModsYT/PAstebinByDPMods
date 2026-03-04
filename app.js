import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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
const appSection = document.getElementById('appSection');
const cardsGrid = document.getElementById('cardsGrid');
const searchInput = document.getElementById('searchInput');
const totalCount = document.getElementById('totalCount');
const userEmailBadge = document.getElementById('userEmailBadge');

// Tabs & Views
const tabMyPastes = document.getElementById('tabMyPastes');
const tabCreate = document.getElementById('tabCreate');
const btnAddNew = document.getElementById('btnAddNew');
const viewList = document.getElementById('viewList');
const viewEditor = document.getElementById('viewEditor');
const editorTitle = document.getElementById('editorTitle');

// Editor Inputs
const appNameInput = document.getElementById('appName');
const jsonInputArea = document.getElementById('jsonInput');

let currentUserUid = null;
let currentApps = {}; 

// --- Auto Resize Textarea Logic ---
function autoResizeTextarea() {
    jsonInputArea.style.height = 'auto'; // Reset height temporarily
    jsonInputArea.style.height = (jsonInputArea.scrollHeight) + 'px'; // Set to required height
}

// Listen for typing or pasting to resize dynamically
jsonInputArea.addEventListener('input', autoResizeTextarea);


// --- UI Navigation Logic ---
function switchTab(tab) {
    if(tab === 'list') {
        tabMyPastes.classList.add('active');
        tabCreate.classList.remove('active');
        
        viewList.classList.remove('hidden');
        viewList.classList.add('animate-view');
        
        viewEditor.classList.add('hidden');
        viewEditor.classList.remove('animate-view');
    } else {
        tabCreate.classList.add('active');
        tabMyPastes.classList.remove('active');
        
        viewEditor.classList.remove('hidden');
        viewEditor.classList.add('animate-view');
        
        viewList.classList.add('hidden');
        viewList.classList.remove('animate-view');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

tabMyPastes.addEventListener('click', () => switchTab('list'));
tabCreate.addEventListener('click', () => {
    editorTitle.innerText = "Add New App";
    appNameInput.value = '';
    appNameInput.disabled = false;
    jsonInputArea.value = '';
    setTimeout(autoResizeTextarea, 50); // Reset size for new entry
    switchTab('editor');
});
btnAddNew.addEventListener('click', () => tabCreate.click());

// --- Auth State ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        userEmailBadge.innerText = user.email.split('@')[0];
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        loadMetadata();
    } else {
        currentUserUid = null;
        loginSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
});

// --- Data Fetching & Rendering ---
function loadMetadata() {
    if (!currentUserUid) return;
    const metaRef = ref(db, 'api_metadata/' + currentUserUid);
    
    onValue(metaRef, (snapshot) => {
        currentApps = snapshot.val() || {};
        renderCards(currentApps);
    });
}

function renderCards(data) {
    cardsGrid.innerHTML = '';
    const keys = Object.keys(data);
    totalCount.innerText = `Total: ${keys.length} Apps`;
    
    keys.sort((a, b) => new Date(data[b].updatedAt) - new Date(data[a].updatedAt));

    keys.forEach(key => {
        const item = data[key];
        const dbUrl = firebaseConfig.databaseURL.replace(/\/$/, ""); 
        const rawUrl = `${dbUrl}/api_data/${currentUserUid}/${key}.json`;

        const card = document.createElement('div');
        card.className = 'card glass animate-view';
        card.innerHTML = `
            <div class="card-header">${key}</div>
            <div class="card-actions">
                <button class="action-btn btn-visit" onclick="window.open('${rawUrl}', '_blank')">Visit</button>
                <button class="action-btn btn-edit" data-id="${key}">Edit</button>
                <button class="action-btn btn-copy" data-url="${rawUrl}">Copy</button>
                <button class="action-btn btn-delete" data-id="${key}">Delete</button>
                <button class="action-btn btn-public">Public</button>
            </div>
            <div class="card-meta">
                <div class="meta-item">
                    <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                    ${item.updatedAt.split(',')[0]}
                </div>
                <div class="meta-item">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    ${item.chars || 0} chars
                </div>
                <div class="meta-item">
                    <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    ${item.views || 0} views
                </div>
            </div>
        `;
        cardsGrid.appendChild(card);
    });

    attachCardListeners();
}

// --- Search Filter ---
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = {};
    for (const key in currentApps) {
        if (key.toLowerCase().includes(term)) {
            filtered[key] = currentApps[key];
        }
    }
    renderCards(filtered);
});

// --- Action Listeners ---
function attachCardListeners() {
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            navigator.clipboard.writeText(e.target.dataset.url);
            const originalText = e.target.innerText;
            e.target.innerText = "Copied!";
            e.target.style.borderColor = "var(--accent)";
            e.target.style.color = "var(--accent)";
            setTimeout(() => {
                e.target.innerText = originalText;
                e.target.style.borderColor = "var(--glass-border)";
                e.target.style.color = "var(--text-main)";
            }, 2000);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if(confirm(`Delete '${id}' permanently?`)) {
                const updates = {};
                updates[`api_data/${currentUserUid}/${id}`] = null;
                updates[`api_metadata/${currentUserUid}/${id}`] = null;
                update(ref(db), updates).catch(err => alert("Error: " + err.message));
            }
        });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            editorTitle.innerText = `Editing App: ${id}`;
            appNameInput.value = id;
            appNameInput.disabled = true; 
            jsonInputArea.value = "Fetching data...";
            switchTab('editor');

            get(ref(db, `api_data/${currentUserUid}/${id}`)).then((snapshot) => {
                if(snapshot.exists()) {
                    jsonInputArea.value = JSON.stringify(snapshot.val(), null, 2);
                    setTimeout(autoResizeTextarea, 50); // Resize after fetching payload
                }
            });
        });
    });
}

// --- Save Logic ---
document.getElementById('saveBtn').addEventListener('click', () => {
    const appName = appNameInput.value.trim();
    const rawJson = jsonInputArea.value;

    if(!appName) return alert("Please provide an App Name.");
    if (/[.#$\[\]]/.test(appName)) return alert("Error: App name cannot contain '.', '#', '$', '[', or ']'");

    try {
        const parsedJson = JSON.parse(rawJson); 
        const charCount = JSON.stringify(parsedJson).length; 
        
        const currentDate = new Date().toLocaleString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const updates = {};
        updates[`api_data/${currentUserUid}/${appName}`] = parsedJson;
        updates[`api_metadata/${currentUserUid}/${appName}/updatedAt`] = currentDate;
        updates[`api_metadata/${currentUserUid}/${appName}/chars`] = charCount;
        
        get(ref(db, `api_metadata/${currentUserUid}/${appName}/views`)).then((snapshot) => {
            if (!snapshot.exists()) updates[`api_metadata/${currentUserUid}/${appName}/views`] = 0;
            
            update(ref(db), updates).then(() => {
                alert("App JSON deployed securely!");
                switchTab('list'); 
            }).catch(error => alert("Database Error: " + error.message));
        });

    } catch (e) {
        alert("Syntax Error: Invalid JSON format. Please check your brackets and commas.");
    }
});

// --- Login / Logout ---
document.getElementById('loginBtn').addEventListener('click', () => {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, e, p).catch(err => alert("Login failed: " + err.message));
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth);
});
