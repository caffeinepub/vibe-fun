import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Loader2, Rocket, Search, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Token } from "../backend.d";
import { useListTokens } from "../hooks/useQueries";
import TokenCard from "./TokenCard";

type SortMode = "new" | "trending";

interface ExplorePageProps {
  onTokenClick: (token: Token) => void;
  onLaunchToken: () => void;
}

export default function ExplorePage({
  onTokenClick,
  onLaunchToken,
}: ExplorePageProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("new");
  const { data: tokens = [], isLoading } = useListTokens();

  const filtered = useMemo(() => {
    let list = [...tokens];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.ticker.toLowerCase().includes(q),
      );
    }
    if (sort === "new") {
      list.sort((a, b) => Number(b.createdAt - a.createdAt));
    } else {
      list.sort((a, b) => Number(b.icpReserve - a.icpReserve));
    }
    return list;
  }, [tokens, search, sort]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-display font-bold text-4xl sm:text-5xl mb-3">
          <span className="text-neon-green">vibe</span>
          <span className="text-foreground">.fun</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          The ICP meme token launchpad. Fair bonding curves, instant trading.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-border focus:border-neon-green/50"
            data-ocid="explore.search_input"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sort === "new" ? "default" : "ghost"}
            onClick={() => setSort("new")}
            className={
              sort === "new"
                ? "bg-neon-green/20 text-neon-green border border-neon-green/40"
                : "border border-border text-muted-foreground"
            }
            data-ocid="explore.tab"
          >
            <Clock className="w-4 h-4 mr-2" />
            New
          </Button>
          <Button
            variant={sort === "trending" ? "default" : "ghost"}
            onClick={() => setSort("trending")}
            className={
              sort === "trending"
                ? "bg-neon-green/20 text-neon-green border border-neon-green/40"
                : "border border-border text-muted-foreground"
            }
            data-ocid="explore.tab"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </Button>
        </div>
      </div>

      {/* Token Grid */}
      {isLoading ? (
        <div
          className="flex flex-col items-center justify-center py-24 gap-4"
          data-ocid="explore.loading_state"
        >
          <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
          <p className="text-muted-foreground">Loading tokens...</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-6"
          data-ocid="explore.empty_state"
        >
          <div className="w-20 h-20 rounded-full bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
            <Rocket className="w-10 h-10 text-neon-green/60" />
          </div>
          <div className="text-center">
            <h3 className="font-display font-semibold text-xl mb-2">
              No tokens yet
            </h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "No tokens match your search."
                : "Be the first to launch a token!"}
            </p>
            {!search && (
              <Button
                onClick={onLaunchToken}
                className="bg-neon-green text-background hover:bg-neon-green/90 font-semibold"
                data-ocid="explore.primary_button"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Launch the First Token
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((token, i) => (
            <TokenCard
              key={token.id}
              token={token}
              index={i}
              onClick={() => onTokenClick(token)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
