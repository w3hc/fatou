export interface ApiKey {
  id: string;
  key: string;
  walletAddress?: string;
  createdAt: string;
  lastUsedAt: string;
  isActive: boolean;
}
