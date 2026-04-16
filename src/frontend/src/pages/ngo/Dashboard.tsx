import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  Bell,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import { Layout } from "../../components/Layout";
import { statusBadge } from "../../components/RoleBadge";
import { useAuth } from "../../hooks/useAuth";
import { useNGODonations } from "../../hooks/useDonations";
import type { Donation, User } from "../../types";
import { DonationStatus, UserRole, nsToMs, principalToId } from "../../types";

// ─── Assign Agent Dialog ──────────────────────────────────────────────────────

interface AssignAgentDialogProps {
  donation: Donation | null;
  open: boolean;
  onClose: () => void;
  onAssign: (donationId: string, agentId: string) => Promise<void>;
}

function AssignAgentDialog({
  donation,
  open,
  onClose,
  onAssign,
}: AssignAgentDialogProps) {
  const { actor, isFetching } = useActor(createActor);
  const [agents, setAgents] = useState<User[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!open || !actor || isFetching) return;
    void (async () => {
      try {
        const users = await actor.getAllUsers();
        const deliveryAgents = users
          .filter((u) => u.role === UserRole.deliveryAgent)
          .map((u) => ({
            id: principalToId(u.id),
            name: u.name,
            phone: u.phone,
            orgName: u.orgName,
            role: u.role,
            status: u.status,
            createdAt: nsToMs(u.createdAt),
          }));
        setAgents(deliveryAgents);
      } catch {
        toast.error("Failed to load delivery agents.");
      }
    })();
  }, [open, actor, isFetching]);

  const handleAssign = async () => {
    if (!donation || !selectedAgent) return;
    setIsAssigning(true);
    try {
      await onAssign(donation.id, selectedAgent);
      toast.success("Delivery agent assigned!");
      onClose();
    } catch {
      toast.error("Failed to assign agent. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="ngo.assign_agent.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            Assign Delivery Agent
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {donation && (
            <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              <span className="font-medium text-foreground">
                {donation.foodType}
              </span>
              {" · "}
              {donation.quantity} {donation.unit}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="agent-select" className="text-sm font-medium">
              Select Agent
            </Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger
                id="agent-select"
                data-ocid="ngo.assign_agent.select"
              >
                <SelectValue placeholder="Choose a delivery agent…" />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No agents available
                  </SelectItem>
                ) : (
                  agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {a.phone}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="ngo.assign_agent.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="btn-primary flex-1 gap-2"
              onClick={handleAssign}
              disabled={!selectedAgent || isAssigning}
              data-ocid="ngo.assign_agent.confirm_button"
            >
              {isAssigning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              Assign Agent
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Donation Request Card ────────────────────────────────────────────────────

interface DonationRequestCardProps {
  d: Donation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAssign: (d: Donation) => void;
  showAssign?: boolean;
}

function DonationRequestCard({
  d,
  onAccept,
  onReject,
  onAssign,
  showAssign,
}: DonationRequestCardProps) {
  const { className, label } = statusBadge(d.status);
  const isPending = d.status === DonationStatus.pending;
  const isAccepted = d.status === DonationStatus.accepted;

  return (
    <div className="card-elevated role-ngo p-4 space-y-3">
      {d.imageBlob && (
        <img
          src={d.imageBlob.getDirectURL()}
          alt={d.foodType}
          className="w-full h-28 object-cover rounded-lg"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Bell className="w-3.5 h-3.5" />
          <span>
            {isPending ? "New Request · " : ""}
            {d.donorName ?? "Donor"}
          </span>
        </div>
        <Badge variant="outline" className={`${className} shrink-0 text-xs`}>
          {label}
        </Badge>
      </div>

      <div>
        <p className="font-semibold">{d.foodType}</p>
        <div className="mt-1.5 space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{d.pickupAddress}</span>
          </div>
          <p>
            <span className="font-medium text-foreground">
              {d.quantity} {d.unit}
            </span>{" "}
            · Pickup{" "}
            {new Date(d.pickupWindowStart).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" – "}
            {new Date(d.pickupWindowEnd).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {d.contactPhone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <a
                href={`tel:${d.contactPhone}`}
                className="hover:text-foreground transition-colors"
              >
                {d.contactPhone}
              </a>
            </div>
          )}
        </div>
        {d.notes && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            "{d.notes}"
          </p>
        )}
      </div>

      {isPending && (
        <div className="flex gap-2 pt-1">
          <Button
            className="btn-primary flex-1 gap-2"
            onClick={() => onAccept(d.id)}
            data-ocid="ngo.accept_button"
          >
            <CheckCircle2 className="w-4 h-4" />
            Accept
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-destructive/40 text-destructive hover:bg-destructive/5"
            onClick={() => onReject(d.id)}
            data-ocid="ngo.reject_button"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
        </div>
      )}

      {showAssign && isAccepted && (
        <Button
          className="w-full gap-2 btn-primary"
          onClick={() => onAssign(d)}
          data-ocid="ngo.assign_button"
        >
          <UserPlus className="w-4 h-4" />
          Assign Delivery Agent
        </Button>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function NGODashboard() {
  const { profile } = useAuth();
  const {
    pendingDonations,
    inProgress,
    completed,
    isLoading,
    lastUpdated,
    acceptDonation,
    rejectDonation,
    assignAgent,
    refresh,
  } = useNGODonations(8000);

  const [assignTarget, setAssignTarget] = useState<Donation | null>(null);

  const handleAccept = async (id: string) => {
    try {
      await acceptDonation(id);
      toast.success("Donation accepted! Arranging pickup.");
    } catch {
      toast.error("Failed to accept donation.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectDonation(id);
      toast.info("Donation declined.");
    } catch {
      toast.error("Failed to reject donation.");
    }
  };

  const handleAssign = async (donationId: string, agentId: string) => {
    await assignAgent(donationId, agentId);
    await refresh();
  };

  return (
    <Layout>
      <div
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
        data-ocid="ngo.dashboard.page"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {profile?.orgName ?? "NGO Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pendingDonations.length} donation
              {pendingDonations.length !== 1 ? "s" : ""} available nearby
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => void refresh()}
              data-ocid="ngo.refresh_button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated{" "}
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Available",
              value: pendingDonations.length,
              color: "text-amber-600",
            },
            {
              label: "In Progress",
              value: inProgress.length,
              color: "text-secondary",
            },
            {
              label: "Completed",
              value: completed.length,
              color: "text-primary",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="card-elevated p-3 text-center">
              <p className={`font-bold text-2xl ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Available Donations */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3">
            Available Donations
          </h2>
          {isLoading ? (
            <div className="space-y-3" data-ocid="ngo.donations.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          ) : pendingDonations.length === 0 ? (
            <div
              className="card-elevated p-10 text-center"
              data-ocid="ngo.donations.empty_state"
            >
              <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-semibold mb-1">
                No donations available right now
              </p>
              <p className="text-sm text-muted-foreground">
                New donations from nearby donors will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="ngo.available.list">
              {pendingDonations.map((d, i) => (
                <div key={d.id} data-ocid={`ngo.donation.item.${i + 1}`}>
                  <DonationRequestCard
                    d={d}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onAssign={setAssignTarget}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* In Progress */}
        {inProgress.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-lg mb-3">
              In Progress
            </h2>
            <div className="space-y-3">
              {inProgress.map((d, i) => (
                <div key={d.id} data-ocid={`ngo.accepted.item.${i + 1}`}>
                  <DonationRequestCard
                    d={d}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onAssign={setAssignTarget}
                    showAssign={d.status === DonationStatus.accepted}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AssignAgentDialog
        donation={assignTarget}
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssign}
      />
    </Layout>
  );
}
