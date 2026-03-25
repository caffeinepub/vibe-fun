import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Comment, Token, Trade, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useListTokens() {
  const { actor, isFetching } = useActor();
  return useQuery<Token[]>({
    queryKey: ["tokens"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTokens();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGetToken(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Token>({
    queryKey: ["token", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error("No actor or id");
      return actor.getToken(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useGetTokenPrice(tokenId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["tokenPrice", tokenId?.toString()],
    queryFn: async () => {
      if (!actor || tokenId === null) return 0n;
      return actor.getTokenPrice(tokenId);
    },
    enabled: !!actor && !isFetching && tokenId !== null,
    refetchInterval: 5000,
  });
}

export function useGetTokenBalance(
  tokenId: bigint | null,
  user: Principal | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["tokenBalance", tokenId?.toString(), user?.toString()],
    queryFn: async () => {
      if (!actor || tokenId === null || !user) return 0n;
      return actor.getTokenBalance(tokenId, user);
    },
    enabled: !!actor && !isFetching && tokenId !== null && !!user,
    refetchInterval: 10000,
  });
}

export function useGetTokenTrades(tokenId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Trade[]>({
    queryKey: ["trades", tokenId?.toString()],
    queryFn: async () => {
      if (!actor || tokenId === null) return [];
      return actor.getTokenTrades(tokenId);
    },
    enabled: !!actor && !isFetching && tokenId !== null,
  });
}

export function useGetTokenHolders(tokenId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["holders", tokenId?.toString()],
    queryFn: async () => {
      if (!actor || tokenId === null) return [];
      return actor.getTokenHolders(tokenId);
    },
    enabled: !!actor && !isFetching && tokenId !== null,
  });
}

export function useGetComments(tokenId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", tokenId?.toString()],
    queryFn: async () => {
      if (!actor || tokenId === null) return [];
      return actor.getComments(tokenId);
    },
    enabled: !!actor && !isFetching && tokenId !== null,
    refetchInterval: 5000,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserTokens() {
  const { actor, isFetching } = useActor();
  return useQuery<Token[]>({
    queryKey: ["userTokens"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserTokens();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserBalances() {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint, bigint][]>({
    queryKey: ["userBalances"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserBalances();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddComment(tokenId: bigint) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addComment(tokenId, text);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["comments", tokenId.toString()] }),
  });
}

export function useCreateToken() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      ticker: string;
      description: string;
      imageId: import("../backend").ExternalBlob;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createToken(
        params.name,
        params.ticker,
        params.description,
        params.imageId,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tokens"] }),
  });
}

export function useBuyTokens(tokenId: bigint) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tokenAmount: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.buyTokens(tokenId, tokenAmount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["token", tokenId.toString()] });
      qc.invalidateQueries({ queryKey: ["trades", tokenId.toString()] });
      qc.invalidateQueries({ queryKey: ["holders", tokenId.toString()] });
      qc.invalidateQueries({ queryKey: ["tokenPrice", tokenId.toString()] });
      qc.invalidateQueries({ queryKey: ["tokenBalance"] });
      qc.invalidateQueries({ queryKey: ["userBalances"] });
    },
  });
}

export function useSellTokens(tokenId: bigint) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tokenAmount: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.sellTokens(tokenId, tokenAmount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["token", tokenId.toString()] });
      qc.invalidateQueries({ queryKey: ["trades", tokenId.toString()] });
      qc.invalidateQueries({ queryKey: ["holders", tokenId.toString()] });
      qc.invalidateQueries({ queryKey: ["tokenPrice", tokenId.toString()] });
      qc.invalidateQueries({ queryKey: ["tokenBalance"] });
      qc.invalidateQueries({ queryKey: ["userBalances"] });
    },
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}
