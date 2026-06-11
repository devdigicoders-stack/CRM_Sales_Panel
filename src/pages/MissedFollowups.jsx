import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { leadAPI } from "../api/lead";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Phone, Mail, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, Eye, PhoneCall, MessageCircle,
  Tag, Calendar, Clock, Table2, LayoutGrid, Search, CalendarX, X, Send
} from "lucide-react";
import { toast } from "sonner";

const ITEMS = 10;

const priorityConfig = {
  high:   { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
  medium: { bg: "#fef3c7", color: "#b45309", border: "#fcd34d" },
  low:    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
};

const statusConfig = {
  new:            { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  assigned:       { bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe" },
  interested:     { bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7" },
  in_process:     { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  converted:      { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  closed:         { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" },
  not_interested: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status?.toLowerCase()] || statusConfig.new;
  return (
    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      {status?.replace("_", " ") || "—"}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = priorityConfig[priority?.toLowerCase()] || priorityConfig.medium;
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase border whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      {priority || "medium"}
    </span>
  );
};

export default function MissedFollowups() {
  const { themeColors: c } = useTheme();
  const navigate = useNavigate();
  const isDark = c.mode === "dark";

  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [view, setView]       = useState("table");

  const [followupModal, setFollowupModal]   = useState(false);
  const [followupLead, setFollowupLead]     = useState(null);
  const [followupForm, setFollowupForm] = useState({ note: "", date: "" });
  const [addingFollowup, setAddingFollowup] = useState(false);

  useEffect(() => { fetchMissed(); }, []);

  const fetchMissed = async () => {
    try {
      setLoading(true); setError(null);
      const res = await leadAPI.getAllLeads();
      const allLeads = res?.data?.leads || [];
      
      const missedLeads = allLeads.filter(l => {
        if (!l.followUpDate) return false;
        return new Date(l.followUpDate) < new Date();
      });
      
      setLeads(missedLeads.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate)));
    } catch {
      setError("Failed to load missed follow-ups.");
      toast.error("Failed to load data.");
    } finally { setLoading(false); }
  };

  const openFollowupModal = (lead, e) => {
    e?.stopPropagation();
    setFollowupLead(lead);
    setFollowupForm({ note: "Set next touchpoint follow-up.", date: "" });
    setFollowupModal(true);
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!followupForm.note || !followupForm.date) return toast.error("Note and date required.");
    setAddingFollowup(true);
    try {
      const dateObj = new Date(followupForm.date);
      const payload = {
        note: followupForm.note,
        followUpDate: dateObj.toISOString(),
      };
      await leadAPI.addRemark(followupLead._id, payload);
      toast.success("Follow-up scheduled successfully!");
      setFollowupModal(false);
      fetchMissed();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to schedule follow-up.");
    } finally {
      setAddingFollowup(false);
    }
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return !search ||
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(search) ||
      l.email?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS) || 1;
  const paginated  = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  const fmtDate = d => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const fmtDateTime = d => d
    ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  const daysOverdue = d => {
    if (!d) return null;
    const diff = Math.floor((Date.now() - new Date(d)) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: "#ef4444" }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading missed follow-ups…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle size={40} color="#dc2626" />
      <p style={{ color: c.text }}>{error}</p>
      <button onClick={fetchMissed}
        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: "#ef4444" }}>
        <RefreshCw size={14} className="inline mr-2" /> Retry
      </button>
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <AlertTriangle size={26} color="#ef4444" /> Missed Follow-ups
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            Overdue leads that need immediate attention.
          </p>
        </div>
        <button onClick={fetchMissed}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border p-5 flex flex-wrap items-center gap-6"
        style={{ backgroundColor: isDark ? "#450a0a" : "#fff1f2", borderColor: "#fecaca" }}>
        <div className="absolute -right-4 -top-4 opacity-10">
          <AlertTriangle size={120} color="#ef4444" />
        </div>

        {[
          { label: "Total Overdue",  value: leads.length,                                           color: "#ef4444" },
          { label: "High Priority",  value: leads.filter(l => l.priority === "high").length,        color: "#b91c1c" },
          { label: "Interested",     value: leads.filter(l => l.status === "interested").length,    color: "#10b981" },
          { label: "Unassigned",     value: leads.filter(l => !l.assignedTo).length,               color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} className="z-10">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label}</p>
            <p className="text-3xl font-black" style={{ color: isDark ? "#fca5a5" : color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.textSecondary }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
          {["table", "card"].map(v => (
            <button key={v} onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: view === v ? c.surface : "transparent",
                color: view === v ? "#ef4444" : c.textSecondary,
                border: view === v ? `1px solid ${c.border}` : "1px solid transparent",
              }}>
              {v === "table" ? <><Table2 size={14} /> Table</> : <><LayoutGrid size={14} /> Cards</>}
            </button>
          ))}
        </div>
      </div>

      {paginated.length === 0 && (
        <div className="py-20 text-center rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <CalendarX size={40} className="mx-auto mb-3" color="#ef4444" />
          <p className="font-bold text-lg" style={{ color: c.text }}>
            {search ? "No results found" : "No Missed Follow-ups!"}
          </p>
          <p className="text-sm mt-1" style={{ color: c.textSecondary }}>
            {search ? "Try different search" : "Great work — all caught up!"}
          </p>
        </div>
      )}

      {paginated.length > 0 && view === "table" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr style={{ backgroundColor: isDark ? "#450a0a22" : "#fff1f2", borderBottom: `1px solid ${c.border}` }}>
                  {["#", "Name", "Phone", "Email", "Source", "Status", "Priority", "Missed Date", "Overdue", "Last Remark", "Assigned To", "Actions"].map(h => (
                    <th key={h}
                      className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
                      style={{ color: h === "Missed Date" || h === "Overdue" ? "#ef4444" : c.textSecondary }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((lead, idx) => {
                  const lastRemark = lead.remarks?.length ? lead.remarks[lead.remarks.length - 1].note : "—";
                  const overdue = daysOverdue(lead.followUpDate);
                  return (
                    <tr key={lead._id}
                      className="border-b transition-colors duration-150 cursor-pointer"
                      style={{ borderColor: c.border }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#450a0a22" : "#fff1f2"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      onClick={() => navigate(`/lead-details/${lead._id}`)}>

                      <td className="px-4 py-3 text-xs font-bold" style={{ color: c.textSecondary }}>
                        {(page - 1) * ITEMS + idx + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-black" style={{ color: c.text }}>{lead.name || "—"}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <a href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
                          style={{ color: c.text }}>
                          <Phone size={12} color="#10b981" /> {lead.phone || "—"}
                        </a>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs truncate max-w-[140px]" style={{ color: c.textSecondary }}>{lead.email || "—"}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold" style={{ color: c.textSecondary }}>{lead.source || "—"}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3 whitespace-nowrap"><PriorityBadge priority={lead.priority} /></td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
                          style={{ backgroundColor: isDark ? "#450a0a" : "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}>
                          <CalendarX size={11} /> {fmtDate(lead.followUpDate)}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {overdue ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black border"
                            style={{ backgroundColor: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                            {overdue}d ago
                          </span>
                        ) : <span style={{ color: c.textSecondary }}>—</span>}
                      </td>

                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-xs truncate" style={{ color: c.textSecondary }} title={lastRemark}>
                          {lastRemark}
                        </p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                              style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                              {lead.assignedTo?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <span className="text-xs font-semibold truncate max-w-[80px]" style={{ color: c.text }}>
                              {lead.assignedTo?.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs italic" style={{ color: c.textSecondary }}>Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/lead-details/${lead._id}`)}
                            className="p-2 rounded-lg border transition-all hover:scale-105"
                            style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" }}
                            title="View Details">
                            <Eye size={14} />
                          </button>
                          <a href={`tel:${lead.phone}`}
                            className="p-2 rounded-lg border transition-all hover:scale-105"
                            style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }}
                            title="Call">
                            <PhoneCall size={14} />
                          </a>
                          <button onClick={e => openFollowupModal(lead, e)}
                            className="p-2 rounded-lg border transition-all hover:scale-105"
                            style={{ backgroundColor: "#fef3c7", borderColor: "#fed7aa", color: "#b45309" }}
                            title="Schedule Follow-up">
                            <Calendar size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paginated.length > 0 && view === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map(lead => {
            const pCfg = priorityConfig[lead.priority?.toLowerCase()] || priorityConfig.medium;
            const lastRemark = lead.remarks?.length ? lead.remarks[lead.remarks.length - 1].note : null;
            const overdue = daysOverdue(lead.followUpDate);

            return (
              <div key={lead._id}
                className="rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                style={{ backgroundColor: c.surface, borderColor: c.border }}
                onClick={() => navigate(`/lead-details/${lead._id}`)}>

                <div className="h-1.5 w-full" style={{ backgroundColor: pCfg.color }} />

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-base truncate" style={{ color: c.text }}>{lead.name}</p>
                      <p className="text-xs" style={{ color: c.textSecondary }}>{lead.source || "—"}</p>
                    </div>
                    {overdue && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black border shrink-0"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                        {overdue}d overdue
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: c.text }}>
                      <Phone size={12} color="#10b981" /> {lead.phone}
                    </p>
                    {lead.email && (
                      <p className="flex items-center gap-2 text-xs truncate" style={{ color: c.textSecondary }}>
                        <Mail size={12} /> {lead.email}
                      </p>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
                    style={{ backgroundColor: isDark ? "#450a0a" : "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}>
                    <CalendarX size={11} /> {fmtDate(lead.followUpDate)}
                  </span>

                  {lead.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lead.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{ backgroundColor: isDark ? `${c.primary}20` : "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
                          <Tag size={9} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {lastRemark && (
                    <p className="text-xs px-3 py-2 rounded-lg border italic truncate"
                      style={{ backgroundColor: c.background, borderColor: c.border, color: c.textSecondary }}>
                      💬 {lastRemark}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: c.border }}>
                    <div className="flex gap-1.5">
                      <StatusBadge status={lead.status} />
                      <PriorityBadge priority={lead.priority} />
                    </div>
                    {lead.assignedTo && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                          {lead.assignedTo?.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold truncate max-w-[70px]" style={{ color: c.textSecondary }}>
                          {lead.assignedTo?.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => navigate(`/lead-details/${lead._id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80"
                      style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" }}>
                      <Eye size={13} /> View
                    </button>
                    <a href={`tel:${lead.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80"
                      style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }}>
                      <PhoneCall size={13} /> Call
                    </a>
                    <button onClick={e => openFollowupModal(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80"
                      style={{ backgroundColor: "#fef3c7", borderColor: "#fed7aa", color: "#b45309" }}>
                      <Calendar size={13} /> Followup
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {paginated.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-sm" style={{ color: c.textSecondary }}>
            Showing <b style={{ color: c.text }}>{(page - 1) * ITEMS + 1}</b>–
            <b style={{ color: c.text }}>{Math.min(page * ITEMS, filtered.length)}</b> of{" "}
            <b style={{ color: c.text }}>{filtered.length}</b> leads
          </p>
          <div className="flex gap-1.5">
            <PageBtn onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} c={c}>
              <ChevronLeft size={15} />
            </PageBtn>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                style={{ backgroundColor: page === n ? "#ef4444" : c.background, color: page === n ? "#fff" : c.text, border: `1px solid ${page === n ? "#ef4444" : c.border}` }}>
                {n}
              </button>
            ))}
            <PageBtn onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} c={c}>
              <ChevronRight size={15} />
            </PageBtn>
          </div>
        </div>
      )}

      {followupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setFollowupModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}><Calendar size={16} /></div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Schedule Follow-up</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{followupLead?.name} · {followupLead?.phone}</p>
                </div>
              </div>
              <button onClick={() => setFollowupModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>

            <form onSubmit={handleAddFollowup} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Follow-up Note *</label>
                <textarea value={followupForm.note} onChange={e => setFollowupForm(f => ({ ...f, note: e.target.value }))}
                  required placeholder="e.g. Set next touchpoint follow-up." rows={3} className="w-full p-3 rounded-xl border text-sm outline-none resize-none" style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }} />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Follow-up Date & Time *</label>
                <input type="datetime-local" value={followupForm.date} onChange={e => setFollowupForm(f => ({ ...f, date: e.target.value }))}
                  required className="w-full p-3 rounded-xl border text-sm outline-none" style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }} />
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setFollowupModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={addingFollowup || !followupForm.note || !followupForm.date} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90" style={{ backgroundColor: "#b45309", color: "#fff" }}>
                  {addingFollowup ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling…</> : <><Send size={14} /> Schedule Follow-up</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children, onClick, disabled, c }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40"
      style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}>
      {children}
    </button>
  );
}
