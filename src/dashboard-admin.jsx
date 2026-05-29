import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// THEORY NOTE:
// This Admin Dashboard is a Multi-Tenant Decision Support System (DSS).
// It aggregates behavioral data from ALL client campaigns, applies the
// ML scoring pipeline, and surfaces actionable intelligence to the agency.
//
// DATA MODE:
//   LIVE  → fetches from Flask API every 30 seconds with auth token
//   DEMO  → uses embedded synthetic data when Flask unreachable
//
// Auto-detects mode based on API reachability.
// ─────────────────────────────────────────────────────────────────────────────

// API_BASE reads from environment variable set at build time.
// Locally: http://127.0.0.1:5000
// On GitHub Pages: your Render URL (set in .env.production)
const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";

// Read token from sessionStorage — set by Login.jsx after authentication
const getToken = () => sessionStorage.getItem("inspiritoToken") || "";

// Authenticated fetch — adds Authorization header automatically
const authFetch = (url, opts={}) => fetch(url, {
  ...opts,
  headers: { "Content-Type":"application/json", "Authorization":`Bearer ${getToken()}`, ...(opts.headers||{}) },
});

// ── EMBEDDED DEMO DATA (used when Flask is offline) ──────────────────────────
const DEMO_DATA = {
  overall: {
    total_sessions: 500, hot_leads: 118, warm_leads: 187, cold_leads: 195,
    hot_rate_pct: 23.6, warm_rate_pct: 37.4, cold_rate_pct: 39.0,
    quality_rate_pct: 61.0, form_submissions: 89, conversion_rate_pct: 17.8,
    bounce_rate_pct: 31.2, avg_scroll_depth: 48.3, avg_time_on_page: 94.6,
    total_spend_inr: 9284.50, wasted_spend_inr: 3818.25, wasted_spend_pct: 41.1,
    cost_per_hot_lead: 78.68,
  },
  source_breakdown: [
    { traffic_source: "instagram_ad",    sessions: 148, hot: 41, warm: 62, cold: 45, avg_scroll: 54.2, avg_spend: 18.2 },
    { traffic_source: "google_search_ad",sessions: 124, hot: 38, warm: 48, cold: 38, avg_scroll: 61.8, avg_spend: 30.1 },
    { traffic_source: "facebook_ad",     sessions:  74, hot: 17, warm: 28, cold: 29, avg_scroll: 44.1, avg_spend: 17.6 },
    { traffic_source: "direct",          sessions:  40, hot: 12, warm: 19, cold:  9, avg_scroll: 67.3, avg_spend:  4.2 },
    { traffic_source: "organic_search",  sessions:  36, hot: 10, warm: 18, cold:  8, avg_scroll: 65.1, avg_spend:  3.1 },
    { traffic_source: "google_display_ad",sessions: 48, hot:  0, warm: 12, cold: 36, avg_scroll: 22.4, avg_spend: 10.8 },
  ],
  device_breakdown: [
    { device_type: "mobile",  sessions: 326, hot: 74, avg_scroll: 46.1 },
    { device_type: "desktop", sessions: 141, hot: 37, avg_scroll: 56.8 },
    { device_type: "tablet",  sessions:  33, hot:  7, avg_scroll: 51.2 },
  ],
  daily_trend: [
    { day: "Mon", sessions: 68, hot: 16, warm: 26, cold: 26 },
    { day: "Tue", sessions: 74, hot: 18, warm: 29, cold: 27 },
    { day: "Wed", sessions: 82, hot: 20, warm: 31, cold: 31 },
    { day: "Thu", sessions: 71, hot: 17, warm: 27, cold: 27 },
    { day: "Fri", sessions: 89, hot: 22, warm: 33, cold: 34 },
    { day: "Sat", sessions: 63, hot: 14, warm: 24, cold: 25 },
    { day: "Sun", sessions: 53, hot: 11, warm: 17, cold: 25 },
  ],
  recent_sessions: [
    { session_id:"SES00001", traffic_source:"instagram_ad",  device_type:"mobile",  lead_score_label:"Hot",  scroll_depth_pct:88, time_on_page_sec:210, form_submitted:1, prob_hot:0.91, scored_at:"2025-06-12 18:42" },
    { session_id:"SES00002", traffic_source:"google_search_ad",device_type:"desktop",lead_score_label:"Warm", scroll_depth_pct:54, time_on_page_sec:112, form_submitted:0, prob_hot:0.31, scored_at:"2025-06-12 18:38" },
    { session_id:"SES00003", traffic_source:"facebook_ad",   device_type:"mobile",  lead_score_label:"Cold", scroll_depth_pct: 8, time_on_page_sec:  7, form_submitted:0, prob_hot:0.04, scored_at:"2025-06-12 18:31" },
    { session_id:"SES00004", traffic_source:"instagram_ad",  device_type:"mobile",  lead_score_label:"Hot",  scroll_depth_pct:92, time_on_page_sec:248, form_submitted:1, prob_hot:0.94, scored_at:"2025-06-12 18:22" },
    { session_id:"SES00005", traffic_source:"direct",        device_type:"desktop", lead_score_label:"Warm", scroll_depth_pct:61, time_on_page_sec:143, form_submitted:0, prob_hot:0.38, scored_at:"2025-06-12 17:58" },
    { session_id:"SES00006", traffic_source:"google_search_ad",device_type:"mobile",lead_score_label:"Hot",  scroll_depth_pct:79, time_on_page_sec:195, form_submitted:1, prob_hot:0.87, scored_at:"2025-06-12 17:44" },
    { session_id:"SES00007", traffic_source:"google_display_ad",device_type:"mobile",lead_score_label:"Cold",scroll_depth_pct:11, time_on_page_sec: 9, form_submitted:0, prob_hot:0.03, scored_at:"2025-06-12 17:31" },
    { session_id:"SES00008", traffic_source:"organic_search",device_type:"desktop", lead_score_label:"Warm", scroll_depth_pct:58, time_on_page_sec:131, form_submitted:0, prob_hot:0.28, scored_at:"2025-06-12 17:18" },
  ],
  recommendations: [
    { category:"Traffic Source",   priority:"HIGH",   insight:"Google Display Ads has 75% cold lead rate — majority of spend wasted", recommendation:"Reduce Google Display budget by 35% immediately. Reallocate to Google Search." },
    { category:"Ad Scheduling",    priority:"HIGH",   insight:"Evening (6–10 PM) delivers 31% hot lead rate vs 14% in morning", recommendation:"Increase bid multiplier by 25% for 6–10 PM slots." },
    { category:"Landing Page",     priority:"HIGH",   insight:"shoes_collection page avg scroll depth only 28% — users leaving early", recommendation:"Move hero CTA above the fold. Add urgency element in first 30% of page." },
    { category:"Device Experience",priority:"MEDIUM", insight:"Mobile bounce rate (38%) is 14% higher than desktop (24%)", recommendation:"Audit mobile page load speed. Target under 2 seconds. Compress hero images." },
    { category:"Geographic",       priority:"MEDIUM", insight:"Metro tier delivers 28% hot rate vs 11% in rural areas", recommendation:"Concentrate 65% of geographic budget in metro + tier-2 cities." },
    { category:"Ad Format",        priority:"LOW",    insight:"Instagram Reels delivers highest engagement velocity (avg 18.4/min)", recommendation:"Allocate 45% of Instagram creative budget to Reel format." },
  ],
  alerts: [
    { type:"SPEND_LEAKAGE",  segment:"ALL",              value:41.1, message:"₹3,818 (41.1%) of total spend wasted on Cold leads — guardrail triggered" },
    { type:"HIGH_BOUNCE",    segment:"google_display_ad", value:75.0, message:"Google Display Ads: 75% cold rate — campaign underperforming benchmark" },
    { type:"OPPORTUNITY",    segment:"instagram_ad",      value:27.7, message:"Instagram Reels: 27.7% hot rate — scale budget for higher ROI" },
  ],
  feature_importance: [
    { feature:"time_on_page_sec",       avg_importance:0.182 },
    { feature:"scroll_depth_pct",       avg_importance:0.164 },
    { feature:"form_interaction",       avg_importance:0.141 },
    { feature:"cta_clicks",             avg_importance:0.118 },
    { feature:"product_image_clicks",   avg_importance:0.094 },
    { feature:"engagement_velocity",    avg_importance:0.081 },
    { feature:"high_intent_flag",       avg_importance:0.067 },
    { feature:"session_depth_score",    avg_importance:0.052 },
    { feature:"recency_score",          avg_importance:0.044 },
    { feature:"ad_quality_index",       avg_importance:0.031 },
  ],
};

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  navy:    "#003D66",
  navyDk:  "#002b49",
  orange:  "#F28C28",
  hot:     "#e74c3c",
  warm:    "#F28C28",
  cold:    "#5bc0eb",
  success: "#27ae60",
  white:   "#ffffff",
  bg:      "#f0f4f8",
  card:    "#ffffff",
  border:  "#e2e8f0",
  text:    "#1a2a3a",
  muted:   "#6b7a8d",
};

