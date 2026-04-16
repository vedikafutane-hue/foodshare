import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Heart,
  Leaf,
  Loader2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types";

const roleRoutes: Record<UserRole, string> = {
  [UserRole.donor]: "/donor",
  [UserRole.ngo]: "/ngo",
  [UserRole.deliveryAgent]: "/agent",
  [UserRole.admin]: "/admin",
};

export default function SignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, profile, login, switchRole } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated && profile) {
      navigate({ to: roleRoutes[profile.role] });
    } else if (isAuthenticated && !profile) {
      navigate({ to: "/register" });
    }
  }, [isAuthenticated, profile, navigate]);

  const handleDemoLogin = (role: UserRole) => {
    switchRole(role);
    navigate({ to: roleRoutes[role] });
  };

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await login();
    } finally {
      setSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      data-ocid="signin.page"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg">
          <Leaf className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-center mb-3">
          FoodShare
        </h1>
        <p className="text-lg text-muted-foreground text-center max-w-md mb-10">
          Connecting food donors with NGOs to reduce waste and feed those in
          need.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mb-10">
          {[
            {
              role: UserRole.donor,
              icon: Heart,
              label: "Donor",
              desc: "Hotels & Events",
              cls: "role-donor",
            },
            {
              role: UserRole.ngo,
              icon: ShieldCheck,
              label: "NGO",
              desc: "Charitable Trusts",
              cls: "role-ngo",
            },
            {
              role: UserRole.deliveryAgent,
              icon: Truck,
              label: "Agent",
              desc: "Pickup & Delivery",
              cls: "role-agent",
            },
            {
              role: UserRole.admin,
              icon: ShieldCheck,
              label: "Admin",
              desc: "Platform Admin",
              cls: "",
            },
          ].map(({ role, icon: Icon, label, desc, cls }) => (
            <div
              key={role}
              className={`card-elevated ${cls} p-4 flex flex-col items-center gap-2 text-center`}
            >
              <Icon className="w-6 h-6 text-muted-foreground" />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <Button
          className="btn-primary gap-2 w-full max-w-xs"
          onClick={() => void handleLogin()}
          disabled={signingIn}
          data-ocid="signin.login_button"
        >
          {signingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          Sign In with Internet Identity
        </Button>

        <div className="mt-8 w-full max-w-sm">
          <p className="text-center text-sm text-muted-foreground mb-3">
            — or try a demo dashboard —
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                UserRole.donor,
                UserRole.ngo,
                UserRole.deliveryAgent,
                UserRole.admin,
              ] as UserRole[]
            ).map((role) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin(role)}
                data-ocid={`signin.demo_${role}`}
                className="text-xs"
              >
                {role === UserRole.deliveryAgent
                  ? "Agent Demo"
                  : `${role.charAt(0).toUpperCase() + role.slice(1)} Demo`}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-card">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:text-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
