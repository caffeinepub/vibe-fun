import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import type { Token } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetUserBalances,
  useGetUserTokens,
  useListTokens,
} from "../hooks/useQueries";
import { formatICPShort, timeAgo } from "../utils/format";

interface UserProfilePageProps {
  onBack: () => void;
  onTokenClick: (token: Token) => void;
}

export default function UserProfilePage({
  onBack,
  onTokenClick,
}: UserProfilePageProps) {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const { data: userTokens = [], isLoading: tokensLoading } =
    useGetUserTokens();
  const { data: balances = [], isLoading: balancesLoading } =
    useGetUserBalances();
  const { data: allTokens = [] } = useListTokens();

  const balanceMap = new Map<string, bigint>(
    balances.map(([id, bal]) => [id.toString(), bal]),
  );
  const balanceTokens = allTokens.filter(
    (t) =>
      balanceMap.has(t.id.toString()) &&
      (balanceMap.get(t.id.toString()) ?? 0n) > 0n,
  );

  const principal = identity?.getPrincipal().toString() ?? "";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        data-ocid="profile.link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-6 mb-6"
        data-ocid="profile.card"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neon-purple/10 border-2 border-neon-purple/30 flex items-center justify-center">
            <User className="w-8 h-8 text-neon-purple" />
          </div>
          <div>
            {profileLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <h1 className="font-display font-bold text-2xl">
                  {profile?.name ?? "Anonymous"}
                </h1>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {principal.slice(0, 20)}...
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tokens Created */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-green" />
            Tokens Launched
            <Badge
              variant="outline"
              className="ml-auto text-xs border-neon-green/30 text-neon-green"
            >
              {userTokens.length}
            </Badge>
          </h2>

          {tokensLoading ? (
            <div
              className="flex items-center justify-center py-8"
              data-ocid="profile.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-neon-green" />
            </div>
          ) : userTokens.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-8"
              data-ocid="profile.empty_state"
            >
              No tokens launched yet
            </p>
          ) : (
            <div className="space-y-3">
              {userTokens.map((token, i) => (
                <button
                  key={token.id.toString()}
                  type="button"
                  onClick={() => onTokenClick(token)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors text-left"
                  data-ocid={`profile.item.${i + 1}`}
                >
                  <img
                    src={token.imageId.getDirectURL()}
                    alt={token.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(token.ticker)}&background=0a0a0f&color=00ff88&bold=true`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {token.name}
                      </span>
                      <span className="font-mono text-xs text-neon-green/70">
                        ${token.ticker}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {timeAgo(token.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-neon-green">
                      {formatICPShort(token.icpReserve)} ICP
                    </div>
                    <div className="text-xs text-muted-foreground">reserve</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Token Balances */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4 text-neon-purple" />
            Holdings
            <Badge
              variant="outline"
              className="ml-auto text-xs border-neon-purple/30 text-neon-purple"
            >
              {balanceTokens.length}
            </Badge>
          </h2>

          {balancesLoading ? (
            <div
              className="flex items-center justify-center py-8"
              data-ocid="profile.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-neon-purple" />
            </div>
          ) : balanceTokens.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-8"
              data-ocid="profile.empty_state"
            >
              No token holdings yet
            </p>
          ) : (
            <div className="space-y-3">
              {balanceTokens.map((token, i) => {
                const bal = balanceMap.get(token.id.toString()) ?? 0n;
                const priceICP =
                  token.tokenSupply > 0n
                    ? Number(token.icpReserve) / Number(token.tokenSupply) / 1e8
                    : 0;
                const value = priceICP * Number(bal);
                return (
                  <button
                    key={token.id.toString()}
                    type="button"
                    onClick={() => onTokenClick(token)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors text-left"
                    data-ocid={`profile.item.${i + 1}`}
                  >
                    <img
                      src={token.imageId.getDirectURL()}
                      alt={token.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(token.ticker)}&background=0a0a0f&color=00ff88&bold=true`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {token.name}
                        </span>
                        <span className="font-mono text-xs text-neon-purple/70">
                          ${token.ticker}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {Number(bal).toLocaleString()} tokens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-neon-purple">
                        {value.toFixed(4)} ICP
                      </div>
                      <div className="text-xs text-muted-foreground">value</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