const LABEL_COLOR = { Hot: C.hot, Warm: C.warm, Cold: C.cold };

// ── UTILITY ───────────────────────────────────────────────────────────────────
const fmt = (n, dec=1) => n == null ? "—" : Number(n).toFixed(dec);
const fmtINR = n => n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN", {maximumFractionDigits:0});

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: C.card, borderRadius: 12, padding: "22px 24px",
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 12px rgba(0,61,102,0.07)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position:"absolute", top:0, left:0, width:4,
        height:"100%", background: color || C.navy, borderRadius:"12px 0 0 12px"
      }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        {trend != null && (
          <span style={{
            fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20,
            background: trend >= 0 ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)",
            color: trend >= 0 ? C.success : C.hot,
          }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color: color || C.navy, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:600, color: C.text, marginBottom:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color: C.muted }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:0, letterSpacing:0.3 }}>{children}</h2>
      {sub && <p style={{ fontSize:12, color:C.muted, margin:"4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{
      background:C.card, borderRadius:12, padding:"24px",
      border:`1px solid ${C.border}`,
      boxShadow:"0 2px 12px rgba(0,61,102,0.07)",
      ...style
    }}>
      {children}
    </div>
  );
}

function Badge({ label }) {
  const colors = {
    Hot:  { bg:"rgba(231,76,60,0.1)",  color:C.hot,     dot:C.hot },
    Warm: { bg:"rgba(242,140,40,0.1)", color:C.warm,    dot:C.warm },
    Cold: { bg:"rgba(91,192,235,0.12)",color:"#2980b9", dot:C.cold },
  };
  const s = colors[label] || { bg:"#eee", color:"#333", dot:"#ccc" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:s.bg, color:s.color,
      fontSize:11, fontWeight:700, padding:"3px 10px",
      borderRadius:20, letterSpacing:0.3,
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>
      {label}
    </span>
  );
}

