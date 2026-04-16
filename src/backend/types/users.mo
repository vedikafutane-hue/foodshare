module {
  public type UserRole = {
    #donor;
    #ngo;
    #deliveryAgent;
    #admin;
  };

  public type UserStatus = {
    #active;
    #inactive;
  };

  // Internal (mutable) representation
  public type UserInternal = {
    id : Principal;
    var name : Text;
    var phone : Text;
    var orgName : ?Text; // for NGO
    role : UserRole;
    var status : UserStatus;
    createdAt : Int;
  };

  // Shared (immutable) API type
  public type User = {
    id : Principal;
    name : Text;
    phone : Text;
    orgName : ?Text;
    role : UserRole;
    status : UserStatus;
    createdAt : Int;
  };

  public type RegisterUserRequest = {
    name : Text;
    phone : Text;
    orgName : ?Text;
    role : UserRole;
  };
};
