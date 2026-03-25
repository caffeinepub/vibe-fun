export function formatICP(e8s: bigint): string {
  return (Number(e8s) / 1e8).toFixed(4);
}

export function formatICPShort(e8s: bigint): string {
  const icp = Number(e8s) / 1e8;
  if (icp >= 1_000_000) return `${(icp / 1_000_000).toFixed(2)}M`;
  if (icp >= 1_000) return `${(icp / 1_000).toFixed(2)}K`;
  return icp.toFixed(2);
}

export function icpToE8s(icp: number): bigint {
  return BigInt(Math.round(icp * 1e8));
}

export function formatPrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 6)}...${p.slice(-4)}`;
}

export function timeAgo(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function pricePerToken(token: {
  icpReserve: bigint;
  tokenSupply: bigint;
}): number {
  if (token.tokenSupply === 0n) return 0;
  return Number(token.icpReserve) / Number(token.tokenSupply);
}
