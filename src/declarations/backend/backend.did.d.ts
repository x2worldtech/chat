import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Chat {
  'id' : string,
  'participants' : Array<Principal>,
  'messages' : List,
  'lastActivity' : Time,
  'createdAt' : Time,
}
export interface FileReference { 'hash' : string, 'path' : string }
export type List = [] | [[Message, List]];
export interface Message {
  'id' : string,
  'content' : string,
  'sender' : Principal,
  'encrypted' : boolean,
  'timestamp' : Time,
}
export type Time = bigint;
export interface User {
  'bio' : [] | [string],
  'principal' : Principal,
  'username' : string,
  'createdAt' : Time,
  'profilePicture' : [] | [string],
}
export interface _SERVICE {
  'addGroupMember' : ActorMethod<[string, Principal], undefined>,
  'createChat' : ActorMethod<[Principal], string>,
  'createGroup' : ActorMethod<[string], string>,
  'deleteChatForEveryone' : ActorMethod<[string], undefined>,
  'deleteChatForMe' : ActorMethod<[string], undefined>,
  'deleteMessageForEveryone' : ActorMethod<[string, string], undefined>,
  'deleteMessageForMe' : ActorMethod<[string], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'findExistingChat' : ActorMethod<[Principal, Principal], [] | [string]>,
  'getChatList' : ActorMethod<[], Array<Chat>>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getGroupMembers' : ActorMethod<[string], Array<Principal>>,
  'getMessages' : ActorMethod<[string], Array<Message>>,
  'getUserByPrincipal' : ActorMethod<[Principal], [] | [User]>,
  'getUserByUsername' : ActorMethod<[string], [] | [User]>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'registerUser' : ActorMethod<[string], undefined>,
  'sendMessage' : ActorMethod<[string, string], undefined>,
  'updateBio' : ActorMethod<[string], undefined>,
  'updateProfilePicture' : ActorMethod<[string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
