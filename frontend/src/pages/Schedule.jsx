//Schedule.jsx

import { useEffect, useState } from "react";
import API from "../services/api";

const Schedule = () => {
  const [matches, setMatches] = useState([]);
  const [selectedDate, setSelectedDate] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/match/all");

        // sort by date
        const sorted = res.data.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setMatches(sorted);
      } catch (err) {
        console.log(err);
      }
    };

    load();
  }, []);

  // 📅 group by date
  const grouped = matches.reduce((acc, m) => {
    const date = new Date(m.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    if (!acc[date]) acc[date] = [];
    acc[date].push(m);

    return acc;
  }, {});

  // 🧠 Smart Date Labeling
  const getDayLabel = (date) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return null;
  };

  // 🎯 Upgrades: Highlights & Filtering
  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const nextMatch = matches.find(m => m.status === "upcoming");

  const visibleDates = selectedDate === "all"
    ? Object.keys(grouped)
    : [selectedDate];

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
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    whiteSpace: "nowrap"
  };

  return (
    <div style={{
      maxWidth: "700px",
      margin: "auto",
      padding: "12px"
    }}>
      <h1 style={{
        textAlign: "center",
        fontSize: "clamp(24px, 6vw, 40px)"
      }}>
        📅 Match Schedule
      </h1>

      {/* 📅 Date Range Filter */}
      <div style={{
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        marginBottom: "20px",
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setSelectedDate("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: "none",
            cursor: "pointer",
            background: selectedDate === "all" ? "#4CAF50" : "#eee",
            color: selectedDate === "all" ? "white" : "black"
          }}
        >
          All
        </button>

        {Object.keys(grouped).map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background: selectedDate === date ? "#4CAF50" : "#eee",
              color: selectedDate === date ? "white" : "black"
            }}
          >
            {date}
          </button>
        ))}
      </div>

      {visibleDates.length === 0 ? (
        <p style={{ textAlign: "center" }}>
          No matches scheduled
        </p>
      ) : (
        visibleDates.map((date) => (
          <div key={date} style={{ marginBottom: "20px" }}>

            {/* Date Heading */}
            <h2 style={{
              textAlign: "center",
              margin: "25px 0 10px",
              fontSize: "18px",
              opacity: 0.8,
              color: date === todayStr ? "#4CAF50" : "inherit"
            }}>
              ─── {date} {date === todayStr && "(Today)"} ───
            </h2>

            {/* Matches of that date */}
            {grouped[date].map((m) => {
              const label = getDayLabel(m.date);
              
              return (
                <div key={m._id} style={{
                  padding: "12px 16px",
                  margin: "12px 0",
                  borderRadius: "12px",
                  background: "#1f1f1f",
                  color: "white",
                  borderLeft: `5px solid ${
                    m.status === "live"
                      ? "red"
                      : m.status === "completed"
                      ? "green"
                      : "orange"
                  }`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                }}>
                  <h4 style={{ margin: 0, fontSize: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{m.teamA?.name || m.teamA} vs {m.teamB?.name || m.teamB}</span>
                    
                    {nextMatch?._id === m._id && (
                      <span style={{
                        color: "#4CAF50",
                        fontSize: "12px",
                        background: "rgba(76, 175, 80, 0.1)",
                        padding: "2px 8px",
                        borderRadius: "10px"
                      }}>
                        🔥 Next Match
                      </span>
                    )}
                  </h4>

                  {/* 🏷️ Badges */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "10px 0" }}>
                    <span style={badgeStyle}>{m.category || m.type || "Match"}</span>
                    {m.gameClass && <span style={badgeStyle}>{m.gameClass}</span>}
                  </div>

                  <p style={{ fontSize: "13px", color: "#bbb", margin: "5px 0 0" }}>
                    👤 {m.playersA?.join(" & ")} vs {m.playersB?.join(" & ")}
                  </p>

                  <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: "8px 0", color: "#ccc" }}>
                    ⏱ {new Date(m.date).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                    {label && (
                      <span style={{ marginLeft: "10px", color: "#4CAF50", fontSize: "12px", fontWeight: "bold" }}>
                        ({label})
                      </span>
                    )}
                  </p>

                  {m.status !== "upcoming" && (
                    <div style={{ fontSize: "15px", fontWeight: "bold", color: "#ddd", marginTop: "8px" }}>
                      Sets: <span style={{ color: m.status === "live" ? "#ff4d4d" : "#4CAF50" }}>{getSetScore(m.sets, m.scoreA, m.scoreB)}</span>
                    </div>
                  )}

                  <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      background: m.status === "live" ? "#ff4d4d" : m.status === "completed" ? "#4CAF50" : "#ff9800",
                      color: "white",
                      fontWeight: "bold"
                    }}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};

export default Schedule;