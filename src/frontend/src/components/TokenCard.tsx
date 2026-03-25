import { TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import type { Token } from "../backend.d";
import { formatICPShort, timeAgo } from "../utils/format";

interface TokenCardProps {
  token: Token;
  index: number;
  onClick: () => void;
}

export default function TokenCard({ token, index, onClick }: TokenCardProps) {
  const priceICP =
    token.tokenSupply > 0n
      ? Number(token.icpReserve) / Number(token.tokenSupply) / 1e8
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="group cursor-pointer bg-card border border-border hover:border-neon-green/30 rounded-lg p-4 transition-all hover:shadow-neon"
      data-ocid={`tokens.item.${index + 1}`}
    >
      {/* Token Image */}
      <div className="relative mb-3 overflow-hidden rounded-md aspect-square bg-muted/30">
        <img
          src={token.imageId.getDirectURL()}
          alt={token.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://ui-avatars.com/api/?name=${encodeURIComponent(token.ticker)}&background=0a0a0f&color=00ff88&bold=true`;
          }}
        />
        <div className="absolute top-2 right-2">
          <span className="font-mono text-xs bg-background/80 backdrop-blur-sm text-neon-green border border-neon-green/30 px-2 py-0.5 rounded">
            {token.ticker}
          </span>
        </div>
      </div>

      {/* Token Info */}
      <div className="space-y-2">
        <h3 className="font-display font-semibold text-sm truncate group-hover:text-neon-green transition-colors">
          {token.name}
        </h3>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">ICP Reserve</span>
          <span className="font-mono font-medium text-neon-green">
            {formatICPShort(token.icpReserve)} ICP
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Price</span>
          <span className="font-mono text-foreground/80">
            {priceICP === 0 ? "--" : priceICP.toExponential(2)} ICP
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {timeAgo(token.createdAt)}
          </span>
          <div className="flex items-center gap-1 text-neon-green/80">
            <TrendingUp className="w-3 h-3" />
            <span className="font-mono">
              {Number(token.tokenSupply).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
