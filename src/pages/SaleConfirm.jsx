import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate } from "react-router-dom";
import { leadAPI } from "../api/lead";
import {
  ArrowLeft, CheckCircle2, IndianRupee, Wrench,
  FileText, Send, AlertCircle, Users
} from "lucide-react";
import { toast } from "sonner";

export default function SaleConfirm() {
  const { themeColors: c } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isDark = c.mode === "dark";

  const [lead, setLead]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    productDetails: "",
    dealValue:      "",
    accountRemarks: "",
    transferToAccounts: true,
    amountPaid:     "",
    pendingAmount:  "",
    paymentScreenshot: null,
  });

  useEffect(() => {
    leadAPI.getLeadById(id)
      .then(res => {
        const l = res?.data?.lead;
        setLead(l);
        const deal = l?.dealValue || 0;
        const paid = l?.amountPaid || 0;
        const pending = Math.max(0, deal - paid);
        setForm(f => ({
          ...f,
          productDetails: l?.productDetails || "",
          dealValue:      deal || "",
          accountRemarks: l?.accountRemarks || "",
          amountPaid:     paid || "",
          pendingAmount:  pending || "",
        }));
      })
      .catch(() => toast.error("Failed to load lead."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productDetails.trim()) return toast.error("Product details required.");
    if (!form.dealValue || isNaN(Number(form.dealValue))) return toast.error("Enter valid deal value.");
    if (form.amountPaid === "" || isNaN(Number(form.amountPaid))) return toast.error("Amount paid required.");
    if (form.pendingAmount === "" || isNaN(Number(form.pendingAmount))) return toast.error("Pending amount required.");
    if (!form.paymentScreenshot) return toast.error("Payment screenshot is required.");

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("productDetails", form.productDetails);
      formData.append("dealValue", Number(form.dealValue));
      formData.append("amountPaid", Number(form.amountPaid));
      formData.append("pendingAmount", Number(form.pendingAmount));
      formData.append("accountRemarks", form.accountRemarks);
      formData.append("transferToAccounts", form.transferToAccounts);
      formData.append("paymentScreenshot", form.paymentScreenshot);

      await leadAPI.confirmSale(id, formData);
      toast.success("Sale confirmed & transferred to Accounts!");
      navigate(`/lead-details/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to confirm sale.");
    } finally { setSaving(false); }
  };

  const inputSt = { backgroundColor: c.background, color: c.text, borderColor: c.border };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
    </div>
  );

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
            <CheckCircle2 size={22} color="#f59e0b" /> Mark as Sale Confirmed
          </h1>
          <p className="text-xs" style={{ color: c.textSecondary }}>Lead: {lead?.name} · {lead?.phone}</p>
        </div>
      </div>

      {/* ALERT */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border text-sm"
        style={{ backgroundColor: isDark ? "#451a03" : "#fffbeb", borderColor: "#fcd34d", color: "#b45309" }}>
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-black">Important!</p>
          <p className="text-xs mt-0.5">Once confirmed, this lead will be marked as <b>Closed Won</b> and transferred to the Accounts Team.</p>
        </div>
      </div>

      {/* FORM */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}99` : `${c.background}70` }}>
          <p className="text-sm font-black uppercase tracking-wider" style={{ color: c.textSecondary }}>Sale Details</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Product Details */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <Wrench size={11} className="inline mr-1" /> Product / Service Details *
            </label>
            <textarea value={form.productDetails}
              onChange={e => setForm(f => ({ ...f, productDetails: e.target.value }))}
              rows={3} placeholder="e.g. Shop 105, Mall Road - Fiber Router & CCTV Setup"
              className="w-full p-3 rounded-xl border text-sm outline-none resize-none"
              style={inputSt} required />
          </div>

          {/* Deal Value */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <IndianRupee size={11} className="inline mr-1" /> Deal Value (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black" style={{ color: c.textSecondary }}>₹</span>
              <input type="number" value={form.dealValue}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => {
                    const deal = Number(val) || 0;
                    const paid = Number(f.amountPaid) || 0;
                    return {
                      ...f,
                      dealValue: val,
                      pendingAmount: Math.max(0, deal - paid).toString()
                    };
                  });
                }}
                placeholder="e.g. 25000"
                className="w-full pl-7 pr-4 py-3 rounded-xl border text-sm outline-none"
                style={inputSt} required min={0} />
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <IndianRupee size={11} className="inline mr-1" /> Amount Paid (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black" style={{ color: c.textSecondary }}>₹</span>
              <input type="number" value={form.amountPaid}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => {
                    const deal = Number(f.dealValue) || 0;
                    const paid = Number(val) || 0;
                    return {
                      ...f,
                      amountPaid: val,
                      pendingAmount: Math.max(0, deal - paid).toString()
                    };
                  });
                }}
                placeholder="e.g. 10000"
                className="w-full pl-7 pr-4 py-3 rounded-xl border text-sm outline-none"
                style={inputSt} required min={0} />
            </div>
          </div>

          {/* Pending Amount */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <IndianRupee size={11} className="inline mr-1" /> Pending Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black" style={{ color: c.textSecondary }}>₹</span>
              <input type="number" value={form.pendingAmount}
                className="w-full pl-7 pr-4 py-3 rounded-xl border text-sm outline-none opacity-80 cursor-not-allowed"
                style={{ ...inputSt, backgroundColor: isDark ? `${c.background}80` : "#f3f4f6" }} readOnly />
            </div>
          </div>

          {/* Payment Screenshot */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <FileText size={11} className="inline mr-1" /> Payment Screenshot / Receipt *
            </label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*,application/pdf" id="payment-screenshot-input"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setForm(f => ({ ...f, paymentScreenshot: e.target.files[0] }));
                  }
                }}
                className="hidden" />
              <label htmlFor="payment-screenshot-input"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer hover:opacity-90 transition-all"
                style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
                <FileText size={14} /> Choose File
              </label>
              <span className="text-xs" style={{ color: c.textSecondary }}>
                {form.paymentScreenshot ? form.paymentScreenshot.name : "No file chosen (Mandatory)"}
              </span>
            </div>
          </div>

          {/* Account Remarks */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <FileText size={11} className="inline mr-1" /> Remarks for Accounts Team
            </label>
            <textarea value={form.accountRemarks}
              onChange={e => setForm(f => ({ ...f, accountRemarks: e.target.value }))}
              rows={3} placeholder="Any notes for the accounts team..."
              className="w-full p-3 rounded-xl border text-sm outline-none resize-none"
              style={inputSt} />
          </div>

          {/* Transfer Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border"
            style={{ backgroundColor: isDark ? `${c.primary}10` : "#eff6ff", borderColor: `${c.primary}30` }}>
            <div className="flex items-center gap-3">
              <Users size={18} style={{ color: c.primary }} />
              <div>
                <p className="text-sm font-black" style={{ color: c.text }}>Transfer to Accounts Team</p>
                <p className="text-xs" style={{ color: c.textSecondary }}>Auto-transfer lead for billing & verification</p>
              </div>
            </div>
            <button type="button"
              onClick={() => setForm(f => ({ ...f, transferToAccounts: !f.transferToAccounts }))}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ backgroundColor: form.transferToAccounts ? c.primary : c.border }}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.transferToAccounts ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: c.border }}>
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl text-sm font-bold border"
              style={{ borderColor: c.border, color: c.textSecondary }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90"
              style={{ backgroundColor: "#f59e0b", color: "#fff" }}>
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirming…</>
                : <><CheckCircle2 size={15} /> Confirm Sale</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
