import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { leadAPI } from "../api/lead";
import {
  MessageCircle, Phone, Mail, Search, RefreshCw, AlertCircle,
  Calendar, User, ChevronDown, ChevronUp, Filter
} from "lucide-react";
import { toast } from "sonner";

export default function CommunicationHistory() {
  const { themeColors: c } = useTheme();
  const isDark = c.mode === "dark";

  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await leadAPI.getAllLeads();
      const leads = res?.data?.leads || [];
      
      // Extract communications from remarks
      const allComms = [];
      leads.forEach(lead => {
        if (lead.remarks && lead.remarks.length > 0) {
          lead.remarks.forEach(remark => {
            allComms.push({
              id: `${lead._id}-${remark._id}`,
              leadId: lead._id,
              leadName: lead.name,
              leadPhone: lead.phone,
              type: 'remark',
              message: remark.note,
              date: remark.createdAt,
              status: remark.status || lead.status,
            });
          });
        }
      });
      
      setCommunications(allComms.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch {
      setError("Failed to load communications.");
      toast.error("Failed to load communications.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = communications.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.leadName?.toLowerCase().includes(q) ||
      c.leadPhone?.includes(search) ||
      c.message?.toLowerCase().includes(q);
    const matchFilter = filter === "all" || c.type === filter;
    return matchSearch && matchFilter;
  });

  const inputSt = { backgroundColor: c.background, color: c.text, borderColor: c.border };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading communications…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle size={40} color="#dc2626" />
      <p style={{ color: c.text }}>{error}</p>
      <button onClick={fetchCommunications} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
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
            <MessageCircle size={26} style={{ color: c.primary }} /> Communication History
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            {communications.length} total communications
          </p>
        </div>
        <button onClick={fetchCommunications}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.textSecondary }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, or message..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={inputSt} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none"
          style={inputSt}>
          <option value="all">All Types</option>
          <option value="remark">Remarks</option>
          <option value="call">Calls</option>
          <option value="email">Emails</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <MessageCircle size={40} className="mx-auto mb-3" style={{ color: c.textSecondary }} />
          <p className="font-bold text-lg" style={{ color: c.text }}>No communications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(comm => (
            <div key={comm.id}
              className="rounded-2xl border p-4 transition-all hover:shadow-md cursor-pointer"
              style={{ backgroundColor: c.surface, borderColor: c.border }}
              onClick={() => setExpandedId(expandedId === comm.id ? null : comm.id)}>

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1"
                    style={{ backgroundColor: `${c.primary}20`, color: c.primary }}>
                    <MessageCircle size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold" style={{ color: c.text }}>{comm.leadName}</p>
                      <span className="text-xs px-2 py-1 rounded-lg"
                        style={{ backgroundColor: `${c.primary}12`, color: c.primary }}>
                        {comm.type}
                      </span>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: c.textSecondary }}>
                      {comm.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: c.textSecondary }}>
                      <Calendar size={12} />
                      {new Date(comm.date).toLocaleDateString()} at {new Date(comm.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <button className="p-2 rounded-lg hover:opacity-80 transition-all"
                  style={{ backgroundColor: `${c.primary}10`, color: c.primary }}>
                  {expandedId === comm.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {expandedId === comm.id && (
                <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: c.border }}>
                  <div>
                    <p className="text-xs font-bold uppercase" style={{ color: c.textSecondary }}>Full Message</p>
                    <p className="text-sm mt-2 p-3 rounded-lg" style={{ backgroundColor: c.background, color: c.text }}>
                      {comm.message}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase" style={{ color: c.textSecondary }}>Phone</p>
                      <a href={`tel:${comm.leadPhone}`}
                        className="text-sm font-semibold mt-1 flex items-center gap-1 hover:underline"
                        style={{ color: c.primary }}>
                        <Phone size={12} /> {comm.leadPhone}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase" style={{ color: c.textSecondary }}>Status</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: c.text }}>
                        {comm.status?.replace("_", " ") || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
