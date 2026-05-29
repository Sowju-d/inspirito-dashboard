// =============================================================================
// Login.jsx — Login Page Component
// AI-Driven Performance Marketing Engine | Inspirito
// =============================================================================
//
// WHAT THIS DOES:
//   Renders the login form. Calls POST /api/login on the Flask backend.
//   On success → stores token + user info in sessionStorage → App.js
//   reads it and routes to the correct dashboard automatically.
//
// FLOW:
//   User enters credentials → POST /api/login → token received
//   → sessionStorage.setItem('token', token)
//   → sessionStorage.setItem('role', 'admin' or 'client')
//   → sessionStorage.setItem('username', 'ADMIN' or 'CLIENT001')
//   → App.js detects login → shows correct dashboard
//
// NO HARDCODED CREDENTIALS — everything verified against Flask database.
// =============================================================================

import { useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";

const C = {
  navy:   "#003D66",
  navyDk: "#002b49",
  orange: "#F28C28",
  border: "#e2e8f0",
  muted:  "#6b7a8d",
  text:   "#1a2a3a",
  error:  "#e74c3c",
  success:"#27ae60",
};

export default function Login({ onLogin }) {
  const [role,     setRole]    = useState("client");
  const [username, setUsername]= useState("");
  const [password, setPassword]= useState("");
  const [showPwd,  setShowPwd] = useState(false);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError("");

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter your " + (role === "admin" ? "username" : "Client ID") + " and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toUpperCase(),
          password: password.trim(),
          role:     role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Flask returned error — show it to user
        setError(data.error || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      // ── SUCCESS ────────────────────────────────────────────────────────
      // Store everything in sessionStorage.
      // sessionStorage is cleared when the browser tab closes —
      // so each session requires fresh login. Correct for security.
      sessionStorage.setItem("inspiritoToken",    data.token);
      sessionStorage.setItem("inspiritoRole",     data.role);
      sessionStorage.setItem("inspiritoUsername", data.user?.client_id || data.user?.username || username.toUpperCase());
      sessionStorage.setItem("inspiritoBusiness", data.user?.business_name || "Inspirito Admin");
      sessionStorage.setItem("inspiritoCampaign", data.user?.campaign_name || "");

      // Tell App.js that login succeeded → it will show correct dashboard
      onLogin(data.role, data.user);

    } catch (err) {
      // Network error — Flask not reachable
      setError("Cannot reach the server. Make sure Flask is running or Render is deployed.");
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0f4f8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        maxWidth: 900,
        width: "100%",
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,61,102,0.14)",
        animation: "fadeIn 0.4s ease",
      }}>

        {/* ── LEFT: Brand Panel ── */}
        <div style={{
          background: C.navyDk,
          padding: "56px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, border:"36px solid rgba(242,140,40,0.1)", borderRadius:"50%" }}/>
          <div style={{ position:"absolute", bottom:-50, left:-50, width:180, height:180, border:"28px solid rgba(255,255,255,0.04)", borderRadius:"50%" }}/>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:40 }}>
            <div style={{ width:44, height:44, background:C.orange, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:"#fff" }}>I</div>
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:16, lineHeight:1 }}>Inspirito</div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>Ventures Pvt Ltd</div>
            </div>
          </div>

          <div style={{ fontSize:28, fontWeight:800, color:"#fff", lineHeight:1.25, marginBottom:14 }}>
            Welcome<br/><span style={{ color:C.orange }}>Back.</span>
          </div>
          <div style={{ color:"rgba(255,255,255,0.55)", fontSize:14, lineHeight:1.7, marginBottom:40 }}>
            Sign in to access your campaign dashboard and real-time lead performance insights.
          </div>

          {/* Role selector cards */}
          {[
            { r:"client", icon:"👤", title:"Client Login",  desc:"View your campaign performance & lead quality" },
            { r:"admin",  icon:"🛡️", title:"Admin Login",   desc:"Manage all clients, campaigns & ML engine" },
          ].map(({ r, icon, title, desc }) => (
            <div key={r} onClick={() => { setRole(r); setError(""); }} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: role === r ? "rgba(242,140,40,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${role === r ? C.orange : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10, padding: "14px 16px", cursor: "pointer",
              marginBottom: 10, transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color:"#fff", fontWeight:700, fontSize:13 }}>{title}</div>
                <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, marginTop:2 }}>{desc}</div>
              </div>
              <div style={{
                width:16, height:16, borderRadius:"50%",
                border: `2px solid ${role === r ? C.orange : "rgba(255,255,255,0.3)"}`,
                background: role === r ? C.orange : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {role === r && <div style={{ width:5, height:5, borderRadius:"50%", background:"#fff" }}/>}
              </div>
            </div>
          ))}

          {/* Contact */}
          <div style={{ marginTop:32, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginBottom:8 }}>Need help?</div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>📞 +91 89284 84777</div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:12, marginTop:4 }}>✉️ sales@inspirito.in</div>
          </div>
        </div>

        {/* ── RIGHT: Form Panel ── */}
        <div style={{ padding:"56px 48px", display:"flex", flexDirection:"column", justifyContent:"center" }}>

          <div style={{ fontSize:22, fontWeight:800, color:C.navy, marginBottom:6 }}>
            {role === "admin" ? "Admin Sign In" : "Client Sign In"}
          </div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:32 }}>
            {role === "client"
              ? "Enter your Client ID and password provided by Inspirito."
              : "Restricted to Inspirito team members only."}
          </div>

          {/* Demo hint box */}
          <div style={{
            background:"#f0f7ff", border:"1px dashed #b8d4f0",
            borderRadius:8, padding:"12px 14px", fontSize:12,
            color:"#2c5f8a", marginBottom:24, lineHeight:1.6,
          }}>
            <strong>🎓 Demo credentials</strong><br/>
            Client: <code style={{ background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:3 }}>CLIENT001</code> / <code style={{ background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:3 }}>demo@123</code><br/>
            Admin: <code style={{ background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:3 }}>ADMIN</code> / <code style={{ background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:3 }}>admin@inspirito</code>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background:"#fff0f0", border:`1px solid ${C.error}30`,
              borderRadius:8, padding:"10px 14px",
              color:C.error, fontSize:13, marginBottom:20,
              display:"flex", alignItems:"center", gap:8,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Username field */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#445668", marginBottom:6, letterSpacing:0.3 }}>
              {role === "admin" ? "Admin Username" : "Client ID"} *
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKey}
              placeholder={role === "admin" ? "ADMIN" : "CLIENT001"}
              style={{
                width:"100%", padding:"12px 14px",
                border:`1.5px solid ${C.border}`, borderRadius:8,
                fontFamily:"'DM Sans', sans-serif", fontSize:14,
                color:C.navy, transition:"border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = C.navy}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom:24 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#445668", marginBottom:6 }}>
              Password *
            </label>
            <div style={{ position:"relative" }}>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Enter your password"
                style={{
                  width:"100%", padding:"12px 44px 12px 14px",
                  border:`1.5px solid ${C.border}`, borderRadius:8,
                  fontFamily:"'DM Sans', sans-serif", fontSize:14,
                  color:C.navy, transition:"border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = C.navy}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
              <button onClick={() => setShowPwd(!showPwd)} style={{
                position:"absolute", right:12, top:"50%",
                transform:"translateY(-50%)",
                background:"none", border:"none",
                color:C.muted, cursor:"pointer", fontSize:14, padding:0,
              }}>
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width:"100%", padding:"13px",
              background: loading ? C.muted : C.navy,
              color:"#fff", border:"none", borderRadius:8,
              fontFamily:"'DM Sans', sans-serif",
              fontSize:15, fontWeight:700,
              cursor: loading ? "not-allowed" : "pointer",
              transition:"all 0.25s",
              display:"flex", alignItems:"center",
              justifyContent:"center", gap:8,
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = C.orange; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = C.navy; }}
          >
            {loading ? (
              <>
                <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                Signing in...
              </>
            ) : (
              <>🔐 Sign In</>
            )}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

          {/* Footer note */}
          <div style={{ textAlign:"center", marginTop:24, fontSize:12, color:C.muted }}>
            Don't have an account?{" "}
            <a href="mailto:sales@inspirito.in" style={{ color:C.orange, fontWeight:700, textDecoration:"none" }}>
              Contact Inspirito
            </a>
          </div>

          <div style={{ textAlign:"center", marginTop:8, fontSize:11, color:"#aab8c6" }}>
            🔒 Credentials verified against secure database
          </div>
        </div>

      </div>

      {/* Responsive */}
      <style>{`
        @media(max-width:640px){
          .login-grid { grid-template-columns: 1fr !important; }
          .login-brand { display: none !important; }
        }
      `}</style>
    </div>
  );
}
