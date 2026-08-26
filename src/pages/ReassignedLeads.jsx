import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { leadAPI } from "../api/lead";
import { useNavigate } from "react-router-dom";
import {
  Phone, RefreshCw, AlertCircle, ChevronRight,
  Eye, Search, PhoneCall, CheckCircle2, FileText, Send, Calendar, X, Tag, Star,
  RotateCcw, ArrowRight, Filter
} from "lucide-react";
import { toast } from "sonner";

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
  call_done:      { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
};

const formatDateForInput = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPresetDates = (preset) => {
  const now = new Date();
  const todayStr = formatDateForInput(now);

  if (preset === "today") {
    return { start: todayStr, end: todayStr };
  }
  if (preset === "yesterday") {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = formatDateForInput(y);
    return { start: yStr, end: yStr };
  }
  if (preset === "this_week") {
    const w = new Date();
    w.setDate(w.getDate() - 6);
    return { start: formatDateForInput(w), end: todayStr };
  }
  if (preset === "this_month") {
    const m = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: formatDateForInput(m), end: todayStr };
  }
  return { start: "", end: "" };
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

export default function ReassignedLeads() {
  const { themeColors: c } = useTheme();
  const navigate = useNavigate();
  const isDark = c.mode === "dark";

  const [leads, setLeads]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(false);
  const [search, setSearch]           = useState("");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [activeDatePreset, setActiveDatePreset] = useState("all");

  const [remarkModal, setRemarkModal]   = useState(false);
  const [remarkLead, setRemarkLead]     = useState(null);
  const [remarkForm, setRemarkForm]     = useState({ note: "", followUpDate: "", status: "" });
  const [addingRemark, setAddingRemark] = useState(false);

  const [statusModal, setStatusModal]       = useState(false);
  const [statusLead, setStatusLead]         = useState(null);
  const [newStatus, setNewStatus]           = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const PAGE_SIZE = 50;

  useEffect(() => { fetchLeads(1, true); }, []);

  // Fetch page-by-page directly with server-side isReassigned filter & date filters
  const fetchLeads = async (pageNum = 1, reset = false, sDate = startDate, eDate = endDate, qSearch = search) => {
    try {
      reset ? setLoading(true) : setLoadingMore(true);
      setError(null);
      const params = { page: pageNum, limit: PAGE_SIZE, isReassigned: true };
      if (qSearch && qSearch.trim()) params.search = qSearch.trim();
      if (sDate) params.startDate = sDate;
      if (eDate) params.endDate = eDate;

      const res = await leadAPI.getAllLeads(params);
      const batch = res?.data?.leads || [];
      const totalPages = res?.pages || 1;
      setLeads(prev => reset ? batch : [...prev, ...batch]);
      setPage(pageNum);
      setHasMore(pageNum < totalPages);
    } catch {
      setError("Failed to load reassigned leads.");
      toast.error("Failed to load reassigned leads.");
    } finally { setLoading(false); setLoadingMore(false); }
  };

  const handlePresetClick = (preset) => {
    setActiveDatePreset(preset);
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      fetchLeads(1, true, "", "", search);
    } else {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
      fetchLeads(1, true, start, end, search);
    }
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    setActiveDatePreset("custom");
    fetchLeads(1, true, val, endDate, search);
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    setEndDate(val);
    setActiveDatePreset("custom");
    fetchLeads(1, true, startDate, val, search);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setActiveDatePreset("all");
    fetchLeads(1, true, "", "", search);
  };

  const handleMarkCallDone = async (lead, e) => {
    e?.stopPropagation();
    try {
      await leadAPI.updateLead(lead._id, { isCallDone: true });
      toast.success("Marked as call done!");
      fetchLeads(1, true, startDate, endDate, search);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark call done.");
    }
  };

  const openRemarkModal = (lead, e) => {
    e?.stopPropagation();
    setRemarkLead(lead);
    setRemarkForm({ note: "", followUpDate: "", status: "" });
    setRemarkModal(true);
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkForm.note.trim()) return toast.error("Note is required.");
    setAddingRemark(true);
    try {
      const payload = {
        note: remarkForm.note.trim(),
        ...(remarkForm.status && { status: remarkForm.status }),
        ...(remarkForm.followUpDate && { followUpDate: new Date(remarkForm.followUpDate).toISOString() }),
      };
      await leadAPI.addRemark(remarkLead._id, payload);
      toast.success("Remark added!");
      setRemarkModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add remark.");
    } finally { setAddingRemark(false); }
  };

  const openStatusModal = (lead, e) => {
    e?.stopPropagation();
    setStatusLead(lead);
    setNewStatus(lead.status);
    setStatusModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === statusLead.status) return toast.error("Select a different status.");
    setUpdatingStatus(true);
    try {
      await leadAPI.updateLead(statusLead._id, { status: newStatus });
      toast.success("Status updated!");
      setStatusModal(false);
      fetchLeads(1, true, startDate, endDate, search);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
    } finally { setUpdatingStatus(false); }
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return !search ||
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(search) ||
      l.email?.toLowerCase().includes(q);
  });

  const paginated = filtered;
  const inputSt   = { backgroundColor: c.background, color: c.text, borderColor: c.border };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle size={40} color="#dc2626" />
      <p style={{ color: c.text }}>{error}</p>
      <button onClick={() => fetchLeads(1, true, startDate, endDate, search)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: c.primary }}>
        <RefreshCw size={14} className="inline mr-2" /> Retry
      </button>
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-black">R</span>
            Reassigned Leads
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            {leads.length} leads reassigned to you {startDate || endDate ? `(filtered ${activeDatePreset !== "custom" && activeDatePreset !== "all" ? `• ${activeDatePreset.replace("_", " ")}` : ""})` : "— call them now"}
          </p>
        </div>
        <button onClick={() => fetchLeads(1, true, startDate, endDate, search)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
          style={{ borderColor: c.border, color: c.textSecondary, backgroundColor: c.surface }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Search & Date Filter Card */}
      <div className="p-4 sm:p-5 rounded-2xl border space-y-3.5 shadow-sm" style={{ backgroundColor: c.surface, borderColor: c.border }}>
        {/* Row 1: Search bar + Quick Date Presets */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: c.textSecondary }} />
            <input value={search} onChange={e => { setSearch(e.target.value); if (e.target.value === "") fetchLeads(1, true, startDate, endDate, ""); }}
              onKeyDown={e => e.key === "Enter" && fetchLeads(1, true, startDate, endDate, search)}
              placeholder="Search by name, phone, email... (press Enter)"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
              style={inputSt} />
            {search && (
              <button onClick={() => { setSearch(""); fetchLeads(1, true, startDate, endDate, ""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:opacity-80"
                style={{ color: c.textSecondary }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
            {[
              { id: "all", label: "All" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "this_week", label: "This Week" },
              { id: "this_month", label: "This Month" },
            ].map(p => {
              const isSelected = activeDatePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetClick(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: isSelected ? c.primary : "transparent",
                    color: isSelected ? "#fff" : c.textSecondary,
                    boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                  }}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: From Date -> To Date Pickers + Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: isDark ? `${c.border}50` : `${c.border}80` }}>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: c.textSecondary }}>
              <Calendar size={13} style={{ color: c.primary }} /> Date Range:
            </span>

            {/* From Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
              <span className="text-[11px] font-bold" style={{ color: c.textSecondary }}>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                style={{ color: c.text }}
              />
            </div>

            <ArrowRight size={13} style={{ color: c.textSecondary }} className="hidden sm:block" />

            {/* To Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
              <span className="text-[11px] font-bold" style={{ color: c.textSecondary }}>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                style={{ color: c.text }}
              />
            </div>

            {/* Clear / Reset Date Filter button */}
            {(startDate || endDate || activeDatePreset !== "all") && (
              <button
                type="button"
                onClick={handleClearDates}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: isDark ? "#374151" : "#f3f4f6", color: isDark ? "#d1d5db" : "#4b5563" }}
                title="Clear date filter">
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          {/* Active Filter Info Badge */}
          {(startDate || endDate) && (
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.primary }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: c.primary }} />
              <span>
                {startDate === endDate && startDate ? (
                  <>Selected: {new Date(startDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</>
                ) : (
                  <>
                    {startDate ? new Date(startDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Start"}
                    {" → "}
                    {endDate ? new Date(endDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "End"}
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {paginated.length === 0 && (
        <div className="py-20 text-center rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <span className="text-5xl">📞</span>
          <p className="font-bold text-lg mt-3" style={{ color: c.text }}>No reassigned leads</p>
          <p className="text-sm mt-1" style={{ color: c.textSecondary }}>
            {search || startDate || endDate ? "Try adjusting your search or date filter" : "You have no reassigned leads right now"}
          </p>
        </div>
      )}

      {/* Table */}
      {paginated.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr style={{ backgroundColor: isDark ? `${c.background}99` : `${c.background}80`, borderBottom: `1px solid ${c.border}` }}>
                  {["#", "Name", "Phone", "Status", "Priority", "Assigned To", "Created At", "Actions"].map((h, i) => (
                    <th key={i} className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
                      style={{ color: c.textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((lead, idx) => (
                  <tr key={lead._id}
                    className="border-b transition-colors duration-150 cursor-pointer"
                    style={{ borderColor: c.border }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? `${c.primary}10` : `${c.primary}06`}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    onClick={() => navigate(`/lead-details/${lead._id}`)}>

                    <td className="px-4 py-3 text-xs font-bold" style={{ color: c.textSecondary }}>
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black" style={{ color: c.text }}>{lead.name || "—"}</p>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-orange-500 text-white tracking-wide uppercase">
                          REASSIGNED
                        </span>
                      </div>
                      {lead.email && <p className="text-xs truncate max-w-[160px]" style={{ color: c.textSecondary }}>{lead.email}</p>}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <a href={`tel:${lead.phone}`}
                        className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
                        style={{ color: c.text }}>
                        <Phone size={12} color="#10b981" /> {lead.phone || "—"}
                      </a>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><PriorityBadge priority={lead.priority} /></td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                            style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                            {lead.assignedTo?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="text-xs font-semibold truncate max-w-[90px]" style={{ color: c.text }}>
                            {lead.assignedTo?.name}
                          </span>
                        </div>
                      ) : <span className="text-xs italic" style={{ color: c.textSecondary }}>Unassigned</span>}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.createdAt ? (
                        <div>
                          <p className="text-xs font-bold" style={{ color: c.text }}>
                            {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-[11px]" style={{ color: c.textSecondary }}>
                            {new Date(lead.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </p>
                        </div>
                      ) : <span className="text-xs" style={{ color: c.textSecondary }}>—</span>}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {/* Primary: Call button — big & prominent */}
                        <a href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-105"
                          style={{ backgroundColor: "#10b981", borderColor: "#059669", color: "#fff" }}
                          title="Call Now">
                          <PhoneCall size={13} /> Call
                        </a>
                        <button onClick={() => navigate(`/lead-details/${lead._id}`)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" }}
                          title="View Details">
                          <Eye size={13} />
                        </button>
                        <button onClick={e => openStatusModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#eef2ff", borderColor: "#c7d2fe", color: "#4338ca" }}
                          title="Update Status">
                          <Tag size={13} />
                        </button>
                        <button onClick={e => openRemarkModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d", color: "#b45309" }}
                          title="Add Remark">
                          <FileText size={13} />
                        </button>
                        <button onClick={e => handleMarkCallDone(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#e0f2fe", borderColor: "#bae6fd", color: "#0369a1" }}
                          title="Mark Call Done">
                          <CheckCircle2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button onClick={() => fetchLeads(page + 1, false)}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: c.border, color: c.textSecondary, backgroundColor: c.surface }}>
            {loadingMore ? <><RefreshCw size={14} className="animate-spin" /> Loading…</> : <><ChevronRight size={14} /> Load More</>}
          </button>
        </div>
      )}
      {!hasMore && leads.length > 0 && (
        <p className="text-center text-xs py-2" style={{ color: c.textSecondary }}>
          Showing all {leads.length} reassigned leads
        </p>
      )}

      {/* Remark Modal */}
      {remarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setRemarkModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fffbeb", color: "#b45309" }}><FileText size={16} /></div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Add Remark</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{remarkLead?.name} · {remarkLead?.phone}</p>
                </div>
              </div>
              <button onClick={() => setRemarkModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>
            <form onSubmit={handleAddRemark} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Note *</label>
                <textarea value={remarkForm.note} onChange={e => setRemarkForm(f => ({ ...f, note: e.target.value }))}
                  rows={4} required placeholder="e.g. Called, discussed pricing..." autoFocus
                  className="w-full p-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }} />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Update Status (Optional)</label>
                <select value={remarkForm.status} onChange={e => setRemarkForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full p-3 rounded-xl border text-sm font-semibold outline-none"
                  style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }}>
                  <option value="">No Change</option>
                  {["new","assigned","interested","in_process","converted","closed","not_interested","call_done"].map(s => (
                    <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}><Calendar size={10} className="inline mr-1" />Follow-up Date & Time</label>
                <input type="datetime-local" value={remarkForm.followUpDate}
                  onChange={e => setRemarkForm(f => ({ ...f, followUpDate: e.target.value }))}
                  className="w-full p-3 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }} />
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setRemarkModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={addingRemark || !remarkForm.note.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 hover:opacity-90"
                  style={{ backgroundColor: "#f59e0b", color: "#fff" }}>
                  {addingRemark ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Send size={14} /> Add Remark</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setStatusModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#eef2ff", color: "#4338ca" }}><Tag size={16} /></div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Update Status</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{statusLead?.name} · {statusLead?.phone}</p>
                </div>
              </div>
              <button onClick={() => setStatusModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {["new","assigned","interested","in_process","not_interested","call_done"].map(s => {
                  const cfg = statusConfig[s];
                  const isSelected = newStatus === s;
                  return (
                    <button key={s} type="button" onClick={() => setNewStatus(s)}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all"
                      style={{ backgroundColor: isSelected ? (isDark ? `${cfg.color}20` : cfg.bg) : c.background, borderColor: isSelected ? cfg.color : c.border, color: isSelected ? cfg.color : c.text }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? cfg.color : c.border }} />
                      <span className="text-xs font-bold">{s.replace("_", " ").toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setStatusModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={updatingStatus || !newStatus}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 hover:opacity-90"
                  style={{ backgroundColor: "#4338ca", color: "#fff" }}>
                  {updatingStatus ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</> : <><Tag size={14} /> Update Status</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
