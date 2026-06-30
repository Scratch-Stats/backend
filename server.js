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
