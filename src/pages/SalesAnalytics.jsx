import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { leadAPI } from "../api/lead";
import {
  TrendingUp, DollarSign, CheckCircle, AlertCircle,
  RefreshCw, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { toast } from "sonner";

export default function SalesAnalytics() {
  const { themeColors: c } = useTheme();
  const isDark = c.mode === "dark";

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSalesStats();
  }, []);

  const fetchSalesStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await leadAPI.getAllLeads();
      const leads = res?.data?.leads || [];

      // Calculate sales metrics
      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => l.status === "converted").length;
      const closedLeads = leads.filter(l => l.status === "closed").length;
      const totalSaleAmount = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
      const averageDealValue = convertedLeads > 0 ? totalSaleAmount / convertedLeads : 0;

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      setStats({
        totalLeads,
        convertedLeads,
        closedLeads,
        totalSaleAmount,
        averageDealValue,
        conversionRate,
        byStatus: leads.reduce((acc, l) => {
          acc[l.status] = (acc[l.status] || 0) + 1;
          return acc;
        }, {}),
      });
    } catch {
      setError("Failed to load sales analytics.");
      toast.error("Failed to load sales analytics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading analytics…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle size={40} color="#dc2626" />
      <p style={{ color: c.text }}>{error}</p>
      <button onClick={fetchSalesStats} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: c.primary }}>
        <RefreshCw size={14} className="inline mr-2" /> Retry
      </button>
    </div>
  );

  if (!stats) return null;

  const metricCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: BarChart3,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      title: "Converted",
      value: stats.convertedLeads,
      icon: CheckCircle,
      color: "#10b981",
      bg: "#ecfdf5",
    },
    {
      title: "Closed Won",
      value: stats.closedLeads,
      icon: TrendingUp,
      color: "#8b5cf6",
      bg: "#f5f3ff",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: AlertCircle,
      color: "#f59e0b",
      bg: "#fffbeb",
    },
  ];

  const revenueCards = [
    {
      title: "Total Sale Amount",
      value: `₹${stats.totalSaleAmount?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "#059669",
    },
    {
      title: "Avg Deal Value",
      value: `₹${stats.averageDealValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}`,
      icon: TrendingUp,
      color: "#dc2626",
    },
  ];

  const chartBg = "transparent";
  const titleStyle = { color: c.text, fontWeight: "700", fontSize: "15px" };
  const tooltipCfg = {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderRadius: 10,
    style: { color: c.text, fontSize: "13px" },
  };

  const statusOptions = {
    chart: { type: "pie", backgroundColor: chartBg, style: { fontFamily: "inherit" }, height: 300 },
    title: { text: "Sales by Status", style: titleStyle },
    tooltip: { ...tooltipCfg, pointFormat: "<b>{point.y}</b> leads" },
    plotOptions: {
      pie: {
        dataLabels: { enabled: false },
        showInLegend: true,
        borderWidth: 2,
        borderColor: c.surface,
      },
    },
    legend: {
      itemStyle: { color: c.textSecondary, fontWeight: "600", fontSize: "12px" },
    },
    series: [{
      name: "Leads",
      colorByPoint: true,
      data: Object.entries(stats.byStatus).map(([status, count]) => ({
        name: status.replace(/_/g, " "),
        y: count,
      })),
    }],
    credits: { enabled: false },
  };

  return (
    <div className="w-full pb-20 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <BarChart3 size={26} style={{ color: c.primary }} /> Sales Analytics
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            Overview of your sales performance
          </p>
        </div>
        <button onClick={fetchSalesStats}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metricCards.map(({ title, value, icon: Icon, color, bg }) => (
          <div key={title}
            className="rounded-2xl border p-4 hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: isDark ? c.surface : bg, borderColor: c.border }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase" style={{ color: isDark ? c.textSecondary : color }}>
                {title}
              </p>
              <Icon size={14} style={{ color, opacity: 0.7 }} />
            </div>
            <p className="text-2xl font-black" style={{ color: isDark ? c.text : color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {revenueCards.map(({ title, value, icon: Icon, color }) => (
          <div key={title}
            className="rounded-2xl border p-5 flex items-center gap-4"
            style={{ backgroundColor: c.surface, borderColor: c.border }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}20`, color }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: c.textSecondary }}>
                {title}
              </p>
              <p className="text-lg font-black mt-1" style={{ color: c.text }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-4"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <HighchartsReact highcharts={Highcharts} options={statusOptions} />
      </div>
    </div>
  );
}
