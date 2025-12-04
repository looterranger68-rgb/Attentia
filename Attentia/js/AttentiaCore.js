/**
 * AttentiaCore.js
 * The central "Backend" for the client-side application.
 * Handles data persistence, user state, and adaptation logic.
 */

// --- Database Layer ---
class AttentiaDB {
    constructor() {
        this.STORAGE_KEY = 'attentia_data_v2'; // Bumped version for new schema
        this.data = this._load();
    }

    _load() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
            // Check for v1 data to migrate
            const v1Data = localStorage.getItem('attentia_data_v1');
            if (v1Data) {
                try {
                    const parsedV1 = JSON.parse(v1Data);
                    // Migrate v1 guest data to a default user
                    return {
                        users: {
                            'guest': {
                                password: 'guest', // Dummy password
                                data: parsedV1
                            }
                        },
                        currentUser: 'guest'
                    };
                } catch (e) {
                    console.warn('Migration failed', e);
                }
            }

            // Default fresh state
            return {
                users: {},
                currentUser: null
            };
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('AttentiaDB: Corrupt data, resetting.', e);
            return { users: {}, currentUser: null };
        }
    }

    _save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    reload() {
        this.data = this._load();
        console.log('[AttentiaDB] Reloaded data from storage');
    }

    // --- User Management ---
    createUser(username, password) {
        if (this.data.users[username]) {
            throw new Error('User already exists');
        }
        this.data.users[username] = {
            password: password, // In a real app, hash this!
            data: {
                user: { name: username, level: 1, xp: 0 },
                runs: {},
                settings: { theme: 'dark' }
            }
        };
        this._save();
    }

    getUser(username) {
        return this.data.users[username];
    }

    setCurrentUser(username) {
        if (username && !this.data.users[username]) {
            throw new Error('User not found');
        }
        this.data.currentUser = username;
        this._save();
    }

    getCurrentUser() {
        return this.data.currentUser;
    }

    // --- Data Access (Scoped to Current User) ---
    _getUserData() {
        const current = this.data.currentUser;
        if (!current || !this.data.users[current]) return null;
        return this.data.users[current].data;
    }

    saveRun(gameId, runData) {
        const userData = this._getUserData();
        if (!userData) return;

        if (!userData.runs[gameId]) {
            userData.runs[gameId] = [];
        }
        if (!runData.timestamp) runData.timestamp = Date.now();

        userData.runs[gameId].push(runData);
        this._save();
        console.log(`[AttentiaDB] Saved run for ${gameId} (User: ${this.data.currentUser})`, runData);
    }

    saveTasks(tasks) {
        const userData = this._getUserData();
        if (!userData) return;
        userData.tasks = tasks;
        this._save();
    }

    getTasks() {
        const userData = this._getUserData();
        if (!userData) return [];
        return userData.tasks || [];
    }

    getRuns(gameId) {
        const userData = this._getUserData();
        if (!userData) return [];
        return userData.runs[gameId] || [];
    }

    getUserProfile() {
        const userData = this._getUserData();
        if (!userData) return null;
        return userData.user;
    }

    updateUserProfile(updates) {
        const userData = this._getUserData();
        if (!userData) return;
        userData.user = { ...userData.user, ...updates };
        this._save();
    }

    // --- Book Progress ---
    saveBookProgress(bookId, progressData) {
        const userData = this._getUserData();
        if (!userData) return;

        if (!userData.books) {
            userData.books = {};
        }

        // Merge with existing progress or create new
        userData.books[bookId] = {
            ...userData.books[bookId],
            ...progressData,
            lastRead: Date.now()
        };

        this._save();
        console.log(`[AttentiaDB] Saved progress for book ${bookId}`, userData.books[bookId]);
    }

    getBookProgress(bookId) {
        const userData = this._getUserData();
        if (!userData || !userData.books) return null;
        return userData.books[bookId] || null;
    }
}

// --- Auth Service ---
class AuthService {
    constructor(db) {
        this.db = db;
    }

    register(username, password) {
        try {
            this.db.createUser(username, password);
            return { success: true, message: 'User created successfully' };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    login(username, password) {
        const user = this.db.getUser(username);
        if (!user || user.password !== password) {
            return { success: false, message: 'Invalid username or password' };
        }
        this.db.setCurrentUser(username);
        return { success: true, message: 'Login successful' };
    }

    logout() {
        this.db.setCurrentUser(null);
    }

    getCurrentUser() {
        return this.db.getCurrentUser();
    }

    isAuthenticated() {
        return !!this.db.getCurrentUser();
    }
}

// --- Adaptation Engine ---
class AdaptationEngine {
    constructor(db) {
        this.db = db;
    }

    getDifficulty(gameId) {
        const runs = this.db.getRuns(gameId);
        if (runs.length === 0) {
            return { level: 'easy', speed: 1.0, complexity: 1 };
        }

        const recent = runs.slice(-5);
        const wins = recent.filter(r => r.outcome === 'win').length;
        const winRate = wins / recent.length;

        if (winRate >= 0.8) {
            return { level: 'hard', speed: 1.5, complexity: 3 };
        } else if (winRate >= 0.5) {
            return { level: 'medium', speed: 1.2, complexity: 2 };
        } else {
            return { level: 'easy', speed: 1.0, complexity: 1 };
        }
    }
}

// --- Core Singleton ---
class AttentiaCoreService {
    constructor() {
        if (AttentiaCoreService.instance) {
            return AttentiaCoreService.instance;
        }
        this.db = new AttentiaDB();
        this.auth = new AuthService(this.db);
        this.adaptation = new AdaptationEngine(this.db);
        AttentiaCoreService.instance = this;

        console.log('Attentia Core Initialized (v2 Auth Enabled)');
        window.AttentiaCore = this;
        window.AuthService = this.auth; // Expose auth service globally
    }

    // Public API
    saveRun(gameId, runData) {
        this.db.saveRun(gameId, runData);
    }

    saveTasks(tasks) {
        this.db.saveTasks(tasks);
    }

    getTasks() {
        return this.db.getTasks();
    }

    getRuns(gameId) {
        return this.db.getRuns(gameId);
    }

    getDifficulty(gameId) {
        return this.adaptation.getDifficulty(gameId);
    }

    getUser() {
        return this.db.getUserProfile();
    }

    saveBookProgress(bookId, progress) {
        this.db.saveBookProgress(bookId, progress);
    }

    getBookProgress(bookId) {
        return this.db.getBookProgress(bookId);
    }

    reload() {
        this.db.reload();
    }

    // --- Auth Helpers ---
    _getLoginPath() {
        // Check if we are in the 'main' directory
        if (window.location.pathname.includes('/main/')) {
            return 'login.html';
        } else {
            return 'Attentia/main/login.html';
        }
    }

    requireAuth() {
        if (!this.auth.isAuthenticated()) {
            // Redirect to login if not authenticated
            window.location.href = this._getLoginPath();
        }
    }

    logout() {
        this.auth.logout();
        window.location.href = this._getLoginPath();
    }
}

// Initialize immediately
const AttentiaCore = new AttentiaCoreService();
