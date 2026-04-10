const Team = require("../models/Team");

// Add a new team
const addTeam = async (req, res) => {
  try {
    const team = new Team({ name: req.body.name });
    await team.save();
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all teams (sorted by wins for the leaderboard)
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find().sort({ wins: -1 });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addTeam, getTeams };