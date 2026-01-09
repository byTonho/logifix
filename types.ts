export enum SegmentType {
  ONLINE = 'Loja Virtual',
  PHYSICAL = 'Loja Física',
  BOTH = 'Ambos'
}

export interface Carrier {
  id: string;
  name: string;
  segment: SegmentType;
  color: string; // Hex color
}

export enum OccurrenceStatus {
  OPEN = 'Em Aberto',
  ANALYSIS = 'Aguardando Resposta',
  BLOCK_RETURN = 'Bloqueio/Devolução',
  FINANCE_AUDIT = 'Auditoria Financeira',
  DONE = 'Concluído'
}

export interface TimelineEvent {
  id: string;
  date: string; // ISO Date + Time
  text: string;
  user: string;
}

export interface Occurrence {
  id: string;
  carrierId: string;
  trackingCode: string;
  invoiceNumber: string;
  recipientName: string;
  state: string; // UF
  status: OccurrenceStatus;
  
  // Dates
  createdAt: string; // System creation date
  occurrenceDate: string; // User defined date of the problem
  finishedAt?: string;

  // Values
  invoiceValue: number;
  freightValue: number;
  
  // Complex Logic Flags
  flagResent: boolean;      // Produto reenviado?
  resentCarrierId?: string; // Se reenviado, qual transp?
  resentTrackingCode?: string; // Novo rastreio

  flagInvoiceDispute: boolean; // Contestar fatura?
  flagLostReturn: boolean;  // Extravio na devolução?
  
  notes: TimelineEvent[];
}

// Stats Types
export interface DashboardStats {
  total: number;
  byCarrier: { name: string; count: number }[];
  byStatus: { status: string; count: number }[];
  problematicRegions: { state: string; count: number }[];
}

// --- NEW AUTH TYPES ---

export enum UserRole {
  MASTER = 'Master',
  USER = 'Usuário'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this should be hashed
  role: UserRole;
}

export interface AuditLog {
  id: string;
  action: string; // e.g., "Criou Ocorrência", "Excluiu Transportadora"
  details: string; // Description of the change
  userId: string;
  userName: string;
  timestamp: string;
}