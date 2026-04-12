import { useEffect, useMemo, useState } from "react";
import { Bell, MapPin, Thermometer, Truck, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FillLevelBar } from "@/components/FillLevelBar";
import { StatusBadge } from "@/components/StatusBadge";

export default function CollectorPage() {
  const [bins, setBins] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [binsRes, notifRes] = await Promise.all([
        supabase.from("waste_bins").select("*").order("status", { ascending: false }).order("last_updated", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
      ]);

      if (binsRes.data) setBins(binsRes.data);
      if (notifRes.data) setNotifications(notifRes.data);
    };

    fetchData();
    const channel = supabase.channel("collector-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "waste_bins" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fullBins = useMemo(() => bins.filter((bin) => bin.status === "Full"), [bins]);

  return (
    <div className="p-6 space-y-6 collector-page-bg">
      <div>
        <h1 className="text-2xl font-display font-bold">Collector Center</h1>
        <p className="text-sm text-muted-foreground">Live collection queue, bin status, and route-ready alerts</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-5 shadow-card interactive-surface">
          <Truck className="h-5 w-5 text-primary mb-3" />
          <p className="text-3xl font-display font-bold">{bins.length || "—"}</p>
          <p className="text-sm text-muted-foreground">Total visible bins</p>
        </div>
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-5 shadow-card interactive-surface">
          <TriangleAlert className="h-5 w-5 text-warning mb-3" />
          <p className="text-3xl font-display font-bold">{fullBins.length || "—"}</p>
          <p className="text-sm text-muted-foreground">Bins ready for pickup</p>
        </div>
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-5 shadow-card interactive-surface">
          <Bell className="h-5 w-5 text-info mb-3" />
          <p className="text-3xl font-display font-bold">{notifications.length || "—"}</p>
          <p className="text-sm text-muted-foreground">Latest collector alerts</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.4fr,0.9fr] gap-6">
        <section className="rounded-3xl border bg-card/80 backdrop-blur-xl shadow-elevated overflow-hidden interactive-surface">
          <div className="px-5 py-4 border-b">
            <h2 className="font-display font-semibold">Bin Operations</h2>
          </div>
          <div className="divide-y">
            {bins.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground">No hardware data yet. Live operational details will appear here after bin hardware starts sending updates.</div>
            ) : (
              bins.map((bin) => (
                <div key={bin.id} className="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between hover:bg-muted/20 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold">{bin.bin_id}</span>
                      <StatusBadge status={bin.status as "Full" | "Medium" | "Empty"} />
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {bin.location}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5" /> {bin.temperature ?? "—"}°C • {bin.waste_type}</div>
                  </div>
                  <div className="w-full md:w-56">
                    <FillLevelBar level={bin.fill_level} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border bg-card/80 backdrop-blur-xl shadow-elevated overflow-hidden interactive-surface">
          <div className="px-5 py-4 border-b">
            <h2 className="font-display font-semibold">Collection Alerts</h2>
          </div>
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground">Collector notifications will appear here automatically when a bin becomes full.</div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}