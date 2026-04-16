import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, createActor } from "../backend";
import type { Analytics, Donation, DonationFormData } from "../types";
import { DonationStatus, msToNs, nsToMs, principalToId } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

import type { Donation as BackendDonation } from "../backend";

function mapDonation(d: BackendDonation): Donation {
  return {
    id: d.id.toString(),
    donorId: principalToId(d.donorId),
    foodType: d.foodType,
    quantity: Number(d.quantity),
    unit: d.unit,
    pickupAddress: d.pickupAddress,
    pickupWindowStart: nsToMs(d.pickupWindowStart),
    pickupWindowEnd: nsToMs(d.pickupWindowEnd),
    contactPhone: d.contactPhone,
    imageBlob: d.imageBlob,
    status: d.status,
    acceptedBy: d.acceptedBy ? principalToId(d.acceptedBy) : undefined,
    assignedTo: d.assignedTo ? principalToId(d.assignedTo) : undefined,
    notes: d.notes,
    createdAt: nsToMs(d.createdAt),
  };
}

// ─── Donor Donations Hook ─────────────────────────────────────────────────────

export function useDonorDonations() {
  const { actor, isFetching } = useActor(createActor);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDonations = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const results = await actor.getDonationsByDonor();
      setDonations(results.map(mapDonation));
    } catch (err) {
      console.error("getDonationsByDonor failed:", err);
      toast.error("Failed to load your donations.");
    } finally {
      setIsLoading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    void fetchDonations();
  }, [fetchDonations]);

  const createDonation = useCallback(
    async (
      data: DonationFormData,
      imageFile?: File | null,
    ): Promise<Donation> => {
      if (!actor) throw new Error("Actor not ready");

      let imageBlob: ExternalBlob | undefined;
      if (imageFile) {
        const bytes = new Uint8Array(await imageFile.arrayBuffer());
        imageBlob = ExternalBlob.fromBytes(bytes);
      }

      const req = {
        foodType: data.foodType,
        quantity: BigInt(Math.round(Number(data.quantity))),
        unit: data.unit,
        pickupAddress: data.pickupAddress,
        pickupWindowStart: msToNs(new Date(data.pickupWindowStart).getTime()),
        pickupWindowEnd: msToNs(new Date(data.pickupWindowEnd).getTime()),
        contactPhone: data.contactPhone,
        imageBlob,
        notes: data.notes ?? null,
      };

      const result = await actor.createDonation(req);
      const donation = mapDonation(result);
      setDonations((prev) => [donation, ...prev]);
      return donation;
    },
    [actor],
  );

  const cancelDonation = useCallback(
    async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.cancelDonation(BigInt(id));
      const updated = mapDonation(result);
      setDonations((prev) => prev.map((d) => (d.id === id ? updated : d)));
    },
    [actor],
  );

  return {
    donations,
    isLoading,
    createDonation,
    cancelDonation,
    refresh: fetchDonations,
  };
}

// ─── NGO Pending Donations Hook (with polling) ────────────────────────────────

export function useNGODonations(pollIntervalMs = 8000) {
  const { actor, isFetching } = useActor(createActor);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPending = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const [pending, all] = await Promise.all([
        actor.getPendingDonations(),
        actor.getDonations(),
      ]);
      setDonations(pending.map(mapDonation));
      setAllDonations(all.map(mapDonation));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("getPendingDonations failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    void fetchPending();
    intervalRef.current = setInterval(
      () => void fetchPending(),
      pollIntervalMs,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPending, pollIntervalMs]);

  const acceptDonation = useCallback(
    async (id: string, notes?: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.acceptDonation(BigInt(id), notes ?? null);
      const updated = mapDonation(result);
      setDonations((prev) => prev.filter((d) => d.id !== id));
      setAllDonations((prev) => prev.map((d) => (d.id === id ? updated : d)));
    },
    [actor],
  );

  const rejectDonation = useCallback(
    async (id: string, notes?: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.rejectDonation(BigInt(id), notes ?? null);
      const updated = mapDonation(result);
      setDonations((prev) => prev.filter((d) => d.id !== id));
      setAllDonations((prev) => prev.map((d) => (d.id === id ? updated : d)));
    },
    [actor],
  );

  const assignAgent = useCallback(
    async (donationId: string, agentPrincipalText: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      const agentPrincipal = Principal.fromText(agentPrincipalText);
      const result = await actor.assignDeliveryAgent(
        BigInt(donationId),
        agentPrincipal,
      );
      const updated = mapDonation(result);
      setAllDonations((prev) =>
        prev.map((d) => (d.id === donationId ? updated : d)),
      );
      return updated;
    },
    [actor],
  );

  const inProgress = allDonations.filter((d) =>
    [
      DonationStatus.accepted,
      DonationStatus.assigned,
      DonationStatus.inTransit,
    ].includes(d.status),
  );
  const completed = allDonations.filter(
    (d) => d.status === DonationStatus.completed,
  );

  return {
    pendingDonations: donations,
    inProgress,
    completed,
    isLoading,
    lastUpdated,
    acceptDonation,
    rejectDonation,
    assignAgent,
    refresh: fetchPending,
  };
}

