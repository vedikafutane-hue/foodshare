import { Badge } from "@/components/ui/badge";
import { UserRole } from "../types";

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  [UserRole.donor]: {
    label: "Donor",
    className:
      "bg-primary/10 text-primary border-primary/30 hover:bg-primary/10",
  },
  [UserRole.ngo]: {
    label: "NGO",
    className:
      "bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/10",
  },
  [UserRole.deliveryAgent]: {
    label: "Delivery Agent",
    className:
      "bg-accent/15 text-accent-foreground border-accent/40 hover:bg-accent/15",
  },
  [UserRole.admin]: {
    label: "Admin",
    className: "bg-muted text-muted-foreground border-border hover:bg-muted",
  },
};

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const config = roleConfig[role];
  return (
    <Badge
      variant="outline"
      className={`${config.className} ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"} font-semibold`}
    >
      {config.label}
    </Badge>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:
      "bg-amber-100/60 text-amber-800 border-amber-300/60 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50",
    accepted:
      "bg-blue-100/60 text-blue-800 border-blue-300/60 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50",
    assigned:
      "bg-violet-100/60 text-violet-800 border-violet-300/60 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/50",
    inTransit:
      "bg-orange-100/60 text-orange-800 border-orange-300/60 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50",
    completed:
      "bg-emerald-100/60 text-emerald-800 border-emerald-300/60 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50",
    rejected:
      "bg-red-100/60 text-red-800 border-red-300/60 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50",
    cancelled: "bg-muted text-muted-foreground border-border",
    expired: "bg-muted text-muted-foreground border-border",
  };
  const labelMap: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    assigned: "Assigned",
    inTransit: "In Transit",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
    expired: "Expired",
  };
  return {
    className: map[status] ?? map.pending,
    label: labelMap[status] ?? status,
  };
}
