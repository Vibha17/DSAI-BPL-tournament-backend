//Navbar.jsx

import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("admin");

  const logout = () => {
    localStorage.removeItem("admin");
    navigate("/");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      background: "#111",
      color: "white"
    }}>
      <h3 style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        🏸 DSAI League
      </h3>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => navigate("/")}>Home</button>
        <button onClick={() => navigate("/schedule")}>Schedule</button>
        <button onClick={() => navigate("/leaderboard")}>Leaderboard</button>

        {!isLoggedIn ? (
          <button onClick={() => navigate("/admin")}>Admin</button>
        ) : (
          <>
            <button onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;