// ─── Agent Pickups Hook (with polling) ───────────────────────────────────────

export function useAgentPickups(pollIntervalMs = 15000) {
  const { actor, isFetching } = useActor(createActor);
  const [pickups, setPickups] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPickups = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const results = await actor.getAssignedPickups();
      setPickups(results.map(mapDonation));
    } catch (err) {
      console.error("getAssignedPickups failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    void fetchPickups();
    intervalRef.current = setInterval(
      () => void fetchPickups(),
      pollIntervalMs,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPickups, pollIntervalMs]);

  const markPickupCompleted = useCallback(
    async (id: string, notes?: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.markPickupCompleted(BigInt(id), notes ?? null);
      const updated = mapDonation(result);
      setPickups((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    },
    [actor],
  );

  const activeTasks = pickups.filter((d) =>
    [DonationStatus.assigned, DonationStatus.inTransit].includes(d.status),
  );
  const completedTasks = pickups.filter(
    (d) => d.status === DonationStatus.completed,
  );

  return {
    activeTasks,
    completedTasks,
    isLoading,
    markPickupCompleted,
    refresh: fetchPickups,
  };
}

// ─── Admin Hooks ──────────────────────────────────────────────────────────────

export function useAdminData(pollIntervalMs = 30000) {
  const { actor, isFetching } = useActor(createActor);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const [analyticsResult, donationsResult] = await Promise.all([
        actor.getAnalytics(),
        actor.getDonations(),
      ]);
      setAnalytics({
        totalDonations: Number(analyticsResult.totalDonations),
        completed: Number(analyticsResult.completed),
        pending: Number(analyticsResult.pending),
        accepted: Number(analyticsResult.accepted),
        assigned: Number(analyticsResult.assigned),
        rejected: Number(analyticsResult.rejected),
        cancelled: Number(analyticsResult.cancelled),
        expired: Number(analyticsResult.expired),
        activeNGOs: Number(analyticsResult.activeNGOs),
        totalQuantity: Number(analyticsResult.totalQuantity),
      });
      setAllDonations(donationsResult.map(mapDonation));
    } catch (err) {
      console.error("Admin data fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    void fetchData();
    intervalRef.current = setInterval(() => void fetchData(), pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, pollIntervalMs]);

  return { analytics, allDonations, isLoading, refresh: fetchData };
}

export function useAdminUsers() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<import("../types").User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const results = await actor.getAllUsers();
      setUsers(
        results.map((u) => ({
          id: principalToId(u.id),
          name: u.name,
          phone: u.phone,
          orgName: u.orgName,
          role: u.role,
          status: u.status,
          createdAt: nsToMs(u.createdAt),
        })),
      );
    } catch (err) {
      console.error("getAllUsers failed:", err);
      toast.error("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const deactivateUser = useCallback(
    async (userId: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.deactivateUser(Principal.fromText(userId));
      await fetchUsers();
      void queryClient.invalidateQueries();
    },
    [actor, fetchUsers, queryClient],
  );

  const reactivateUser = useCallback(
    async (userId: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.reactivateUser(Principal.fromText(userId));
      await fetchUsers();
      void queryClient.invalidateQueries();
    },
    [actor, fetchUsers, queryClient],
  );

  return {
    users,
    isLoading,
    deactivateUser,
    reactivateUser,
    refresh: fetchUsers,
  };
}
