import { useEffect, useState } from "react";
import { Trash2, Recycle, TrendingUp, Thermometer } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { FillLevelBar } from "@/components/FillLevelBar";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function DashboardPage() {
  const [bins, setBins] = useState<any[]>([]);
  const [detections, setDetections] = useState<any[]>([]);

  useEffect(() => {
    const fetchBins = async () => {
      const { data } = await supabase.from("waste_bins").select("*").order("bin_id");
      if (data) setBins(data);
    };
    const fetchDetections = async () => {
      const { data } = await supabase.from("detection_history").select("*").order("created_at", { ascending: false }).limit(100);
      if (data) setDetections(data);
    };
    fetchBins();
    fetchDetections();

    const channel = supabase.channel("dash-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "waste_bins" }, () => fetchBins())
      .on("postgres_changes", { event: "*", schema: "public", table: "detection_history" }, () => fetchDetections())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalBins = bins.length;
  const avgTemp = bins.length ? Math.round(bins.reduce((a, b) => a + (b.temperature || 0), 0) / bins.length) : 0;
  const fullBins = bins.filter((b) => b.status === "Full").length;
  const recyclingRate = totalBins > 0 ? Math.round(((totalBins - fullBins) / totalBins) * 100) : 0;

  // Build waste distribution from real bin data
  const wasteTypeCounts: Record<string, number> = {};
  bins.forEach((b) => {
    wasteTypeCounts[b.waste_type] = (wasteTypeCounts[b.waste_type] || 0) + 1;
  });
  const wasteColors: Record<string, string> = {
    Plastic: "hsl(200, 80%, 50%)", Paper: "hsl(38, 92%, 50%)",
    Metal: "hsl(260, 60%, 55%)", Organic: "hsl(152, 60%, 36%)",
    Mixed: "hsl(220, 50%, 55%)", Glass: "hsl(180, 50%, 45%)",
  };
  const wasteDistribution = Object.entries(wasteTypeCounts).map(([name, value]) => ({
    name, value, color: wasteColors[name] || "hsl(0, 0%, 60%)",
  }));

  // Build detection trend from real data
  const detectionsByType: Record<string, number> = {};
  detections.forEach((d) => {
    const type = d.waste_type || "Unknown";
    detectionsByType[type] = (detectionsByType[type] || 0) + 1;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time waste management overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bins" value={String(totalBins)} icon={<Trash2 className="h-5 w-5" />} subtitle={`${fullBins} bins full`} />
        <StatCard title="Recycling Rate" value={`${recyclingRate}%`} icon={<Recycle className="h-5 w-5" />} subtitle="Based on bin status" />
        <StatCard title="AI Detections" value={String(detections.length)} icon={<TrendingUp className="h-5 w-5" />} subtitle="Total scans" />
        <StatCard title="Avg Temperature" value={totalBins ? `${avgTemp}°C` : "—"} icon={<Thermometer className="h-5 w-5" />} subtitle={totalBins ? "Normal range" : "No bins"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 shadow-card border">
          <h3 className="font-display font-semibold mb-4">Waste Type Distribution</h3>
          {wasteDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No bin data yet. Admin can add bins.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={wasteDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {wasteDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border">
          <h3 className="font-display font-semibold mb-4">AI Detection Breakdown</h3>
          {detections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No detections yet. Use the camera scanner!</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(detectionsByType).map(([name, count]) => ({ name, count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(152, 60%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-card border">
        <h3 className="font-display font-semibold mb-4">Smart Bin Fill Levels</h3>
        {bins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bins configured yet. Admin can add bins from the Admin Panel.</p>
        ) : (
          <div className="space-y-3">
            {bins.map((bin) => (
              <div key={bin.id} className="flex items-center gap-4">
                <span className="text-xs font-medium w-20 text-muted-foreground">{bin.bin_id}</span>
                <div className="flex-1">
                  <FillLevelBar level={bin.fill_level} />
                </div>
                <StatusBadge status={bin.status as "Full" | "Medium" | "Empty"} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
