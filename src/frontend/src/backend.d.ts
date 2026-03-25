import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Comment {
    tokenId: bigint;
    text: string;
    author: Principal;
    timestamp: bigint;
}
export interface Trade {
    tokenId: bigint;
    tradeType: Variant_buy_sell;
    trader: Principal;
    tokenAmount: bigint;
    timestamp: bigint;
    icpAmount: bigint;
}
export interface Token {
    id: bigint;
    creator: Principal;
    ticker: string;
    tokenSupply: bigint;
    name: string;
    createdAt: bigint;
    description: string;
    icpReserve: bigint;
    imageId: ExternalBlob;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_buy_sell {
    buy = "buy",
    sell = "sell"
}
export interface backendInterface {
    addComment(tokenId: bigint, text: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    buyTokens(tokenId: bigint, tokenAmount: bigint): Promise<bigint>;
    createToken(name: string, ticker: string, description: string, imageId: ExternalBlob): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(tokenId: bigint): Promise<Array<Comment>>;
    getToken(id: bigint): Promise<Token>;
    getTokenBalance(tokenId: bigint, user: Principal): Promise<bigint>;
    getTokenHolders(tokenId: bigint): Promise<Array<Principal>>;
    getTokenPrice(tokenId: bigint): Promise<bigint>;
    getTokenTrades(tokenId: bigint): Promise<Array<Trade>>;
    getUserBalances(): Promise<Array<[bigint, bigint]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserTokens(): Promise<Array<Token>>;
    isCallerAdmin(): Promise<boolean>;
    listTokens(): Promise<Array<Token>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sellTokens(tokenId: bigint, tokenAmount: bigint): Promise<bigint>;
}
