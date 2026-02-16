import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    id: string;
    content: string;
    sender: Principal;
    encrypted: boolean;
    timestamp: Time;
}
export interface Chat {
    id: string;
    participants: Array<Principal>;
    messages: List;
    lastActivity: Time;
    createdAt: Time;
}
export type Time = bigint;
export interface FileReference {
    hash: string;
    path: string;
}
export interface User {
    bio?: string;
    principal: Principal;
    username: string;
    createdAt: Time;
    profilePicture?: string;
}
export type List = [Message, List] | null;
export interface backendInterface {
    addGroupMember(groupId: string, member: Principal): Promise<void>;
    createChat(participant: Principal): Promise<string>;
    createGroup(name: string): Promise<string>;
    deleteChatForEveryone(chatId: string): Promise<void>;
    deleteChatForMe(chatId: string): Promise<void>;
    deleteMessageForEveryone(chatId: string, messageId: string): Promise<void>;
    deleteMessageForMe(messageId: string): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    findExistingChat(participant1: Principal, participant2: Principal): Promise<string | null>;
    getChatList(): Promise<Array<Chat>>;
    getFileReference(path: string): Promise<FileReference>;
    getGroupMembers(groupId: string): Promise<Array<Principal>>;
    getMessages(chatId: string): Promise<Array<Message>>;
    getUserByPrincipal(principal: Principal): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    listFileReferences(): Promise<Array<FileReference>>;
    registerFileReference(path: string, hash: string): Promise<void>;
    registerUser(username: string): Promise<void>;
    sendMessage(chatId: string, content: string): Promise<void>;
    updateBio(bio: string): Promise<void>;
    updateProfilePicture(path: string): Promise<void>;
}