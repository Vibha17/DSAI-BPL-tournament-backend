const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const matchRoutes = require("./routes/matchRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();
const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

global.io = io;

// Middleware
app.use(cors({
    origin: "*"
}));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.send("Backend running 🚀");
});

app.use("/api/match", matchRoutes);
app.use("/api/team", teamRoutes);

// Socket connection
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});