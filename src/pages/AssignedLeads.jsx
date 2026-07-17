import React, { useState, useEffect } from "react";
import WhatsAppChooserModal from '../components/WhatsAppChooserModal';
import { useTheme } from "../context/ThemeContext";
import { leadAPI } from "../api/lead";
import { useNavigate } from "react-router-dom";
import {
  Users, Phone, Mail, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, Eye, UserCheck,
  Search, LayoutGrid, Table2, TrendingUp,
  PhoneCall, MessageCircle, Tag, X, FileText, Send, Calendar, Upload, ArrowRight, Truck, Plus, Star, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const ITEMS = 10;
const STATUS_OPTS = ["all","new","assigned","interested","in_process","converted","closed","not_interested","call_done"];

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

export default function AssignedLeads() {
  const { themeColors: c } = useTheme();
  const navigate = useNavigate();
  const isDark = c.mode === "dark";

  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [dateFilter, setDateFilter]             = useState("");
  const [view, setView]       = useState("table");
  const [callTab, setCallTab] = useState("pending");
  const [waModalLead, setWaModalLead] = useState(null);

  const [remarkModal, setRemarkModal]   = useState(false);
  const [remarkLead, setRemarkLead]     = useState(null);
  const [remarkForm, setRemarkForm] = useState({ note: "", followUpDate: "", status: "" });
  const [addingRemark, setAddingRemark] = useState(false);

  const [docModal, setDocModal]         = useState(false);
  const [docLead, setDocLead]           = useState(null);
  const [docFile, setDocFile]           = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [transferModal, setTransferModal]   = useState(false);
  const [transferLead, setTransferLead]     = useState(null);
  const [transferring, setTransferring]     = useState(false);

  const [meetingModal, setMeetingModal]   = useState(false);
  const [meetingLead, setMeetingLead]     = useState(null);
  const [meetingForm, setMeetingForm] = useState({ title: "", date: "", notes: "" });
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);

  const [addLeadModal, setAddLeadModal] = useState(false);
  const [salesUsers, setSalesUsers]     = useState([]);
  const [settings, setSettings]         = useState({ leadSources: [], leadTags: [], priorities: [] });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [addLeadForm, setAddLeadForm]   = useState({ name: "", phone: "", email: "", address: "", source: "", priority: "medium", assignedTo: "", remark: "", tags: [] });
  const [addingLead, setAddingLead]     = useState(false);

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true); setError(null);
      const [leadsRes, settingsRes] = await Promise.allSettled([
        leadAPI.getAllLeads(),
        leadAPI.getSettings()
      ]);
      
      if (leadsRes.status === "fulfilled") {
        setLeads(leadsRes.value?.data?.leads || []);
      } else {
        throw new Error("Failed to load leads");
      }

      if (settingsRes.status === "fulfilled") {
        const s = settingsRes.value?.data?.settings || settingsRes.value?.settings || {};
        setSettings(prev => ({ ...prev, leadTags: s.leadTags || [] }));
      }
    } catch {
      setError("Failed to load leads.");
      toast.error("Failed to load leads.");
    } finally { setLoading(false); }
  };

  const openAddLeadModal = async () => {
    setAddLeadForm({ name: "", phone: "", email: "", address: "", source: "", priority: "medium", assignedTo: "", remark: "", tags: [] });
    setSettings({ leadSources: [], leadTags: [], priorities: [] });
    setSettingsLoading(true);
    setAddLeadModal(true);

    // Settings aur Users alag-alag fetch karo — ek fail ho toh doosra block na ho
    const [settingsRes, usersRes] = await Promise.allSettled([
      leadAPI.getSettings(),
      leadAPI.getSalesUsers(),
    ]);

    // Settings
    if (settingsRes.status === "fulfilled") {
      console.log("settingsRes value:", settingsRes.value);
      const s = settingsRes.value?.data?.settings || settingsRes.value?.settings || {};
      const sources    = s.leadSources || [];
      const tags       = s.leadTags    || [];
      const priorities = s.priorities  || [];
      setSettings({ leadSources: sources, leadTags: tags, priorities });
      setAddLeadForm(f => ({ ...f, source: sources[0] || "", priority: priorities[0] || "" }));
    } else {
      console.error("Settings error:", settingsRes.reason);
    }

    // Sales Users (403 aaye toh quietly ignore karo)
    if (usersRes.status === "fulfilled") {
      setSalesUsers(usersRes.value?.data?.users || usersRes.value?.users || []);
    } else {
      setSalesUsers([]);
    }

    setSettingsLoading(false);
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!addLeadForm.name.trim() || !addLeadForm.phone.trim()) return toast.error("Name and phone required.");
    setAddingLead(true);
    try {
      const payload = {
        name: addLeadForm.name.trim(),
        phone: addLeadForm.phone.trim(),
        email: addLeadForm.email.trim() || undefined,
        address: addLeadForm.address.trim() || undefined,
        source: addLeadForm.source,
        priority: addLeadForm.priority,
        remark: addLeadForm.remark.trim() || undefined,
        tags: addLeadForm.tags.length > 0 ? addLeadForm.tags : undefined,
        assignedTo: addLeadForm.assignedTo || undefined,
      };
      await leadAPI.createLead(payload);
      toast.success("Lead added successfully!");
      setAddLeadModal(false);
      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add lead.");
    } finally { setAddingLead(false); }
  };

  const openRemarkModal = (lead, e) => {
    e?.stopPropagation();
    setRemarkLead(lead);
    setRemarkForm({ note: "", followUpDate: "", status: "" });
    setRemarkModal(true);
  };

  const openDocModal = (lead, e) => {
    e?.stopPropagation();
    setDocLead(lead);
    setDocFile(null);
    setDocModal(true);
  };

  const openTransferModal = (lead, e) => {
    e?.stopPropagation();
    if (lead.status === "closed") {
      toast.error("Cannot transfer closed leads to accounts!");
      return;
    }
    setTransferLead(lead);
    setTransferModal(true);
  };

  const openStatusModal = (lead, e) => {
    e?.stopPropagation();
    setStatusLead(lead);
    setNewStatus(lead.status);
    setStatusModal(true);
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkForm.note.trim()) return toast.error("Note is required.");
    setAddingRemark(true);
    try {
      const payload = {
        note: remarkForm.note.trim(),
        ...(remarkForm.status && { status: remarkForm.status }),
        ...(remarkForm.followUpDate && {
          followUpDate: new Date(remarkForm.followUpDate).toISOString(),
        }),
      };
      await leadAPI.addRemark(remarkLead._id, payload);
      toast.success("Remark added successfully!");
      setRemarkModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add remark.");
    } finally {
      setAddingRemark(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) return toast.error("Please select a file.");
    setUploadingDoc(true);
    try {
      await leadAPI.uploadSaleDocuments(docLead._id, docFile);
      toast.success("Sale documents uploaded successfully!");
      setDocModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload documents.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (transferLead?.status === "closed") {
      toast.error("Cannot transfer closed leads to accounts!");
      setTransferModal(false);
      return;
    }
    setTransferring(true);
    try {
      await leadAPI.transferToAccounts(transferLead._id);
      toast.success("Lead transferred to accounts successfully!");
      setTransferModal(false);
      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to transfer lead.");
    } finally {
      setTransferring(false);
    }
  };

  const openMeetingModal = (lead, e) => {
    e?.stopPropagation();
    setMeetingLead(lead);
    setMeetingForm({ title: "", date: "", notes: "" });
    setMeetingModal(true);
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.date) return toast.error("Title and date required.");
    setSchedulingMeeting(true);
    try {
      const dateObj = new Date(meetingForm.date);
      const payload = {
        note: `[Meeting] ${meetingForm.title}${meetingForm.notes ? " - " + meetingForm.notes : ""}`,
        followUpDate: dateObj.toISOString(),
        tags: ["Meeting Scheduled"],
      };
      await leadAPI.addRemark(meetingLead._id, payload);
      toast.success("Meeting scheduled successfully!");
      setMeetingModal(false);
      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to schedule meeting.");
    } finally {
      setSchedulingMeeting(false);
    }
  };

  const [statusModal, setStatusModal]       = useState(false);
  const [statusLead, setStatusLead]         = useState(null);
  const [newStatus, setNewStatus]           = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === statusLead.status) {
      return toast.error("Please select a different status.");
    }
    setUpdatingStatus(true);
    try {
      await leadAPI.updateLead(statusLead._id, { status: newStatus });
      toast.success("Lead status updated successfully!");
      setStatusModal(false);
      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkCallDone = async (lead, e) => {
    e?.stopPropagation();
    try {
      await leadAPI.updateLead(lead._id, { isCallDone: true });
      toast.success("Lead marked as call done!");
      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark call done.");
    }
  };

  const [priorityModal, setPriorityModal]       = useState(false);
  const [priorityLead, setPriorityLead]         = useState(null);
  const [newPriority, setNewPriority]           = useState("");
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const openPriorityModal = (lead, e) => {
    e?.stopPropagation();
    setPriorityLead(lead);
    setNewPriority(lead.priority || "medium");
    setPriorityModal(true);
  };

  const handleUpdatePriority = async (e) => {
    e.preventDefault();
    if (!newPriority || newPriority === priorityLead.priority) {
      return toast.error("Please select a different priority.");
    }
    setUpdatingPriority(true);
    try {
      await leadAPI.updateLead(priorityLead._id, { priority: newPriority });
      toast.success("Lead priority updated successfully!");
      setPriorityModal(false);
      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update priority.");
    } finally {
      setUpdatingPriority(false);
    }
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(search) ||
      l.email?.toLowerCase().includes(q) ||
      (l.tags && l.tags.some(tag => tag?.toLowerCase().includes(q)));
      
    let effectiveStatus = l.status;
    if (effectiveStatus === "assigned" && (!l.remarks || l.remarks.length === 0)) {
      effectiveStatus = "new";
    }

    const matchStatus = status === "all" || effectiveStatus === status;
    const matchTag = selectedTag === "all" || (l.tags && l.tags.includes(selectedTag));
    
    const matchTab = callTab === "done" ? !!l.isCallDone : !l.isCallDone;
    const matchDate = !dateFilter || new Date(l.createdAt).toISOString().split('T')[0] === dateFilter;

    return matchSearch && matchStatus && matchTag && matchTab && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS) || 1;
  const paginated  = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  const stats = [
    { label: "Total",         value: leads.length,                                              color: c.primary,  bg: `${c.primary}12`, icon: Users      },
    { label: "Interested",    value: leads.filter(l => l.status === "interested").length,       color: "#10b981",  bg: "#ecfdf5",        icon: TrendingUp  },
    { label: "In Process",    value: leads.filter(l => l.status === "in_process").length,       color: "#f59e0b",  bg: "#fffbeb",        icon: RefreshCw   },
    { label: "Converted",     value: leads.filter(l => l.status === "converted").length,        color: "#8b5cf6",  bg: "#f5f3ff",        icon: UserCheck   },
    { label: "Closed",        value: leads.filter(l => l.status === "closed").length,           color: "#6b7280",  bg: "#f9fafb",        icon: AlertCircle },
    { label: "Not Interested",value: leads.filter(l => l.status === "not_interested").length,   color: "#ef4444",  bg: "#fef2f2",        icon: AlertCircle },
  ];

  const inputSt = { backgroundColor: c.background, color: c.text, borderColor: c.border };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading leads…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle size={40} color="#dc2626" />
      <p style={{ color: c.text }}>{error}</p>
      <button onClick={fetchLeads} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: c.primary }}>
        <RefreshCw size={14} className="inline mr-2" /> Retry
      </button>
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <UserCheck size={26} style={{ color: c.primary }} /> Assigned Leads
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            {leads.length} total leads assigned to you
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddLeadModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: c.primary, color: "#fff" }}>
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label}
            className="rounded-2xl border p-4 flex flex-col gap-1 hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: isDark ? c.surface : bg, borderColor: c.border }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: isDark ? c.textSecondary : color }}>{label}</p>
              <Icon size={14} style={{ color, opacity: 0.7 }} />
            </div>
            <p className="text-3xl font-black" style={{ color: isDark ? c.text : color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-2">
        <button onClick={() => { setCallTab("pending"); setPage(1); }}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border"
          style={{
            backgroundColor: callTab === "pending" ? c.primary : "transparent",
            color: callTab === "pending" ? "#fff" : c.textSecondary,
            borderColor: callTab === "pending" ? c.primary : c.border
          }}>
          Pending Calls ({leads.filter(l => !l.isCallDone).length})
        </button>
        <button onClick={() => { setCallTab("done"); setPage(1); }}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all border"
          style={{
            backgroundColor: callTab === "done" ? c.primary : "transparent",
            color: callTab === "done" ? "#fff" : c.textSecondary,
            borderColor: callTab === "done" ? c.primary : c.border
          }}>
          Call Done ({leads.filter(l => l.isCallDone).length})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.textSecondary }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={inputSt} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none"
          style={inputSt}>
          {STATUS_OPTS.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Status" : s.replace("_", " ").toUpperCase()}</option>
          ))}
        </select>
        {settings.leadTags?.length > 0 && (
          <select value={selectedTag} onChange={e => { setSelectedTag(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none"
            style={inputSt}>
            <option value="all">ALL TAGS</option>
            {settings.leadTags.map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        )}
        <input 
          type="date"
          value={dateFilter}
          onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none w-full sm:w-auto min-w-[140px]"
          style={{ ...inputSt, cursor: "pointer" }}
        />
        <div className="flex gap-1 p-1 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
          {[["table", "Table", Table2], ["card", "Cards", LayoutGrid]].map(([v, label, Icon]) => (
            <button key={v} onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: view === v ? c.surface : "transparent",
                color: view === v ? c.primary : c.textSecondary,
                border: view === v ? `1px solid ${c.border}` : "1px solid transparent",
              }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {paginated.length === 0 && (
        <div className="py-20 text-center rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <Users size={40} className="mx-auto mb-3" style={{ color: c.textSecondary }} />
          <p className="font-bold text-lg" style={{ color: c.text }}>No leads found</p>
          <p className="text-sm mt-1" style={{ color: c.textSecondary }}>Try adjusting your search or filter</p>
        </div>
      )}

      {paginated.length > 0 && view === "table" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr style={{ backgroundColor: isDark ? `${c.background}99` : `${c.background}80`, borderBottom: `1px solid ${c.border}` }}>
                  {[["#",""], "Name","Phone","Email","Source","Status","Priority","Assigned To","Created At","Actions"].map((h,i) => (
                    <th key={i} className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
                      style={{ color: c.textSecondary }}>{typeof h === 'string' ? h : h[0]}</th>
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
                      <p className="text-sm truncate max-w-[150px]" style={{ color: c.textSecondary }}>{lead.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-semibold" style={{ color: c.textSecondary }}>{lead.source || "—"}</p>
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
                      ) : (
                        <span className="text-xs italic" style={{ color: c.textSecondary }}>Unassigned</span>
                      )}
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
                        <button onClick={e => openPriorityModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#fef3c7", borderColor: "#fcd34d", color: "#b45309" }}
                          title="Update Priority">
                          <Star size={13} />
                        </button>
                        <button onClick={e => openRemarkModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d", color: "#b45309" }}
                          title="Add Remark">
                          <FileText size={13} />
                        </button>
                        <button onClick={e => openDocModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac", color: "#16a34a" }}
                          title="Sale Documents">
                          <Upload size={13} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); navigate(`/delivery/${lead._id}`); }}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#fef3c7", borderColor: "#fed7aa", color: "#b45309" }}
                          title="Manage Delivery">
                          <Truck size={13} />
                        </button>
                        <button onClick={e => openMeetingModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#fef3c7", borderColor: "#fed7aa", color: "#b45309" }}
                          title="Schedule Meeting">
                          <Calendar size={13} />
                        </button>
                        <a href={`tel:${lead.phone}`}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }}
                          title="Call">
                          <PhoneCall size={13} />
                        </a>
                        <button onClick={e => handleMarkCallDone(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#e0f2fe", borderColor: "#bae6fd", color: "#0369a1" }}
                          title="Mark Call Done">
                          <CheckCircle2 size={13} />
                        </button>
                        {lead.integrations?.whatsappLink && (
                          <button onClick={() => setWaModalLead(lead)}
                            className="p-2 rounded-lg border transition-all hover:scale-105"
                            style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }}
                            title="WhatsApp">
                            <MessageCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paginated.length > 0 && view === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map(lead => {
            const pCfg = priorityConfig[lead.priority?.toLowerCase()] || priorityConfig.medium;
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
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: c.text }}>
                    <Phone size={12} color="#10b981" /> {lead.phone}
                  </p>
                  {lead.email && (
                    <p className="flex items-center gap-2 text-xs truncate" style={{ color: c.textSecondary }}>
                      <Mail size={12} /> {lead.email}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: c.border }}>
                    <PriorityBadge priority={lead.priority} />
                    {lead.assignedTo && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                          {lead.assignedTo?.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: c.textSecondary }}>
                          {lead.assignedTo?.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => navigate(`/lead-details/${lead._id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80 min-w-[70px]"
                      style={{ backgroundColor: `${c.primary}12`, borderColor: `${c.primary}30`, color: c.primary }}>
                      <Eye size={12} /> View
                    </button>
                    <button onClick={e => openStatusModal(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80 min-w-[70px]"
                      style={{ backgroundColor: "#eef2ff", borderColor: "#c7d2fe", color: "#4338ca" }}>
                      <Tag size={12} /> Status
                    </button>
                    <button onClick={e => openPriorityModal(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80 min-w-[70px]"
                      style={{ backgroundColor: "#fef3c7", borderColor: "#fcd34d", color: "#b45309" }}>
                      <Star size={12} /> Priority
                    </button>
                    <button onClick={e => openRemarkModal(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80 min-w-[70px]"
                      style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d", color: "#b45309" }}>
                      <FileText size={12} /> Remark
                    </button>
                    <button onClick={e => openMeetingModal(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80 min-w-[70px]"
                      style={{ backgroundColor: "#fef3c7", borderColor: "#fed7aa", color: "#b45309" }}>
                      <Calendar size={12} /> Meeting
                    </button>
                    <button onClick={e => handleMarkCallDone(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80 min-w-[70px]"
                      style={{ backgroundColor: "#e0f2fe", borderColor: "#bae6fd", color: "#0369a1" }}>
                      <CheckCircle2 size={12} /> Call Done
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
                style={{ backgroundColor: page === n ? c.primary : c.background, color: page === n ? "#fff" : c.text, border: `1px solid ${page === n ? c.primary : c.border}` }}>
                {n}
              </button>
            ))}
            <PageBtn onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} c={c}>
              <ChevronRight size={15} />
            </PageBtn>
          </div>
        </div>
      )}

      {/* STATUS, PRIORITY, REMARK, DOC, TRANSFER MODALS... */}
      {priorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setPriorityModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
                  <Star size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Update Lead Priority</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{priorityLead?.name} · {priorityLead?.phone}</p>
                </div>
              </div>
              <button onClick={() => setPriorityModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>

            <form onSubmit={handleUpdatePriority} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-3" style={{ color: c.textSecondary }}>Select New Priority *</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.keys(priorityConfig).map(p => {
                    const cfg = priorityConfig[p];
                    const isSelected = newPriority === p;
                    return (
                      <button key={p} type="button" onClick={() => setNewPriority(p)} className="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all"
                        style={{ backgroundColor: isSelected ? (isDark ? `${cfg.color}20` : cfg.bg) : c.background, borderColor: isSelected ? cfg.color : c.border, color: isSelected ? cfg.color : c.text, boxShadow: isSelected ? `0 0 0 2px ${cfg.color}25` : "none" }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? cfg.color : c.border }} />
                        <span className="text-xs font-bold">{p.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setPriorityModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={updatingPriority || !newPriority} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90" style={{ backgroundColor: "#b45309", color: "#fff" }}>
                  {updatingPriority ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</> : <><Star size={14} /> Update Priority</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setStatusModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#eef2ff", color: "#4338ca" }}>
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Update Lead Status</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{statusLead?.name} · {statusLead?.phone}</p>
                </div>
              </div>
              <button onClick={() => setStatusModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-3" style={{ color: c.textSecondary }}>Select New Status *</label>
                <div className="grid grid-cols-2 gap-3">
                  {STATUS_OPTS.filter(s => s !== "all" && s !== "call_done" && s !== "converted" && s !== "closed").map(s => {
                    const cfg = statusConfig[s];
                    const isSelected = newStatus === s;
                    return (
                      <button key={s} type="button" onClick={() => setNewStatus(s)} className="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all"
                        style={{ backgroundColor: isSelected ? (isDark ? `${cfg.color}20` : cfg.bg) : c.background, borderColor: isSelected ? cfg.color : c.border, color: isSelected ? cfg.color : c.text, boxShadow: isSelected ? `0 0 0 2px ${cfg.color}25` : "none" }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? cfg.color : c.border }} />
                        <span className="text-xs font-bold">{s.replace("_", " ").toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setStatusModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={updatingStatus || !newStatus} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90" style={{ backgroundColor: "#4338ca", color: "#fff" }}>
                  {updatingStatus ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</> : <><Tag size={14} /> Update Status</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {remarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setRemarkModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
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
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Note / Remark *</label>
                <textarea value={remarkForm.note} onChange={e => setRemarkForm(f => ({ ...f, note: e.target.value }))} rows={4} required placeholder="e.g. Discuss solar panel integration details." className="w-full p-3 rounded-xl border text-sm outline-none resize-none" style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }} autoFocus />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Update Status (Optional)</label>
                <select value={remarkForm.status} onChange={e => setRemarkForm(f => ({ ...f, status: e.target.value }))} className="w-full p-3 rounded-xl border text-sm font-semibold outline-none" style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }}>
                  <option value="">No Change</option>
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="interested">Interested</option>
                  <option value="in_process">In Process</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="call_done">Call Done</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}><Calendar size={10} className="inline mr-1" />Follow-up Date & Time</label>
                <input type="datetime-local" value={remarkForm.followUpDate} onChange={e => setRemarkForm(f => ({ ...f, followUpDate: e.target.value }))} className="w-full p-3 rounded-xl border text-sm outline-none" style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }} />
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setRemarkModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={addingRemark || !remarkForm.note.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90" style={{ backgroundColor: "#f59e0b", color: "#fff" }}>
                  {addingRemark ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Send size={14} /> Add Remark</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {docModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setDocModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}><Upload size={16} /></div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Sale Documents</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{docLead?.name} · {docLead?.phone}</p>
                </div>
              </div>
              <button onClick={() => setDocModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Upload Agreement File *</label>
                <div className="relative">
                  <input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} required accept="image/*,.pdf,.doc,.docx" className="hidden" id="agreementFile" />
                  <label htmlFor="agreementFile" className="flex items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:opacity-80" style={{ borderColor: c.border, backgroundColor: `${c.primary}05` }}>
                    <Upload size={20} style={{ color: c.primary }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: c.text }}>{docFile ? docFile.name : "Click to upload file"}</p>
                      <p className="text-[10px]" style={{ color: c.textSecondary }}>PDF, DOC, DOCX, or Images</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setDocModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={uploadingDoc || !docFile} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90" style={{ backgroundColor: "#16a34a", color: "#fff" }}>
                  {uploadingDoc ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</> : <><Send size={14} /> Upload Documents</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setTransferModal(false)}>
          <div className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}><ArrowRight size={16} /></div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Transfer to Accounts</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{transferLead?.name} · {transferLead?.phone}</p>
                </div>
              </div>
              <button onClick={() => setTransferModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl border" style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}>
                <p className="text-sm font-semibold" style={{ color: "#16a34a" }}>Transfer this lead to the accounts team for follow-up?</p>
                <p className="text-xs mt-2" style={{ color: c.textSecondary }}>The lead will be moved to accounts department and you'll lose access to manage it.</p>
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button onClick={() => setTransferModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button onClick={handleTransfer} disabled={transferring} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-all" style={{ backgroundColor: "#16a34a", color: "#fff" }}>
                  {transferring ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Transferring…</> : <><Send size={14} /> Transfer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setAddLeadModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl flex flex-col" style={{ backgroundColor: c.surface, maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.primary}18`, color: c.primary }}>
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Add New Lead</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>Fill details to create a new lead</p>
                </div>
              </div>
              <button onClick={() => setAddLeadModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>

            <form onSubmit={handleAddLead} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.textSecondary }}>Name *</label>
                  <input value={addLeadForm.name} onChange={e => setAddLeadForm(f => ({ ...f, name: e.target.value }))}
                    required placeholder="Full name" className="w-full p-3 rounded-xl border text-sm outline-none" style={inputSt} autoFocus />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.textSecondary }}>Phone *</label>
                  <input value={addLeadForm.phone} onChange={e => setAddLeadForm(f => ({ ...f, phone: e.target.value }))}
                    type="tel" maxLength={10} pattern="[0-9]{10}"
                    required placeholder="10-digit number" className="w-full p-3 rounded-xl border text-sm outline-none" style={inputSt} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.textSecondary }}>Email</label>
                  <input type="email" value={addLeadForm.email} onChange={e => setAddLeadForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com" className="w-full p-3 rounded-xl border text-sm outline-none" style={inputSt} />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.textSecondary }}>Address</label>
                  <input type="text" value={addLeadForm.address} onChange={e => setAddLeadForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Address" className="w-full p-3 rounded-xl border text-sm outline-none" style={inputSt} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.textSecondary }}>Source</label>
                  <select value={addLeadForm.source} onChange={e => setAddLeadForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full p-3 rounded-xl border text-sm font-semibold outline-none" style={inputSt}
                    disabled={settingsLoading}>
                    <option value="">{settingsLoading ? "Loading..." : "— Select Source —"}</option>
                    {settings.leadSources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.textSecondary }}>Priority</label>
                  <select value={addLeadForm.priority} onChange={e => setAddLeadForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full p-3 rounded-xl border text-sm font-semibold outline-none" style={inputSt}
                    disabled={settingsLoading}>
                    {settingsLoading
                      ? <option>Loading...</option>
                      : settings.priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)
                    }
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.textSecondary }}>Tags</label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl border min-h-[48px]" style={{ ...inputSt, borderColor: c.border }}>
                  {settingsLoading
                    ? <span className="text-xs" style={{ color: c.textSecondary }}>Loading tags…</span>
                    : settings.leadTags.map(tag => {
                        const selected = addLeadForm.tags[0] === tag;
                        return (
                          <button key={tag} type="button"
                            onClick={() => setAddLeadForm(f => ({ ...f, tags: selected ? [] : [tag] }))}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all"
                            style={{
                              backgroundColor: selected ? c.primary : c.background,
                              color: selected ? "#fff" : c.textSecondary,
                              borderColor: selected ? c.primary : c.border,
                            }}>
                            {tag}
                          </button>
                        );
                      })
                  }
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: c.textSecondary }}>Remark</label>
                <input value={addLeadForm.remark} onChange={e => setAddLeadForm(f => ({ ...f, remark: e.target.value }))}
                  placeholder="e.g. Initial discussion done" className="w-full p-3 rounded-xl border text-sm outline-none" style={inputSt} />
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setAddLeadModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={addingLead || !addLeadForm.name.trim() || !addLeadForm.phone.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90"
                  style={{ backgroundColor: c.primary, color: "#fff" }}>
                  {addingLead ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding…</> : <><Plus size={14} /> Add Lead</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {meetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setMeetingModal(false)}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: c.surface }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}><Calendar size={16} /></div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Schedule Meeting</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{meetingLead?.name} · {meetingLead?.phone}</p>
                </div>
              </div>
              <button onClick={() => setMeetingModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}><X size={15} /></button>
            </div>

            <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Meeting Title *</label>
                <input type="text" value={meetingForm.title} onChange={e => setMeetingForm(f => ({ ...f, title: e.target.value }))}
                  required placeholder="e.g. Product Demo, Follow-up Call" className="w-full p-3 rounded-xl border text-sm outline-none" style={inputSt} />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Date & Time *</label>
                <input type="datetime-local" value={meetingForm.date} onChange={e => setMeetingForm(f => ({ ...f, date: e.target.value }))}
                  required className="w-full p-3 rounded-xl border text-sm outline-none" style={inputSt} />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.textSecondary }}>Notes (Optional)</label>
                <textarea value={meetingForm.notes} onChange={e => setMeetingForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Agenda, discussion points, etc." rows={3} className="w-full p-3 rounded-xl border text-sm outline-none resize-none" style={inputSt} />
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setMeetingModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: c.border, color: c.textSecondary }}>Cancel</button>
                <button type="submit" disabled={schedulingMeeting || !meetingForm.title || !meetingForm.date} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90" style={{ backgroundColor: "#b45309", color: "#fff" }}>
                  {schedulingMeeting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling…</> : <><Send size={14} /> Schedule Meeting</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <WhatsAppChooserModal link={waModalLead?.integrations?.whatsappLink} phone={waModalLead?.phone} isOpen={!!waModalLead} onClose={() => setWaModalLead(null)} />
    </div>
  );
}

function PageBtn({ children, onClick, disabled, c }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40" style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}>
      {children}
    </button>
      
  );
}
