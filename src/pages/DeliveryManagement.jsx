import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate } from "react-router-dom";
import { leadAPI } from "../api/lead";
import {
  ArrowLeft, Truck, Calendar, Save, AlertCircle,
  CheckCircle2, Clock, Package, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const DELIVERY_STATUSES = [
  { value: "pending",     label: "Pending",     color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d" },
  { value: "in_progress", label: "In Progress", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  { value: "delivered",   label: "Delivered",   color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7" },
  { value: "cancelled",   label: "Cancelled",   color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
];

export default function DeliveryManagement() {
  const { themeColors: c } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isDark = c.mode === "dark";

  const [lead, setLead]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    deliveryStatus:   "pending",
    expectedDelivery: "",
    deliveryNotes:    "",
  });

  useEffect(() => {
    leadAPI.getLeadById(id)
      .then(res => {
        const l = res?.data?.lead;
        setLead(l);
        setForm(f => ({
          ...f,
          deliveryStatus: l?.deliveryStatus || "pending",
          expectedDelivery: l?.expectedDelivery
            ? new Date(l.expectedDelivery).toISOString().split("T")[0]
            : "",
        }));
      })
      .catch(() => toast.error("Failed to load lead."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leadAPI.updateDelivery(id, {
        deliveryStatus:   form.deliveryStatus,
        expectedDelivery: form.expectedDelivery || undefined,
        deliveryNotes:    form.deliveryNotes || undefined,
      });
      toast.success("Delivery status updated!");
      navigate(`/lead-details/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update delivery.");
    } finally { setSaving(false); }
  };

  const inputSt = { backgroundColor: c.background, color: c.text, borderColor: c.border };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
    </div>
  );

  const currentDelivery = DELIVERY_STATUSES.find(d => d.value === lead?.deliveryStatus) || DELIVERY_STATUSES[0];

  return (
    <div className="w-full pb-20 max-w-2xl mx-auto space-y-5">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center border"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <Truck size={22} color="#7c3aed" /> Manage Delivery
          </h1>
          <p className="text-xs" style={{ color: c.textSecondary }}>Lead: {lead?.name} · {lead?.phone}</p>
        </div>
      </div>

      {/* CURRENT STATUS CARD */}
      <div className="relative overflow-hidden rounded-2xl border p-5 flex items-center gap-4"
        style={{ backgroundColor: isDark ? c.surface : currentDelivery.bg, borderColor: currentDelivery.border }}>
        <div className="absolute -right-3 -top-3 opacity-10">
          <Package size={90} color={currentDelivery.color} />
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10"
          style={{ backgroundColor: `${currentDelivery.color}20`, color: currentDelivery.color }}>
          <Truck size={24} />
        </div>
        <div className="z-10">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: currentDelivery.color }}>Current Delivery Status</p>
          <p className="text-2xl font-black" style={{ color: isDark ? c.text : currentDelivery.color }}>
            {currentDelivery.label}
          </p>
          {lead?.productDetails && (
            <p className="text-xs mt-1 font-medium" style={{ color: c.textSecondary }}>{lead.productDetails}</p>
          )}
        </div>
      </div>

      {/* DELIVERY TIMELINE */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <p className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: c.textSecondary }}>Delivery Pipeline</p>
        <div className="flex items-center gap-2">
          {DELIVERY_STATUSES.slice(0, 3).map((s, i, arr) => {
            const currentIdx = arr.findIndex(d => d.value === lead?.deliveryStatus);
            const isActive   = lead?.deliveryStatus === s.value;
            const isDone     = currentIdx > i;
            return (
              <React.Fragment key={s.value}>
                <div className="flex flex-col items-center gap-1 min-w-[70px]">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all"
                    style={{
                      backgroundColor: isActive ? s.color : isDone ? "#10b981" : c.background,
                      borderColor:     isActive ? s.color : isDone ? "#10b981" : c.border,
                      color:           isActive || isDone ? "#fff" : c.textSecondary,
                    }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span className="text-[9px] font-bold uppercase text-center" style={{ color: isActive ? s.color : c.textSecondary }}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-0.5 mb-4" style={{ backgroundColor: isDone ? "#10b981" : c.border }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* FORM */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
          <p className="text-sm font-black uppercase tracking-wider" style={{ color: c.textSecondary }}>Update Delivery Status</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Status Selector */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-3" style={{ color: c.textSecondary }}>
              Delivery Status *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DELIVERY_STATUSES.map(({ value, label, color, bg, border }) => {
                const active = form.deliveryStatus === value;
                return (
                  <button key={value} type="button"
                    onClick={() => setForm(f => ({ ...f, deliveryStatus: value }))}
                    className="flex items-center gap-3 p-3.5 rounded-xl border transition-all"
                    style={{
                      backgroundColor: active ? (isDark ? `${color}20` : bg) : c.background,
                      borderColor: active ? color : c.border,
                      boxShadow: active ? `0 0 0 2px ${color}25` : "none",
                    }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: active ? color : c.border }} />
                    <span className="text-sm font-bold" style={{ color: active ? color : c.text }}>{label}</span>
                    {active && <CheckCircle2 size={14} className="ml-auto" style={{ color }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expected Delivery Date */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <Calendar size={11} className="inline mr-1" /> Expected Delivery Date
            </label>
            <input type="date" value={form.expectedDelivery}
              onChange={e => setForm(f => ({ ...f, expectedDelivery: e.target.value }))}
              className="w-full p-3 rounded-xl border text-sm outline-none"
              style={inputSt} />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              Delivery Notes
            </label>
            <textarea value={form.deliveryNotes}
              onChange={e => setForm(f => ({ ...f, deliveryNotes: e.target.value }))}
              rows={3} placeholder="Any delivery instructions or notes..."
              className="w-full p-3 rounded-xl border text-sm outline-none resize-none"
              style={inputSt} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl text-sm font-bold border"
              style={{ borderColor: c.border, color: c.textSecondary }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90"
              style={{ backgroundColor: "#7c3aed", color: "#fff" }}>
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><Save size={15} /> Update Delivery</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
