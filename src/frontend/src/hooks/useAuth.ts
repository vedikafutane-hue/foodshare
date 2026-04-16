import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { RegisterFormData, User } from "../types";
import { UserRole, UserStatus, nsToMs, principalToId } from "../types";

const STORAGE_KEY = "foodshare_user_profile";

function loadCachedProfile(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as User;
  } catch {
    // ignore
  }
  return null;
}

function cacheProfile(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearCache() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useAuth() {
  const { identity, loginStatus, login, clear, isAuthenticated } =
    useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<User | null>(loadCachedProfile);
  const [isRegistering, setIsRegistering] = useState(false);

  const isLoading =
    loginStatus === "initializing" || loginStatus === "logging-in";

  // Fetch profile from backend when actor is ready and user is authenticated
  useEffect(() => {
    if (!actor || actorFetching || !isAuthenticated) return;

    let cancelled = false;
    (async () => {
      try {
        const backendUser = await actor.getMyProfile();
        if (cancelled) return;
        if (backendUser) {
          const user: User = {
            id: principalToId(backendUser.id),
            name: backendUser.name,
            phone: backendUser.phone,
            orgName: backendUser.orgName,
            role: backendUser.role,
            status: backendUser.status,
            createdAt: nsToMs(backendUser.createdAt),
          };
          cacheProfile(user);
          setProfile(user);
        } else {
          // User not registered yet — clear stale cache
          clearCache();
          setProfile(null);
        }
      } catch (err) {
        console.error("getMyProfile failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actor, actorFetching, isAuthenticated]);

  const register = useCallback(
    async (data: RegisterFormData): Promise<User> => {
      if (!actor) throw new Error("Actor not ready");
      setIsRegistering(true);
      try {
        const backendUser = await actor.registerUser({
          name: data.name,
          phone: data.phone,
          orgName: data.orgName,
          role: data.role,
        });
        const user: User = {
          id: principalToId(backendUser.id),
          name: backendUser.name,
          phone: backendUser.phone,
          orgName: backendUser.orgName,
          role: backendUser.role,
          status: backendUser.status,
          createdAt: nsToMs(backendUser.createdAt),
        };
        cacheProfile(user);
        setProfile(user);
        // Invalidate all queries so data is fresh
        void queryClient.invalidateQueries();
        return user;
      } finally {
        setIsRegistering(false);
      }
    },
    [actor, queryClient],
  );

  const signOut = useCallback(() => {
    clearCache();
    setProfile(null);
    void queryClient.clear();
    clear();
  }, [clear, queryClient]);

  // Demo role switcher — sets local profile without backend (for testing all 4 dashboards)
  const switchRole = useCallback(
    (role: UserRole) => {
      const updated: User = profile
        ? { ...profile, role }
        : {
            id: `demo-${role}`,
            name:
              role === UserRole.admin
                ? "Admin User"
                : role === UserRole.ngo
                  ? "Priya Menon"
                  : role === UserRole.deliveryAgent
                    ? "Vikram Patel"
                    : "Rajesh Sharma",
            phone: "+91 90000 00000",
            orgName:
              role === UserRole.ngo
                ? "Akshaya Trust"
                : role === UserRole.donor
                  ? "Grand Banquet Hall"
                  : undefined,
            role,
            status: UserStatus.active,
            createdAt: Date.now(),
          };
      cacheProfile(updated);
      setProfile(updated);
    },
    [profile],
  );

  // Expose actor for use in other hooks
  return {
    identity,
    isAuthenticated,
    isLoading,
    isRegistering,
    profile,
    actor,
    actorFetching,
    login,
    register,
    signOut,
    switchRole,
  };
}
