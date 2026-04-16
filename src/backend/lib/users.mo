import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types/users";
import Common "../types/common";

module {
  public func toPublic(u : Types.UserInternal) : Types.User {
    {
      id = u.id;
      name = u.name;
      phone = u.phone;
      orgName = u.orgName;
      role = u.role;
      status = u.status;
      createdAt = u.createdAt;
    };
  };

  public func new(
    id : Principal,
    req : Types.RegisterUserRequest,
  ) : Types.UserInternal {
    {
      id;
      var name = req.name;
      var phone = req.phone;
      var orgName = req.orgName;
      role = req.role;
      var status = #active;
      createdAt = Time.now();
    };
  };

  public func register(
    users : Map.Map<Common.UserId, Types.UserInternal>,
    caller : Principal,
    req : Types.RegisterUserRequest,
  ) : Types.User {
    switch (users.get(caller)) {
      case (?existing) { toPublic(existing) };
      case null {
        let user = new(caller, req);
        users.add(caller, user);
        toPublic(user);
      };
    };
  };

  public func getProfile(
    users : Map.Map<Common.UserId, Types.UserInternal>,
    caller : Principal,
  ) : ?Types.User {
    switch (users.get(caller)) {
      case (?u) { ?toPublic(u) };
      case null { null };
    };
  };

  public func getAllUsers(
    users : Map.Map<Common.UserId, Types.UserInternal>,
  ) : [Types.User] {
    users.values()
      .map<Types.UserInternal, Types.User>(toPublic)
      .toArray();
  };

  public func setStatus(
    users : Map.Map<Common.UserId, Types.UserInternal>,
    targetId : Common.UserId,
    status : Types.UserStatus,
  ) : () {
    switch (users.get(targetId)) {
      case (?u) { u.status := status };
      case null { /* no-op if user not found */ };
    };
  };
};
