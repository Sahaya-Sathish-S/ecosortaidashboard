import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ecosortLogo from "@/assets/ecosort-logo.png";

export default function CollectorLoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { error } = await signUp(email, password, fullName, { phone, role: "collector" });
      if (error) toast.error(error.message);
      else {
        toast.success("Collector account created successfully.");
        navigate("/collector");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
      else {
        toast.success("Collector access granted.");
        navigate("/collector");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 app-shell-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={ecosortLogo} alt="EcoSort AI" className="h-20 w-20 mx-auto mb-4 drop-shadow-lg" />
          <h1 className="text-3xl font-display font-bold text-foreground">Waste Collector Access</h1>
          <p className="text-sm mt-1 text-muted-foreground">Collection crew login, alerts, and bin operations</p>
        </div>

        <div className="rounded-3xl p-8 border bg-card/80 backdrop-blur-xl shadow-elevated interactive-surface">
          <div className="flex gap-1 bg-muted/60 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LogIn className="h-3.5 w-3.5 inline mr-1.5" />Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${mode === "signup" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <UserPlus className="h-3.5 w-3.5 inline mr-1.5" />Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Collector name" className="mt-1.5" required />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" className="mt-1.5" required />
                </div>
              </>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="collector@ecosort.ai" className="mt-1.5" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" required minLength={6} />
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-glow gradient-eco border-0 text-primary-foreground h-12">
              <Truck className="h-4 w-4 mr-2" />
              {loading ? "Please wait..." : mode === "signup" ? "Create Collector Account" : "Open Collector Center"}
            </Button>
          </form>

          <div className="text-center mt-5">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to main login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}