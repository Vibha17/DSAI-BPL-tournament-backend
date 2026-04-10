const mongoose = require("mongoose");
require("dotenv").config();

const Team = require("./models/Team");
const Match = require("./models/Match");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // 🧹 CLEAR OLD DATA
    await Team.deleteMany();
    await Match.deleteMany();

    console.log("Old data removed ❌");

    // 🧑‍🤝‍🧑 CREATE TEAMS
    const teams = await Team.insertMany([
      { name: "DSAI 3rd Year" },
      { name: "CSE 2nd Year" },
      { name: "ECE" },
      { name: "ME" },
      { name: "Civil" },
      { name: "Chemical" }
    ]);

    console.log("Teams added ✅");

    // 📌 Helper to get team by name
    const getTeam = (name) => teams.find(t => t.name === name)._id;

    // 🏸 CREATE MATCHES
    await Match.insertMany([
      {
        teamA: getTeam("DSAI 3rd Year"),
        teamB: getTeam("CSE 2nd Year"),
        playersA: ["Rahul"],
        playersB: ["Aman"],
        type: "singles",
        status: "live",
        scoreA: 10,
        scoreB: 8,
        date: new Date(Date.now() + 1000 * 60 * 30) // +30 min
      },
      {
        teamA: getTeam("ECE"),
        teamB: getTeam("ME"),
        playersA: ["Rohit", "Kunal"],
        playersB: ["Arjun", "Dev"],
        type: "doubles",
        status: "upcoming",
        date: new Date(Date.now() + 1000 * 60 * 60 * 2) // +2 hr
      },
      {
        teamA: getTeam("Civil"),
        teamB: getTeam("Chemical"),
        playersA: ["Suresh"],
        playersB: ["Mahesh"],
        type: "singles",
        status: "completed",
        scoreA: 21,
        scoreB: 15,
        winner: getTeam("Civil"),
        date: new Date(Date.now() - 1000 * 60 * 60) // past
      }
    ]);

    console.log("Matches added ✅");

    process.exit();

  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

seed();