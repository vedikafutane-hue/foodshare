import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface RegisterUserRequest {
    orgName?: string;
    name: string;
    role: UserRole;
    phone: string;
}
export type Timestamp = bigint;
export interface User {
    id: Principal;
    status: UserStatus;
    orgName?: string;
    name: string;
    createdAt: bigint;
    role: UserRole;
    phone: string;
}
export interface CreateDonationRequest {
    imageBlob?: ExternalBlob;
    unit: string;
    pickupAddress: string;
    quantity: bigint;
    pickupWindowEnd: Timestamp;
    pickupWindowStart: Timestamp;
    contactPhone: string;
    foodType: string;
}
export type UserId = Principal;
export interface Donation {
    id: DonationId;
    status: DonationStatus;
    imageBlob?: ExternalBlob;
    assignedTo?: UserId;
    donorId: UserId;
    createdAt: Timestamp;
    unit: string;
    pickupAddress: string;
    notes?: string;
    quantity: bigint;
    pickupWindowEnd: Timestamp;
    acceptedBy?: UserId;
    pickupWindowStart: Timestamp;
    contactPhone: string;
    foodType: string;
}
export interface Analytics {
    assigned: bigint;
    cancelled: bigint;
    expired: bigint;
    pending: bigint;
    completed: bigint;
    rejected: bigint;
    totalDonations: bigint;
    accepted: bigint;
    totalQuantity: bigint;
    activeNGOs: bigint;
}
export type DonationId = bigint;
export enum DonationStatus {
    assigned = "assigned",
    cancelled = "cancelled",
    expired = "expired",
    pending = "pending",
    completed = "completed",
    inTransit = "inTransit",
    rejected = "rejected",
    accepted = "accepted"
}
export enum UserRole {
    ngo = "ngo",
    admin = "admin",
    deliveryAgent = "deliveryAgent",
    donor = "donor"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum UserStatus {
    active = "active",
    inactive = "inactive"
}
export interface backendInterface {
    acceptDonation(donationId: DonationId, notes: string | null): Promise<Donation>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    assignDeliveryAgent(donationId: DonationId, agentId: UserId): Promise<Donation>;
    cancelDonation(donationId: DonationId): Promise<Donation>;
    createDonation(req: CreateDonationRequest): Promise<Donation>;
    deactivateUser(userId: UserId): Promise<void>;
    getAllUsers(): Promise<Array<User>>;
    getAnalytics(): Promise<Analytics>;
    getAssignedPickups(): Promise<Array<Donation>>;
    getCallerUserRole(): Promise<UserRole__1>;
    getDonations(): Promise<Array<Donation>>;
    getDonationsByDonor(): Promise<Array<Donation>>;
    getMyProfile(): Promise<User | null>;
    getPendingDonations(): Promise<Array<Donation>>;
    isCallerAdmin(): Promise<boolean>;
    markPickupCompleted(donationId: DonationId, notes: string | null): Promise<Donation>;
    reactivateUser(userId: UserId): Promise<void>;
    registerUser(req: RegisterUserRequest): Promise<User>;
    rejectDonation(donationId: DonationId, notes: string | null): Promise<Donation>;
}
