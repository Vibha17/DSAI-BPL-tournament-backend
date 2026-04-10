// Leaderboard.jsx

import { useEffect, useState } from "react";
import API from "../services/api";

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/team/all");
        // Ensure teams are sorted in decreasing order of their wins
        setTeams(res.data.sort((a, b) => b.wins - a.wins));
      } catch (err) {
        console.log(err);
      }
    };
    load();
  }, []);

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "15px", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center", fontSize: "clamp(24px, 5vw, 36px)" }}>
        🏆 Scoreboard
      </h1>

      {teams.map((t, i) => (
        <div key={t._id} style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "15px 20px",
          margin: "8px 0",
          borderRadius: "10px",
          background: i === 0 ? "#fffbe6" : i === 1 ? "#f5f5f5" : i === 2 ? "#fff0f5" : "#fff",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          fontSize: "18px",
          border: "1px solid #eaeaea"
        }}>
          <span>
            <b>#{i + 1} {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ""}</b> {t.name}
          </span>
          <span style={{ color: "#4CAF50", fontWeight: "bold" }}>{t.wins} wins</span>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;