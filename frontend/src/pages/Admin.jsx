import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

// ✅ stable socket connection
const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"]
});

const Admin = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [delayState, setDelayState] = useState({ id: null, date: "" });
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [scoreState, setScoreState] = useState({ id: null, sets: [] });
  const [editState, setEditState] = useState({ id: null, sets: [], winner: "" });

  const [form, setForm] = useState({
    teamA: "",
    teamB: "",
    playersA: [""],
    playersB: [""],
    category: "Men's Singles",
    status: "upcoming",
    date: ""
  });

  useEffect(() => {
    if (!localStorage.getItem("admin")) {
      navigate("/admin");
    }
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const [matchRes, teamRes] = await Promise.all([
          API.get("/match/all"),
          API.get("/team/all")
        ]);
        setMatches(
          matchRes.data.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          )
        );
        setTeams(teamRes.data);
      } catch (e) {
        console.log(e);
      }
    };

    load();

    socket.on("matchUpdated", (u) => {
      setMatches((prev) =>
        prev
          .map((m) => (m._id === u._id ? u : m))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );
    });

    return () => socket.off("matchUpdated");
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "category") {
      const isDoubles = e.target.value === "Doubles" || e.target.value === "Mixed Doubles";
      setForm({
        ...form,
        category: e.target.value,
        playersA: isDoubles ? ["", ""] : [""],
        playersB: isDoubles ? ["", ""] : [""]
      });
      return;
    }
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // 🎯 Styles
  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box"
  };

  const btnStyle = {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    background: "#eee",
    transition: "0.2s"
  };

  const cardStyle = {
    background: "white",
    borderRadius: "15px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  };

  const badgeStyle = {
    background: "#eee",
    color: "#333",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap"
  };

  // ➕ Add Team
  const handleAddTeam = async () => {
    if (!teamName.trim()) return;
    try {
      const res = await API.post("/team/add", { name: teamName });
      setTeams([...teams, res.data]);
      setTeamName("");
      alert("Team Added ✅");
    } catch (e) {
      console.log(e);
    }
  };

  // ➕ Add Match
  const addMatch = async () => {
    try {
      if (!form.teamA || !form.teamB) {
        alert("Enter team names ❗");
        return;
      }
      
      if (form.teamA === form.teamB) {
        alert("Teams cannot be the same ❗");
        return;
      }

      if (form.playersA.some(p => !p) || form.playersB.some(p => !p)) {
        alert("Enter all player names ❗");
        return;
      }

      if (!form.date) {
        alert("Select date & time ❗");
        return;
      }

      if (new Date(form.date) < new Date()) {
        alert("Date should be future ❗");
        return;
      }

      await API.post("/match/create", form);
      alert("Match Added ✅");

      setForm({
        teamA: "",
        teamB: "",
        playersA: [""],
        playersB: [""],
        category: "Men's Singles",
        status: "upcoming",
        date: ""
      });

      const res = await API.get("/match/all");
      setMatches(
        res.data.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        )
      );

    } catch (err) {
      console.log(err);
    }
  };

  // ▶ Start
  const startMatch = async (id) => {
    const match = matches.find((m) => m._id === id);
    if (match?.status !== "upcoming") return; // Safety guard

    if (!window.confirm("Start this match now? (The scheduled time will be updated to right now)")) return;
    const now = new Date().toISOString();
    await API.put(`/match/update/${id}`, { status: "live", date: now });
  };

  // ⏰ Delay
  const openDelayPicker = (m) => {
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const d = new Date(m.date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d - tzOffset).toISOString().slice(0, 16);
    setDelayState({ id: m._id, date: localISOTime });
  };

  const saveDelay = async () => {
    if (!delayState.date) return;
    await API.put(`/match/update/${delayState.id}`, { date: delayState.date });
    setDelayState({ id: null, date: "" });
  };

  const cancelDelay = () => {
    setDelayState({ id: null, date: "" });
  };

  // 🔴 Update score
  const saveScore = async (id) => {
    const match = matches.find((m) => m._id === id);
    if (match?.status === "completed") {
      alert("Match already completed ❌");
      setScoreState({ id: null, sets: [] });
      return;
    }

    await API.put(`/match/update/${id}`, {
      sets: scoreState.sets
    });
    setScoreState({ id: null, sets: [] });
  };

  // 🟢 End match
  const endMatch = async (id, teamA, teamB, sets, legacyA, legacyB) => {
    let a = 0, b = 0;
    const matchSets = sets?.length ? sets : [{scoreA: legacyA||0, scoreB: legacyB||0}];
    
    matchSets.forEach(s => {
      if (s.scoreA > s.scoreB) a++;
      else if (s.scoreB > s.scoreA) b++;
    });

    let winner =
      a > b ? (typeof teamA === 'object' ? teamA._id : teamA) :
      b > a ? (typeof teamB === 'object' ? teamB._id : teamB) :
      null;

    if (!winner) {
      alert("Match is tied or incomplete! Update the score first.");
      return;
    }

    if (!window.confirm("End match and declare winner?")) return;

    await API.put(`/match/update/${id}`, {
      status: "completed",
      winner
    });
  };

  // 🟢 Edit
  const saveEdit = async (id) => {
    if (!editState.winner) {
      alert("Select a winner");
      return;
    }

    await API.put(`/match/update/${id}`, {
      sets: editState.sets,
      winner: editState.winner
    });
    setEditState({ id: null, sets: [], winner: "" });
  };

  // ❌ Delete
  const deleteMatch = async (id) => {
    if (!window.confirm("Delete match?")) return;

    await API.delete(`/match/delete/${id}`);
    setMatches((prev) => prev.filter((m) => m._id !== id));
  };

  const getColor = (s) =>
    s === "live" ? "red" :
    s === "completed" ? "green" :
    "orange";

  const format = (s) =>
    s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div style={{
      maxWidth: "900px",
      width: "100%",
      margin: "auto",
      padding: "15px",
      fontFamily: "Arial"
    }}>

      {/* 🔐 Heading */}
      <h1 style={{
        textAlign: "center",
        fontSize: "clamp(26px, 5vw, 38px)",
        marginBottom: "20px"
      }}>
        🔐 Admin Dashboard
      </h1>

      {/* ➕ Add Team */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#222" }}>➕ Add Team</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <button
            style={{ ...btnStyle, background: "#2196F3", color: "white", fontWeight: "bold" }}
            onClick={handleAddTeam}
            onMouseOver={(e) => e.target.style.opacity = 0.8}
            onMouseOut={(e) => e.target.style.opacity = 1}
          >
            Add
          </button>
        </div>
      </div>

      {/* ➕ Add Match */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#222" }}>➕ Add Match</h2>
        <div style={{ display: "grid", gap: "12px" }}>
      <select style={inputStyle} name="teamA" value={form.teamA} onChange={handleChange}>
        <option value="">Select Team A</option>
        {teams.map(t => (
          <option key={t._id} value={t._id}>{t.name}</option>
        ))}
      </select>
      
      <select style={inputStyle} name="teamB" value={form.teamB} onChange={handleChange}>
        <option value="">Select Team B</option>
        {teams.map(t => (
          <option key={t._id} value={t._id}>{t.name}</option>
        ))}
      </select>

        <select style={inputStyle} name="category" value={form.category} onChange={handleChange}>
          <option value="Men's Singles">Men's Singles</option>
          <option value="Women's Singles">Women's Singles</option>
          <option value="Doubles">Doubles</option>
          <option value="Mixed Doubles">Mixed Doubles</option>
        </select>

        {/* Players A */}
        <h4 style={{ margin: "5px 0 0" }}>Players - Team A</h4>
        {form.playersA.map((p, i) => (
          <input
            key={`pa-${i}`}
            placeholder={`Player ${i + 1}`}
            value={p}
            onChange={(e) => {
              const arr = [...form.playersA];
              arr[i] = e.target.value;
              setForm({ ...form, playersA: arr });
            }}
            style={inputStyle}
          />
        ))}

        {/* Players B */}
        <h4 style={{ margin: "5px 0 0" }}>Players - Team B</h4>
        {form.playersB.map((p, i) => (
          <input
            key={`pb-${i}`}
            placeholder={`Player ${i + 1}`}
            value={p}
            onChange={(e) => {
              const arr = [...form.playersB];
              arr[i] = e.target.value;
              setForm({ ...form, playersB: arr });
            }}
            style={inputStyle}
          />
        ))}

        <input
          style={inputStyle}
          type="datetime-local"
          name="date"
          value={form.date}
          onChange={handleChange}
        />

        <button
          onClick={addMatch}
          style={{
            ...inputStyle,
            background: "#4CAF50",
            color: "white",
            fontWeight: "bold",
            transition: "0.2s",
            cursor: "pointer"
          }}
          onMouseOver={(e) => e.target.style.opacity = 0.8}
          onMouseOut={(e) => e.target.style.opacity = 1}
        >
          ➕ Add Match
        </button>
      </div>
      </div>

      {/* 📋 Matches */}
      {matches.length === 0 ? (
        <p style={{ textAlign: "center" }}>No matches</p>
      ) : (
        matches.map((m) => (
          <div
            key={m._id}
            style={{
              borderRadius: "15px",
              padding: "15px",
              marginBottom: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              borderLeft: `5px solid ${
                m.status === "live"
                  ? "red"
                  : m.status === "completed"
                  ? "green"
                  : "orange"
              }`,
              background: "white"
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

            <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
              👤 {m.playersA?.join(" & ")} vs {m.playersB?.join(" & ")}
            </p>

            <p style={{ color: getColor(m.status), fontWeight: "bold" }}>
              {format(m.status)}
            </p>

            <p style={{ color: "#666" }}>
              {new Date(m.date).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short"
              })}
            </p>

            {m.status !== "upcoming" && (
              <div style={{ margin: "10px 0", background: "#f8f8f8", padding: "10px", borderRadius: "8px" }}>
                {(m.sets?.length ? m.sets : [{scoreA: m.scoreA||0, scoreB: m.scoreB||0}]).map((s, idx) => (
                  <div key={idx} style={{ fontSize: "15px", marginBottom: "4px" }}>
                    <b>Set {idx + 1}:</b> {s.scoreA} - {s.scoreB} 
                    <span style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}>
                      {s.scoreA > s.scoreB ? `(${m.teamA?.name || m.teamA})` : s.scoreB > s.scoreA ? `(${m.teamB?.name || m.teamB})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {m.status === "completed" && (
            <p>🏆 Winner: <b>{m.winner?.name || m.winner}</b></p>
            )}

            {/* 🎮 Actions */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "10px"
            }}>

              {m.status === "upcoming" && (
                <>
                  <button
                    style={{ ...btnStyle, background: "#4CAF50", color: "white" }}
                    onClick={() => startMatch(m._id)}
                    onMouseOver={(e) => e.target.style.opacity = 0.8}
                    onMouseOut={(e) => e.target.style.opacity = 1}
                  >
                    ▶ Start
                  </button>
                  
                  {delayState.id === m._id ? (
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <input
                        type="datetime-local"
                        value={delayState.date}
                        onChange={(e) => setDelayState({ ...delayState, date: e.target.value })}
                        style={{ padding: "5px", borderRadius: "5px", border: "1px solid #ccc" }}
                      />
                      <button
                        style={{ ...btnStyle, background: "#4CAF50", color: "white" }}
                        onClick={saveDelay}
                        onMouseOver={(e) => e.target.style.opacity = 0.8}
                        onMouseOut={(e) => e.target.style.opacity = 1}
                      >Save</button>
                      <button
                        style={{ ...btnStyle, background: "#ccc" }}
                        onClick={cancelDelay}
                        onMouseOver={(e) => e.target.style.opacity = 0.8}
                        onMouseOut={(e) => e.target.style.opacity = 1}
                      >Cancel</button>
                    </div>
                  ) : (
                    <button
                      style={{ ...btnStyle, background: "#ff9800", color: "white" }}
                      onClick={() => openDelayPicker(m)}
                      onMouseOver={(e) => e.target.style.opacity = 0.8}
                      onMouseOut={(e) => e.target.style.opacity = 1}
                    >
                      ⏰ Delay
                    </button>
                  )}
                </>
              )}

              {m.status === "live" && (
                <>
                  {scoreState.id === m._id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", padding: "10px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
                      {scoreState.sets.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: "bold" }}>Set {i + 1}</span>
                          <input type="number" value={s.scoreA} onChange={(e) => { const newSets = [...scoreState.sets]; newSets[i].scoreA = Number(e.target.value); setScoreState({...scoreState, sets: newSets}); }} style={{ padding: "5px", width: "50px", borderRadius: "5px", border: "1px solid #ccc" }} />
                          <span>-</span>
                          <input type="number" value={s.scoreB} onChange={(e) => { const newSets = [...scoreState.sets]; newSets[i].scoreB = Number(e.target.value); setScoreState({...scoreState, sets: newSets}); }} style={{ padding: "5px", width: "50px", borderRadius: "5px", border: "1px solid #ccc" }} />
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                        <button
                          style={{ ...btnStyle, background: "#4CAF50", color: "white" }}
                          onClick={() => saveScore(m._id)}
                          onMouseOver={(e) => e.target.style.opacity = 0.8}
                          onMouseOut={(e) => e.target.style.opacity = 1}
                        >Save</button>
                        <button
                          style={{ ...btnStyle, background: "#ccc" }}
                          onClick={() => setScoreState({ id: null, sets: [] })}
                          onMouseOver={(e) => e.target.style.opacity = 0.8}
                          onMouseOut={(e) => e.target.style.opacity = 1}
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      style={{ ...btnStyle, background: "#2196F3", color: "white" }}
                      onClick={() => setScoreState({ id: m._id, sets: m.sets?.length ? m.sets : [{scoreA: m.scoreA||0, scoreB: m.scoreB||0}, {scoreA:0, scoreB:0}, {scoreA:0, scoreB:0}] })}
                      onMouseOver={(e) => e.target.style.opacity = 0.8}
                      onMouseOut={(e) => e.target.style.opacity = 1}
                    >
                      Update Score
                    </button>
                  )}
                  
                  {scoreState.id !== m._id && (
                    <button
                      style={{ ...btnStyle, background: "#9c27b0", color: "white" }}
                      onClick={() => endMatch(m._id, m.teamA, m.teamB, m.sets, m.scoreA, m.scoreB)}
                      onMouseOver={(e) => e.target.style.opacity = 0.8}
                      onMouseOut={(e) => e.target.style.opacity = 1}
                    >
                      End
                    </button>
                  )}
                </>
              )}

              {m.status === "completed" && (
                <>
                  {editState.id === m._id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", padding: "10px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
                      {editState.sets.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: "bold" }}>Set {i + 1}</span>
                          <input type="number" value={s.scoreA} onChange={(e) => { const newSets = [...editState.sets]; newSets[i].scoreA = Number(e.target.value); setEditState({...editState, sets: newSets}); }} style={{ padding: "5px", width: "50px", borderRadius: "5px", border: "1px solid #ccc" }} />
                          <span>-</span>
                          <input type="number" value={s.scoreB} onChange={(e) => { const newSets = [...editState.sets]; newSets[i].scoreB = Number(e.target.value); setEditState({...editState, sets: newSets}); }} style={{ padding: "5px", width: "50px", borderRadius: "5px", border: "1px solid #ccc" }} />
                        </div>
                      ))}
                      <select value={editState.winner} onChange={(e) => setEditState({ ...editState, winner: e.target.value })} style={{ padding: "5px", borderRadius: "5px", border: "1px solid #ccc", marginTop: "5px" }}>
                        <option value="">Select Winner</option>
                        <option value={m.teamA?._id || m.teamA}>{m.teamA?.name || m.teamA}</option>
                        <option value={m.teamB?._id || m.teamB}>{m.teamB?.name || m.teamB}</option>
                      </select>
                      <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                        <button
                          style={{ ...btnStyle, background: "#4CAF50", color: "white" }}
                          onClick={() => saveEdit(m._id)}
                          onMouseOver={(e) => e.target.style.opacity = 0.8}
                          onMouseOut={(e) => e.target.style.opacity = 1}
                        >Save</button>
                        <button
                          style={{ ...btnStyle, background: "#ccc" }}
                          onClick={() => setEditState({ id: null, sets: [], winner: "" })}
                          onMouseOver={(e) => e.target.style.opacity = 0.8}
                          onMouseOut={(e) => e.target.style.opacity = 1}
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      style={{ ...btnStyle, background: "#eee", color: "black" }}
                      onClick={() => setEditState({ id: m._id, sets: m.sets?.length ? m.sets : [{scoreA: m.scoreA||0, scoreB: m.scoreB||0}, {scoreA:0, scoreB:0}, {scoreA:0, scoreB:0}], winner: m.winner?._id || m.winner })}
                      onMouseOver={(e) => e.target.style.opacity = 0.8}
                      onMouseOut={(e) => e.target.style.opacity = 1}
                    >
                      Edit
                    </button>
                  )}
                </>
              )}

              <button
                style={{ ...btnStyle, background: "#f44336", color: "white" }}
                onClick={() => deleteMatch(m._id)}
                onMouseOver={(e) => e.target.style.opacity = 0.8}
                onMouseOut={(e) => e.target.style.opacity = 1}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Admin;