import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import UsersMixin "mixins/users-api";
import DonationsMixin "mixins/donations-api";
import UserTypes "types/users";
import DonationTypes "types/donations";
import Common "types/common";

actor {
  // Authorization state (first logged-in user becomes admin)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Object storage for donation images
  include MixinObjectStorage();

  // Domain state
  let users = Map.empty<Common.UserId, UserTypes.UserInternal>();
  let donations = Map.empty<Common.DonationId, DonationTypes.DonationInternal>();

  // Domain mixins
  include UsersMixin(accessControlState, users);
  include DonationsMixin(accessControlState, users, donations);
};
