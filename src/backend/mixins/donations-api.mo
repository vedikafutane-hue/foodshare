import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import DonationLib "../lib/donations";
import Types "../types/donations";
import UserTypes "../types/users";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserInternal>,
  donations : Map.Map<Common.DonationId, Types.DonationInternal>,
) {

  /// Donor: create a new food donation.
  public shared ({ caller }) func createDonation(req : Types.CreateDonationRequest) : async Types.Donation {
    if (caller.isAnonymous()) Runtime.trap("Anonymous users cannot create donations");
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("You must register before creating a donation") };
    };
    if (user.role != #donor) Runtime.trap("Only donors can create donations");
    if (user.status != #active) Runtime.trap("Your account is inactive");
    let nextId = donations.size();
    DonationLib.create(donations, nextId, caller, req);
  };

  /// Donor: cancel a pending donation they own.
  public shared ({ caller }) func cancelDonation(donationId : Common.DonationId) : async Types.Donation {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #donor) Runtime.trap("Only donors can cancel donations");
    DonationLib.cancelDonation(donations, donationId, caller);
  };

  /// NGO: accept a pending donation.
  public shared ({ caller }) func acceptDonation(donationId : Common.DonationId, notes : ?Text) : async Types.Donation {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #ngo) Runtime.trap("Only NGOs can accept donations");
    if (user.status != #active) Runtime.trap("Your account is inactive");
    DonationLib.acceptDonation(donations, donationId, caller, notes);
  };

  /// NGO: reject a pending donation.
  public shared ({ caller }) func rejectDonation(donationId : Common.DonationId, notes : ?Text) : async Types.Donation {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #ngo) Runtime.trap("Only NGOs can reject donations");
    DonationLib.rejectDonation(donations, donationId, caller, notes);
  };

  /// Admin: assign a delivery agent to an accepted donation.
  public shared ({ caller }) func assignDeliveryAgent(donationId : Common.DonationId, agentId : Common.UserId) : async Types.Donation {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #admin) Runtime.trap("Admin access required");
    // Verify agent exists and has the right role
    switch (users.get(agentId)) {
      case (?agent) {
        if (agent.role != #deliveryAgent) Runtime.trap("Target user is not a delivery agent");
      };
      case null { Runtime.trap("Delivery agent not found") };
    };
    DonationLib.assignAgent(donations, donationId, agentId);
  };

  /// Agent: mark their assigned pickup as completed.
  public shared ({ caller }) func markPickupCompleted(donationId : Common.DonationId, notes : ?Text) : async Types.Donation {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #deliveryAgent) Runtime.trap("Only delivery agents can mark pickups as completed");
    DonationLib.markCompleted(donations, donationId, caller, notes);
  };

  /// Returns all donations visible to the caller based on their role.
  public query ({ caller }) func getDonations() : async [Types.Donation] {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { return [] };
    };
    switch (user.role) {
      case (#donor) { DonationLib.getDonationsByDonor(donations, caller) };
      case (#ngo) { DonationLib.getAllDonations(donations) };
      case (#deliveryAgent) { DonationLib.getAssignedPickups(donations, caller) };
      case (#admin) { DonationLib.getAllDonations(donations) };
    };
  };

  /// Donor: list their own donations.
  public query ({ caller }) func getDonationsByDonor() : async [Types.Donation] {
    DonationLib.getDonationsByDonor(donations, caller);
  };

  /// NGO: list all pending (non-expired) donations for the NGO feed.
  public query ({ caller }) func getPendingDonations() : async [Types.Donation] {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #ngo and user.role != #admin) Runtime.trap("NGO or Admin access required");
    DonationLib.getPendingDonations(donations);
  };

  /// Agent: list pickups assigned to the caller.
  public query ({ caller }) func getAssignedPickups() : async [Types.Donation] {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role == #admin) {
      // Admin sees all assigned/inTransit donations
      return donations.values()
        .filter(func(d) { d.status == #assigned or d.status == #inTransit })
        .map<Types.DonationInternal, Types.Donation>(DonationLib.toPublic)
        .toArray();
    };
    if (user.role != #deliveryAgent) Runtime.trap("Delivery agent or Admin access required");
    DonationLib.getAssignedPickups(donations, caller);
  };

  /// Admin: aggregate analytics dashboard data.
  public query ({ caller }) func getAnalytics() : async Types.Analytics {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #admin) Runtime.trap("Admin access required");
    DonationLib.getAnalytics(donations, users);
  };
};
