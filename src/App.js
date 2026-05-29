// =============================================================================
// App.js — Root Component + Router
// AI-Driven Performance Marketing Engine | Inspirito
// =============================================================================
//
// THIS IS THE CENTRAL CONTROLLER OF THE ENTIRE REACT APP.
//
// WHAT IT DOES:
//   1. On load → checks sessionStorage for existing token
//   2. If token exists → verifies it with Flask → shows correct dashboard
//   3. If no token → shows Login page
//   4. After login → routes to admin or client dashboard based on role
//   5. On logout → clears sessionStorage → shows Login page
//
// ROUTING LOGIC:
//   Not logged in        → <Login />
//   Logged in as admin   → <AdminDashboard />
//   Logged in as client  → <ClientDashboard />
//
// No URL routing needed — state-based routing is simpler for a
// single-page GitHub Pages app and easier to explain in viva.
// =============================================================================

import { useState, useEffect } from "react";
import Login           from "./Login";
import AdminDashboard  from "./dashboard-admin";
import ClientDashboard from "./dashboard-client";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";

export default function App() {
  // 'loading' → checking existing session
  // 'login'   → show login page
  // 'admin'   → show admin dashboard
  // 'client'  → show client dashboard
  const [screen, setScreen] = useState("loading");

  // ── ON APP LOAD ─────────────────────────────────────────────────────────
  // Check if a token already exists in sessionStorage.
  // This handles the case where user refreshes the page —
  // they shouldn't have to log in again.
  useEffect(() => {
    const token = sessionStorage.getItem("inspiritoToken");
    const role  = sessionStorage.getItem("inspiritoRole");

    if (!token || !role) {
      // No stored session → go to login
      setScreen("login");
      return;
    }

    // Token exists → verify it's still valid with Flask
    fetch(`${API_BASE}/api/verify-token`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(4000),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          // Token still valid → go straight to dashboard
          setScreen(role);
        } else {
          // Token expired → clear and go to login
          sessionStorage.clear();
          setScreen("login");
        }
      })
      .catch(() => {
        // Flask unreachable → if token exists, trust it
        // This lets the app work in demo mode without Flask
        if (token && role) {
          setScreen(role);
        } else {
          setScreen("login");
        }
      });
  }, []);

  // ── LOGIN HANDLER ────────────────────────────────────────────────────────
  // Called by Login.jsx after successful authentication.
  // role = 'admin' or 'client'
  const handleLogin = (role, user) => {
    setScreen(role);
  };

  // ── LOGOUT HANDLER ───────────────────────────────────────────────────────
  // Called by dashboard nav bar Logout button.
  // Clears all session data and returns to login.
  const handleLogout = () => {
    sessionStorage.clear();
    setScreen("login");
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        height:"100vh", background:"#f0f4f8", flexDirection:"column", gap:16,
        fontFamily:"system-ui, sans-serif",
      }}>
        <div style={{
          width:40, height:40,
          border:"3px solid #e2e8f0",
          borderTop:"3px solid #003D66",
          borderRadius:"50%",
          animation:"spin 1s linear infinite",
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:"#6b7a8d", fontSize:14 }}>Checking session...</p>
      </div>
    );
  }

  if (screen === "login") {
    return <Login onLogin={handleLogin} />;
  }

  if (screen === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (screen === "client") {
    return <ClientDashboard onLogout={handleLogout} />;
  }

  // Fallback
  return <Login onLogin={handleLogin} />;
}
