import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserLib "../lib/users";
import Types "../types/users";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, Types.UserInternal>,
) {

  /// Register the caller with a chosen role and profile info.
  public shared ({ caller }) func registerUser(req : Types.RegisterUserRequest) : async Types.User {
    if (caller.isAnonymous()) Runtime.trap("Anonymous users cannot register");
    UserLib.register(users, caller, req);
  };

  /// Get the current caller's profile.
  public query ({ caller }) func getMyProfile() : async ?Types.User {
    UserLib.getProfile(users, caller);
  };

  /// Admin: list all registered users.
  public query ({ caller }) func getAllUsers() : async [Types.User] {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #admin) Runtime.trap("Admin access required");
    UserLib.getAllUsers(users);
  };

  /// Admin: deactivate a user.
  public shared ({ caller }) func deactivateUser(userId : Common.UserId) : async () {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #admin) Runtime.trap("Admin access required");
    UserLib.setStatus(users, userId, #inactive);
  };

  /// Admin: reactivate a user.
  public shared ({ caller }) func reactivateUser(userId : Common.UserId) : async () {
    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Not registered") };
    };
    if (user.role != #admin) Runtime.trap("Admin access required");
    UserLib.setStatus(users, userId, #active);
  };
};
