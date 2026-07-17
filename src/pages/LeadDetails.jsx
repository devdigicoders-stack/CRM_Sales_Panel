import React, { useState, useEffect } from "react";
import WhatsAppChooserModal from '../components/WhatsAppChooserModal';
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate } from "react-router-dom";
import { leadAPI } from "../api/lead";
import {
  ArrowLeft, Phone, Mail, MessageSquare,
  Save, RefreshCw, AlertCircle, CheckCircle2,
  User, Tag, IndianRupee, Send, Wrench,
  PhoneCall, Clock, ExternalLink, Calendar
} from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTS = ["new", "assigned", "interested", "in_process", "converted", "closed", "not_interested", "call_done"];

export default function LeadDetails() {
  const [waModalLead, setWaModalLead] = useState(null);

  const { themeColors: c } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead]           = useState(null);
  const [settings, setSettings]   = useState({ leadTags: [] });
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Remark
  const [remarkNote, setRemarkNote]       = useState("");
  const [meetingType, setMeetingType]     = useState("follow_up");
  const [remarkFollowup, setRemarkFollowup] = useState("");
  const [remarkTags, setRemarkTags] = useState("");
  const [addingRemark, setAddingRemark]   = useState(false);

  // Status update
  const [newStatus, setNewStatus]     = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isDark = c.mode === "dark";

  useEffect(() => { fetchLead(); }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const [leadRes, settingsRes] = await Promise.allSettled([
        leadAPI.getLeadById(id),
        leadAPI.getSettings()
      ]);
      
      if (leadRes.status === "fulfilled") {
        const l = leadRes.value?.data?.lead;
        setLead(l);
        setNewStatus(l?.status || "");
      } else {
        throw new Error("Failed to load lead details.");
      }

      if (settingsRes.status === "fulfilled") {
        const s = settingsRes.value?.data?.settings || settingsRes.value?.settings || {};
        setSettings({ leadTags: s.leadTags || [] });
      }
    } catch {
      toast.error("Failed to load lead details.");
    } finally { setLoading(false); }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkNote.trim()) return toast.error("Please enter a remark.");
    setAddingRemark(true);
    try {
      const tagsArray = remarkTags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      let finalNote = remarkNote;
      if (meetingType === "visit") finalNote = `[Visit] ${finalNote}`;
      if (meetingType === "not_interested") finalNote = `[Closed - Not Interested] ${finalNote}`;
      if (meetingType === "converted") finalNote = `[Converted / Deal Closed] ${finalNote}`;

      const res = await leadAPI.addRemark(id, {
        note: finalNote,
        followUpDate: meetingType === "follow_up" ? (remarkFollowup || undefined) : undefined,
        visitDate: meetingType === "visit" ? (remarkFollowup || undefined) : undefined,
        status: meetingType === "not_interested" ? "not_interested" : meetingType === "converted" ? "converted" : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });
      setLead(prev => ({ ...prev, remarks: res?.data?.lead?.remarks || prev.remarks, tags: res?.data?.lead?.tags || prev.tags }));
      setRemarkNote(""); 
      setRemarkFollowup("");
      setRemarkTags("");
      setMeetingType("follow_up");
      toast.success("Remark added!");
    } catch { toast.error("Failed to add remark."); }
    finally { setAddingRemark(false); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === lead?.status) return;
    setUpdatingStatus(true);
    try {
      await leadAPI.updateLead(id, { status: newStatus });
      setLead(prev => ({ ...prev, status: newStatus }));
      toast.success("Status updated!");
    } catch { toast.error("Failed to update status."); }
    finally { setUpdatingStatus(false); }
  };

  const handleMarkCallDone = async () => {
    try {
      await leadAPI.updateLead(id, { isCallDone: true });
      setLead(prev => ({ ...prev, isCallDone: true }));
      toast.success("Lead marked as call done!");
    } catch {
      toast.error("Failed to mark call done.");
    }
  };



  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const priorityConfig = {
    high:   { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
    medium: { bg: "#fef3c7", color: "#b45309", border: "#fcd34d" },
    low:    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  };

  const statusConfig = {
    assigned:       { color: "#4338ca", bg: "#eef2ff", border: "#c7d2fe" },
    interested:     { color: "#065f46", bg: "#ecfdf5", border: "#6ee7b7" },
    in_process:     { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
    converted:      { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
    closed:         { color: "#374151", bg: "#f9fafb", border: "#e5e7eb" },
    not_interested: { color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
    call_done:      { color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
    new:            { color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  };

  const inputSt = { backgroundColor: c.background, color: c.text, borderColor: c.border };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading lead…</p>
    </div>
  );

  if (!lead) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle size={40} color="#dc2626" />
      <p style={{ color: c.text }}>Lead not found.</p>
      <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: c.primary }}>
        Go Back
      </button>
    </div>
  );

  const pCfg = priorityConfig[lead.priority?.toLowerCase()] || priorityConfig.medium;
  const sCfg = statusConfig[lead.status?.toLowerCase()] || statusConfig.new;

  const TABS = [
    { key: "overview",    label: "Overview"          },
    { key: "remarks",     label: `Remarks (${lead.remarks?.length || 0})` },
    { key: "progress",    label: "Lead Progress"     },
  ];

  return (
    <div className="w-full pb-20 space-y-5">

      {/* BACK + HEADER */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:opacity-80"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black truncate" style={{ color: c.text }}>{lead.name}</h1>
          <p className="text-xs" style={{ color: c.textSecondary }}>Lead ID: {lead._id}</p>
        </div>
        <span className="px-3 py-1 rounded-xl text-xs font-black uppercase border"
          style={{ backgroundColor: sCfg.bg, color: sCfg.color, borderColor: sCfg.border }}>
          {lead.status?.replace("_", " ")}
        </span>
      </div>

      {/* QUICK INFO STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Phone,       label: "Phone",    value: lead.phone,         color: "#10b981" },
          { icon: Mail,        label: "Email",    value: lead.email || "—",  color: "#3b82f6" },
          { icon: User,        label: "Source",   value: lead.source || "—", color: "#8b5cf6" },
          { icon: IndianRupee, label: "Deal",     value: `₹${lead.dealValue?.toLocaleString("en-IN") || "0"}`, color: "#f59e0b" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-3 p-3.5 rounded-2xl border"
            style={{ backgroundColor: c.surface, borderColor: c.border }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}18`, color }}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>{label}</p>
              <p className="text-sm font-bold truncate" style={{ color: c.text }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 rounded-xl border overflow-x-auto"
        style={{ backgroundColor: c.background, borderColor: c.border }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex-1 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              backgroundColor: activeTab === key ? c.surface : "transparent",
              color: activeTab === key ? c.primary : c.textSecondary,
              border: activeTab === key ? `1px solid ${c.border}` : "1px solid transparent",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lead Info */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: c.surface, borderColor: c.border }}>
            <p className="text-sm font-black uppercase tracking-wider" style={{ color: c.textSecondary }}>Lead Information</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Name",          value: lead.name },
                { label: "Phone",         value: lead.phone },
                { label: "Email",         value: lead.email },
                { label: "Source",        value: lead.source },
                { label: "Priority",      value: lead.priority },
                { label: "Verification",  value: lead.verificationStatus },
                { label: "Payment",       value: lead.paymentStatus },
                { label: "Delivery",      value: lead.deliveryStatus },
                { label: "Installation",  value: lead.installationStatus },
                { label: "Deal Value",    value: `₹${lead.dealValue?.toLocaleString("en-IN") || 0}` },
                { label: "Amount Paid",   value: `₹${lead.amountPaid?.toLocaleString("en-IN") || 0}` },
                { label: "Pending Amount",value: `₹${lead.pendingAmount?.toLocaleString("en-IN") || 0}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>{label}</p>
                  <p className="text-sm font-bold mt-0.5 truncate" style={{ color: c.text }}>{value || "—"}</p>
                </div>
              ))}
            </div>
            {lead.productDetails && (
              <div className="p-3 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: c.textSecondary }}>Product Details</p>
                <p className="text-sm font-semibold" style={{ color: c.text }}>{lead.productDetails}</p>
              </div>
            )}
            {lead.paymentScreenshot && (
              <div className="p-3 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: c.textSecondary }}>Payment Screenshot</p>
                <a href={`${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${lead.paymentScreenshot}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  View Payment Screenshot <ExternalLink size={12} className="inline-block" />
                </a>
              </div>
            )}
            {lead.awbNumber && (
              <div className="p-3 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: c.textSecondary }}>AWB / Tracking Number</p>
                <p className="text-sm font-semibold text-indigo-600">{lead.awbNumber}</p>
              </div>
            )}
            {lead.invoiceUrl && (
              <div className="p-3 rounded-xl border" style={{ backgroundColor: c.background, borderColor: c.border }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: c.textSecondary }}>Invoice Document</p>
                <a href={`${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${lead.invoiceUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-650 hover:underline flex items-center gap-1">
                  View Uploaded Invoice <ExternalLink size={12} className="inline-block" />
                </a>
              </div>
            )}
          </div>

          {/* Assigned To + Tags + Actions */}
          <div className="space-y-4">
            {lead.assignedTo && (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: c.surface, borderColor: c.border }}>
                <p className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: c.textSecondary }}>Assigned To</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black"
                    style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                    {lead.assignedTo.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black" style={{ color: c.text }}>{lead.assignedTo.name}</p>
                    <p className="text-xs" style={{ color: c.textSecondary }}>{lead.assignedTo.email}</p>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                      {lead.assignedTo.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {lead.tags?.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: c.surface, borderColor: c.border }}>
                <p className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: c.textSecondary }}>Tags</p>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ backgroundColor: isDark ? `${c.primary}20` : "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: c.surface, borderColor: c.border }}>
              <p className="text-sm font-black uppercase tracking-wider" style={{ color: c.textSecondary }}>Actions</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <a href={`tel:${lead.phone}`}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all hover:shadow-md active:scale-95"
                  style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }}>
                  <PhoneCall size={14} /> Call
                </a>
                <button onClick={handleMarkCallDone}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all hover:shadow-md active:scale-95"
                  style={{ backgroundColor: "#e0f2fe", borderColor: "#bae6fd", color: "#0369a1" }}>
                  <CheckCircle2 size={14} /> Call Done
                </button>
                {lead.integrations?.whatsappLink && (
                  <button onClick={() => setWaModalLead(lead)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all hover:shadow-md active:scale-95"
                    style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }}>
                    <MessageSquare size={14} /> WhatsApp
                  </button>
                )}
              </div>

              <button onClick={() => navigate(`/sale-confirm/${lead._id}`)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all hover:shadow-md active:scale-95"
                style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d", color: "#b45309" }}>
                <CheckCircle2 size={14} /> Confirm Sale
              </button>

              <button onClick={() => navigate(`/delivery/${lead._id}`)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all hover:shadow-md active:scale-95"
                style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" }}>
                <Wrench size={14} /> Manage Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: REMARKS / COMMUNICATION HISTORY ── */}
      {activeTab === "remarks" && (
        <div className="space-y-4">
          {/* Add Remark Form */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: c.surface, borderColor: c.border }}>
            <p className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: c.textSecondary }}>Add Remark / Note</p>
            <form onSubmit={handleAddRemark} className="space-y-3">
              <textarea value={remarkNote} onChange={e => setRemarkNote(e.target.value)}
                rows={3} placeholder="Write your communication note here..."
                className="w-full p-3 rounded-xl border text-sm outline-none resize-none"
                style={inputSt} />
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: c.textSecondary }}>
                  Tag
                </label>
                {settings.leadTags?.length > 0 ? (
                  <select value={remarkTags} onChange={e => setRemarkTags(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-sm outline-none bg-transparent appearance-none"
                    style={{ ...inputSt, cursor: "pointer" }}>
                    <option value="" className="bg-white dark:bg-zinc-800">No Tag</option>
                    {settings.leadTags.map(t => (
                      <option key={t} value={t} className="bg-white dark:bg-zinc-800">{t}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={remarkTags} onChange={e => setRemarkTags(e.target.value)}
                    placeholder="e.g. Meeting Scheduled, Follow-up, Important"
                    className="w-full p-2.5 rounded-xl border text-sm outline-none"
                    style={inputSt} />
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: c.textSecondary }}>
                    Schedule Type
                  </label>
                  <select value={meetingType} onChange={e => setMeetingType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-sm outline-none bg-transparent appearance-none"
                    style={{ ...inputSt, cursor: "pointer" }}>
                    <option value="follow_up" className="bg-white dark:bg-zinc-800">Follow-up / Call / General</option>
                    <option value="visit" className="bg-white dark:bg-zinc-800">Visit / Demo</option>
                    <option value="not_interested" className="bg-white dark:bg-zinc-800">Closed - Not Interested</option>
                    <option value="converted" className="bg-white dark:bg-zinc-800">Converted / Deal Closed</option>
                  </select>
                </div>
                {meetingType !== "not_interested" && meetingType !== "converted" && (
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: c.textSecondary }}>
                      {meetingType === 'visit' ? 'Visit/Demo Date' : 'Next Follow-up Date'}
                    </label>
                    <input type="datetime-local" value={remarkFollowup} onChange={e => setRemarkFollowup(e.target.value)}
                      className="w-full p-2.5 rounded-xl border text-sm outline-none"
                      style={inputSt} />
                  </div>
                )}
                <button type="submit" disabled={addingRemark || !remarkNote.trim()}
                  className="self-end flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90"
                  style={{ backgroundColor: c.primary, color: "#fff" }}>
                  {addingRemark
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    : <><Send size={14} /> Add Remark</>}
                </button>
              </div>
            </form>
          </div>

          {/* Remarks History */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: c.border }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}80` : `${c.background}60` }}>
              <p className="text-sm font-black uppercase tracking-wider" style={{ color: c.textSecondary }}>
                Communication History ({lead.remarks?.length || 0})
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: c.border }}>
              {!lead.remarks?.length ? (
                <div className="py-12 text-center">
                  <MessageSquare size={32} className="mx-auto mb-3" style={{ color: c.textSecondary }} />
                  <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>No remarks yet.</p>
                </div>
              ) : (
                [...lead.remarks].reverse().map((r, i) => (
                  <div key={r._id || i} className="flex gap-4 p-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ backgroundColor: i === 0 ? `${c.primary}20` : c.background, color: i === 0 ? c.primary : c.textSecondary, border: `2px solid ${i === 0 ? c.primary : c.border}` }}>
                        {i === 0 ? "★" : lead.remarks.length - i}
                      </div>
                      {i !== lead.remarks.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: c.border }} />}
                    </div>
                    <div className="flex-1 pb-3 min-w-0">
                      <p className="text-sm" style={{ color: c.text }}>{r.note}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: c.textSecondary }}>
                          <Clock size={10} /> {fmtDateTime(r.createdAt)}
                        </span>
                        {r.addedBy?.name && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: c.textSecondary }}>
                            <User size={10} /> {r.addedBy.name}
                          </span>
                        )}
                        {r.followUpDate && (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${c.primary}20`, color: c.primary }}>
                            <Calendar size={10} /> Scheduled: {fmtDateTime(r.followUpDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}



      {/* ── TAB: LEAD PROGRESS ── */}
      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-5" style={{ backgroundColor: c.surface, borderColor: c.border }}>
            <p className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: c.textSecondary }}>
              Update Lead Status
            </p>

            {/* Progress pipeline */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
              {["new", "assigned", "interested", "in_process", "converted"].map((s, i, arr) => {
                const statusIdx = arr.indexOf(lead.status);
                const thisIdx   = i;
                const isActive  = lead.status === s;
                const isDone    = statusIdx > thisIdx;
                return (
                  <React.Fragment key={s}>
                    <div className={`flex flex-col items-center gap-1 min-w-[70px]`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all`}
                        style={{
                          backgroundColor: isActive ? c.primary : isDone ? "#10b981" : c.background,
                          borderColor: isActive ? c.primary : isDone ? "#10b981" : c.border,
                          color: isActive || isDone ? "#fff" : c.textSecondary,
                        }}>
                        {isDone ? "✓" : i + 1}
                      </div>
                      <span className="text-[9px] font-bold uppercase text-center" style={{ color: isActive ? c.primary : c.textSecondary }}>
                        {s.replace("_", " ")}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex-1 h-0.5 mb-4" style={{ backgroundColor: isDone ? "#10b981" : c.border }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Status Select */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: c.textSecondary }}>
                  Change Status To
                </label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm font-semibold outline-none"
                  style={inputSt}>
                  {STATUS_OPTS.filter(s => s !== "call_done" && s !== "converted" && s !== "closed").map(s => (
                    <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleStatusUpdate}
                disabled={updatingStatus || newStatus === lead.status}
                className="self-end flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90"
                style={{ backgroundColor: c.primary, color: "#fff" }}>
                {updatingStatus
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                  : <><Save size={14} /> Update Status</>}
              </button>
            </div>
          </div>

          {/* Current Status Info */}
          <div className="rounded-2xl border p-5 flex items-center gap-4"
            style={{ backgroundColor: isDark ? c.surface : sCfg.bg, borderColor: sCfg.border }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black"
              style={{ backgroundColor: `${sCfg.color}20`, color: sCfg.color }}>
              ●
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sCfg.color }}>Current Status</p>
              <p className="text-xl font-black capitalize" style={{ color: sCfg.color }}>
                {lead.status?.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}
      <WhatsAppChooserModal link={waModalLead?.integrations?.whatsappLink} phone={waModalLead?.phone} isOpen={!!waModalLead} onClose={() => setWaModalLead(null)} />
    </div>
  );
}
