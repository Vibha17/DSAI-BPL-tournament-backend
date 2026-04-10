const express = require("express");
const router = express.Router();

const {
    createMatch,
    getMatches,
    updateMatch,
    deleteMatch
} = require("../controllers/matchController");

// Create
router.post("/create", createMatch);

// Get all
router.get("/all", getMatches);

// Update
router.put("/update/:id", updateMatch);

// Delete
router.delete("/delete/:id", deleteMatch);

module.exports = router;