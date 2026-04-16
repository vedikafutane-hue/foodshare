import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/donations";
import UserTypes "../types/users";
import Common "../types/common";

module {
  // Returns effective status — treats pending-but-expired as #expired without mutating.
  // Used by query functions to remain read-only.
  func effectiveStatus(d : Types.DonationInternal) : Types.DonationStatus {
    if (d.status == #pending and Time.now() > d.pickupWindowEnd) {
      #expired;
    } else {
      d.status;
    };
  };

  public func toPublic(d : Types.DonationInternal) : Types.Donation {
    {
      id = d.id;
      donorId = d.donorId;
      foodType = d.foodType;
      quantity = d.quantity;
      unit = d.unit;
      pickupAddress = d.pickupAddress;
      pickupWindowStart = d.pickupWindowStart;
      pickupWindowEnd = d.pickupWindowEnd;
      contactPhone = d.contactPhone;
      imageBlob = d.imageBlob;
      status = effectiveStatus(d);
      acceptedBy = d.acceptedBy;
      assignedTo = d.assignedTo;
      notes = d.notes;
      createdAt = d.createdAt;
    };
  };

  public func isExpired(d : Types.DonationInternal) : Bool {
    Time.now() > d.pickupWindowEnd;
  };

  public func create(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    nextId : Nat,
    donorId : Common.UserId,
    req : Types.CreateDonationRequest,
  ) : Types.Donation {
    let d : Types.DonationInternal = {
      id = nextId;
      donorId;
      foodType = req.foodType;
      quantity = req.quantity;
      unit = req.unit;
      pickupAddress = req.pickupAddress;
      pickupWindowStart = req.pickupWindowStart;
      pickupWindowEnd = req.pickupWindowEnd;
      contactPhone = req.contactPhone;
      imageBlob = req.imageBlob;
      var status = #pending;
      var acceptedBy = null;
      var assignedTo = null;
      var notes = null;
      createdAt = Time.now();
    };
    donations.add(nextId, d);
    toPublic(d);
  };

  public func acceptDonation(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    donationId : Common.DonationId,
    ngoId : Common.UserId,
    notes : ?Text,
  ) : Types.Donation {
    let d = switch (donations.get(donationId)) {
      case (?d) { d };
      case null { Runtime.trap("Donation not found") };
    };
    if (d.status != #pending) Runtime.trap("Donation is not pending");
    if (isExpired(d)) {
      d.status := #expired;
      Runtime.trap("Donation has expired");
    };
    d.status := #accepted;
    d.acceptedBy := ?ngoId;
    d.notes := notes;
    toPublic(d);
  };

  public func rejectDonation(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    donationId : Common.DonationId,
    ngoId : Common.UserId,
    notes : ?Text,
  ) : Types.Donation {
    let d = switch (donations.get(donationId)) {
      case (?d) { d };
      case null { Runtime.trap("Donation not found") };
    };
    if (d.status != #pending) Runtime.trap("Donation is not pending");
    d.status := #rejected;
    d.acceptedBy := ?ngoId;
    d.notes := notes;
    toPublic(d);
  };

  public func assignAgent(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    donationId : Common.DonationId,
    agentId : Common.UserId,
  ) : Types.Donation {
    let d = switch (donations.get(donationId)) {
      case (?d) { d };
      case null { Runtime.trap("Donation not found") };
    };
    if (d.status != #accepted) Runtime.trap("Donation must be accepted before assigning an agent");
    d.status := #assigned;
    d.assignedTo := ?agentId;
    toPublic(d);
  };

  public func markCompleted(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    donationId : Common.DonationId,
    agentId : Common.UserId,
    notes : ?Text,
  ) : Types.Donation {
    let d = switch (donations.get(donationId)) {
      case (?d) { d };
      case null { Runtime.trap("Donation not found") };
    };
    if (d.status != #assigned and d.status != #inTransit) Runtime.trap("Donation is not assigned to an agent");
    switch (d.assignedTo) {
      case (?id) {
        if (id != agentId) Runtime.trap("You are not the assigned agent for this donation");
      };
      case null { Runtime.trap("No agent assigned") };
    };
    d.status := #completed;
    d.notes := notes;
    toPublic(d);
  };

  public func cancelDonation(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    donationId : Common.DonationId,
    donorId : Common.UserId,
  ) : Types.Donation {
    let d = switch (donations.get(donationId)) {
      case (?d) { d };
      case null { Runtime.trap("Donation not found") };
    };
    if (d.donorId != donorId) Runtime.trap("You are not the donor of this donation");
    if (d.status != #pending) Runtime.trap("Only pending donations can be cancelled");
    d.status := #cancelled;
    toPublic(d);
  };

  public func getDonationsByDonor(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    donorId : Common.UserId,
  ) : [Types.Donation] {
    donations.values()
      .filter(func(d) { d.donorId == donorId })
      .map<Types.DonationInternal, Types.Donation>(toPublic)
      .toArray();
  };

  public func getPendingDonations(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
  ) : [Types.Donation] {
    // Returns only donations that are effectively pending (not expired) — read-only
    donations.values()
      .filter(func(d) { d.status == #pending and not isExpired(d) })
      .map<Types.DonationInternal, Types.Donation>(toPublic)
      .toArray();
  };

  public func getAssignedPickups(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    agentId : Common.UserId,
  ) : [Types.Donation] {
    donations.values()
      .filter(func(d) {
        switch (d.assignedTo) {
          case (?id) { id == agentId and (d.status == #assigned or d.status == #inTransit) };
          case null { false };
        };
      })
      .map<Types.DonationInternal, Types.Donation>(toPublic)
      .toArray();
  };

  public func getAllDonations(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
  ) : [Types.Donation] {
    donations.values()
      .map<Types.DonationInternal, Types.Donation>(toPublic)
      .toArray();
  };

  public func getAnalytics(
    donations : Map.Map<Common.DonationId, Types.DonationInternal>,
    users : Map.Map<Common.UserId, UserTypes.UserInternal>,
  ) : Types.Analytics {
    var totalDonations = 0;
    var completed = 0;
    var pending = 0;
    var accepted = 0;
    var assigned = 0;
    var rejected = 0;
    var cancelled = 0;
    var expired = 0;
    var totalQuantity = 0;

    donations.values().forEach(func(d) {
      totalDonations += 1;
      totalQuantity += d.quantity;
      let status = effectiveStatus(d);
      switch (status) {
        case (#completed) { completed += 1 };
        case (#pending) { pending += 1 };
        case (#accepted) { accepted += 1 };
        case (#assigned) { assigned += 1 };
        case (#inTransit) { assigned += 1 };
        case (#rejected) { rejected += 1 };
        case (#cancelled) { cancelled += 1 };
        case (#expired) { expired += 1 };
      };
    });

    var activeNGOs = 0;
    users.values().forEach(func(u) {
      if (u.role == #ngo and u.status == #active) {
        activeNGOs += 1;
      };
    });

    {
      totalDonations;
      completed;
      pending;
      accepted;
      assigned;
      rejected;
      cancelled;
      expired;
      activeNGOs;
      totalQuantity;
    };
  };
};
