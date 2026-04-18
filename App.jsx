import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// API SERVICE LAYER — swap BASE_URL and implement each function when ready
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = "https://your-api.com"; // ← change this

export const api = {
  getStats:       () => fetch(`${BASE_URL}/stats`).then(r => r.json()),
  getOccurrences: () => fetch(`${BASE_URL}/occurrences`).then(r => r.json()),
  getTeams:       () => fetch(`${BASE_URL}/teams`).then(r => r.json()),
  getActivity:    () => fetch(`${BASE_URL}/activity`).then(r => r.json()),
  resolveOcc:     (id) => fetch(`${BASE_URL}/occurrences/${id}/resolve`, { method:"PATCH" }).then(r => r.json()),
  assignTeam:     (occId, teamId) => fetch(`${BASE_URL}/occurrences/${occId}/assign`, {
    method:"PATCH", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ teamId }),
  }).then(r => r.json()),
  createOcc:      (data) => fetch(`${BASE_URL}/occurrences`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(data),
  }).then(r => r.json()),
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — replaced automatically when API is connected
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_STATS = [
  { label:"Pending",        value:3,  sub:"Requires attention",  color:"#f97316", bg:"#fff7ed", icon:"⏰" },
  { label:"Assigned",       value:5,  sub:"Teams assigned",      color:"#7c3aed", bg:"#f5f3ff", icon:"👥" },
  { label:"In Progress",    value:8,  sub:"Being resolved",      color:"#2563eb", bg:"#eff6ff", icon:"🕐" },
  { label:"Resolved Today", value:12, sub:"+3 than yesterday",   color:"#16a34a", bg:"#f0fdf4", icon:"✅" },
];

const MOCK_OCCS = [
  { id:"9421", sev:"CRITICAL", st:"Pending",     cat:"Potholes",   title:"Large Pothole on Main Track",             addr:"Av. Conde da Boa Vista, 1282 · Boa Vista",        date:"06/04/2026 · 08:15", sc:"#dc2626", stc:"#f97316", cc:"#92400e", cbg:"#fef3c7" },
  { id:"9418", sev:"HIGH",     st:"Assigned",    cat:"Signaling",  title:"Faulty Traffic Light - Blinking Yellow",  addr:"Rua Dom Pedro II, 245 · Santo Antonio",           date:"04/04/2026 · 14:40", sc:"#d97706", stc:"#2563eb", cc:"#1e40af", cbg:"#dbeafe" },
  { id:"9388", sev:"MEDIUM",   st:"In Progress", cat:"Drainage",   title:"Flooding on Road After Rain",             addr:"Praça do Hipódromo, s/n · Derby",                 date:"30/11/2026 · 10:05", sc:"#d97706", stc:"#059669", cc:"#065f46", cbg:"#d1fae5" },
];

const MOCK_TEAMS = [
  { id:1, name:"Team Alpha", members:5, status:"Available", tasks:null },
  { id:2, name:"Team Beta",  members:4, status:"Busy",      tasks:"2 active tasks" },
  { id:3, name:"Team Gamma", members:6, status:"Available", tasks:null },
  { id:4, name:"Team Delta", members:5, status:"Busy",      tasks:"1 active task" },
];

const MOCK_ACTIVITY = [
  { icon:"✅", color:"#16a34a", text:"Team Alpha resolved #9372", time:"15 minutes ago" },
  { icon:"👥", color:"#2563eb", text:"#9418 assigned to Team Beta", time:"1 hour ago" },
  { icon:"🔴", color:"#dc2626", text:"New occurrence #9421",        time:"2 hours ago" },
];

