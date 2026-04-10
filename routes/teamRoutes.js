const express = require("express");
const router = express.Router();
const { addTeam, getTeams } = require("../controllers/teamController");

router.post("/add", addTeam);
router.get("/all", getTeams);

module.exports = router;