// Login.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    // simple hardcoded login
    if (user === "admin" && pass === "1234") {
      localStorage.setItem("admin", "true"); // 🔥 ADD
      navigate("/dashboard");
    } else {
      alert("Wrong credentials ❌");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "Arial" }}>
      <div style={{
        display: "inline-block",
        background: "white",
        padding: "30px 40px",
        borderRadius: "15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        border: "1px solid #eee"
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>🔐 Admin Login</h2>

        <input
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          style={{ display: "block", width: "220px", padding: "10px", margin: "10px auto", borderRadius: "8px", border: "1px solid #ccc", fontSize: "15px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          style={{ display: "block", width: "220px", padding: "10px", margin: "10px auto 20px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "15px" }}
        />

        <button 
          onClick={handleLogin}
          style={{ 
            padding: "10px", width: "100%", background: "#4CAF50", color: "white", 
            border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", 
            cursor: "pointer", transition: "0.2s" 
          }}
          onMouseOver={(e) => e.target.style.background = "#45a049"}
          onMouseOut={(e) => e.target.style.background = "#4CAF50"}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;