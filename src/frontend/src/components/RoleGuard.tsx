import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types";

const roleRoutes: Record<UserRole, string> = {
  [UserRole.donor]: "/donor",
  [UserRole.ngo]: "/ngo",
  [UserRole.deliveryAgent]: "/agent",
  [UserRole.admin]: "/admin",
};

interface RoleGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) {
      navigate({ to: "/" });
    } else if (profile.role !== allowedRole) {
      navigate({ to: roleRoutes[profile.role] });
    }
  }, [profile, allowedRole, navigate]);

  if (!profile || profile.role !== allowedRole) return null;

  return <>{children}</>;
}
