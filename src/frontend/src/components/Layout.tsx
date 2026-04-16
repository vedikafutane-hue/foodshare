import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@tanstack/react-router";
import { ChevronDown, Leaf, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types";
import { RoleBadge } from "./RoleBadge";

const roleRoutes: Record<UserRole, string> = {
  [UserRole.donor]: "/donor",
  [UserRole.ngo]: "/ngo",
  [UserRole.deliveryAgent]: "/agent",
  [UserRole.admin]: "/admin",
};

const demoRoles: { role: UserRole; label: string }[] = [
  { role: UserRole.donor, label: "View as Donor" },
  { role: UserRole.ngo, label: "View as NGO" },
  { role: UserRole.deliveryAgent, label: "View as Agent" },
  { role: UserRole.admin, label: "View as Admin" },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut, switchRole } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    void router.navigate({ to: "/" });
  };

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    void router.navigate({ to: roleRoutes[role] });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-xs sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to={profile ? roleRoutes[profile.role] : "/"}
            className="flex items-center gap-2 font-display font-bold text-xl text-foreground hover:opacity-80 transition-smooth"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>FoodShare</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            {profile && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {profile.name}
                  </span>
                  <RoleBadge role={profile.role} size="sm" />
                </div>

                {/* Demo role switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      data-ocid="nav.role_switcher"
                    >
                      Switch Role <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {demoRoles.map(({ role, label }) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => handleSwitchRole(role)}
                        data-ocid={`nav.switch_${role}`}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  data-ocid="nav.signout_button"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          {profile && (
            <button
              type="button"
              className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              data-ocid="nav.mobile_menu_toggle"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && profile && (
          <div className="sm:hidden border-t border-border bg-card px-4 py-3 space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">{profile.name}</span>
              <RoleBadge role={profile.role} size="sm" />
            </div>
            <div className="border-t border-border pt-2 space-y-1">
              <p className="text-xs text-muted-foreground px-1 pb-1">
                Switch Role (Demo)
              </p>
              {demoRoles.map(({ role, label }) => (
                <button
                  type="button"
                  key={role}
                  className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-smooth"
                  onClick={() => handleSwitchRole(role)}
                  data-ocid={`nav.mobile_switch_${role}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="border-t border-border pt-2">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                onClick={handleSignOut}
                data-ocid="nav.mobile_signout_button"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 bg-background">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-primary" />
            <span>FoodShare — Reducing waste, feeding hope</span>
          </div>
          <span>
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built with love using caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
