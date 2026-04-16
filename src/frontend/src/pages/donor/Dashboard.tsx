import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Phone,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { statusBadge } from "../../components/RoleBadge";
import { useAuth } from "../../hooks/useAuth";
import { useDonorDonations } from "../../hooks/useDonations";
import type { Donation } from "../../types";
import { DonationStatus } from "../../types";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface DonationCardProps {
  d: Donation;
  onCancel: (id: string) => void;
}

function DonationCard({ d, onCancel }: DonationCardProps) {
  const { className, label } = statusBadge(d.status);
  const isPending = d.status === DonationStatus.pending;

  return (
    <div
      className="card-elevated role-donor p-4 flex flex-col gap-3"
      data-ocid="donor.donation.card"
    >
      {/* Image if available */}
      {d.imageBlob && (
        <img
          src={d.imageBlob.getDirectURL()}
          alt={d.foodType}
          className="w-full h-36 object-cover rounded-lg"
        />
      )}

      {/* Top row: food type + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-base truncate">{d.foodType}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {d.quantity} {d.unit}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`${className} shrink-0 text-xs font-semibold px-2.5 py-1`}
        >
          {label}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
          <span className="break-words">{d.pickupAddress}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 shrink-0 text-primary/60" />
          <span>
            {formatDate(d.pickupWindowStart)} ·{" "}
            {formatTime(d.pickupWindowStart)} – {formatTime(d.pickupWindowEnd)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-4 h-4 shrink-0 text-primary/60" />
          <span>{d.contactPhone}</span>
        </div>
      </div>

      {/* Notes */}
      {d.notes && (
        <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
          {d.notes}
        </p>
      )}

      {/* Cancel button — only for pending */}
      {isPending && (
        <div className="pt-1 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/60"
                data-ocid="donor.cancel_donation_button"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancel Donation
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="donor.cancel_confirm.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this donation?</AlertDialogTitle>
                <AlertDialogDescription>
                  NGOs won't be able to accept this donation after it's
                  cancelled. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="donor.cancel_confirm.cancel_button">
                  Keep it
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onCancel(d.id)}
                  data-ocid="donor.cancel_confirm.confirm_button"
                >
                  Yes, cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

export default function DonorDashboard() {
  const { profile } = useAuth();
  const { donations, isLoading, cancelDonation } = useDonorDonations();

  const sorted = [...donations].sort((a, b) => b.createdAt - a.createdAt);

  const counts = {
    pending: donations.filter((d) => d.status === DonationStatus.pending)
      .length,
    active: donations.filter((d) =>
      [
        DonationStatus.accepted,
        DonationStatus.assigned,
        DonationStatus.inTransit,
      ].includes(d.status),
    ).length,
    completed: donations.filter((d) => d.status === DonationStatus.completed)
      .length,
    cancelled: donations.filter((d) =>
      [
        DonationStatus.cancelled,
        DonationStatus.rejected,
        DonationStatus.expired,
      ].includes(d.status),
    ).length,
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelDonation(id);
      toast.success("Donation cancelled.");
    } catch {
      toast.error("Failed to cancel donation. Please try again.");
    }
  };

  return (
    <Layout>
      <div
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
        data-ocid="donor.dashboard.page"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">
              Welcome back, {profile?.name?.split(" ")[0] ?? "Donor"} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {profile?.orgName ?? "Donor Dashboard"} — your food donations
            </p>
          </div>
          <Link to="/donor/new-donation">
            <Button
              size="lg"
              className="btn-primary gap-2 w-full sm:w-auto"
              data-ocid="donor.new_donation_button"
            >
              <Plus className="w-5 h-5" />
              Post New Donation
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: Clock,
              label: "Pending",
              value: counts.pending,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              icon: Package,
              label: "Active",
              value: counts.active,
              color: "text-secondary",
              bg: "bg-secondary/8",
            },
            {
              icon: CheckCircle2,
              label: "Completed",
              value: counts.completed,
              color: "text-primary",
              bg: "bg-primary/8",
            },
            {
              icon: XCircle,
              label: "Cancelled",
              value: counts.cancelled,
              color: "text-muted-foreground",
              bg: "bg-muted",
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className="card-elevated p-4 text-center"
              data-ocid={`donor.stat.${label.toLowerCase()}`}
            >
              <div
                className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center mx-auto mb-2`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="font-bold text-2xl leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Donations list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">
              Your Donations
            </h2>
            {sorted.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {sorted.length} total
              </span>
            )}
          </div>

          {isLoading ? (
            <div
              className="space-y-3"
              data-ocid="donor.donations.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div
              className="card-elevated p-12 text-center"
              data-ocid="donor.donations.empty_state"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold text-base mb-1">No donations yet</p>
              <p className="text-sm text-muted-foreground mb-5">
                Share your surplus food — even small amounts help.
              </p>
              <Link to="/donor/new-donation">
                <Button
                  size="lg"
                  className="btn-primary gap-2"
                  data-ocid="donor.empty_cta_button"
                >
                  <Plus className="w-5 h-5" /> Post First Donation
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="donor.donations.list">
              {sorted.map((d, i) => (
                <div key={d.id} data-ocid={`donor.donation.item.${i + 1}`}>
                  <DonationCard d={d} onCancel={handleCancel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
