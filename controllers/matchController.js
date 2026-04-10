const Match = require("../models/Match");

// Create match
const createMatch = async (req, res) => {
    try {
        const match = new Match(req.body);
        const saved = await match.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all matches
const getMatches = async (req, res) => {
    try {
        const matches = await Match.find()
            .populate("teamA")
            .populate("teamB")
            .populate("winner")
            .sort({ date: 1 });
        res.json(matches);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update score or match details
const updateMatch = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await Match.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        // 🔥 Emit live update
        global.io.emit("matchUpdated", updated);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete match
const deleteMatch = async (req, res) => {
    try {
        const { id } = req.params;

        await Match.findByIdAndDelete(id);

        res.json({ message: "Match deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createMatch,
    getMatches,
    updateMatch,
    deleteMatch
};