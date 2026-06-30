// ===============================
// IMPORTS (CommonJS)
// ===============================
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===============================
// TOKEN PROTECTION MIDDLEWARE
// ===============================
function requireAdmin(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || auth !== "Bearer ADMIN_TOKEN") {
        return res.status(403).json({ error: "Admin token required" });
    }

    next();
}

// ===============================
// Helper: Fetch Scratch API
// ===============================
async function fetchScratch(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Scratch API error: ${response.status}`);
    }
    return response.json();
}

// ===============================
// Scratch Search Routes
// ===============================
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

// ===============================
// Scratch User & Project Info
// ===============================
app.get("/api/user/:username", async (req, res) => {
    try {
        const data = await fetchScratch(
            `https://api.scratch.mit.edu/users/${req.params.username}`
        );
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/project/:id", async (req, res) => {
    try {
        const data = await fetchScratch(
            `https://api.scratch.mit.edu/projects/${req.params.id}`
        );
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===============================
// JSON Helpers
// ===============================
function loadJSON(file) {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
}

function saveJSON(file, data) {
    fs.writeFileSync(
        path.join(process.cwd(), file),
        JSON.stringify(data, null, 2)
    );
}

// ===============================
// Featured Content
// ===============================
app.get("/featured", (req, res) => {
    res.json(loadJSON("featured.json"));
});

app.post("/featured/add", requireAdmin, (req, res) => {
    const { type, item } = req.body;
    if (!type || !item) return res.status(400).json({ error: "Missing data" });

    const data = loadJSON("featured.json");

    const key =
        type === "projects"
            ? "featuredProjects"
            : type === "studios"
            ? "featuredStudios"
            : "featuredUsers";

    data[key].unshift(item);
    if (data[key].length > 6) data[key].pop();

    saveJSON("featured.json", data);
    res.json({ success: true });
});

app.post("/featured/remove", requireAdmin, (req, res) => {
    const { type, index } = req.body;
    if (index === undefined || !type)
        return res.status(400).json({ error: "Missing data" });

    const data = loadJSON("featured.json");

    const key =
        type === "projects"
            ? "featuredProjects"
            : type === "studios"
            ? "featuredStudios"
            : "featuredUsers";

    data[key].splice(index, 1);

    saveJSON("featured.json", data);
    res.json({ success: true });
});

// ===============================
// Verified Users
// ===============================
app.get("/verified", (req, res) => {
    res.json(loadJSON("verified.json"));
});

app.post("/verified/add", requireAdmin, (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    const data = loadJSON("verified.json");
    if (!data.verifiedUsers.includes(username)) {
        data.verifiedUsers.push(username);
        saveJSON("verified.json", data);
    }

    res.json({ success: true });
});

app.post("/verified/remove", requireAdmin, (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    const data = loadJSON("verified.json");
    data.verifiedUsers = data.verifiedUsers.filter(u => u !== username);

    saveJSON("verified.json", data);
    res.json({ success: true });
});

// ===============================
// Admin Accounts
// ===============================
app.get("/admins", (req, res) => {
    res.json(loadJSON("admins.json"));
});

app.post("/admins/add", requireAdmin, (req, res) => {
    const { username, rank } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    const data = loadJSON("admins.json");
    data.adminAccounts.push({ username, rank: rank || "Admin" });

    saveJSON("admins.json", data);
    res.json({ success: true });
});

app.post("/admins/remove", requireAdmin, (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    const data = loadJSON("admins.json");
    data.adminAccounts = data.adminAccounts.filter(a => a.username !== username);

    saveJSON("admins.json", data);
    res.json({ success: true });
});

// ===============================
// Login
// ===============================
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const loginData = loadJSON("login.json");

    if (
        username === loginData.owner.username &&
        password === loginData.owner.password
    ) {
        return res.json({ success: true, token: "ADMIN_TOKEN" });
    }

    res.status(401).json({ error: "Invalid credentials" });
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
