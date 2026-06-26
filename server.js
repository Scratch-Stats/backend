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
