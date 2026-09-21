import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate } from "react-router-dom";
import { leadAPI } from "../api/lead";
import axiosInstance from "../api/axiosInstance";
import {
  ArrowLeft, CheckCircle2, IndianRupee, Wrench,
  FileText, Send, AlertCircle, Users, Plus, Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function SaleConfirm() {
  const { themeColors: c } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isDark = c.mode === "dark";

  const [lead, setLead]         = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  // Multi-Product Selected Items State
  const [productItems, setProductItems] = useState([
    { rowId: Date.now(), productId: "", quantity: 1, price: 0, name: "" }
  ]);

  const [form, setForm] = useState({
    productDetails: "",
    dealValue:      "",
    accountRemarks: "",
    transferToAccounts: true,
    amountPaid:     "",
    pendingAmount:  "",
    paymentScreenshots: [],
  });

  useEffect(() => {
    // Load lead details
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

        if (l?.productId) {
          setProductItems([{
            rowId: Date.now(),
            productId: l.productId,
            quantity: l.productQuantity || 1,
            price: 0,
            name: l.productDetails || ""
          }]);
        }
      })
      .catch(() => toast.error("Failed to load lead."))
      .finally(() => setLoading(false));

    // Load active products for catalog selection
    axiosInstance.get("/stock/products")
      .then(res => {
        if (res.data.status === "success") {
          setProducts(res.data.data);
        }
      })
      .catch(err => console.error("Failed to load catalog products", err));
  }, [id]);

  // Recalculate summary totals whenever productItems change
  const syncProductTotals = (updatedItems, currentPaid = form.amountPaid) => {
    let totalDeal = 0;
    const detailsList = [];

    updatedItems.forEach(item => {
      if (item.productId) {
        const prod = products.find(p => p._id === item.productId);
        const price = prod ? (prod.sellingPrice || 0) : item.price;
        const lineTotal = price * (Number(item.quantity) || 1);
        totalDeal += lineTotal;
        detailsList.push(`${item.quantity}x ${prod ? prod.name : item.name} (₹${lineTotal.toLocaleString('en-IN')})`);
      } else if (item.name) {
        detailsList.push(`${item.quantity}x ${item.name}`);
      }
    });

    const newDealValue = totalDeal > 0 ? totalDeal.toString() : form.dealValue;
    const paidNum = Number(currentPaid) || 0;
    const dealNum = Number(newDealValue) || 0;
    const pendingNum = Math.max(0, dealNum - paidNum);

    setForm(f => ({
      ...f,
      dealValue: newDealValue,
      pendingAmount: pendingNum.toString(),
      productDetails: detailsList.length > 0 ? detailsList.join(", ") : f.productDetails
    }));
  };

  const handleAddRow = () => {
    const newItems = [
      ...productItems,
      { rowId: Date.now() + Math.random(), productId: "", quantity: 1, price: 0, name: "" }
    ];
    setProductItems(newItems);
    syncProductTotals(newItems);
  };

  const handleRemoveRow = (rowId) => {
    if (productItems.length === 1) return;
    const newItems = productItems.filter(item => item.rowId !== rowId);
    setProductItems(newItems);
    syncProductTotals(newItems);
  };

  const handleItemChange = (rowId, field, value) => {
    const newItems = productItems.map(item => {
      if (item.rowId === rowId) {
        const updated = { ...item, [field]: value };
        if (field === "productId") {
          const prod = products.find(p => p._id === value);
          if (prod) {
            updated.name = prod.name;
            updated.price = prod.sellingPrice || 0;
          }
        }
        return updated;
      }
      return item;
    });

    setProductItems(newItems);
    syncProductTotals(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productDetails.trim()) return toast.error("Product details required.");
    if (!form.dealValue || isNaN(Number(form.dealValue))) return toast.error("Enter valid deal value.");
    if (form.amountPaid === "" || isNaN(Number(form.amountPaid))) return toast.error("Amount paid required.");
    if (form.pendingAmount === "" || isNaN(Number(form.pendingAmount))) return toast.error("Pending amount required.");
    if (!form.paymentScreenshots || form.paymentScreenshots.length === 0) return toast.error("At least one payment screenshot is required.");

    setSaving(true);
    try {
      const formData = new FormData();

      // Main product fallback & full items JSON
      const firstValidItem = productItems.find(i => i.productId);
      const mainProdId = firstValidItem ? firstValidItem.productId : "";
      const totalQty = productItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);

      formData.append("productId", mainProdId);
      formData.append("productQuantity", totalQty);
      formData.append("productDetails", form.productDetails);
      formData.append("items", JSON.stringify(productItems));
      formData.append("dealValue", Number(form.dealValue));
      formData.append("amountPaid", Number(form.amountPaid));
      formData.append("pendingAmount", Number(form.pendingAmount));
      formData.append("accountRemarks", form.accountRemarks);
      formData.append("transferToAccounts", form.transferToAccounts);
      form.paymentScreenshots.forEach(file => {
        formData.append("paymentScreenshots", file);
      });

      await leadAPI.confirmSale(id, formData);
      toast.success("Sale confirmed with multiple products & transferred to Accounts!");
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

          {/* MULTI-PRODUCT SELECTION LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider block" style={{ color: c.textSecondary }}>
                <Wrench size={11} className="inline mr-1" /> SELECT PRODUCTS (STOCK CATALOG) *
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 bg-amber-500 text-black hover:bg-amber-400 transition"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            {productItems.map((item, idx) => (
              <div key={item.rowId} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl border bg-slate-50/50" style={{ borderColor: c.border }}>
                {/* Product Dropdown */}
                <div className="col-span-7">
                  <select
                    value={item.productId}
                    onChange={e => handleItemChange(item.rowId, "productId", e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs outline-none"
                    style={inputSt}
                  >
                    <option value="">-- Select Product {idx + 1} --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id} disabled={p.currentStock <= 0}>
                        {p.name} {p.sellingPrice ? `(₹${p.sellingPrice.toLocaleString('en-IN')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="col-span-4">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => handleItemChange(item.rowId, "quantity", e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs outline-none font-bold"
                    style={inputSt}
                    required
                  />
                </div>

                {/* Delete Row */}
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(item.rowId)}
                    disabled={productItems.length === 1}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Product Details Description */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <Wrench size={11} className="inline mr-1" /> Product / Service Description Summary *
            </label>
            <textarea
              rows={3}
              value={form.productDetails}
              onChange={e => setForm({ ...form, productDetails: e.target.value })}
              placeholder="e.g. 2x Teachmint X 86, 1x LIGHT STAND 9FT..."
              className="w-full p-3 rounded-xl border text-sm outline-none"
              style={inputSt}
              required
            />
          </div>

          {/* Deal Value, Paid, Pending */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
                <IndianRupee size={11} className="inline mr-1" /> Deal Value (Total ₹) *
              </label>
              <input
                type="number"
                min="0"
                value={form.dealValue}
                onChange={e => {
                  const val = e.target.value;
                  const paid = Number(form.amountPaid) || 0;
                  const pend = Math.max(0, (Number(val) || 0) - paid);
                  setForm({ ...form, dealValue: val, pendingAmount: pend.toString() });
                }}
                className="w-full p-3 rounded-xl border text-sm outline-none font-extrabold"
                style={inputSt}
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
                <IndianRupee size={11} className="inline mr-1" /> Amount Paid (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={form.amountPaid}
                onChange={e => {
                  const paid = e.target.value;
                  const deal = Number(form.dealValue) || 0;
                  const pend = Math.max(0, deal - (Number(paid) || 0));
                  setForm({ ...form, amountPaid: paid, pendingAmount: pend.toString() });
                }}
                className="w-full p-3 rounded-xl border text-sm outline-none font-bold"
                style={inputSt}
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
                <IndianRupee size={11} className="inline mr-1" /> Pending Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={form.pendingAmount}
                onChange={e => setForm({ ...form, pendingAmount: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm outline-none font-bold"
                style={inputSt}
                required
              />
            </div>
          </div>

          {/* Payment Screenshot Upload */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <FileText size={11} className="inline mr-1" /> Payment Screenshot / Proof *
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setForm({ ...form, paymentScreenshots: Array.from(e.target.files) })}
              className="w-full p-2.5 rounded-xl border text-xs outline-none bg-white"
              style={inputSt}
            />
            {form.paymentScreenshots.length > 0 && (
              <p className="text-xs text-emerald-600 font-bold mt-1">
                ✓ {form.paymentScreenshots.length} file(s) selected
              </p>
            )}
          </div>

          {/* Account Remarks */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider block mb-2" style={{ color: c.textSecondary }}>
              <FileText size={11} className="inline mr-1" /> Remarks for Accounts Team
            </label>
            <textarea
              rows={2}
              value={form.accountRemarks}
              onChange={e => setForm({ ...form, accountRemarks: e.target.value })}
              placeholder="e.g. Received ₹50,000 via UPI transaction #982173. Balance COD."
              className="w-full p-3 rounded-xl border text-sm outline-none"
              style={inputSt}
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-black text-white shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              style={{ backgroundColor: c.primary }}
            >
              <Send size={16} />
              {saving ? "Confirming & Transferring..." : "Confirm Sale & Transfer to Accounts"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
