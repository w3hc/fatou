export interface ApiKey {
  id: string;
  key: string;
  walletAddress?: string;
  createdAt: string;
  lastUsedAt: string;
  isActive: boolean;
  slug: string;
  assistantName: string;
  introPhrase: string;
  daoAddress: string;
  daoNetwork: string;
}
