// Frontend types — mapped from backend Candid types

import type { Principal } from "@icp-sdk/core/principal";
import type { ExternalBlob } from "../backend";
import { DonationStatus, UserRole, UserStatus } from "../backend";

// Re-export backend enums for use in components
export { DonationStatus, UserRole, UserStatus };

// ─── Frontend-friendly types (BigInts converted to number, Principal to string) ─

export interface User {
  id: string; // Principal.toText()
  name: string;
  phone: string;
  orgName?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number; // BigInt timestamp → milliseconds
}

export interface Donation {
  id: string; // DonationId (bigint) → string
  donorId: string; // Principal → string
  donorName?: string; // resolved from users lookup
  foodType: string;
  quantity: number; // bigint → number
  unit: string;
  pickupAddress: string;
  pickupWindowStart: number; // bigint nanoseconds → milliseconds
  pickupWindowEnd: number;
  contactPhone: string;
  imageBlob?: ExternalBlob; // real object-storage blob
  status: DonationStatus;
  acceptedBy?: string; // Principal → string
  assignedTo?: string; // Principal → string
  notes?: string;
  createdAt: number;
}

export interface Analytics {
  totalDonations: number;
  completed: number;
  pending: number;
  accepted: number;
  assigned: number;
  rejected: number;
  cancelled: number;
  expired: number;
  activeNGOs: number;
  totalQuantity: number;
}

export interface RegisterFormData {
  name: string;
  phone: string;
  orgName?: string;
  role: UserRole;
}

export interface DonationFormData {
  foodType: string;
  quantity: number;
  unit: string;
  pickupAddress: string;
  pickupWindowStart: string; // datetime-local string
  pickupWindowEnd: string;
  contactPhone: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert backend bigint nanoseconds to JS milliseconds */
export function nsToMs(ns: bigint): number {
  return Number(ns / 1_000_000n);
}

/** Convert JS milliseconds to backend bigint nanoseconds */
export function msToNs(ms: number): bigint {
  return BigInt(Math.floor(ms)) * 1_000_000n;
}

/** Convert backend Principal to string id */
export function principalToId(p: Principal): string {
  return p.toText();
}
