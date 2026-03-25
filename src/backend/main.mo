import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";



actor {
  let BASE_PRICE = 100_000;
  let PRICE_SLOPE = 10;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    name : Text;
  };

  type Token = {
    id : Nat;
    name : Text;
    ticker : Text;
    description : Text;
    imageId : Storage.ExternalBlob;
    creator : Principal;
    createdAt : Int;
    icpReserve : Nat;
    tokenSupply : Nat;
  };

  type Trade = {
    tokenId : Nat;
    trader : Principal;
    icpAmount : Nat;
    tokenAmount : Nat;
    tradeType : {
      #buy;
      #sell;
    };
    timestamp : Int;
  };

  type Comment = {
    tokenId : Nat;
    author : Principal;
    text : Text;
    timestamp : Int;
  };

  module Comment {
    public func compare(comment1 : Comment, comment2 : Comment) : Order.Order {
      Int.compare(comment2.timestamp, comment1.timestamp);
    };
  };

  module Token {
    public func compare(token1 : Token, token2 : Token) : Order.Order {
      Int.compare(token2.createdAt, token1.createdAt);
    };
  };

  module Trade {
    public func compare(trade1 : Trade, trade2 : Trade) : Order.Order {
      Int.compare(trade2.timestamp, trade1.timestamp);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let tokens = Map.empty<Nat, Token>();
  let trades = Map.empty<Nat, List.List<Trade>>();
  let balances = Map.empty<Nat, Map.Map<Principal, Nat>>();
  let comments = Map.empty<Nat, List.List<Comment>>();
  var tokenIdCounter = 0;

  func getNextTokenId() : Nat {
    tokenIdCounter += 1;
    tokenIdCounter;
  };

  func getTokenInternal(id : Nat) : Token {
    switch (tokens.get(id)) {
      case (null) { Runtime.trap("Token not found") };
      case (?token) { token };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createToken(name : Text, ticker : Text, description : Text, imageId : Storage.ExternalBlob) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tokens");
    };

    let id = getNextTokenId();
    let token : Token = {
      id;
      name;
      ticker;
      description;
      imageId;
      creator = caller;
      createdAt = Time.now();
      icpReserve = 0;
      tokenSupply = 0;
    };
    tokens.add(id, token);
    trades.add(id, List.empty<Trade>());
    balances.add(id, Map.empty<Principal, Nat>());
    comments.add(id, List.empty<Comment>());
    id;
  };

  func calculateBuyCost(currentSupply : Nat, tokenAmount : Nat) : Nat {
    var totalCost = 0;
    var supply = currentSupply;

    var i = 0;
    while (i < tokenAmount) {
      let price = BASE_PRICE + (supply * PRICE_SLOPE);
      totalCost += price;
      supply += 1;
      i += 1;
    };

    totalCost;
  };

  func calculateSellPayout(currentSupply : Nat, tokenAmount : Nat) : Nat {
    var totalPayout = 0;
    var supply = currentSupply;

    var i = 0;
    while (i < tokenAmount) {
      let price = BASE_PRICE + ((supply - 1) * PRICE_SLOPE);
      totalPayout += price;
      supply -= 1;
      i += 1;
    };

    totalPayout;
  };

  public query func getTokenPrice(tokenId : Nat) : async Nat {
    let token = switch (tokens.get(tokenId)) {
      case (null) { Runtime.trap("Token not found") };
      case (?token) { token };
    };
    BASE_PRICE + (token.tokenSupply * PRICE_SLOPE);
  };

  public shared ({ caller }) func buyTokens(tokenId : Nat, tokenAmount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can buy tokens");
    };

    let icpAmount = calculateBuyCost(getTokenInternal(tokenId).tokenSupply, tokenAmount);

    let token = getTokenInternal(tokenId);
    let newToken = {
      id = token.id;
      name = token.name;
      ticker = token.ticker;
      description = token.description;
      imageId = token.imageId;
      creator = token.creator;
      createdAt = token.createdAt;
      icpReserve = token.icpReserve + icpAmount;
      tokenSupply = token.tokenSupply + tokenAmount;
    };
    tokens.add(tokenId, newToken);

    switch (balances.get(tokenId)) {
      case (null) { Runtime.trap("Token balances not found") };
      case (?tokenBalances) {
        let userBalance = switch (tokenBalances.get(caller)) {
          case (null) { 0 };
          case (?balance) { balance };
        };
        tokenBalances.add(caller, userBalance + tokenAmount);
      };
    };

    switch (trades.get(tokenId)) {
      case (null) { Runtime.trap("Token trades not found") };
      case (?tokenTrades) {
        let trade : Trade = {
          tokenId;
          trader = caller;
          icpAmount;
          tokenAmount;
          tradeType = #buy;
          timestamp = Time.now();
        };
        tokenTrades.add(trade);
      };
    };

    tokenAmount;
  };

  public shared ({ caller }) func sellTokens(tokenId : Nat, tokenAmount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can sell tokens");
    };

    let token = getTokenInternal(tokenId);

    switch (balances.get(tokenId)) {
      case (null) { Runtime.trap("Token balances not found") };
      case (?tokenBalances) {
        let userBalance = switch (tokenBalances.get(caller)) {
          case (null) { 0 };
          case (?balance) { balance };
        };

        if (tokenAmount > userBalance) { Runtime.trap("Insufficient balance") };

        let icpAmount = calculateSellPayout(token.tokenSupply, tokenAmount);
        let newToken = {
          id = token.id;
          name = token.name;
          ticker = token.ticker;
          description = token.description;
          imageId = token.imageId;
          creator = token.creator;
          createdAt = token.createdAt;
          icpReserve = token.icpReserve - icpAmount;
          tokenSupply = token.tokenSupply - tokenAmount;
        };
        tokens.add(tokenId, newToken);

        tokenBalances.add(caller, userBalance - tokenAmount);

        switch (trades.get(tokenId)) {
          case (null) { Runtime.trap("Token trades not found") };
          case (?tokenTrades) {
            let trade : Trade = {
              tokenId;
              trader = caller;
              icpAmount;
              tokenAmount;
              tradeType = #sell;
              timestamp = Time.now();
            };
            tokenTrades.add(trade);
          };
        };
        icpAmount;
      };
    };
  };

  public query func getToken(id : Nat) : async Token {
    getTokenInternal(id);
  };

  public query func listTokens() : async [Token] {
    tokens.values().toArray().sort();
  };

  public query func getTokenTrades(tokenId : Nat) : async [Trade] {
    switch (trades.get(tokenId)) {
      case (null) { [] };
      case (?tokenTrades) { tokenTrades.toArray().sort() };
    };
  };

  public query func getTokenHolders(tokenId : Nat) : async [Principal] {
    switch (balances.get(tokenId)) {
      case (null) { [] };
      case (?tokenBalances) {
        let holders = Set.empty<Principal>();
        tokenBalances.entries().forEach(
          func((principal, balance)) {
            if (balance > 0) {
              holders.add(principal);
            };
          }
        );
        holders.toArray();
      };
    };
  };

  public query func getTokenBalance(tokenId : Nat, user : Principal) : async Nat {
    switch (balances.get(tokenId)) {
      case (null) { 0 };
      case (?tokenBalances) {
        switch (tokenBalances.get(user)) {
          case (null) { 0 };
          case (?balance) { balance };
        };
      };
    };
  };

  public query ({ caller }) func getUserTokens() : async [Token] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their tokens");
    };
    tokens.values().toArray().filter(func(token) { token.creator == caller }).sort();
  };

  public query ({ caller }) func getUserBalances() : async [(Nat, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their balances");
    };
    balances.entries().toArray().flatMap<(Nat, Map.Map<Principal, Nat>), (Nat, Nat)>(
      func((tokenId, tokenBalances)) {
        switch (tokenBalances.get(caller)) {
          case (null) { [].values() };
          case (?balance) { [(tokenId, balance)].values() };
        };
      }
    );
  };

  public shared ({ caller }) func addComment(tokenId : Nat, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };

    switch (comments.get(tokenId)) {
      case (null) { Runtime.trap("Token comments not found") };
      case (?tokenComments) {
        let comment : Comment = {
          tokenId;
          author = caller;
          text;
          timestamp = Time.now();
        };
        tokenComments.add(comment);
      };
    };
  };

  public query func getComments(tokenId : Nat) : async [Comment] {
    switch (comments.get(tokenId)) {
      case (null) { [] };
      case (?tokenComments) { tokenComments.toArray().sort() };
    };
  };
};
