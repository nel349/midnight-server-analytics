export interface Transaction {
  hash: string;
  identifiers: string[];
  applyStage?: string;
  raw?: string;
  merkleTreeRoot?: string;
  contractActions?: any[]; // You might want to define a more specific type for ContractActions
}

export interface Block {
  hash: string;
  height: number;
  timestamp: number;
  protocolVersion?: number;
  author?: string;
  parent?: { hash: string; height: number };
  transactions: Transaction[];
} 