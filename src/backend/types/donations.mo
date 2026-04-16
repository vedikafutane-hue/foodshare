import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

module {
  public type DonationStatus = {
    #pending;
    #accepted;
    #assigned;
    #inTransit;
    #completed;
    #rejected;
    #cancelled;
    #expired;
  };

  // Internal (mutable) representation
  public type DonationInternal = {
    id : Common.DonationId;
    donorId : Common.UserId;
    foodType : Text;
    quantity : Nat;
    unit : Text;
    pickupAddress : Text;
    pickupWindowStart : Common.Timestamp;
    pickupWindowEnd : Common.Timestamp;
    contactPhone : Text;
    imageBlob : ?Storage.ExternalBlob;
    var status : DonationStatus;
    var acceptedBy : ?Common.UserId;  // NGO principal
    var assignedTo : ?Common.UserId;  // Delivery agent principal
    var notes : ?Text;                // NGO rejection/acceptance notes or agent notes
    createdAt : Common.Timestamp;
  };

  // Shared (immutable) API type
  public type Donation = {
    id : Common.DonationId;
    donorId : Common.UserId;
    foodType : Text;
    quantity : Nat;
    unit : Text;
    pickupAddress : Text;
    pickupWindowStart : Common.Timestamp;
    pickupWindowEnd : Common.Timestamp;
    contactPhone : Text;
    imageBlob : ?Storage.ExternalBlob;
    status : DonationStatus;
    acceptedBy : ?Common.UserId;
    assignedTo : ?Common.UserId;
    notes : ?Text;
    createdAt : Common.Timestamp;
  };

  public type CreateDonationRequest = {
    foodType : Text;
    quantity : Nat;
    unit : Text;
    pickupAddress : Text;
    pickupWindowStart : Common.Timestamp;
    pickupWindowEnd : Common.Timestamp;
    contactPhone : Text;
    imageBlob : ?Storage.ExternalBlob;
  };

  public type Analytics = {
    totalDonations : Nat;
    completed : Nat;
    pending : Nat;
    accepted : Nat;
    assigned : Nat;
    rejected : Nat;
    cancelled : Nat;
    expired : Nat;
    activeNGOs : Nat;
    totalQuantity : Nat;
  };
};
