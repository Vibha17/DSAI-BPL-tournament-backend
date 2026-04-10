const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
    teamA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    },
    teamB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    },

    // players
    playersA: [String],
    playersB: [String],

    // sets
    sets: {
        type: [
            {
                scoreA: { type: Number, default: 0 },
                scoreB: { type: Number, default: 0 },
                winner: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Team"
                }
            }
        ],
        default: [
            { scoreA: 0, scoreB: 0 },
            { scoreA: 0, scoreB: 0 },
            { scoreA: 0, scoreB: 0 }
        ]
    },

    // match type (singles / doubles)
    type: {
        type: String,
        enum: ["singles", "doubles"],
        required: true
    },

    // status
    status: {
        type: String,
        enum: ["upcoming", "live", "completed"],
        default: "upcoming"
    },

    // winner
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    },

    // max points (21 or custom)
    maxPoints: {
        type: Number,
        default: 21
    },

    // date & venue
    date: {
        type: Date,
        required: true
    },
    venue: {
        type: String,
        default: "IIT Guwahati Badminton Court"
    }

}, { timestamps: true });

module.exports = mongoose.model("Match", matchSchema);