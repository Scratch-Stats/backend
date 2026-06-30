import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper function to fetch from Scratch API
async function fetchScratch(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Scratch API error: ${response.status}`);
    }
    return response.json();
}

// Search projects
app.get("/api/search/projects", async (req, res) => {
    const { q, limit = 20 } = req.query;
    try {
        const data = await fetchScratch(
            `https://api.scratch.mit.edu/search/projects?q=${q}&limit=${limit}`
        );
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search users
app.get("/api/search/users", async (req, res) => {
    const { q, limit = 20 } = req.query;
    try {
        const data = await fetchScratch(
            `https://api.scratch.mit.edu/search/users?q=${q}&limit=${limit}`
        );
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user info
app.get("/api/user/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const data = await fetchScratch(
            `https://api.scratch.mit.edu/users/${username}`
        );
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get project info
app.get("/api/project/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const data = await fetchScratch(
            `https://api.scratch.mit.edu/projects/${id}`
        );
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});

import fs from "fs";
import path from "path";

// Path to featured.json
const featuredPath = path.join(process.cwd(), "featured.json");

// Helper: Load featured data
function loadFeatured() {
    const raw = fs.readFileSync(featuredPath, "utf8");
    return JSON.parse(raw);
}

// Helper: Save featured data
function saveFeatured(data) {
    fs.writeFileSync(featuredPath, JSON.stringify(data, null, 2));
}

// ===============================
// GET featured content
// ===============================
app.get("/featured", (req, res) => {
    try {
        const data = loadFeatured();
        res.json(data);
    } catch (err) {
        console.error("Error loading featured:", err);
        res.status(500).json({ error: "Failed to load featured content" });
    }
});

// ===============================
// ADD featured content
// ===============================
app.post("/featured/add", (req, res) => {
    const { type, item } = req.body;

    if (!type || !item) {
        return res.status(400).json({ error: "Missing type or item" });
    }

    try {
        const data = loadFeatured();

        if (type === "projects") {
            data.featuredProjects.unshift(item);
            if (data.featuredProjects.length > 6) data.featuredProjects.pop();
        }

        if (type === "studios") {
            data.featuredStudios.unshift(item);
            if (data.featuredStudios.length > 6) data.featuredStudios.pop();
        }

        if (type === "users") {
            data.featuredUsers.unshift(item);
            if (data.featuredUsers.length > 6) data.featuredUsers.pop();
        }

        saveFeatured(data);
        res.json({ success: true });

    } catch (err) {
        console.error("Error adding featured:", err);
        res.status(500).json({ error: "Failed to add featured content" });
    }
});

// ===============================
// REMOVE featured content
// ===============================
app.post("/featured/remove", (req, res) => {
    const { type, index } = req.body;

    if (index === undefined || !type) {
        return res.status(400).json({ error: "Missing type or index" });
    }

    try {
        const data = loadFeatured();

        if (type === "projects") data.featuredProjects.splice(index, 1);
        if (type === "studios") data.featuredStudios.splice(index, 1);
        if (type === "users") data.featuredUsers.splice(index, 1);

        saveFeatured(data);
        res.json({ success: true });

    } catch (err) {
        console.error("Error removing featured:", err);
        res.status(500).json({ error: "Failed to remove featured content" });
    }
});

import fs from "fs";
import path from "path";

const verifiedPath = path.join(process.cwd(), "verified.json");

function loadVerified() {
    return JSON.parse(fs.readFileSync(verifiedPath, "utf8"));
}

function saveVerified(data) {
    fs.writeFileSync(verifiedPath, JSON.stringify(data, null, 2));
}

// GET verified users
app.get("/verified", (req, res) => {
    res.json(loadVerified());
});

// ADD verified user
app.post("/verified/add", (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    const data = loadVerified();
    if (!data.verifiedUsers.includes(username)) {
        data.verifiedUsers.push(username);
        saveVerified(data);
    }

    res.json({ success: true });
});

// REMOVE verified user
app.post("/verified/remove", (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    const data = loadVerified();
    data.verifiedUsers = data.verifiedUsers.filter(u => u !== username);
    saveVerified(data);

    res.json({ success: true });
});

const adminsPath = path.join(process.cwd(), "admins.json");

function loadAdmins() {
    return JSON.parse(fs.readFileSync(adminsPath, "utf8"));
}

function saveAdmins(data) {
    fs.writeFileSync(adminsPath, JSON.stringify(data, null, 2));
}

// GET admin accounts
app.get("/admins", (req, res) => {
    res.json(loadAdmins());
});

// ADD admin
app.post("/admins/add", (req, res) => {
    const { username, rank } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    const data = loadAdmins();
    data.adminAccounts.push({ username, rank: rank || "Admin" });
    saveAdmins(data);

    res.json({ success: true });
});

// REMOVE admin
app.post("/admins/remove", (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    const data = loadAdmins();
    data.adminAccounts = data.adminAccounts.filter(a => a.username !== username);
    saveAdmins(data);

    res.json({ success: true });
});

const loginPath = path.join(process.cwd(), "login.json");

function loadLogin() {
    return JSON.parse(fs.readFileSync(loginPath, "utf8"));
}

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const loginData = loadLogin();

    if (
        username === loginData.owner.username &&
        password === loginData.owner.password
    ) {
        return res.json({ success: true, token: "ADMIN_TOKEN" });
    }

    res.status(401).json({ error: "Invalid credentials" });
});
