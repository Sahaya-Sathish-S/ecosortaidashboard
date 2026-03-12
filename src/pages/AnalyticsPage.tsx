import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { StatCard } from "@/components/StatCard";
import { Leaf, Recycle, TrendingUp, TreePine } from "lucide-react";

export default function AnalyticsPage() {
  const [bins, setBins] = useState<any[]>([]);
  const [detections, setDetections] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [binsRes, detectionsRes] = await Promise.all([
        supabase.from("waste_bins").select("*"),
        supabase.from("detection_history").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      if (binsRes.data) setBins(binsRes.data);
      if (detectionsRes.data) setDetections(detectionsRes.data);
    };
    fetchData();
  }, []);

  const totalBins = bins.length;
  const fullBins = bins.filter((b) => b.status === "Full").length;
  const recyclingRate = totalBins > 0 ? Math.round(((totalBins - fullBins) / totalBins) * 100) : 0;

  // Detection type breakdown
  const typeBreakdown: Record<string, number> = {};
  detections.forEach((d) => {
    typeBreakdown[d.waste_type] = (typeBreakdown[d.waste_type] || 0) + 1;
  });
  const typeData = Object.entries(typeBreakdown).map(([name, count]) => ({ name, count }));

  // Detections per day (last 7 days)
  const dailyMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    dailyMap[key] = 0;
  }
  detections.forEach((d) => {
    const date = new Date(d.created_at);
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 7) {
      const key = date.toLocaleDateString("en-US", { weekday: "short" });
      if (key in dailyMap) dailyMap[key]++;
    }
  });
  const dailyData = Object.entries(dailyMap).map(([day, scans]) => ({ day, scans }));

  // Waste type bar data from bins
  const binTypeMap: Record<string, number> = {};
  bins.forEach((b) => {
    binTypeMap[b.waste_type] = (binTypeMap[b.waste_type] || 0) + 1;
  });
  const binTypeData = Object.entries(binTypeMap).map(([name, count]) => ({ name, count }));

  const wasteColors: Record<string, string> = {
    Plastic: "hsl(200, 80%, 50%)", Paper: "hsl(38, 92%, 50%)",
    Metal: "hsl(260, 60%, 55%)", Organic: "hsl(152, 60%, 36%)",
    Mixed: "hsl(220, 50%, 55%)", Glass: "hsl(180, 50%, 45%)",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Waste Analytics</h1>
        <p className="text-sm text-muted-foreground">Insights from real data</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bins" value={String(totalBins)} icon={<TrendingUp className="h-5 w-5" />} subtitle="Active smart bins" />
        <StatCard title="Recycling Efficiency" value={`${recyclingRate}%`} icon={<Recycle className="h-5 w-5" />} subtitle="Based on bin status" />
        <StatCard title="AI Scans" value={String(detections.length)} icon={<Leaf className="h-5 w-5" />} subtitle="Total detections" />
        <StatCard title="Waste Types" value={String(Object.keys(typeBreakdown).length)} icon={<TreePine className="h-5 w-5" />} subtitle="Unique types detected" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 shadow-card border">
          <h3 className="font-display font-semibold mb-4">Daily AI Scans (Last 7 Days)</h3>
          <div className="h-64">
            {dailyData.some((d) => d.scans > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="scans" stroke="hsl(152, 60%, 36%)" strokeWidth={2} dot={{ fill: "hsl(152, 60%, 36%)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-20">No scan data in the last 7 days.</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border">
          <h3 className="font-display font-semibold mb-4">Detection Breakdown by Type</h3>
          <div className="h-64">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(200, 80%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-20">No detection data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-card border">
        <h3 className="font-display font-semibold mb-4">Bin Waste Type Distribution</h3>
        {binTypeData.length > 0 ? (
          <div className="space-y-3">
            {binTypeData.map((w) => (
              <div key={w.name} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium">{w.name}</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((w.count / totalBins) * 100)}%`,
                      backgroundColor: wasteColors[w.name] || "hsl(0,0%,60%)",
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-10 text-right">{w.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No bins configured yet.</p>
        )}
      </div>
    </div>
  );
}
