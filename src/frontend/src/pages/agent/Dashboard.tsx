import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Package,
  Phone,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { statusBadge } from "../../components/RoleBadge";
import { useAuth } from "../../hooks/useAuth";
import { useAgentPickups } from "../../hooks/useDonations";
import type { Donation } from "../../types";
import { DonationStatus } from "../../types";

// ─── Complete Dialog ──────────────────────────────────────────────────────────

interface CompleteDialogProps {
  donation: Donation | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string, notes: string) => Promise<void>;
}

function CompleteDialog({
  donation,
  open,
  onClose,
  onConfirm,
}: CompleteDialogProps) {
  const [notes, setNotes] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!donation) return;
    setIsConfirming(true);
    try {
      await onConfirm(donation.id, notes);
      setNotes("");
      onClose();
    } catch {
      toast.error("Failed to complete pickup. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-ocid="agent.complete_dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl">
            Confirm Pickup Complete
          </AlertDialogTitle>
          <AlertDialogDescription>
            {donation && (
              <span>
                You are marking <strong>{donation.foodType}</strong> from{" "}
                <strong>{donation.donorName ?? "Donor"}</strong> as delivered to
                the NGO.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-1">
          <label
            htmlFor="completion-notes"
            className="text-sm font-medium text-foreground"
          >
            Completion Notes{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <Textarea
            id="completion-notes"
            placeholder="e.g. Delivered 2 containers to NGO reception. All food in good condition."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            rows={3}
            data-ocid="agent.complete_notes.textarea"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleClose}
            data-ocid="agent.complete_dialog.cancel_button"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={() => void handleConfirm()}
            className="btn-primary gap-2"
            disabled={isConfirming}
            data-ocid="agent.complete_dialog.confirm_button"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Complete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  d: Donation;
  index: number;
  onOpenComplete: (d: Donation) => void;
}

function TaskCard({ d, index, onOpenComplete }: TaskCardProps) {
  const { className, label } = statusBadge(d.status);
  const isAssigned = d.status === DonationStatus.assigned;

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div
      className="card-elevated role-agent overflow-hidden"
      data-ocid={`agent.task.item.${index}`}
    >
      {/* Food image header */}
      {d.imageBlob ? (
        <div className="h-36 overflow-hidden">
          <img
            src={d.imageBlob.getDirectURL()}
            alt={d.foodType}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-1.5 bg-accent/60" aria-hidden="true" />
      )}

      <div className="p-4 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display font-bold text-lg leading-tight truncate">
              {d.foodType}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">
                {d.quantity} {d.unit}
              </span>
              {d.donorName && <span> · {d.donorName}</span>}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`${className} shrink-0 text-xs font-semibold`}
          >
            {label}
          </Badge>
        </div>

        {/* Details grid */}
        <div className="rounded-lg bg-muted/40 p-3 space-y-2.5">
          <div className="flex items-start gap-2.5 text-sm">
            <MapPin className="w-4 h-4 shrink-0 text-accent mt-0.5" />
            <span className="text-foreground leading-snug">
              {d.pickupAddress}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDate(d.pickupWindowStart)} ·{" "}
              <span className="text-foreground font-medium">
                {formatTime(d.pickupWindowStart)} –{" "}
                {formatTime(d.pickupWindowEnd)}
              </span>
            </span>
          </div>

          {d.contactPhone && (
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
              <a
                href={`tel:${d.contactPhone.replace(/\s/g, "")}`}
                className="text-accent font-semibold hover:underline transition-colors"
                data-ocid={`agent.task.contact_phone.${index}`}
              >
                {d.contactPhone}
              </a>
              <span className="text-muted-foreground text-xs">(Donor)</span>
            </div>
          )}

          {d.notes && (
            <div className="flex items-start gap-2.5 text-sm">
              <UtensilsCrossed className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground italic">{d.notes}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 text-sm sm:flex-none"
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.pickupAddress)}`,
                "_blank",
              )
            }
            data-ocid={`agent.navigate_button.${index}`}
          >
            <Navigation className="w-4 h-4" />
            Navigate
          </Button>

          {isAssigned && (
            <Button
              size="lg"
              className="btn-primary flex-1 gap-2 text-base font-bold shadow-md"
              onClick={() => onOpenComplete(d)}
              data-ocid={`agent.mark_complete_button.${index}`}
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark Pickup Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Completed History Row ────────────────────────────────────────────────────

function CompletedRow({ d, index }: { d: Donation; index: number }) {
  return (
    <div
      className="card-elevated p-3.5 flex items-center gap-3"
      data-ocid={`agent.completed.item.${index}`}
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{d.foodType}</p>
        <p className="text-xs text-muted-foreground truncate">
          {d.pickupAddress}
        </p>
        {d.donorName && (
          <p className="text-xs text-muted-foreground">{d.donorName}</p>
        )}
      </div>
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 text-xs shrink-0"
      >
        Done
      </Badge>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function AgentDashboard() {
  const { profile } = useAuth();
  const { activeTasks, completedTasks, isLoading, markPickupCompleted } =
    useAgentPickups(15000);

  const [completeTarget, setCompleteTarget] = useState<Donation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  void profile; // used by RoleGuard upstream

  const handleOpenComplete = (d: Donation) => {
    setCompleteTarget(d);
    setDialogOpen(true);
  };

  const handleConfirmComplete = async (id: string, notes: string) => {
    const result = await markPickupCompleted(id, notes || undefined);
    toast.success("Pickup complete! Great work.", {
      description: `${result.foodType} marked as delivered.`,
    });
  };

  return (
    <Layout>
      <div
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
        data-ocid="agent.dashboard.page"
      >
        {/* Page header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold">Delivery Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile?.name ?? "Delivery Agent"} · Agent Dashboard
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center">
            <Truck className="w-6 h-6 text-accent" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Active Tasks",
              value: activeTasks.length,
              color: "text-accent",
              bg: "bg-accent/10",
            },
            {
              label: "Completed",
              value: completedTasks.length,
              color: "text-primary",
              bg: "bg-primary/10",
            },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`card-elevated p-3 text-center ${bg}`}>
              <p className={`font-bold text-2xl ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Active tasks */}
        <section data-ocid="agent.tasks.section">
          <h2 className="font-display font-semibold text-lg mb-3">
            Active Tasks
          </h2>

          {isLoading ? (
            <div className="space-y-3" data-ocid="agent.tasks.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : activeTasks.length === 0 ? (
            <div
              className="card-elevated p-10 text-center"
              data-ocid="agent.tasks.empty_state"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-display font-semibold text-lg mb-1">
                No active tasks
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Pickup assignments from NGOs will appear here. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-ocid="agent.tasks.list">
              {activeTasks.map((d, i) => (
                <TaskCard
                  key={d.id}
                  d={d}
                  index={i + 1}
                  onOpenComplete={handleOpenComplete}
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed history */}
        {completedTasks.length > 0 && (
          <section data-ocid="agent.completed.section">
            <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
              Completed Pickups
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 text-xs font-semibold"
              >
                {completedTasks.length}
              </Badge>
            </h2>
            <div className="space-y-2">
              {completedTasks.map((d, i) => (
                <CompletedRow key={d.id} d={d} index={i + 1} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Completion dialog */}
      <CompleteDialog
        donation={completeTarget}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setCompleteTarget(null);
        }}
        onConfirm={handleConfirmComplete}
      />
    </Layout>
  );
}
