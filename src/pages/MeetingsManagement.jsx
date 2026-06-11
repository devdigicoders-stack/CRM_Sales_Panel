import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { leadAPI } from "../api/lead";
import {
  Calendar, Clock, User, Phone, MapPin, Search, RefreshCw,
  AlertCircle, CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function MeetingsManagement() {
  const { themeColors: c } = useTheme();
  const isDark = c.mode === "dark";

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("upcoming");


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await leadAPI.getAllLeads();
      const leadsData = res?.data?.leads || [];
      setLeads(leadsData);

      // Extract meetings from leads
      const allMeetings = [];
      leadsData.forEach(lead => {
        if (lead.meetings && lead.meetings.length > 0) {
          lead.meetings.forEach(meeting => {
            allMeetings.push({
              id: `${lead._id}-${meeting._id}`,
              leadId: lead._id,
              leadName: lead.name,
              leadPhone: lead.phone,
              ...meeting,
            });
          });
        }
      });

      setMeetings(allMeetings.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch {
      setError("Failed to load meetings.");
      toast.error("Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  };



  const filtered = meetings.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      m.leadName?.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q);

    const now = new Date();
    const meetingDate = new Date(m.date);
    let matchFilter = true;

    if (filter === "upcoming") matchFilter = meetingDate > now;
    else if (filter === "past") matchFilter = meetingDate <= now;

    return matchSearch && matchFilter;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading meetings…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle size={40} color="#dc2626" />
      <p style={{ color: c.text }}>{error}</p>
      <button onClick={fetchData} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: c.primary }}>
        <RefreshCw size={14} className="inline mr-2" /> Retry
      </button>
    </div>
  );

  const inputSt = { backgroundColor: c.background, color: c.text, borderColor: c.border };

  return (
    <div className="w-full pb-20 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <Calendar size={26} style={{ color: c.primary }} /> Meetings
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            {meetings.length} total meetings
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
            style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
            <RefreshCw size={14} /> Refresh
          </button>

        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.textSecondary }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={inputSt} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none"
          style={inputSt}>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <Calendar size={40} className="mx-auto mb-3" style={{ color: c.textSecondary }} />
          <p className="font-bold text-lg" style={{ color: c.text }}>No meetings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(meeting => (
            <div key={meeting.id}
              className="rounded-2xl border p-4"
              style={{ backgroundColor: c.surface, borderColor: c.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-lg" style={{ color: c.text }}>{meeting.title}</p>
                    <CheckCircle size={16} style={{ color: "#10b981" }} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                      <User size={14} /> {meeting.leadName}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                      <Phone size={14} /> {meeting.leadPhone}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                      <Calendar size={14} /> {new Date(meeting.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                      <Clock size={14} /> {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2 text-sm col-span-1 sm:col-span-2" style={{ color: c.textSecondary }}>
                        <MapPin size={14} /> {meeting.location}
                      </div>
                    )}
                  </div>

                  {meeting.notes && (
                    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: c.background }}>
                      <p className="text-xs font-bold mb-1" style={{ color: c.textSecondary }}>Notes:</p>
                      <p className="text-sm" style={{ color: c.text }}>{meeting.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
