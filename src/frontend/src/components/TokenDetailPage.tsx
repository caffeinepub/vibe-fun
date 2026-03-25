import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useBuyTokens,
  useGetComments,
  useGetToken,
  useGetTokenBalance,
  useGetTokenHolders,
  useGetTokenPrice,
  useGetTokenTrades,
  useSellTokens,
} from "../hooks/useQueries";
import {
  formatICP,
  formatICPShort,
  formatPrincipal,
  timeAgo,
} from "../utils/format";

interface TokenDetailPageProps {
  tokenId: bigint;
  onBack: () => void;
  onLoginRequired: () => void;
}

function e8sToICP(e8s: bigint): number {
  return Number(e8s) / 1e8;
}

export default function TokenDetailPage({
  tokenId,
  onBack,
  onLoginRequired,
}: TokenDetailPageProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const principal = identity?.getPrincipal() ?? null;

  const { data: token, isLoading: tokenLoading } = useGetToken(tokenId);
  const { data: trades = [] } = useGetTokenTrades(tokenId);
  const { data: holders = [] } = useGetTokenHolders(tokenId);
  const { data: comments = [] } = useGetComments(tokenId);
  const { data: priceE8s = 0n } = useGetTokenPrice(tokenId);
  const { data: userBalance = 0n } = useGetTokenBalance(tokenId, principal);

  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [buyTokensInput, setBuyTokensInput] = useState("");
  const [sellTokensInput, setSellTokensInput] = useState("");
  const [commentText, setCommentText] = useState("");

  const { mutateAsync: buyTokens, isPending: buying } = useBuyTokens(tokenId);
  const { mutateAsync: sellTokens, isPending: selling } =
    useSellTokens(tokenId);
  const { mutateAsync: addComment, isPending: commenting } =
    useAddComment(tokenId);

  const currentPriceICP = e8sToICP(priceE8s);

  const chartData = trades
    .slice()
    .sort((a, b) => Number(a.timestamp - b.timestamp))
    .map((trade, i) => ({
      index: i,
      price:
        Number(trade.tokenAmount) > 0
          ? Number(trade.icpAmount) / Number(trade.tokenAmount) / 1e8
          : 0,
      time: timeAgo(trade.timestamp),
      type: trade.tradeType,
    }));

  const handleBuy = async () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    const amount = Number.parseFloat(buyTokensInput);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid token amount");
      return;
    }
    try {
      const icpReceived = await buyTokens(BigInt(Math.floor(amount)));
      toast.success(`Bought ${Math.floor(amount).toLocaleString()} tokens! 🚀`);
      setBuyTokensInput("");
      // icpReceived is the ICP cost in e8s
      toast.info(`Cost: ${formatICP(icpReceived)} ICP`);
    } catch (err: any) {
      toast.error(err?.message ?? "Buy failed");
    }
  };

  const handleSell = async () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    const amount = Number.parseFloat(sellTokensInput);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid token amount");
      return;
    }
    try {
      const received = await sellTokens(BigInt(Math.floor(amount)));
      toast.success(`Sold for ${formatICP(received)} ICP! 💰`);
      setSellTokensInput("");
    } catch (err: any) {
      toast.error(err?.message ?? "Sell failed");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    if (!commentText.trim()) return;
    try {
      await addComment(commentText.trim());
      setCommentText("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to post comment");
    }
  };

  if (tokenLoading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="token_detail.loading_state"
      >
        <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <div
        className="text-center py-24 text-muted-foreground"
        data-ocid="token_detail.error_state"
      >
        Token not found.
      </div>
    );
  }

  const marketCapICP = Number(token.tokenSupply) * currentPriceICP;

  const buyEstimatedICP =
    buyTokensInput &&
    Number.parseFloat(buyTokensInput) > 0 &&
    currentPriceICP > 0
      ? (Number.parseFloat(buyTokensInput) * currentPriceICP).toFixed(6)
      : null;

  const sellEstimatedICP =
    sellTokensInput &&
    Number.parseFloat(sellTokensInput) > 0 &&
    currentPriceICP > 0
      ? (Number.parseFloat(sellTokensInput) * currentPriceICP).toFixed(6)
      : null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        data-ocid="token_detail.link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Token Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-4"
        >
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-muted/30">
              <img
                src={token.imageId.getDirectURL()}
                alt={token.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(token.ticker)}&background=0a0a0f&color=00ff88&bold=true&size=200`;
                }}
              />
            </div>
            <h1 className="font-display font-bold text-xl mb-1">
              {token.name}
            </h1>
            <Badge
              variant="outline"
              className="font-mono border-neon-green/40 text-neon-green mb-3"
            >
              ${token.ticker}
            </Badge>
            {token.description && (
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {token.description}
              </p>
            )}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap</span>
                <span className="font-mono text-neon-green font-medium">
                  {marketCapICP > 0
                    ? marketCapICP.toFixed(4)
                    : formatICPShort(token.icpReserve)}{" "}
                  ICP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono text-foreground">
                  {currentPriceICP === 0 ? "--" : currentPriceICP.toFixed(8)}{" "}
                  ICP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supply</span>
                <span className="font-mono">
                  {Number(token.tokenSupply).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ICP Reserve</span>
                <span className="font-mono">
                  {formatICPShort(token.icpReserve)} ICP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creator</span>
                <span className="font-mono text-neon-purple/80">
                  {formatPrincipal(token.creator.toString())}
                </span>
              </div>
            </div>

            {isAuthenticated && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs">
                  <Wallet className="w-3 h-3 text-neon-cyan" />
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="font-mono text-neon-cyan ml-auto">
                    {Number(userBalance).toLocaleString()} tokens
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Center: Chart + Comments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-6 space-y-4"
        >
          {/* Price Chart */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                Price Chart
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-neon-green">
                  {currentPriceICP > 0
                    ? `${currentPriceICP.toFixed(8)} ICP`
                    : "--"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {trades.length} trades
                </span>
              </div>
            </div>
            {chartData.length < 2 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Not enough trades to display chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.96 0.01 265 / 8%)"
                  />
                  <XAxis dataKey="index" hide />
                  <YAxis
                    tickFormatter={(v) =>
                      v < 0.0001 ? v.toExponential(1) : v.toFixed(6)
                    }
                    tick={{ fill: "oklch(0.55 0.04 265)", fontSize: 10 }}
                    width={70}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.11 0.02 265)",
                      border: "1px solid oklch(0.87 0.22 155 / 20%)",
                      borderRadius: "8px",
                      color: "oklch(0.96 0.01 265)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `${value.toFixed(8)} ICP`,
                      "Price",
                    ]}
                    labelFormatter={(i) => chartData[i]?.time ?? ""}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="oklch(0.87 0.22 155)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "oklch(0.87 0.22 155)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Trade History */}
          {trades.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="font-display font-semibold mb-3 text-sm">
                Recent Trades
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...trades]
                  .sort((a, b) => Number(b.timestamp - a.timestamp))
                  .slice(0, 20)
                  .map((trade, i) => (
                    <div
                      key={`${trade.trader.toString()}-${trade.timestamp.toString()}`}
                      className="flex items-center justify-between text-xs"
                      data-ocid={`trade_history.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                            trade.tradeType === "buy"
                              ? "bg-neon-green/10 text-neon-green"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {trade.tradeType === "buy" ? "BUY" : "SELL"}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {formatPrincipal(trade.trader.toString())}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">
                          {Number(trade.tokenAmount).toLocaleString()} tokens
                        </div>
                        <div className="text-muted-foreground">
                          {formatICP(trade.icpAmount)} ICP
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-display font-semibold flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-neon-purple" />
              Comments
              <span className="text-xs text-muted-foreground font-normal">
                ({comments.length})
              </span>
            </h2>

            <div
              className="space-y-3 max-h-64 overflow-y-auto mb-4"
              data-ocid="token_detail.panel"
            >
              {comments.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground text-center py-6"
                  data-ocid="token_detail.empty_state"
                >
                  No comments yet. Be the first!
                </p>
              ) : (
                [...comments]
                  .sort((a, b) => Number(b.timestamp - a.timestamp))
                  .map((c, i) => (
                    <div
                      key={`${c.author.toString()}-${c.timestamp.toString()}`}
                      className="flex gap-3"
                      data-ocid={`token_detail.item.${i + 1}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-neon-purple font-mono">
                          {c.author.toString().slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-neon-purple/80">
                            {formatPrincipal(c.author.toString())}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(c.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 break-words">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <form onSubmit={handleComment} className="flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  isAuthenticated ? "Add a comment..." : "Login to comment"
                }
                disabled={!isAuthenticated || commenting}
                className="resize-none bg-muted/30 border-border focus:border-neon-green/50 text-sm"
                rows={2}
                data-ocid="token_detail.textarea"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComment(e as any);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!isAuthenticated || !commentText.trim() || commenting}
                className="bg-neon-green/10 border border-neon-green/40 text-neon-green hover:bg-neon-green hover:text-background self-end"
                data-ocid="token_detail.submit_button"
              >
                {commenting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Right: Trade + Holders */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Trade Panel */}
          <div className="bg-card border border-border rounded-lg p-4">
            <Tabs
              value={tradeMode}
              onValueChange={(v) => setTradeMode(v as "buy" | "sell")}
            >
              <TabsList className="grid grid-cols-2 mb-4 bg-muted/30">
                <TabsTrigger
                  value="buy"
                  className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green"
                  data-ocid="token_detail.tab"
                >
                  Buy
                </TabsTrigger>
                <TabsTrigger
                  value="sell"
                  className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive"
                  data-ocid="token_detail.tab"
                >
                  Sell
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-3">
                {currentPriceICP > 0 && (
                  <div className="text-xs bg-neon-green/5 border border-neon-green/10 rounded p-2 flex justify-between">
                    <span className="text-muted-foreground">Current Price</span>
                    <span className="font-mono text-neon-green">
                      {currentPriceICP.toFixed(8)} ICP
                    </span>
                  </div>
                )}
                <div>
                  <Label
                    htmlFor="buy-token-amount"
                    className="text-xs text-muted-foreground mb-1 block"
                  >
                    Tokens to Buy
                  </Label>
                  <Input
                    id="buy-token-amount"
                    type="number"
                    value={buyTokensInput}
                    onChange={(e) => setBuyTokensInput(e.target.value)}
                    placeholder="100"
                    min="1"
                    step="1"
                    className="bg-muted/30 border-border focus:border-neon-green/50 font-mono"
                    data-ocid="token_detail.input"
                  />
                </div>
                {buyEstimatedICP && (
                  <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
                    Est. cost: ~{buyEstimatedICP} ICP
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {["100", "500", "1000", "5000"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBuyTokensInput(v)}
                      className="text-xs font-mono px-2 py-1 rounded border border-neon-green/20 text-neon-green/70 hover:border-neon-green/50 hover:text-neon-green transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleBuy}
                  disabled={
                    buying ||
                    !buyTokensInput ||
                    Number.parseFloat(buyTokensInput) <= 0
                  }
                  className="w-full bg-neon-green text-background hover:bg-neon-green/90 font-semibold"
                  data-ocid="token_detail.primary_button"
                >
                  {buying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {buying ? "Buying..." : "Buy"}
                </Button>
              </TabsContent>

              <TabsContent value="sell" className="space-y-3">
                {isAuthenticated && (
                  <div className="text-xs bg-muted/20 border border-border rounded p-2 flex justify-between">
                    <span className="text-muted-foreground">Your Balance</span>
                    <span className="font-mono text-neon-cyan">
                      {Number(userBalance).toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <Label
                    htmlFor="sell-token-amount"
                    className="text-xs text-muted-foreground mb-1 block"
                  >
                    Tokens to Sell
                  </Label>
                  <Input
                    id="sell-token-amount"
                    type="number"
                    value={sellTokensInput}
                    onChange={(e) => setSellTokensInput(e.target.value)}
                    placeholder="0"
                    min="1"
                    step="1"
                    max={Number(userBalance).toString()}
                    className="bg-muted/30 border-border focus:border-neon-green/50 font-mono"
                    data-ocid="token_detail.input"
                  />
                </div>
                {sellEstimatedICP && (
                  <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
                    Est. receive: ~{sellEstimatedICP} ICP
                  </div>
                )}
                {isAuthenticated && userBalance > 0n && (
                  <button
                    type="button"
                    onClick={() =>
                      setSellTokensInput(Number(userBalance).toString())
                    }
                    className="text-xs font-mono px-2 py-1 rounded border border-destructive/20 text-destructive/70 hover:border-destructive/50 hover:text-destructive transition-colors"
                  >
                    Max ({Number(userBalance).toLocaleString()})
                  </button>
                )}
                <Button
                  onClick={handleSell}
                  disabled={
                    selling ||
                    !sellTokensInput ||
                    Number.parseFloat(sellTokensInput) <= 0
                  }
                  className="w-full bg-destructive/80 text-destructive-foreground hover:bg-destructive font-semibold"
                  data-ocid="token_detail.secondary_button"
                >
                  {selling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {selling ? "Selling..." : "Sell"}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Holders */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-display font-semibold flex items-center gap-2 mb-3 text-sm">
              <Users className="w-4 h-4 text-neon-cyan" />
              Holders
              <span className="text-xs text-muted-foreground font-normal">
                ({holders.length})
              </span>
            </h3>
            {holders.length === 0 ? (
              <p
                className="text-xs text-muted-foreground text-center py-4"
                data-ocid="token_detail.empty_state"
              >
                No holders yet
              </p>
            ) : (
              <div className="space-y-2">
                {holders.slice(0, 10).map((holder, i) => (
                  <div
                    key={holder.toString()}
                    className="flex items-center gap-2 text-xs"
                    data-ocid="token_detail.row"
                  >
                    <span className="w-5 h-5 rounded-full bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center text-neon-purple/60 font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-mono text-foreground/70 flex-1 truncate">
                      {formatPrincipal(holder.toString())}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