const MAP_DOTS = [
  { x:"52%", y:"38%", color:"#dc2626", size:14 },
  { x:"68%", y:"30%", color:"#eab308", size:12 },
  { x:"42%", y:"55%", color:"#f97316", size:13 },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #1e293b; }
  a { text-decoration: none; }

  .navbar {
    background: #1a56db; display: flex; align-items: center;
    justify-content: space-between; padding: 0 24px; height: 52px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15); position: sticky; top: 0; z-index: 100;
  }
  .navbar__brand { display: flex; align-items: center; gap: 10px; }
  .navbar__logo {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(255,255,255,0.2); display: flex;
    align-items: center; justify-content: center; font-size: 16px;
  }
  .navbar__name { color: #fff; font-weight: 700; font-size: 15px; line-height: 1.1; }
  .navbar__sub  { color: rgba(255,255,255,0.7); font-size: 11px; }
  .navbar__tabs { display: flex; gap: 8px; }
  .navbar__tab {
    background: transparent; border: none; color: #fff;
    padding: 6px 14px; border-radius: 6px; cursor: pointer;
    font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;
    transition: background 0.15s;
  }
  .navbar__tab:hover    { background: rgba(255,255,255,0.15); }
  .navbar__tab--active  { background: rgba(255,255,255,0.2); }
  .navbar__notif {
    background: #dc2626; border-radius: 50%; width: 18px; height: 18px;
    font-size: 10px; display: inline-flex; align-items: center;
    justify-content: center; font-weight: 700;
  }
  .navbar__avatar {
    width: 32px; height: 32px; border-radius: 50%; background: #f97316;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 13px; cursor: pointer;
  }

  .page        { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
  .page__title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .page__sub   { color: #64748b; font-size: 14px; margin-bottom: 28px; }

  .stats-grid {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 16px; margin-bottom: 28px;
  }
  .stat-card {
    border-radius: 12px; padding: 18px 20px; border: 1.5px solid transparent;
    display: flex; justify-content: space-between; align-items: flex-start;
    cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .stat-card__label { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 6px; }
  .stat-card__value { font-size: 36px; font-weight: 800; line-height: 1; }
  .stat-card__sub   { font-size: 11px; margin-top: 4px; }
  .stat-card__icon  { font-size: 22px; opacity: 0.7; }

  .layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
  .col    { display: flex; flex-direction: column; gap: 20px; }

  .card       { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
  .card__head {
    padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
    display: flex; justify-content: space-between; align-items: center;
    font-weight: 700; font-size: 15px;
  }
  .card__head--sm { font-size: 14px; padding: 14px 18px; }
  .card__link { color: #1a56db; font-size: 12px; font-weight: 600; cursor: pointer; background: none; border: none; }
  .card__link:hover { opacity: 0.75; }

  .map-body {
    height: 220px;
    background: linear-gradient(135deg,#e0e7ef 0%,#c7d6e8 50%,#dce8f0 100%);
    position: relative; overflow: hidden;
  }
  .map-line-h { position: absolute; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.4); }
  .map-line-v { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.4); }
  .map-dot {
    position: absolute; border-radius: 50%;
    border: 2px solid #fff; transform: translate(-50%,-50%);
    cursor: pointer; transition: transform 0.15s;
  }
  .map-dot:hover { transform: translate(-50%,-50%) scale(1.4); }
  .map-tag {
    position: absolute; bottom: 10px; right: 12px; font-size: 10px;
    color: #64748b; background: rgba(255,255,255,0.8); padding: 3px 8px; border-radius: 4px;
  }

  .occ-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
  .occ-item {
    border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;
    cursor: pointer; transition: box-shadow 0.15s, background 0.15s;
  }
  .occ-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.09); background: #fafbff; }
  .occ-item--selected { background: #eff6ff; border-color: #93c5fd; }
  .occ-item__meta {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 6px; flex-wrap: wrap; gap: 6px;
  }
  .occ-item__badges { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .occ-item__id    { font-size: 11px; color: #64748b; font-weight: 700; }
  .occ-item__title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
  .occ-item__addr  { font-size: 12px; color: #64748b; }
  .occ-item__date  { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .occ-item__actions { display: flex; gap: 8px; margin-top: 10px; }

  .btn {
    padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: none; transition: opacity 0.15s, transform 0.1s;
  }
  .btn:hover   { opacity: 0.85; }
  .btn:active  { transform: scale(0.97); }
  .btn--green  { background: #dcfce7; color: #16a34a; }
  .btn--blue   { background: #dbeafe; color: #1d4ed8; }
  .btn--red    { background: #fee2e2; color: #dc2626; }
  .btn--gray   { background: #f1f5f9; color: #475569; }
  .btn--solid  { background: #1a56db; color: #fff; }

  .badge {
    padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;
    letter-spacing: 0.03em; text-transform: uppercase; white-space: nowrap;
  }

  .teams-list { padding: 8px 0; }
  .team-row {
    padding: 10px 18px; display: flex; justify-content: space-between;
    align-items: center; border-bottom: 1px solid #f8fafc;
    cursor: pointer; transition: background 0.12s;
  }
  .team-row:last-child { border-bottom: none; }
  .team-row:hover { background: #f0f9ff; }
  .team-row--selected { background: #eff6ff; }
  .team-row__name { font-weight: 600; font-size: 13px; margin-bottom: 2px; }
  .team-row__info { font-size: 11px; color: #64748b; }

  .stats-panel { padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; }
  .stat-row__line { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
  .stat-row__label { color: #64748b; }
  .stat-row__val   { font-weight: 700; }
  .bar-track { height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
  .bar-fill  { height: 100%; border-radius: 99px; transition: width 0.6s ease; }

  .act-list { padding: 8px 0; }
  .act-item {
    padding: 10px 18px; display: flex; gap: 12px;
    align-items: flex-start; border-bottom: 1px solid #f8fafc;
    cursor: pointer; transition: background 0.12s;
  }
  .act-item:hover { background: #f8fafc; }
  .act-item:last-child { border-bottom: none; }
  .act-item__icon {
    width: 28px; height: 28px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0;
  }
  .act-item__text { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
  .act-item__time { font-size: 11px; color: #94a3b8; }

  /* Modal */
  .modal-bg {
    position: fixed; inset: 0; background: rgba(15,23,42,0.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 24px;
  }
  .modal {
    background: #fff; border-radius: 14px; width: 100%; max-width: 480px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.18); overflow: hidden;
  }
  .modal__head {
    padding: 18px 22px; border-bottom: 1px solid #e2e8f0;
    display: flex; justify-content: space-between; align-items: center;
    font-weight: 700; font-size: 16px;
  }
  .modal__body  { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
  .modal__foot  { padding: 14px 22px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }
  .modal__close { background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b; line-height: 1; }
  .modal__close:hover { color: #1e293b; }
  .field       { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 13px; font-weight: 600; color: #374151; }
  .field input, .field select, .field textarea {
    border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px;
    font-size: 13px; font-family: inherit; outline: none;
    transition: border-color 0.15s;
  }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: #1a56db; }
  .field textarea { resize: vertical; min-height: 72px; }

  /* Toast */
  .toast-wrap { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 300; }
  .toast {
    background: #1e293b; color: #fff; padding: 10px 18px;
    border-radius: 8px; font-size: 13px; font-weight: 500;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    animation: slideIn 0.2s ease;
  }
  .toast--success { background: #16a34a; }
  .toast--error   { background: #dc2626; }
  @keyframes slideIn { from { opacity:0; transform: translateX(40px); } to { opacity:1; transform: none; } }

  /* Detail panel */
  .detail-section { display: flex; flex-direction: column; gap: 8px; }
  .detail-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
  .detail-row:last-child { border-bottom: none; }
  .detail-key  { color: #64748b; font-weight: 500; }
  .detail-val  { font-weight: 600; }

  /* Tabs inside page */
  .page-tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
  .page-tab  {
    padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
    background: none; border: none; color: #64748b;
    border-bottom: 2px solid transparent; margin-bottom: -2px;
    transition: color 0.15s, border-color 0.15s;
  }
  .page-tab:hover      { color: #1a56db; }
  .page-tab--active    { color: #1a56db; border-bottom-color: #1a56db; }

  /* Filter bar */
  .filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
  .filter-select {
    border: 1px solid #d1d5db; border-radius: 8px; padding: 6px 10px;
    font-size: 12px; font-family: inherit; background: #fff; cursor: pointer; outline: none;
  }
  .filter-select:focus { border-color: #1a56db; }
  .search-input {
    border: 1px solid #d1d5db; border-radius: 8px; padding: 6px 12px;
    font-size: 12px; font-family: inherit; outline: none; flex: 1; min-width: 160px;
  }
  .search-input:focus { border-color: #1a56db; }

  /* Empty state */
  .empty { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 14px; }
  .empty__icon { font-size: 36px; margin-bottom: 10px; }

  @media (max-width: 900px) {
    .stats-grid { grid-template-columns: repeat(2,1fr); }
    .layout     { grid-template-columns: 1fr; }
  }
  @media (max-width: 540px) {
    .navbar__tabs { display: none; }
    .page         { padding: 20px 14px; }
    .stats-grid   { grid-template-columns: 1fr 1fr; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
let toastId = 0;

function Badge({ children, color, bg }) {
  return <span className="badge" style={{ color, background: bg || "#f3f4f6" }}>{children}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: New Occurrence
// ─────────────────────────────────────────────────────────────────────────────
function NewOccModal({ teams, onClose, onSave }) {
  const [form, setForm] = useState({ title:"", address:"", severity:"MEDIUM", category:"", teamId:"", notes:"" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__head">
          🆕 New Occurrence
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <div className="field">
            <label>Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Describe the occurrence..." />
          </div>
          <div className="field">
            <label>Address *</label>
            <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, number · Neighborhood" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div className="field">
              <label>Severity</label>
              <select value={form.severity} onChange={e => set("severity", e.target.value)}>
                <option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
              </select>
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}>
                <option value="">— select —</option>
                <option>Potholes</option><option>Signaling</option><option>Drainage</option>
                <option>Lighting</option><option>Other</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Assign Team</label>
            <select value={form.teamId} onChange={e => set("teamId", e.target.value)}>
              <option value="">— none —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional details..." />
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn btn--gray" onClick={onClose}>Cancel</button>
          <button className="btn btn--solid" onClick={() => { if(form.title && form.address) onSave(form); }}>
            Save Occurrence
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Occurrence Detail
// ─────────────────────────────────────────────────────────────────────────────
function DetailModal({ occ, teams, onClose, onResolve, onAssign }) {
  const [selTeam, setSelTeam] = useState("");
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__head">
          #{occ.id} — {occ.title}
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <div className="detail-section">
            <div className="detail-row"><span className="detail-key">Status</span>   <Badge color={occ.stc} bg={occ.stc+"18"}>{occ.st}</Badge></div>
            <div className="detail-row"><span className="detail-key">Severity</span> <Badge color={occ.sc}  bg={occ.sc +"18"}>{occ.sev}</Badge></div>
            <div className="detail-row"><span className="detail-key">Category</span> <Badge color={occ.cc}  bg={occ.cbg}>{occ.cat}</Badge></div>
            <div className="detail-row"><span className="detail-key">Address</span>  <span className="detail-val">{occ.addr}</span></div>
            <div className="detail-row"><span className="detail-key">Opened</span>   <span className="detail-val">{occ.date}</span></div>
          </div>
          <div className="field">
            <label>Assign to Team</label>
            <div style={{ display:"flex", gap:8 }}>
              <select value={selTeam} onChange={e => setSelTeam(e.target.value)} className="filter-select" style={{ flex:1 }}>
                <option value="">— select team —</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
              </select>
              <button className="btn btn--blue" onClick={() => selTeam && onAssign(occ.id, selTeam)}>Assign</button>
            </div>
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn btn--gray" onClick={onClose}>Close</button>
          <button className="btn btn--green" onClick={() => onResolve(occ.id)}>✅ Mark Resolved</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────────────────────────
function OccurrencesPage({ occs, teams, onResolve, onAssign, onAdd }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);

  const filtered = occs.filter(o => {
    const matchStatus = filter === "All" || o.st === filter;
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase()) || o.addr.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><h1 className="page__title">Occurrences</h1><p className="page__sub">Manage all reported occurrences</p></div>
        <button className="btn btn--solid" style={{ padding:"8px 18px", fontSize:13 }} onClick={onAdd}>+ New Occurrence</button>
      </div>
      <div className="filter-bar">
        <input className="search-input" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
        {["All","Pending","Assigned","In Progress","Resolved"].map(s => (
          <button key={s} className={`btn ${filter===s?"btn--solid":"btn--gray"}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      <div className="card">
        <div className="occ-list">
          {filtered.length === 0 && <div className="empty"><div className="empty__icon">🔍</div>No occurrences found.</div>}
          {filtered.map(o => (
            <div key={o.id} className="occ-item" onClick={() => setDetail(o)} style={{ borderLeftColor: o.sc }}>
              <div className="occ-item__meta">
                <div className="occ-item__badges">
                  <span className="occ-item__id">#{o.id}</span>
                  <Badge color={o.sc}  bg={o.sc +"18"}>{o.sev}</Badge>
                  <Badge color={o.stc} bg={o.stc+"18"}>{o.st}</Badge>
                </div>
                <Badge color={o.cc} bg={o.cbg}>{o.cat}</Badge>
              </div>
              <div className="occ-item__title">{o.title}</div>
              <div className="occ-item__addr">📍 {o.addr}</div>
              <div className="occ-item__date">📅 {o.date}</div>
              <div className="occ-item__actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn--green" onClick={() => onResolve(o.id)}>✅ Resolve</button>
                <button className="btn btn--blue"  onClick={() => setDetail(o)}>🔍 Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {detail && (
        <DetailModal
          occ={detail} teams={teams}
          onClose={() => setDetail(null)}
          onResolve={id => { onResolve(id); setDetail(null); }}
          onAssign={(occId, teamId) => { onAssign(occId, teamId); setDetail(null); }}
        />
      )}
    </div>
  );
}

function TeamsPage({ teams, onToggleStatus }) {
  return (
    <div>
      <h1 className="page__title">Teams</h1>
      <p className="page__sub">Manage field teams and their availability</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {teams.map(t => (
          <div key={t.id} className="card" style={{ padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{t.name}</div>
              <Badge color={t.status==="Available"?"#16a34a":"#d97706"} bg={t.status==="Available"?"#dcfce7":"#fef3c7"}>{t.status}</Badge>
            </div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>
              👥 {t.members} members{t.tasks && ` · ${t.tasks}`}
            </div>
            <button
              className={`btn ${t.status==="Available"?"btn--red":"btn--green"}`}
              style={{ width:"100%" }}
              onClick={() => onToggleStatus(t.id)}
            >
              {t.status==="Available" ? "Mark as Busy" : "Mark as Available"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,      setTab]      = useState("Dashboard");
  const [occs,     setOccs]     = useState(MOCK_OCCS);
  const [teams,    setTeams]    = useState(MOCK_TEAMS);
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [toasts,   setToasts]   = useState([]);
  const [showNew,  setShowNew]  = useState(false);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const toast = (msg, type="") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  // ── Actions (wire to API calls here) ─────────────────────────────────────
  const handleResolve = (id) => {
    // TODO: await api.resolveOcc(id)
    setOccs(prev => prev.map(o => o.id===id ? { ...o, st:"Resolved", stc:"#16a34a" } : o));
    pushActivity("✅","#16a34a",`Occurrence #${id} marked as resolved`);
    toast(`#${id} resolved ✅`, "success");
  };

  const handleAssign = (occId, teamId) => {
    // TODO: await api.assignTeam(occId, teamId)
    const team = teams.find(t => String(t.id)===String(teamId));
    setOccs(prev => prev.map(o => o.id===occId ? { ...o, st:"Assigned", stc:"#2563eb" } : o));
    setTeams(prev => prev.map(t => String(t.id)===String(teamId) ? { ...t, status:"Busy", tasks:`1 active task` } : t));
    pushActivity("👥","#2563eb",`#${occId} assigned to ${team?.name}`);
    toast(`Assigned to ${team?.name} 👥`);
  };

  const handleCreate = (form) => {
    // TODO: await api.createOcc(form)
    const newId = String(9000 + occs.length + 1);
    const sevColor = { CRITICAL:"#dc2626", HIGH:"#d97706", MEDIUM:"#f59e0b", LOW:"#64748b" };
    const sc = sevColor[form.severity] || "#64748b";
    setOccs(prev => [{
      id:newId, sev:form.severity, st:"Pending", cat:form.category||"Other",
      title:form.title, addr:form.address, date:new Date().toLocaleDateString("en-GB"),
      sc, stc:"#f97316", cc:"#92400e", cbg:"#fef3c7",
    }, ...prev]);
    pushActivity("🔴","#dc2626",`New occurrence #${newId} created`);
    toast(`Occurrence #${newId} created 🆕`, "success");
    setShowNew(false);
  };

  const handleToggleTeam = (id) => {
    setTeams(prev => prev.map(t =>
      t.id===id ? { ...t, status: t.status==="Available"?"Busy":"Available", tasks: t.status==="Available"?"1 active task":null } : t
    ));
    const team = teams.find(t => t.id===id);
    toast(`${team?.name} status updated`);
  };

  const pushActivity = (icon, color, text) => {
    setActivity(prev => [{ icon, color, text, time:"Just now" }, ...prev].slice(0, 8));
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = [
    { label:"Pending",        value: occs.filter(o=>o.st==="Pending").length,     sub:"Requires attention",  color:"#f97316", bg:"#fff7ed", icon:"⏰" },
    { label:"Assigned",       value: occs.filter(o=>o.st==="Assigned").length,    sub:"Teams assigned",      color:"#7c3aed", bg:"#f5f3ff", icon:"👥" },
    { label:"In Progress",    value: occs.filter(o=>o.st==="In Progress").length, sub:"Being resolved",      color:"#2563eb", bg:"#eff6ff", icon:"🕐" },
    { label:"Resolved Today", value: occs.filter(o=>o.st==="Resolved").length,    sub:"This session",        color:"#16a34a", bg:"#f0fdf4", icon:"✅" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar__brand">
          <div className="navbar__logo">📍</div>
          <div>
            <div className="navbar__name">Sentinela Civil</div>
            <div className="navbar__sub">Operator Panel</div>
          </div>
        </div>
        <div className="navbar__tabs">
          {["Dashboard","Occurrences","Teams"].map(t => (
            <button key={t} className={`navbar__tab${tab===t?" navbar__tab--active":""}`} onClick={() => setTab(t)}>
              {t==="Occurrences" && <span className="navbar__notif">{occs.filter(o=>o.st==="Pending").length}</span>}
              {t}
            </button>
          ))}
        </div>
        <div className="navbar__avatar" onClick={() => toast("Profile — coming soon")}>MG</div>
      </nav>

      <main className="page">

        {/* ── DASHBOARD TAB ── */}
        {tab==="Dashboard" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
            <div><h1 className="page__title">Dashboard</h1><p className="page__sub">Overview of occurrences and teams</p></div>
            <button className="btn btn--solid" style={{ padding:"8px 18px" }} onClick={() => setShowNew(true)}>+ New Occurrence</button>
          </div>

          {/* Stat cards */}
          <div className="stats-grid">
            {stats.map(s => (
              <div key={s.label} className="stat-card" style={{ background:s.bg, borderColor:s.color+"33" }}
                onClick={() => { setTab("Occurrences"); }}>
                <div>
                  <div className="stat-card__label">{s.label}</div>
                  <div className="stat-card__value" style={{ color:s.color }}>{s.value}</div>
                  <div className="stat-card__sub"   style={{ color:s.color }}>{s.sub}</div>
                </div>
                <div className="stat-card__icon">{s.icon}</div>
              </div>
            ))}
          </div>

          <div className="layout">
            {/* Left */}
            <div className="col">
              <div className="card">
                <div className="card__head">🗺️ Real-Time Occurrence Map</div>
                <div className="map-body">
                  {[20,40,60,80].map(p => <div key={`h${p}`} className="map-line-h" style={{ top:`${p}%` }} />)}
                  {[20,40,60,80].map(p => <div key={`v${p}`} className="map-line-v" style={{ left:`${p}%` }} />)}
                  {MAP_DOTS.map((d,i) => (
                    <div key={i} className="map-dot" title={`Occurrence ${i+1}`} style={{
                      left:d.x, top:d.y, width:d.size, height:d.size,
                      background:d.color, boxShadow:`0 0 8px ${d.color}88`,
                    }} onClick={() => toast(`Occurrence at pin ${i+1} — map integration pending`)} />
                  ))}
                  <div className="map-tag">Recife, PE</div>
                </div>
              </div>

              <div className="card">
                <div className="card__head">
                  <span>Recent Occurrences</span>
                  <button className="card__link" onClick={() => setTab("Occurrences")}>See all →</button>
                </div>
                <div className="occ-list">
                  {occs.slice(0,3).map(o => (
                    <div key={o.id} className="occ-item" style={{ borderLeftColor:o.sc }}
                      onClick={() => setTab("Occurrences")}>
                      <div className="occ-item__meta">
                        <div className="occ-item__badges">
                          <span className="occ-item__id">#{o.id}</span>
                          <Badge color={o.sc}  bg={o.sc +"18"}>{o.sev}</Badge>
                          <Badge color={o.stc} bg={o.stc+"18"}>{o.st}</Badge>
                        </div>
                        <Badge color={o.cc} bg={o.cbg}>{o.cat}</Badge>
                      </div>
                      <div className="occ-item__title">{o.title}</div>
                      <div className="occ-item__addr">📍 {o.addr}</div>
                      <div className="occ-item__date">📅 {o.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="col">
              <div className="card">
                <div className="card__head card__head--sm">
                  <span>👥 Teams</span>
                  <button className="card__link" onClick={() => setTab("Teams")}>See all →</button>
                </div>
                <div className="teams-list">
                  {teams.map(t => (
                    <div key={t.id} className="team-row" onClick={() => setTab("Teams")}>
                      <div>
                        <div className="team-row__name">{t.name}</div>
                        <div className="team-row__info">{t.members} members{t.tasks && ` · ${t.tasks}`}</div>
                      </div>
                      <Badge color={t.status==="Available"?"#16a34a":"#d97706"} bg={t.status==="Available"?"#dcfce7":"#fef3c7"}>{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card__head card__head--sm">📈 Statistics</div>
                <div className="stats-panel">
                  {[
                    { label:"Resolution Rate", value: occs.length ? Math.round(occs.filter(o=>o.st==="Resolved").length/occs.length*100)+"%" : "0%", bar: occs.length ? Math.round(occs.filter(o=>o.st==="Resolved").length/occs.length*100) : 0, color:"#16a34a" },
                    { label:"Average Time",        value:"2.5 days" },
                    { label:"Occurrences (Total)", value:occs.length },
                    { label:"Available Teams",     value:teams.filter(t=>t.status==="Available").length },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="stat-row__line">
                        <span className="stat-row__label">{s.label}</span>
                        <span className="stat-row__val" style={{ color:s.color||"#1e293b" }}>{s.value}</span>
                      </div>
                      {s.bar != null && (
                        <div className="bar-track"><div className="bar-fill" style={{ width:`${s.bar}%`, background:s.color }} /></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card__head card__head--sm">⚡ Recent Activity</div>
                <div className="act-list">
                  {activity.map((a,i) => (
                    <div key={i} className="act-item">
                      <div className="act-item__icon" style={{ background:a.color+"18" }}>{a.icon}</div>
                      <div>
                        <div className="act-item__text">{a.text}</div>
                        <div className="act-item__time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>}

        {/* ── OCCURRENCES TAB ── */}
        {tab==="Occurrences" && (
          <OccurrencesPage
            occs={occs} teams={teams}
            onResolve={handleResolve}
            onAssign={handleAssign}
            onAdd={() => setShowNew(true)}
          />
        )}

        {/* ── TEAMS TAB ── */}
        {tab==="Teams" && (
          <TeamsPage teams={teams} onToggleStatus={handleToggleTeam} />
        )}
      </main>

      {/* New occurrence modal */}
      {showNew && <NewOccModal teams={teams} onClose={() => setShowNew(false)} onSave={handleCreate} />}

      {/* Toasts */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}