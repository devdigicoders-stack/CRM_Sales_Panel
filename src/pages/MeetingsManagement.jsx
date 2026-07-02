import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import axiosInstance from "../api/axiosInstance";
import {
  Calendar, Clock, User, Phone, Search, RefreshCw,
  AlertCircle, ChevronLeft, ChevronRight, X, FileText
} from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const getPriorityColor = (p) =>
  p === "high" ? "#dc2626" : p === "medium" ? "#f59e0b" : "#10b981";

const getStatusColor = (s) => {
  if (s === "converted") return "#10b981";
  if (s === "interested") return "#3b82f6";
  if (s === "not_interested") return "#dc2626";
  return "#6b7280";
};

export default function MeetingsManagement() {
  const { themeColors: c } = useTheme();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null); // { date, meetings[] }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split("T")[0];
      const res = await axiosInstance.get("/calendar", { params: { startDate, endDate } });
      setMeetings(res?.data?.data?.events || []);
    } catch (err) {
      console.error("Calendar fetch error:", err);
      setError("Failed to load meetings.");
      toast.error("Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  };

  // Group meetings by date string "YYYY-MM-DD"
  const meetingsByDate = {};
  meetings.forEach((m) => {
    if (!m.followUpDate) return;
    const key = new Date(m.followUpDate).toISOString().split("T")[0];
    if (!meetingsByDate[key]) meetingsByDate[key] = [];
    meetingsByDate[key].push(m);
  });

  // Apply search filter to list view
  const filteredList = meetings.filter((m) => {
    const q = search.toLowerCase();
    return (
      !search ||
      m.name?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  // Calendar grid days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayMeetings = meetingsByDate[dateStr] || [];
    setSelectedDay({ dateStr, day, meetings: dayMeetings });
  };

  const inputSt = { backgroundColor: c.background, color: c.text, borderColor: c.border };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: c.border, borderTopColor: c.primary }} />
        <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading meetings…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle size={40} color="#dc2626" />
        <p style={{ color: c.text }}>{error}</p>
        <button onClick={fetchData} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: c.primary }}>
          <RefreshCw size={14} className="inline mr-2" /> Retry
        </button>
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-5" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <Calendar size={26} style={{ color: c.primary }} /> Meetings
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            {meetings.length} total follow-ups scheduled
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: c.border }}>
            <button
              onClick={() => setViewMode("calendar")}
              className="px-4 py-2 text-sm font-bold transition-all"
              style={{
                backgroundColor: viewMode === "calendar" ? c.primary : c.surface,
                color: viewMode === "calendar" ? "#fff" : c.text,
              }}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="px-4 py-2 text-sm font-bold transition-all"
              style={{
                backgroundColor: viewMode === "list" ? c.primary : c.surface,
                color: viewMode === "list" ? "#fff" : c.text,
              }}
            >
              List
            </button>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
            style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ─────────────────── CALENDAR VIEW ─────────────────── */}
      {viewMode === "calendar" && (
        <div className="flex-1 rounded-2xl border overflow-hidden flex flex-col" style={{ backgroundColor: c.surface, borderColor: c.border, minHeight: 0 }}>
          {/* Month Navigator */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: c.border }}>
            <button onClick={prevMonth} className="p-2 rounded-xl hover:opacity-70 transition" style={{ color: c.text }}>
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-black" style={{ color: c.text }}>
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:opacity-70 transition" style={{ color: c.text }}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: c.border }}>
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-bold" style={{ color: c.textSecondary }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "1fr" }}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r"
                style={{ borderColor: c.border, backgroundColor: c.background, opacity: 0.4 }} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayMeetings = meetingsByDate[dateStr] || [];
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();
              const isSelected = selectedDay?.day === day && selectedDay?.dateStr === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className="border-b border-r p-1.5 cursor-pointer transition-all hover:opacity-90"
                  style={{
                    borderColor: c.border,
                    backgroundColor: isSelected ? c.primary + "22" : c.surface,
                    outline: isSelected ? `2px solid ${c.primary}` : "none",
                    outlineOffset: "-2px",
                  }}
                >
                  {/* Day number */}
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mb-1"
                    style={{
                      backgroundColor: isToday ? c.primary : "transparent",
                      color: isToday ? "#fff" : c.text,
                    }}
                  >
                    {day}
                  </span>

                  {/* Meeting dots / chips */}
                  <div className="space-y-0.5">
                    {dayMeetings.slice(0, 2).map((m) => (
                      <div
                        key={m._id}
                        className="rounded px-1 py-0.5 text-[10px] font-semibold text-white truncate"
                        style={{ backgroundColor: getPriorityColor(m.priority) }}
                        title={`${m.name} — ${new Date(m.followUpDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                      >
                        {new Date(m.followUpDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} {m.name}
                      </div>
                    ))}
                    {dayMeetings.length > 2 && (
                      <div className="text-[10px] font-bold px-1" style={{ color: c.primary }}>
                        +{dayMeetings.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-3 flex items-center gap-4 border-t" style={{ borderColor: c.border }}>
            <span className="text-xs font-semibold" style={{ color: c.textSecondary }}>Priority:</span>
            {[["high","#dc2626"],["medium","#f59e0b"],["low","#10b981"]].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1 text-xs font-semibold" style={{ color: c.textSecondary }}>
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────── SELECTED DAY DETAIL PANEL ─────────────────── */}
      {viewMode === "calendar" && selectedDay && (
        <div className="rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: c.border }}>
            <h3 className="font-black text-lg" style={{ color: c.text }}>
              📅{" "}
              {new Date(selectedDay.dateStr).toLocaleDateString("en-IN", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
              <span className="ml-2 text-sm font-semibold" style={{ color: c.textSecondary }}>
                ({selectedDay.meetings.length} meeting{selectedDay.meetings.length !== 1 ? "s" : ""})
              </span>
            </h3>
            <button onClick={() => setSelectedDay(null)} style={{ color: c.textSecondary }}>
              <X size={18} />
            </button>
          </div>

          {selectedDay.meetings.length === 0 ? (
            <div className="py-10 text-center" style={{ color: c.textSecondary }}>
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Is din koi meeting nahi hai</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: c.border }}>
              {selectedDay.meetings.map((m) => (
                <div key={m._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-bold text-base" style={{ color: c.text }}>{m.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: getPriorityColor(m.priority) }}>
                        {m.priority?.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: getStatusColor(m.status) }}>
                        {m.status?.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: c.textSecondary }}>
                        <Phone size={13} /> {m.phone}
                      </span>
                      {m.email && (
                        <span className="flex items-center gap-1.5 text-sm" style={{ color: c.textSecondary }}>
                          <User size={13} /> {m.email}
                        </span>
                      )}
                    </div>
                    {m.meetingNote && (
                      <div className="mt-2.5 p-3 rounded-xl border text-sm"
                        style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}>
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] uppercase tracking-wider" style={{ color: c.textSecondary }}>
                          <FileText size={12} /> Notes / Description
                        </div>
                        <p>{m.meetingNote}</p>
                      </div>
                    )}
                  </div>
                  {/* Date & Time Box */}
                  <div className="flex flex-col items-center justify-center rounded-xl px-4 py-3 min-w-[110px] text-center"
                    style={{ backgroundColor: c.primary + "18", border: `1px solid ${c.primary}44` }}>
                    <div className="flex items-center gap-1 text-xs font-semibold mb-1" style={{ color: c.primary }}>
                      <Calendar size={12} />
                      {new Date(m.followUpDate).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black" style={{ color: c.primary }}>
                      <Clock size={13} />
                      {new Date(m.followUpDate).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────── LIST VIEW ─────────────────── */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border"
            style={{ backgroundColor: c.surface, borderColor: c.border }}>
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.textSecondary }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={inputSt}
              />
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border"
              style={{ backgroundColor: c.surface, borderColor: c.border }}>
              <Calendar size={40} className="mx-auto mb-3" style={{ color: c.textSecondary }} />
              <p className="font-bold text-lg" style={{ color: c.text }}>No meetings found</p>
              <p className="text-sm mt-1" style={{ color: c.textSecondary }}>
                Leads pe follow-up date set karo — wahi yahan dikhenge
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((m) => (
                <div key={m._id} className="rounded-2xl border p-4"
                  style={{ backgroundColor: c.surface, borderColor: c.border }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="font-bold text-lg" style={{ color: c.text }}>{m.name}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: getPriorityColor(m.priority) }}>
                          {m.priority?.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: getStatusColor(m.status) }}>
                          {m.status?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                          <Phone size={14} /> {m.phone}
                        </div>
                        {m.email && (
                          <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                            <User size={14} /> {m.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: c.primary }}>
                          <Calendar size={14} />
                          {new Date(m.followUpDate).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: c.primary }}>
                          <Clock size={14} />
                          {new Date(m.followUpDate).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                      {m.meetingNote && (
                        <div className="mt-3 p-3 rounded-xl border text-sm"
                          style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}>
                          <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] uppercase tracking-wider" style={{ color: c.textSecondary }}>
                            <FileText size={12} /> Notes / Description
                          </div>
                          <p>{m.meetingNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
