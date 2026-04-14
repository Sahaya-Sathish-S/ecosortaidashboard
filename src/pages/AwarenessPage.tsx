import { Leaf, BookOpen, Recycle, Globe } from "lucide-react";
import { motion } from "framer-motion";

const guides = [
  { icon: "🟢", title: "Organic Waste", items: ["Food scraps", "Yard waste", "Coffee grounds", "Eggshells"], color: "bg-success/10 border-success/20" },
  { icon: "🔵", title: "Recyclables", items: ["Plastic bottles", "Paper/cardboard", "Glass jars", "Metal cans"], color: "bg-info/10 border-info/20" },
  { icon: "🔴", title: "Non-Recyclable", items: ["Styrofoam", "Chip bags", "Diapers", "Ceramics"], color: "bg-destructive/10 border-destructive/20" },
  { icon: "🟡", title: "Hazardous", items: ["Batteries", "Paint", "Electronics", "Light bulbs"], color: "bg-warning/10 border-warning/20" },
];

const recyclingTips = [
  { title: "Rinse Before Recycling", description: "Clean containers to prevent contamination of recyclable materials.", icon: "💧" },
  { title: "Flatten Cardboard", description: "Break down boxes to save space and improve recycling efficiency.", icon: "📦" },
  { title: "Separate Materials", description: "Keep plastic, paper, metal, and organic waste in different bins.", icon: "♻️" },
  { title: "Avoid Plastic Bags", description: "Use reusable bags. Plastic bags jam recycling machinery.", icon: "🛍️" },
  { title: "Compost Organic Waste", description: "Turn food scraps into nutrient-rich soil for gardens.", icon: "🌱" },
  { title: "E-Waste Disposal", description: "Take electronics to certified e-waste collection points.", icon: "🔌" },
];

export default function AwarenessPage() {
  return (
    <div className="p-6 space-y-8 app-page-bg min-h-full">
      <div>
        <h1 className="text-2xl font-display font-bold">Eco Awareness</h1>
        <p className="text-sm text-muted-foreground">Learn about proper waste segregation and recycling</p>
      </div>

      <section>
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Waste Segregation Guide
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guides.map((g, i) => (
            <motion.div
              key={g.title}
              className={`rounded-xl p-5 border ${g.color} hover:shadow-elevated hover:scale-[1.03] transition-all cursor-default backdrop-blur`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="text-3xl">{g.icon}</span>
              <h3 className="font-display font-semibold mt-2">{g.title}</h3>
              <ul className="mt-3 space-y-1">
                {g.items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-current flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Recycle className="h-5 w-5 text-primary" /> Recycling Tips
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recyclingTips.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card/80 backdrop-blur rounded-xl p-5 shadow-card border hover:shadow-elevated hover:border-primary/20 hover:scale-[1.02] transition-all"
            >
              <span className="text-3xl">{tip.icon}</span>
              <h3 className="font-display font-semibold mt-2">{tip.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-6 border border-primary/10" style={{ background: "linear-gradient(135deg, hsl(152 30% 95%), hsl(168 25% 92%))" }}>
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> Environmental Impact
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 mt-4 text-center">
          <div>
            <p className="text-3xl font-display font-bold text-primary">8M tons</p>
            <p className="text-sm text-muted-foreground mt-1">Plastic enters oceans yearly</p>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-primary">91%</p>
            <p className="text-sm text-muted-foreground mt-1">Of plastic isn't recycled</p>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-primary">450 yrs</p>
            <p className="text-sm text-muted-foreground mt-1">For plastic bottle to decompose</p>
          </div>
        </div>
      </section>
    </div>
  );
}
