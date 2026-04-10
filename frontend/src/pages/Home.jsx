//Home.jsx

import { useEffect, useState } from "react";
import API from "../services/api";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState("live");
  const [prevScores, setPrevScores] = useState({});

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await API.get("/match/all");
        setMatches(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    loadMatches();

    socket.on("matchUpdated", (updated) => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m._id === updated._id) {
            // 🎯 Track old score for flash effect
            setPrevScores((ps) => ({
              ...ps,
              [m._id]: m.sets ? m.sets.map(s => `${s.scoreA}-${s.scoreB}`).join(',') : `${m.scoreA}-${m.scoreB}`
            }));
            return updated;
          }
          return m;
        })
      );
    });

    return () => socket.off("matchUpdated");
  }, []);

  const filtered = matches.filter((m) => m.status === tab);

  // 🎯 Calculate overall sets score
  const getSetScore = (sets, scoreA, scoreB) => {
    let a = 0, b = 0;
    const matchSets = sets?.length ? sets : [{ scoreA: scoreA || 0, scoreB: scoreB || 0 }];
    matchSets.forEach(s => {
      if (s.scoreA > s.scoreB) a++;
      else if (s.scoreB > s.scoreA) b++;
    });
    return `${a} - ${b}`;
  };

  const badgeStyle = {
    background: "#222",
    color: "white",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    whiteSpace: "nowrap"
  };

  return (
    <div style={{
      maxWidth: "900px",
      width: "100%",
      margin: "auto",
      padding: "15px",
      fontFamily: "Arial"
    }}>
      
      {/* 🔴 Blink Animation for LIVE Indicator */}
      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* � Responsive Heading */}
      <h1 style={{
        textAlign: "center",
        fontSize: "clamp(24px, 5vw, 42px)",
        lineHeight: "1.2",
        marginBottom: "20px",
        wordBreak: "break-word"
      }}>
        🏸 DSAI Badminton Premier League <br />
        <span style={{ fontSize: "0.8em", opacity: 0.8 }}>
          2026
        </span>
      </h1>

      {/* Tabs */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        margin: "20px 0",
        flexWrap: "wrap"
      }}>
        {["live", "upcoming", "completed"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background: tab === t ? "#4CAF50" : "#eee",
              color: tab === t ? "white" : "black"
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Matches */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: "center" }}>
          No {tab} matches
        </p>
      ) : (
        filtered.map((m) => {
          // 🎯 Detect if score changed
          const prev = prevScores[m._id];
          const curr = m.sets ? m.sets.map(s => `${s.scoreA}-${s.scoreB}`).join(',') : `${m.scoreA}-${m.scoreB}`;
          const changed = prev && prev !== curr;

          return (
            <div
              key={m._id}
              style={{
                borderRadius: "15px",
                padding: "15px",
                marginBottom: "15px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                background:
                  m.status === "live" ? "#fff3f3" : "white",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <h3 style={{ margin: 0 }}>
              {m.teamA?.name || m.teamA} vs {m.teamB?.name || m.teamB}
              </h3>

              {/* 🏷️ Badges */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "8px 0" }}>
                <span style={badgeStyle}>{m.category || m.type || "Match"}</span>
                {m.gameClass && <span style={badgeStyle}>{m.gameClass}</span>}
              </div>

              <p style={{ margin: "5px 0", color: "#555" }}>
                👤 {m.playersA?.join(" & ")} vs {m.playersB?.join(" & ")}
              </p>

              <p style={{ color: "#666" }}>
                {new Date(m.date).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </p>

              <p>
                Status:{" "}
                <b style={{
                  color: m.status === "live" ? "red" : m.status === "completed" ? "green" : "orange"
                }}>
                  {m.status.toUpperCase()}
                </b>
                
                {/* 🔴 LIVE Pulse Indicator */}
                {m.status === "live" && (
                  <span style={{
                    marginLeft: "10px",
                    color: "red",
                    fontWeight: "bold",
                    animation: "blink 1s infinite"
                  }}>
                    ● LIVE
                  </span>
                )}
              </p>

              {/* 👑 Leading Team */}
              {m.status === "live" && (
                <p>
                  Leading:{" "}
                  <b>
                {(() => {
                  let a = 0, b = 0;
                  const matchSets = m.sets?.length ? m.sets : [{scoreA: m.scoreA||0, scoreB: m.scoreB||0}];
                  matchSets.forEach(s => {
                    if (s.scoreA > s.scoreB) a++;
                    else if (s.scoreB > s.scoreA) b++;
                  });
                  return a > b ? (m.teamA?.name || m.teamA) : b > a ? (m.teamB?.name || m.teamB) : "Tie";
                })()}
                  </b>
                </p>
              )}

              {/* 🏆 Overall Set Score Header */}
              {m.status !== "upcoming" && (
                <h3 style={{ margin: "12px 0 8px", fontSize: "18px", color: "#333" }}>
                  Sets: {getSetScore(m.sets, m.scoreA, m.scoreB)}
                </h3>
              )}

              {/* ⚡ Animated Score */}
              {m.status !== "upcoming" && (
              <div style={{
                  background: changed ? "yellow" : "transparent",
                transition: "0.3s",
                  borderRadius: "8px",
                padding: "5px 0"
                }}>
                {(m.sets?.length ? m.sets : [{scoreA: m.scoreA||0, scoreB: m.scoreB||0}]).map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: s.scoreA > s.scoreB ? "#e6ffe6" : s.scoreB > s.scoreA ? "#ffe6e6" : "#f9f9f9", padding: "8px 12px", margin: "5px 0", borderRadius: "6px", border: "1px solid #eee" }}>
                    <span style={{ fontSize: "14px", color: "#555", fontWeight: "bold" }}>Set {i + 1}</span>
                    <strong style={{ fontSize: "20px", color: m.status === "live" ? "#ff4d4d" : "#222" }}>{s.scoreA} - {s.scoreB}</strong>
                    <span style={{ fontSize: "12px", color: "#888", width: "60px", textAlign: "right" }}>
                      {s.scoreA > s.scoreB ? `🏆 ${m.teamA?.name || m.teamA}` : s.scoreB > s.scoreA ? `🏆 ${m.teamB?.name || m.teamB}` : "-"}
                    </span>
                  </div>
                ))}
              </div>
              )}

              {m.status === "completed" && (
                <p>
                🏆 Winner: <b>{m.winner?.name || m.winner}</b>
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Home;