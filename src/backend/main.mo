import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import List "mo:base/List";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

import Registry "blob-storage/registry";

actor ChatBackend {
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let textMap = OrderedMap.Make<Text>(Text.compare);

  var users : OrderedMap.Map<Principal, User> = principalMap.empty<User>();
  var usernames : OrderedMap.Map<Text, Principal> = textMap.empty<Principal>();
  var chats : OrderedMap.Map<Text, Chat> = textMap.empty<Chat>();
  var groups : OrderedMap.Map<Text, Group> = textMap.empty<Group>();
  var deletedMessages : OrderedMap.Map<Principal, OrderedMap.Map<Text, ()>> = principalMap.empty<OrderedMap.Map<Text, ()>>();
  var deletedChats : OrderedMap.Map<Principal, OrderedMap.Map<Text, ()>> = principalMap.empty<OrderedMap.Map<Text, ()>>();
  var chatParticipants : OrderedMap.Map<Text, Text> = textMap.empty<Text>();

  type User = {
    principal : Principal;
    username : Text;
    createdAt : Time.Time;
    profilePicture : ?Text;
    bio : ?Text;
  };

  type Message = {
    id : Text;
    sender : Principal;
    content : Text;
    timestamp : Time.Time;
    encrypted : Bool;
  };

  type Chat = {
    id : Text;
    participants : [Principal];
    messages : List.List<Message>;
    createdAt : Time.Time;
    lastActivity : Time.Time;
  };

  type Group = {
    id : Text;
    name : Text;
    members : [Principal];
    createdAt : Time.Time;
  };

  public shared ({ caller }) func registerUser(username : Text) : async () {
    if (principalMap.contains(users, caller)) {
      Debug.trap("User already exists");
    };

    if (textMap.contains(usernames, username)) {
      Debug.trap("Username already taken");
    };

    let user : User = {
      principal = caller;
      username;
      createdAt = Time.now();
      profilePicture = null;
      bio = null;
    };

    users := principalMap.put(users, caller, user);
    usernames := textMap.put(usernames, username, caller);
  };

  public shared ({ caller }) func updateProfilePicture(path : Text) : async () {
    switch (principalMap.get(users, caller)) {
      case null { Debug.trap("User not found") };
      case (?user) {
        let updatedUser : User = {
          principal = user.principal;
          username = user.username;
          createdAt = user.createdAt;
          profilePicture = ?path;
          bio = user.bio;
        };
        users := principalMap.put(users, caller, updatedUser);
      };
    };
  };

  public shared ({ caller }) func updateBio(bio : Text) : async () {
    switch (principalMap.get(users, caller)) {
      case null { Debug.trap("User not found") };
      case (?user) {
        let updatedUser : User = {
          principal = user.principal;
          username = user.username;
          createdAt = user.createdAt;
          profilePicture = user.profilePicture;
          bio = ?bio;
        };
        users := principalMap.put(users, caller, updatedUser);
      };
    };
  };

  public query func getUserByPrincipal(principal : Principal) : async ?User {
    principalMap.get(users, principal);
  };

  public query func getUserByUsername(username : Text) : async ?User {
    switch (textMap.get(usernames, username)) {
      case null { null };
      case (?principal) { principalMap.get(users, principal) };
    };
  };

  public shared ({ caller }) func createChat(participant : Principal) : async Text {
    let chatId = Principal.toText(caller) # "-" # Principal.toText(participant);
    let reverseChatId = Principal.toText(participant) # "-" # Principal.toText(caller);

    if (textMap.contains(chatParticipants, chatId) or textMap.contains(chatParticipants, reverseChatId)) {
      Debug.trap("Chat already exists");
    };

    let chat : Chat = {
      id = chatId;
      participants = [caller, participant];
      messages = List.nil<Message>();
      createdAt = Time.now();
      lastActivity = Time.now();
    };

    chats := textMap.put(chats, chatId, chat);
    chatParticipants := textMap.put(chatParticipants, chatId, chatId);
    chatId;
  };

  public query func findExistingChat(participant1 : Principal, participant2 : Principal) : async ?Text {
    let chatId = Principal.toText(participant1) # "-" # Principal.toText(participant2);
    let reverseChatId = Principal.toText(participant2) # "-" # Principal.toText(participant1);

    switch (textMap.get(chatParticipants, chatId)) {
      case (?id) { ?id };
      case null {
        switch (textMap.get(chatParticipants, reverseChatId)) {
          case (?id) { ?id };
          case null { null };
        };
      };
    };
  };

  public shared ({ caller }) func sendMessage(chatId : Text, content : Text) : async () {
    switch (textMap.get(chats, chatId)) {
      case null { Debug.trap("Chat not found") };
      case (?chat) {
        if (Array.find<Principal>(chat.participants, func(p) { Principal.equal(p, caller) }) == null) {
          Debug.trap("Not authorized");
        };

        let message : Message = {
          id = Principal.toText(caller) # "-" # debug_show (Time.now());
          sender = caller;
          content;
          timestamp = Time.now();
          encrypted = true;
        };

        let updatedChat : Chat = {
          id = chat.id;
          participants = chat.participants;
          messages = List.push(message, chat.messages);
          createdAt = chat.createdAt;
          lastActivity = Time.now();
        };

        chats := textMap.put(chats, chatId, updatedChat);
      };
    };
  };

  public shared ({ caller }) func deleteMessageForEveryone(chatId : Text, messageId : Text) : async () {
    switch (textMap.get(chats, chatId)) {
      case null { Debug.trap("Chat not found") };
      case (?chat) {
        let messageToDelete = List.find<Message>(
          chat.messages,
          func(message) { message.id == messageId },
        );

        switch (messageToDelete) {
          case null { Debug.trap("Message not found") };
          case (?message) {
            if (message.sender != caller) {
              Debug.trap("Only the sender can delete this message for everyone");
            };

            let filteredMessages = List.filter<Message>(
              chat.messages,
              func(message) { message.id != messageId },
            );

            let updatedChat : Chat = {
              id = chat.id;
              participants = chat.participants;
              messages = filteredMessages;
              createdAt = chat.createdAt;
              lastActivity = Time.now();
            };

            chats := textMap.put(chats, chatId, updatedChat);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteMessageForMe(messageId : Text) : async () {
    let userDeletedMessages = switch (principalMap.get(deletedMessages, caller)) {
      case null { textMap.empty() };
      case (?map) { map };
    };

    let updatedMap = textMap.put(userDeletedMessages, messageId, ());
    deletedMessages := principalMap.put(deletedMessages, caller, updatedMap);
  };

  public query ({ caller }) func getMessages(chatId : Text) : async [Message] {
    switch (textMap.get(chats, chatId)) {
      case null { Debug.trap("Chat not found") };
      case (?chat) {
        let userDeletedMessages = switch (principalMap.get(deletedMessages, caller)) {
          case null { textMap.empty() };
          case (?map) { map };
        };

        let filteredMessages = List.filter<Message>(
          chat.messages,
          func(message) { not textMap.contains(userDeletedMessages, message.id) },
        );

        List.toArray(filteredMessages);
      };
    };
  };

  public shared ({ caller }) func deleteChatForEveryone(chatId : Text) : async () {
    switch (textMap.get(chats, chatId)) {
      case null { Debug.trap("Chat not found") };
      case (?chat) {
        if (Array.find<Principal>(chat.participants, func(p) { Principal.equal(p, caller) }) == null) {
          Debug.trap("Not authorized");
        };

        chats := textMap.remove(chats, chatId).0;
        chatParticipants := textMap.remove(chatParticipants, chatId).0;
      };
    };
  };

  public shared ({ caller }) func deleteChatForMe(chatId : Text) : async () {
    let userDeletedChats = switch (principalMap.get(deletedChats, caller)) {
      case null { textMap.empty() };
      case (?map) { map };
    };

    let updatedMap = textMap.put(userDeletedChats, chatId, ());
    deletedChats := principalMap.put(deletedChats, caller, updatedMap);
  };

  public query ({ caller }) func getChatList() : async [Chat] {
    let userDeletedChats = switch (principalMap.get(deletedChats, caller)) {
      case null { textMap.empty() };
      case (?map) { map };
    };

    var chatList = List.nil<Chat>();
    for ((chatId, chat) in textMap.entries(chats)) {
      if (not textMap.contains(userDeletedChats, chatId)) {
        chatList := List.push(chat, chatList);
      };
    };

    let chatArray = List.toArray(chatList);
    Array.sort<Chat>(
      chatArray,
      func(a : Chat, b : Chat) : { #less; #equal; #greater } {
        if (a.lastActivity > b.lastActivity) { #less } else if (a.lastActivity < b.lastActivity) {
          #greater;
        } else { #equal };
      },
    );
  };

  public shared ({ caller }) func createGroup(name : Text) : async Text {
    let groupId = Principal.toText(caller) # "-" # debug_show (Time.now());

    let group : Group = {
      id = groupId;
      name;
      members = [caller];
      createdAt = Time.now();
    };

    groups := textMap.put(groups, groupId, group);
    groupId;
  };

  public shared ({ caller }) func addGroupMember(groupId : Text, member : Principal) : async () {
    switch (textMap.get(groups, groupId)) {
      case null { Debug.trap("Group not found") };
      case (?group) {
        if (Array.find<Principal>(group.members, func(p) { Principal.equal(p, caller) }) == null) {
          Debug.trap("Not authorized");
        };

        let newMembers = Array.append<Principal>(group.members, [member]);

        let updatedGroup : Group = {
          id = group.id;
          name = group.name;
          members = newMembers;
          createdAt = group.createdAt;
        };

        groups := textMap.put(groups, groupId, updatedGroup);
      };
    };
  };

  public query func getGroupMembers(groupId : Text) : async [Principal] {
    switch (textMap.get(groups, groupId)) {
      case null { Debug.trap("Group not found") };
      case (?group) { group.members };
    };
  };

  let registry = Registry.new();

  public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
    Registry.add(registry, path, hash);
  };

  public query ({ caller }) func getFileReference(path : Text) : async Registry.FileReference {
    Registry.get(registry, path);
  };

  public query ({ caller }) func listFileReferences() : async [Registry.FileReference] {
    Registry.list(registry);
  };

  public shared ({ caller }) func dropFileReference(path : Text) : async () {
    Registry.remove(registry, path);
  };
};