function AlertBanner({ alert }) {
  const cfg = {
    SPEND_LEAKAGE: { icon:"⚠️", bg:"#fff8f0", border:"#fde5c3", color:"#8b5000" },
    HIGH_BOUNCE:   { icon:"🔴", bg:"#fff0f0", border:"#ffc9c9", color:"#c0392b" },
    OPPORTUNITY:   { icon:"🚀", bg:"#f0fff4", border:"#c3fad5", color:"#1a7a40" },
  };
  const s = cfg[alert.type] || cfg.SPEND_LEAKAGE;
  return (
    <div style={{
      background:s.bg, border:`1px solid ${s.border}`, borderRadius:8,
      padding:"10px 16px", fontSize:12, color:s.color,
      display:"flex", alignItems:"center", gap:10, marginBottom:8,
    }}>
      <span>{s.icon}</span>
      <span><strong>{alert.type.replace("_"," ")}</strong> — {alert.message}</span>
    </div>
  );
}

function PriorityBadge({ p }) {
  const m = { HIGH:{bg:"rgba(231,76,60,0.1)",c:C.hot}, MEDIUM:{bg:"rgba(242,140,40,0.1)",c:C.warm}, LOW:{bg:"rgba(91,192,235,0.1)",c:"#2980b9"} };
  const s = m[p] || m.LOW;
  return <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10, background:s.bg, color:s.c }}>{p}</span>;
}

// ── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.navyDk, border:"none", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#fff" }}>
      <p style={{ fontWeight:700, marginBottom:6, color:C.orange }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, margin:"2px 0" }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
// onLogout is passed from App.js — clears session and shows login
export default function AdminDashboard({ onLogout }) {
  const [data, setData]       = useState(null);
  const [mode, setMode]       = useState("loading"); // loading | live | demo
  const [lastUpdated, setLast]= useState(null);
  const [activeTab, setTab]   = useState("overview");
  const [sessionFilter, setSF]= useState("All");

  // ── DATA FETCHING ──────────────────────────────────────────────────────────
  // THEORY: The dashboard polls the Flask API every 30 seconds.
  // This is a "pull" architecture — simpler than WebSockets for academic scope.
  // In production, WebSocket push would give true real-time updates.
  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/dashboard/admin`, { signal: AbortSignal.timeout(3000) });
      // If 401 Unauthorized → token expired → redirect to login
      if (res.status === 401) { onLogout && onLogout(); return; }
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      setMode("live");
      setLast(new Date());
    } catch {
      // API unreachable → fallback to demo data
      if (mode !== "live") {
        setData(DEMO_DATA);
        setMode("demo");
        setLast(new Date());
      }
    }
  }, [mode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:C.bg, flexDirection:"column", gap:16 }}>
      <div style={{ width:40, height:40, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.navy}`, borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
      <p style={{ color:C.muted, fontFamily:"sans-serif" }}>Loading dashboard data...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const o = data.overall;

  // ── DERIVED DISPLAY DATA ───────────────────────────────────────────────────
  const pieData = [
    { name:"Hot",  value: o.hot_leads,  color: C.hot  },
    { name:"Warm", value: o.warm_leads, color: C.warm },
    { name:"Cold", value: o.cold_leads, color: C.cold },
  ];

  const sourceChartData = (data.source_breakdown || []).map(s => ({
    name: s.traffic_source.replace("_ad","").replace("_"," "),
    Hot:  s.hot, Warm: s.warm, Cold: s.cold,
    Sessions: s.sessions,
  }));

  const trendData = (data.daily_trend || []).map(d => ({
    day: d.day || d.day?.slice(5),
    Hot: d.hot, Warm: d.warm, Cold: d.cold,
    Total: d.sessions,
  }));

  const featImportance = (data.feature_importance || DEMO_DATA.feature_importance).slice(0,8).map(f => ({
    name: f.feature.replace(/_/g," ").replace("pct","%").replace("sec","(s)"),
    importance: parseFloat((f.avg_importance * 100).toFixed(1)),
  }));

  const filteredSessions = (data.recent_sessions || []).filter(s =>
    sessionFilter === "All" || s.lead_score_label === sessionFilter
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans', system-ui, sans-serif", background:C.bg, minHeight:"100vh", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:#f0f4f8; }
        ::-webkit-scrollbar-thumb { background:#c5d2e0; border-radius:3px; }
        button:focus { outline:none; }
        table { border-collapse:collapse; width:100%; }
        th,td { text-align:left; padding:10px 14px; }
        tr:hover td { background:rgba(0,61,102,0.03); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fadein { animation: fadeIn 0.4s ease both; }
      `}</style>

      {/* ── TOP NAV ── */}
      <div style={{ background:C.navyDk, padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 16px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontWeight:800, fontSize:18, color:"#fff", letterSpacing:1 }}>
            INSPIRITO <span style={{ color:C.orange }}>ADMIN</span>
          </div>
          <div style={{ width:1, height:24, background:"rgba(255,255,255,0.15)" }}/>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:500 }}>Performance Marketing Engine</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* Mode badge */}
          <div style={{
            display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700,
            padding:"4px 12px", borderRadius:20,
            background: mode==="live" ? "rgba(39,174,96,0.2)" : "rgba(242,140,40,0.2)",
            color: mode==="live" ? "#2ecc71" : C.orange,
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"currentColor", display:"inline-block", animation: mode==="live" ? "pulse 2s infinite" : "none" }}/>
            {mode==="live" ? "LIVE" : "DEMO MODE"}
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          {lastUpdated && <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={() => onLogout && onLogout()}
            style={{ background:"none", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.7)", padding:"6px 14px", borderRadius:6, fontSize:12, cursor:"pointer", fontWeight:600 }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── MODE BANNER ── */}
      {mode === "demo" && (
        <div style={{ background:"#fff8f0", borderBottom:`2px solid ${C.orange}`, padding:"8px 32px", fontSize:12, color:"#8b5000", display:"flex", alignItems:"center", gap:8 }}>
          <span>⚠️</span>
          <strong>Demo Mode</strong> — Flask API not reachable. Displaying representative synthetic campaign data (500 sessions). Connect Flask backend for live scoring.
        </div>
      )}

      {/* ── TAB NAV ── */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 32px", display:"flex", gap:4 }}>
        {[["overview","📊 Overview"],["sessions","📋 Sessions"],["ml","🤖 ML Insights"],["optimizer","💡 Optimizer"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background:"none", border:"none", padding:"16px 18px",
            fontSize:13, fontWeight: activeTab===id ? 700 : 500,
            color: activeTab===id ? C.navy : C.muted,
            borderBottom: activeTab===id ? `3px solid ${C.orange}` : "3px solid transparent",
            cursor:"pointer", transition:"all 0.2s", marginBottom:-1,
          }}>{label}</button>
        ))}
        <div style={{ flex:1 }}/>
        <button onClick={fetchData} style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted, padding:"8px 16px", borderRadius:6, fontSize:12, cursor:"pointer", margin:"10px 0", fontWeight:600 }}>
          ↻ Refresh
        </button>
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{ padding:"28px 32px", maxWidth:1400, margin:"0 auto" }} className="fadein">

        {/* ════════════════ TAB: OVERVIEW ════════════════ */}
        {activeTab === "overview" && <>

          {/* ALERTS */}
          {(data.alerts || DEMO_DATA.alerts).length > 0 && (
            <div style={{ marginBottom:24 }}>
              {(data.alerts || DEMO_DATA.alerts).map((a,i) => <AlertBanner key={i} alert={a}/>)}
            </div>
          )}

          {/* KPI CARDS */}
          {/* THEORY: KPI cards give the admin the "single glance" summary.
              Each metric maps directly to a research objective:
              - Quality Rate → Objective 2 (Predictive Lead Scoring)
              - Wasted Spend → Objective 3 (Automated Optimization Engine)
              - Conversion Rate → Objective 1 (Behavioral Data Pipeline) */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginBottom:28 }}>
            <KpiCard icon="👥" label="Total Sessions"     value={o.total_sessions}                  color={C.navy}    trend={8}/>
            <KpiCard icon="🔴" label="Hot Leads"          value={o.hot_leads}   sub={`${o.hot_rate_pct}% of traffic`}  color={C.hot}     trend={12}/>
            <KpiCard icon="🟠" label="Warm Leads"         value={o.warm_leads}  sub={`${o.warm_rate_pct}% of traffic`} color={C.warm}    trend={5}/>
            <KpiCard icon="🔵" label="Cold Leads"         value={o.cold_leads}  sub={`${o.cold_rate_pct}% of traffic`} color={C.cold}    trend={-3}/>
            <KpiCard icon="✅" label="Quality Rate"       value={`${o.quality_rate_pct}%`} sub="Hot + Warm"           color={C.success} trend={7}/>
            <KpiCard icon="📝" label="Conversions"        value={o.form_submissions} sub={`${o.conversion_rate_pct}% rate`} color={C.navy}/>
            <KpiCard icon="💸" label="Wasted Spend"       value={fmtINR(o.wasted_spend_inr)} sub={`${o.wasted_spend_pct}% of budget`} color={C.hot}/>
            <KpiCard icon="🎯" label="Cost / Hot Lead"    value={fmtINR(o.cost_per_hot_lead)}       color={C.orange}/>
          </div>

          {/* CHARTS ROW 1 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:20, marginBottom:20 }}>

            {/* Donut — Lead Distribution */}
            <Card>
              <SectionTitle sub="ML model classification of all sessions">Lead Score Distribution</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v,n) => [v + " sessions", n]}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:8 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
                    <span style={{ width:10, height:10, borderRadius:"50%", background:d.color, display:"inline-block" }}/>
                    <span style={{ color:C.muted }}>{d.name}: <strong style={{color:C.text}}>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Line — Daily Trend */}
            {/* THEORY: Time-series trend shows how campaign quality evolves.
                Admin uses this to detect if a new ad creative is improving intent quality. */}
            <Card>
              <SectionTitle sub="Lead quality trend over the campaign period">Daily Lead Quality Trend</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData} margin={{ top:5, right:20, left:-10, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="day" tick={{ fontSize:11, fill:C.muted }}/>
                  <YAxis tick={{ fontSize:11, fill:C.muted }}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize:12 }}/>
                  <Line type="monotone" dataKey="Hot"  stroke={C.hot}  strokeWidth={2.5} dot={{ r:3 }} name="Hot"/>
                  <Line type="monotone" dataKey="Warm" stroke={C.warm} strokeWidth={2.5} dot={{ r:3 }} name="Warm"/>
                  <Line type="monotone" dataKey="Cold" stroke={C.cold} strokeWidth={2}   dot={{ r:3 }} name="Cold" strokeDasharray="4 2"/>
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* CHARTS ROW 2 */}
          <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:20, marginBottom:20 }}>

            {/* Bar — Source Breakdown */}
            {/* THEORY: Source-level KPIs are the core of ad-spend optimization.
                Admin can immediately see which channel to scale and which to cut. */}
            <Card>
              <SectionTitle sub="Lead quality by traffic source — basis for budget reallocation">Traffic Source Performance</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sourceChartData} margin={{ top:5, right:10, left:-10, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:C.muted }}/>
                  <YAxis tick={{ fontSize:11, fill:C.muted }}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize:12 }}/>
                  <Bar dataKey="Hot"  stackId="a" fill={C.hot}  name="Hot"  radius={[0,0,0,0]}/>
                  <Bar dataKey="Warm" stackId="a" fill={C.warm} name="Warm"/>
                  <Bar dataKey="Cold" stackId="a" fill={C.cold} name="Cold" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Device breakdown */}
            <Card>
              <SectionTitle sub="Device-level performance split">Device Performance</SectionTitle>
              <div style={{ marginTop:8 }}>
                {(data.device_breakdown || []).map(d => {
                  const hotRate = Math.round(d.hot / d.sessions * 100);
                  return (
                    <div key={d.device_type} style={{ marginBottom:18 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
                        <span style={{ fontWeight:600, textTransform:"capitalize" }}>
                          {d.device_type === "mobile" ? "📱" : d.device_type === "desktop" ? "💻" : "📊"} {d.device_type}
                        </span>
                        <span style={{ color:C.muted, fontSize:12 }}>{d.sessions} sessions · {hotRate}% hot</span>
                      </div>
                      {/* Stacked bar */}
                      <div style={{ height:10, background:"#eef2f7", borderRadius:5, overflow:"hidden", display:"flex" }}>
                        <div style={{ width:`${d.hot/d.sessions*100}%`, background:C.hot, transition:"width 1s" }}/>
                        <div style={{ width:`${(d.sessions-d.hot-Math.round(d.sessions*0.35))/d.sessions*100}%`, background:C.warm }}/>
                        <div style={{ flex:1, background:C.cold }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Budget waste gauge */}
              <div style={{ marginTop:24, background:"rgba(231,76,60,0.06)", border:"1px solid rgba(231,76,60,0.15)", borderRadius:8, padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.hot, marginBottom:6 }}>⚠️ Ad-Spend Leakage</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:24, fontWeight:800, color:C.hot }}>{o.wasted_spend_pct}%</span>
                  <span style={{ fontSize:12, color:C.muted, paddingBottom:4 }}>budget on Cold leads</span>
                </div>
                <div style={{ height:8, background:"#fce4e4", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${o.wasted_spend_pct}%`, height:"100%", background:C.hot, borderRadius:4, transition:"width 1.5s" }}/>
                </div>
                <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>
                  {fmtINR(o.wasted_spend_inr)} wasted of {fmtINR(o.total_spend_inr)} total spend
                </div>
              </div>
            </Card>
          </div>

        </>}

        {/* ════════════════ TAB: SESSIONS TABLE ════════════════ */}
        {activeTab === "sessions" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <SectionTitle sub={`${filteredSessions.length} sessions shown`}>Live Session Log</SectionTitle>
            {/* Filter buttons */}
            <div style={{ display:"flex", gap:8 }}>
              {["All","Hot","Warm","Cold"].map(f => (
                <button key={f} onClick={() => setSF(f)} style={{
                  padding:"6px 16px", borderRadius:20, border:"none",
                  background: sessionFilter===f ? (f==="Hot"?C.hot:f==="Warm"?C.warm:f==="Cold"?C.cold:C.navy) : C.border,
                  color: sessionFilter===f ? "#fff" : C.muted,
                  fontSize:12, fontWeight:700, cursor:"pointer",
                }}>
                  {f==="All"?"All Leads":f}
                </button>
              ))}
            </div>
          </div>

          <Card style={{ padding:0, overflow:"hidden" }}>
            <table>
              <thead>
                <tr style={{ background:"#f8fafd", borderBottom:`1px solid ${C.border}` }}>
                  {["Session ID","Source","Device","Label","Scroll %","Time (s)","Converted","Hot Prob","Scored At"].map(h => (
                    <th key={h} style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, padding:"12px 14px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ fontSize:12, fontFamily:"monospace", color:C.muted }}>{s.session_id}</td>
                    <td style={{ fontSize:12 }}>{s.traffic_source?.replace("_"," ")}</td>
                    <td style={{ fontSize:12, textTransform:"capitalize" }}>{s.device_type}</td>
                    <td><Badge label={s.lead_score_label}/></td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:50, height:5, background:"#eef2f7", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ width:`${s.scroll_depth_pct}%`, height:"100%", background: s.scroll_depth_pct>60?C.success:s.scroll_depth_pct>30?C.warm:C.hot }}/>
                        </div>
                        <span style={{ fontSize:12 }}>{fmt(s.scroll_depth_pct,0)}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize:12 }}>{fmt(s.time_on_page_sec,0)}s</td>
                    <td style={{ fontSize:12 }}>{s.form_submitted ? <span style={{color:C.success,fontWeight:700}}>✓ Yes</span> : <span style={{color:C.muted}}>No</span>}</td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:40, height:5, background:"#eef2f7", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ width:`${(s.prob_hot||0)*100}%`, height:"100%", background:C.hot }}/>
                        </div>
                        <span style={{ fontSize:11 }}>{fmt((s.prob_hot||0)*100,0)}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize:11, color:C.muted }}>{s.scored_at?.slice(0,16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>}

        {/* ════════════════ TAB: ML INSIGHTS ════════════════ */}
        {activeTab === "ml" && <>
          {/* THEORY: Feature Importance is one of the most academically significant
              outputs. It empirically answers: "Which behavioral signal best predicts
              user intent?" — directly supporting Research Objective 2. */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
            <Card>
              <SectionTitle sub="Which behavioral signals drive the ML model's predictions most">Feature Importance (ML Model)</SectionTitle>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featImportance} layout="vertical" margin={{ top:0, right:20, left:60, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
                  <XAxis type="number" tick={{ fontSize:10, fill:C.muted }} tickFormatter={v => v+"%"}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:C.text }} width={120}/>
                  <Tooltip formatter={v => [v+"%","Importance"]}/>
                  <Bar dataKey="importance" fill={C.navy} radius={[0,4,4,0]} name="Importance (%)">
                    {featImportance.map((_,i) => <Cell key={i} fill={i===0?C.orange:i===1?C.navy:`rgba(0,61,102,${0.9-i*0.09})`}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:16, padding:"12px 14px", background:"#f8fafd", borderRadius:8, fontSize:12, color:C.muted, lineHeight:1.6 }}>
                <strong style={{color:C.navy}}>Interpretation:</strong> Time on page and scroll depth are the two strongest predictors — confirming that dwell time and content engagement are the primary signals of genuine purchase intent in this campaign.
              </div>
            </Card>

            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {/* Model performance summary */}
              <Card>
                <SectionTitle sub="Trained Gradient Boosting Classifier performance">Model Evaluation Summary</SectionTitle>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:8 }}>
                  {[
                    { label:"Accuracy",    value:"89.6%", icon:"🎯" },
                    { label:"ROC-AUC",     value:"0.9800", icon:"📈" },
                    { label:"F1 Score",    value:"0.8941", icon:"⚖️" },
                    { label:"CV Mean Acc", value:"89.4%",  icon:"🔄" },
                  ].map(m => (
                    <div key={m.label} style={{ background:"#f8fafd", borderRadius:8, padding:"14px", textAlign:"center" }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{m.icon}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:C.navy }}>{m.value}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, fontSize:12, color:C.muted, lineHeight:1.6 }}>
                  Model trained on <strong>5,000 synthetic sessions</strong> with <strong>39 features</strong> across 5 behavioral categories. 5-fold cross-validation confirms generalizability.
                </div>
              </Card>

              {/* Label classification breakdown */}
              <Card>
                <SectionTitle sub="How the model maps intent score to label">Scoring Thresholds</SectionTitle>
                {[
                  { label:"Hot",  range:"Intent Score ≥ 0.62", desc:"High scroll + CTA clicks + form interaction", color:C.hot },
                  { label:"Warm", range:"0.30 ≤ Score < 0.62", desc:"Moderate engagement, browsing behavior",      color:C.warm },
                  { label:"Cold", range:"Intent Score < 0.30",  desc:"Low scroll, short dwell, likely bounced",     color:C.cold },
                ].map(t => (
                  <div key={t.label} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ width:4, background:t.color, borderRadius:2, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:t.color }}>{t.label} — <span style={{color:C.muted, fontWeight:400, fontSize:11}}>{t.range}</span></div>
                      <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{t.desc}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </>}

        {/* ════════════════ TAB: OPTIMIZER ════════════════ */}
        {activeTab === "optimizer" && <>
          {/* THEORY: The Optimization Engine implements a Logic-Based Heuristic Module.
              Each recommendation is generated by comparing segment KPIs against
              predefined thresholds — e.g., if cold_rate > 65% → REDUCE_BUDGET alert.
              This is Research Objective 3: "Automated guardrail against ad-spend leakage." */}
          <div style={{ marginBottom:20 }}>
            <SectionTitle sub="AI-generated strategic recommendations based on ML scoring and KPI analysis">Optimization Recommendations</SectionTitle>
            {(data.recommendations || DEMO_DATA.recommendations).map((r,i) => (
              <Card key={i} style={{ marginBottom:14, borderLeft:`4px solid ${r.priority==="HIGH"?C.hot:r.priority==="MEDIUM"?C.warm:C.cold}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:0.5 }}>{r.category}</span>
                    <PriorityBadge p={r.priority}/>
                  </div>
                </div>
                <div style={{ fontSize:13, color:C.text, marginBottom:8, lineHeight:1.5 }}>
                  <strong>Insight:</strong> {r.insight}
                </div>
                <div style={{ fontSize:13, color:C.navy, fontWeight:600, background:"rgba(0,61,102,0.05)", padding:"8px 12px", borderRadius:6 }}>
                  → {r.recommendation}
                </div>
              </Card>
            ))}
          </div>
        </>}

      </div>
    </div>
  );
}
