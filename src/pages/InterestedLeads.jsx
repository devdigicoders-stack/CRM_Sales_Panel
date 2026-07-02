import React, { useState, useEffect } from "react";
import WhatsAppChooserModal from '../components/WhatsAppChooserModal';
import { useTheme } from "../context/ThemeContext";
import { leadAPI } from "../api/lead";
import { useNavigate } from "react-router-dom";
import {
  Users, Phone, Mail, Tag, Calendar, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, MessageCircle, TrendingUp, Star,
  X, Eye, Clock, IndianRupee, Wrench, LayoutGrid, Table2,
  PhoneCall, Search, CheckCircle2, Send, ArrowRight
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
  call_done:      { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
};

function StatusBadge({ status }) {
  const [waModalLead, setWaModalLead] = useState(null);

  const cfg = statusConfig[status?.toLowerCase()] || statusConfig.new;
  return (
    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      {status?.replace("_", " ") || "—"}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = priorityConfig[priority?.toLowerCase()] || priorityConfig.medium;
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase border whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      {priority || "medium"}
    </span>
  );
}

export default function InterestedLeads() {
  const { themeColors: c } = useTheme();
  const navigate = useNavigate();
  const [leads, setLeads]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [view, setView]               = useState("table");
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalLead, setModalLead]     = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [statusModal, setStatusModal] = useState(false);
  const [statusLead, setStatusLead]   = useState(null);
  const [statusForm, setStatusForm]   = useState({ status: "interested", note: "" });
  const [savingStatus, setSavingStatus] = useState(false);

  const [saleModal, setSaleModal]     = useState(false);
  const [saleLead, setSaleLead]       = useState(null);
  const [saleForm, setSaleForm]       = useState({ productDetails: "", dealValue: "" });
  const [savingSale, setSavingSale]   = useState(false);

  const [transferModal, setTransferModal]   = useState(false);
  const [transferLead, setTransferLead]     = useState(null);
  const [transferring, setTransferring]     = useState(false);

  const isDark = c.mode === "dark";

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true); setError(null);
      const res = await leadAPI.getAllLeads();
      const allLeads = res?.data?.leads || [];
      const interestedLeads = allLeads.filter(l => l.status === "interested");
      setLeads(interestedLeads);
    } catch {
      setError("Failed to load leads.");
      toast.error("Failed to load data.");
    } finally { setLoading(false); }
  };

  const handleViewDetails = async (id, e) => {
    e?.stopPropagation();
    setModalOpen(true); setModalLead(null); setModalLoading(true);
    try {
      const res = await leadAPI.getLeadById(id);
      setModalLead(res?.data?.lead || null);
    } catch { toast.error("Failed to load details."); setModalOpen(false); }
    finally { setModalLoading(false); }
  };

  const openStatusModal = (lead, e) => {
    e?.stopPropagation();
    setStatusLead(lead);
    setStatusForm({ status: lead.status || "interested", note: "" });
    setStatusModal(true);
  };

  const openSaleModal = (lead, e) => {
    e?.stopPropagation();
    setSaleLead(lead);
    setSaleForm({
      productDetails: lead.productDetails || "",
      dealValue:      lead.dealValue || "",
    });
    setSaleModal(true);
  };

  const openTransferModal = (lead, e) => {
    e?.stopPropagation();
    if (lead.status !== "closed") {
      toast.error("Lead must be in 'closed' status to transfer to accounts!");
      return;
    }
    setTransferLead(lead);
    setTransferModal(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusForm.status) return toast.error("Status is required.");
    setSavingStatus(true);
    try {
      await leadAPI.updateLead(statusLead._id, {
        status: statusForm.status,
        note: statusForm.note.trim()
      });
      toast.success("Status updated!");
      setStatusModal(false);
      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!saleForm.productDetails.trim()) return toast.error("Product details required.");
    if (!saleForm.dealValue || isNaN(Number(saleForm.dealValue))) return toast.error("Enter valid deal value.");
    setSavingSale(true);
    try {
      await leadAPI.addSaleDetails(saleLead._id, {
        productDetails: saleForm.productDetails.trim(),
        dealValue:      Number(saleForm.dealValue),
      });
      toast.success("Sale details saved!");
      setSaleModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save sale details.");
    } finally { setSavingSale(false); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
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

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return !search || l.name?.toLowerCase().includes(q) || l.phone?.includes(search) || l.email?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS) || 1;
  const paginated  = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  const fmtDate     = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtDateTime = d => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const stats = [
    { label: "Total",        value: leads.length,                                          color: "#10b981", bg: "#ecfdf5" },
    { label: "High Priority",value: leads.filter(l => l.priority === "high").length,       color: "#ef4444", bg: "#fef2f2" },
    { label: "Medium",       value: leads.filter(l => l.priority === "medium").length,     color: "#f59e0b", bg: "#fffbeb" },
    { label: "Low",          value: leads.filter(l => l.priority === "low").length,        color: "#10b981", bg: "#d1fae5" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: "#10b981" }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading leads…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle size={40} color="#dc2626" />
      <p style={{ color: c.text }}>{error}</p>
      <button onClick={fetchLeads} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: "#10b981" }}>
        <RefreshCw size={14} className="inline mr-2" /> Retry
      </button>
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <Star size={26} color="#10b981" /> Interested Leads
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            {leads.length} leads — ready for follow-up
          </p>
        </div>
        <button onClick={fetchLeads}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, color, bg }) => (
          <div key={label}
            className="rounded-2xl border p-4 flex items-center justify-between hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: isDark ? c.surface : bg, borderColor: c.border }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: isDark ? c.textSecondary : color }}>{label}</p>
              <p className="text-3xl font-black mt-0.5" style={{ color: isDark ? c.text : color }}>{value}</p>
            </div>
            <TrendingUp size={20} style={{ color, opacity: 0.5 }} />
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
          <button onClick={() => setView("table")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ backgroundColor: view === "table" ? c.surface : "transparent", color: view === "table" ? "#10b981" : c.textSecondary, border: view === "table" ? `1px solid ${c.border}` : "1px solid transparent" }}>
            <Table2 size={14} /> Table
          </button>
          <button onClick={() => setView("card")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ backgroundColor: view === "card" ? c.surface : "transparent", color: view === "card" ? "#10b981" : c.textSecondary, border: view === "card" ? `1px solid ${c.border}` : "1px solid transparent" }}>
            <LayoutGrid size={14} /> Cards
          </button>
        </div>
      </div>

      {paginated.length === 0 && (
        <div className="py-20 text-center rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <Star size={40} className="mx-auto mb-3" color="#10b981" />
          <p className="font-bold text-lg" style={{ color: c.text }}>No leads found</p>
        </div>
      )}

      {paginated.length > 0 && view === "table" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr style={{ backgroundColor: isDark ? `${c.background}99` : `${c.background}80`, borderBottom: `1px solid ${c.border}` }}>
                  {["#", "Name", "Phone", "Email", "Source", "Status", "Priority", "Follow-up", "Assigned To", "Created At", "Created By ID", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
                      style={{ color: c.textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((lead, idx) => (
                  <tr key={lead._id}
                    className="border-b transition-colors duration-150"
                    style={{ borderColor: c.border }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? `${c.primary}10` : "#f0fdf406"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>

                    <td className="px-4 py-3.5 text-xs font-bold" style={{ color: c.textSecondary }}>
                      {(page - 1) * ITEMS + idx + 1}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-black" style={{ color: c.text }}>{lead.name || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: c.text }}>
                        <Phone size={12} color="#10b981" /> {lead.phone || "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-sm truncate max-w-[150px]" style={{ color: c.textSecondary }}>{lead.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-semibold" style={{ color: c.textSecondary }}>{lead.source || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><PriorityBadge priority={lead.priority} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {lead.followUpDate ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: c.textSecondary }}>
                          <Calendar size={11} color="#f59e0b" /> {fmtDate(lead.followUpDate)}
                        </span>
                      ) : <span style={{ color: c.textSecondary }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                            {lead.assignedTo?.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold truncate max-w-[80px]" style={{ color: c.text }}>
                            {lead.assignedTo?.name}
                          </span>
                        </div>
                      ) : <span className="text-xs italic" style={{ color: c.textSecondary }}>Unassigned</span>}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
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

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {lead.createdBy ? (
                        <div>
                          <p className="text-xs font-bold truncate max-w-[110px]" style={{ color: c.text }}>
                            {lead.createdBy?.name || "—"}
                          </p>
                          <p className="text-[10px] font-mono" style={{ color: c.textSecondary }}>
                            {lead.createdBy?._id || lead.createdBy}
                          </p>
                        </div>
                      ) : <span className="text-xs" style={{ color: c.textSecondary }}>—</span>}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button onClick={e => handleViewDetails(lead._id, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" }} title="Details">
                          <Eye size={14} />
                        </button>
                        <button onClick={e => openStatusModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#e0f2fe", borderColor: "#bae6fd", color: "#0284c7" }} title="Update Status">
                          <RefreshCw size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); navigate(`/sale-confirm/${lead._id}`); }}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa", color: "#c2410c" }} title="Confirm Sale">
                          <CheckCircle2 size={14} />
                        </button>
                        <button onClick={e => openSaleModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d", color: "#b45309" }} title="Add Sale Details">
                          <IndianRupee size={14} />
                        </button>
                        <button onClick={e => openTransferModal(lead, e)}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: lead.status === "closed" ? "#f0fdf4" : "#f3f4f6", borderColor: lead.status === "closed" ? "#86efac" : "#d1d5db", color: lead.status === "closed" ? "#16a34a" : "#9ca3af", opacity: lead.status === "closed" ? 1 : 0.5, cursor: lead.status === "closed" ? "pointer" : "not-allowed" }} 
                          title={lead.status === "closed" ? "Transfer to Accounts" : "Only closed leads can be transferred"}
                          disabled={lead.status !== "closed"}>
                          <ArrowRight size={14} />
                        </button>
                        <a href={`tel:${lead.phone}`}
                          className="p-2 rounded-lg border transition-all hover:scale-105"
                          style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }} title="Call">
                          <PhoneCall size={14} />
                        </a>
                        {lead.integrations?.whatsappLink && (
                          <button onClick={() => setWaModalLead(lead)}
                            className="p-2 rounded-lg border transition-all hover:scale-105"
                            style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }} title="WhatsApp">
                            <MessageCircle size={14} />
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
            const lastRemark = lead.remarks?.length ? lead.remarks[lead.remarks.length - 1].note : null;
            return (
              <div key={lead._id}
                className="rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: c.surface, borderColor: c.border }}>
                <div className="h-1.5 w-full" style={{ backgroundColor: pCfg.color }} />
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-base truncate" style={{ color: c.text }}>{lead.name}</p>
                      <p className="text-xs" style={{ color: c.textSecondary }}>{lead.source || "—"}</p>
                    </div>
                    <PriorityBadge priority={lead.priority} />
                  </div>
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: c.text }}>
                    <Phone size={12} color="#10b981" /> {lead.phone}
                  </a>
                  {lead.email && <p className="flex items-center gap-2 text-xs truncate" style={{ color: c.textSecondary }}><Mail size={12} />{lead.email}</p>}
                  {lead.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lead.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{ backgroundColor: isDark ? `${c.primary}20` : "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
                          <Tag size={9} />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {lead.followUpDate && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: c.textSecondary }}>
                      <Calendar size={11} color="#f59e0b" /> {fmtDate(lead.followUpDate)}
                    </p>
                  )}
                  {lastRemark && (
                    <p className="text-xs px-3 py-2 rounded-lg border italic truncate"
                      style={{ backgroundColor: c.background, borderColor: c.border, color: c.textSecondary }}>
                      💬 {lastRemark}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: c.border }}>
                    <StatusBadge status={lead.status} />
                    {lead.assignedTo && (
                      <div className="flex items-center gap-1.5">
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
                  <div className="flex gap-2">
                    <button onClick={e => handleViewDetails(lead._id, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80"
                      style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" }}>
                      <Eye size={13} /> View
                    </button>
                    <button onClick={e => openStatusModal(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80"
                      style={{ backgroundColor: "#e0f2fe", borderColor: "#bae6fd", color: "#0284c7" }}>
                      <RefreshCw size={13} /> Status
                    </button>
                    <button onClick={e => { e.stopPropagation(); navigate(`/sale-confirm/${lead._id}`); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80"
                      style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                      <CheckCircle2 size={13} /> Confirm
                    </button>
                    <button onClick={e => openSaleModal(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80"
                      style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d", color: "#b45309" }}>
                      <IndianRupee size={13} /> Details
                    </button>
                    <button onClick={e => openTransferModal(lead, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: lead.status === "closed" ? "#f0fdf4" : "#f3f4f6", borderColor: lead.status === "closed" ? "#86efac" : "#d1d5db", color: lead.status === "closed" ? "#16a34a" : "#9ca3af" }}
                      disabled={lead.status !== "closed"}>
                      <ArrowRight size={13} /> {lead.status === "closed" ? "Transfer" : "Not Closed"}
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
            Showing <b style={{ color: c.text }}>{(page - 1) * ITEMS + 1}</b>–<b style={{ color: c.text }}>{Math.min(page * ITEMS, filtered.length)}</b> of <b style={{ color: c.text }}>{filtered.length}</b>
          </p>
          <div className="flex gap-1.5">
            <PageBtn onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} c={c}><ChevronLeft size={15} /></PageBtn>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                style={{ backgroundColor: page === n ? "#10b981" : c.background, color: page === n ? "#fff" : c.text, border: `1px solid ${page === n ? "#10b981" : c.border}` }}>
                {n}
              </button>
            ))}
            <PageBtn onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} c={c}><ChevronRight size={15} /></PageBtn>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            style={{ backgroundColor: c.surface }}>

            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
              style={{ backgroundColor: c.surface, borderColor: c.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
                  <Eye size={16} />
                </div>
                <div>
                  <h3 className="font-black text-lg" style={{ color: c.text }}>{modalLead?.name || "Lead Details"}</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>Full lead information</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: c.border, borderTopColor: "#7c3aed" }} />
                  <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading…</p>
                </div>
              ) : modalLead ? (
                <div className="space-y-5">

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Name",    value: modalLead.name,   span: true  },
                      { label: "Phone",   value: modalLead.phone               },
                      { label: "Email",   value: modalLead.email,  span: true  },
                      { label: "Source",  value: modalLead.source              },
                    ].map(({ label, value, span }) => (
                      <div key={label} className={`p-3 rounded-xl border ${span ? "col-span-2" : ""}`}
                        style={{ backgroundColor: c.background, borderColor: c.border }}>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: c.textSecondary }}>{label}</p>
                        <p className="text-sm font-bold mt-0.5 truncate" style={{ color: c.text }}>{value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider mb-3 pb-2 border-b"
                      style={{ color: c.textSecondary, borderColor: c.border }}>Status & Tracking</p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: "Status",       value: <StatusBadge status={modalLead.status} /> },
                        { label: "Priority",     value: <PriorityBadge priority={modalLead.priority} /> },
                        { label: "Verification", value: modalLead.verificationStatus },
                        { label: "Payment",      value: modalLead.paymentStatus      },
                        { label: "Delivery",     value: modalLead.deliveryStatus     },
                        { label: "Installation", value: modalLead.installationStatus },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: c.textSecondary }}>{label}</span>
                          {typeof value === "string"
                            ? <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase border"
                                style={{ backgroundColor: isDark ? `${c.primary}15` : "#f8fafc", borderColor: c.border, color: c.text }}>
                                {value || "—"}
                              </span>
                            : value}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 flex items-center gap-3 p-3.5 rounded-xl border"
                      style={{ backgroundColor: isDark ? "#064e3b" : "#ecfdf5", borderColor: "#6ee7b7" }}>
                      <IndianRupee size={18} color="#059669" />
                      <div>
                        <p className="text-[10px] font-bold uppercase" style={{ color: "#10b981" }}>Deal Value</p>
                        <p className="text-xl font-black" style={{ color: isDark ? "#6ee7b7" : "#065f46" }}>
                          ₹{modalLead.dealValue?.toLocaleString("en-IN") || "0"}
                        </p>
                      </div>
                    </div>
                    {modalLead.productDetails && (
                      <div className="flex-1 flex items-center gap-3 p-3.5 rounded-xl border"
                        style={{ backgroundColor: c.background, borderColor: c.border }}>
                        <Wrench size={16} style={{ color: c.textSecondary }} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase" style={{ color: c.textSecondary }}>Product</p>
                          <p className="text-xs font-bold truncate" style={{ color: c.text }}>{modalLead.productDetails}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {modalLead.assignedTo && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border"
                      style={{ backgroundColor: c.background, borderColor: c.border }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black"
                        style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                        {modalLead.assignedTo.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase" style={{ color: c.textSecondary }}>Assigned To</p>
                        <p className="font-black" style={{ color: c.text }}>{modalLead.assignedTo.name}</p>
                        <p className="text-xs" style={{ color: c.textSecondary }}>{modalLead.assignedTo.email} · {modalLead.assignedTo.role}</p>
                      </div>
                    </div>
                  )}

                  {modalLead.remarks?.length > 0 && (
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider mb-3 pb-2 border-b"
                        style={{ color: c.textSecondary, borderColor: c.border }}>
                        Remarks ({modalLead.remarks.length})
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {[...modalLead.remarks].reverse().map((r, i) => (
                          <div key={r._id || i} className="p-3 rounded-xl border flex gap-3"
                            style={{ backgroundColor: c.background, borderColor: c.border }}>
                            <div className="w-1.5 rounded-full shrink-0 mt-1"
                              style={{ backgroundColor: i === 0 ? "#10b981" : c.border }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs" style={{ color: c.text }}>{r.note}</p>
                              <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: c.textSecondary }}>
                                <Clock size={9} /> {fmtDateTime(r.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                    <a href={`tel:${modalLead.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border hover:opacity-80"
                      style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }}>
                      <PhoneCall size={15} /> Call
                    </a>
                    {modalLead.integrations?.whatsappLink && (
                      <button onClick={() => setWaModalLead(modalLead)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border hover:opacity-80"
                        style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }}>
                        <MessageCircle size={15} /> WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center py-10 text-sm" style={{ color: c.textSecondary }}>No data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {saleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setSaleModal(false)}>
          <div className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: c.surface }}>

            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#fffbeb", color: "#b45309" }}>
                  <IndianRupee size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Add Sale Details</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>
                    {saleLead?.name} · {saleLead?.phone}
                  </p>
                </div>
              </div>
              <button onClick={() => setSaleModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="p-6 space-y-4">

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2"
                  style={{ color: c.textSecondary }}>
                  <Wrench size={10} className="inline mr-1" />
                  Product / Service Details *
                </label>
                <textarea
                  value={saleForm.productDetails}
                  onChange={e => setSaleForm(f => ({ ...f, productDetails: e.target.value }))}
                  rows={3}
                  required
                  placeholder="e.g. 10kW Premium Monocrystalline Solar Grid"
                  className="w-full p-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2"
                  style={{ color: c.textSecondary }}>
                  <IndianRupee size={10} className="inline mr-1" />
                  Deal Value (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-sm"
                    style={{ color: c.textSecondary }}>₹</span>
                  <input
                    type="number"
                    value={saleForm.dealValue}
                    onChange={e => setSaleForm(f => ({ ...f, dealValue: e.target.value }))}
                    required
                    min={0}
                    placeholder="e.g. 75000"
                    className="w-full pl-7 pr-4 py-3 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setSaleModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                  style={{ borderColor: c.border, color: c.textSecondary }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingSale || !saleForm.productDetails.trim() || !saleForm.dealValue}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#f59e0b", color: "#fff" }}>
                  {savingSale
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    : <><CheckCircle2 size={14} /> Save Details</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setTransferModal(false)}>
          <div className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: c.surface }}>

            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}>
                  <ArrowRight size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Transfer to Accounts</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>
                    {transferLead?.name} · {transferLead?.phone}
                  </p>
                </div>
              </div>
              <button onClick={() => setTransferModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl border"
                style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}>
                <p className="text-sm font-semibold" style={{ color: "#16a34a" }}>
                  Transfer this lead to the accounts team for follow-up?
                </p>
                <p className="text-xs mt-2" style={{ color: c.textSecondary }}>
                  The lead will be moved to accounts department and you'll lose access to manage it.
                </p>
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button onClick={() => setTransferModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                  style={{ borderColor: c.border, color: c.textSecondary }}>
                  Cancel
                </button>
                <button onClick={handleTransfer} disabled={transferring}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#16a34a", color: "#fff" }}>
                  {transferring
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Transferring…</>
                    : <><Send size={14} /> Transfer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setStatusModal(false)}>
          <div className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: c.surface }}>

            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
                  <RefreshCw size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: c.text }}>Update Status</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>
                    {statusLead?.name} · {statusLead?.phone}
                  </p>
                </div>
              </div>
              <button onClick={() => setStatusModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2"
                  style={{ color: c.textSecondary }}>
                  Lead Status *
                </label>
                <select
                  value={statusForm.status}
                  onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
                  required
                  className="w-full p-3 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }}
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="interested">Interested</option>
                  <option value="in_process">In Process</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="call_done">Call Done</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2"
                  style={{ color: c.textSecondary }}>
                  Note / Remarks
                </label>
                <textarea
                  value={statusForm.note}
                  onChange={e => setStatusForm(f => ({ ...f, note: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Customer verified pricing and agreed to downpayment."
                  className="w-full p-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }}
                />
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
                <button type="button" onClick={() => setStatusModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                  style={{ borderColor: c.border, color: c.textSecondary }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingStatus}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#0284c7", color: "#fff" }}>
                  {savingStatus
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                    : <><CheckCircle2 size={14} /> Update</>}
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
    <button onClick={onClick} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40"
      style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}>
      {children}
    </button>
      
  );
}
