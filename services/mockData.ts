import { Carrier, Occurrence, OccurrenceStatus, SegmentType, User, UserRole, AuditLog } from '../types';

export const INITIAL_CARRIERS: Carrier[] = [
  { id: '1', name: 'Rapidão Cometa', segment: SegmentType.BOTH, color: '#ef4444' },
  { id: '2', name: 'LoggiAzul', segment: SegmentType.ONLINE, color: '#3b82f6' },
  { id: '3', name: 'Correios Sedex', segment: SegmentType.BOTH, color: '#eab308' },
  { id: '4', name: 'JadLog Transportes', segment: SegmentType.PHYSICAL, color: '#22c55e' },
];

export const INITIAL_OCCURRENCES: Occurrence[] = [
  {
    id: 'OC-1001',
    carrierId: '1',
    trackingCode: 'BR123456789',
    invoiceNumber: 'NF-5920',
    recipientName: 'João Silva',
    state: 'SP',
    status: OccurrenceStatus.ANALYSIS,
    createdAt: '2023-10-25T10:00:00',
    occurrenceDate: '2023-10-25',
    invoiceValue: 150.00,
    freightValue: 25.90,
    flagResent: false,
    flagInvoiceDispute: false,
    flagLostReturn: false,
    notes: [
      { id: '1', date: '2023-10-25T10:05', text: 'Cliente reclamou de atraso de 5 dias.', user: 'Sistema' },
      { id: '2', date: '2023-10-26T14:30', text: 'Aberto chamado na transportadora.', user: 'Atendente' }
    ]
  },
  // ... existing mock data ...
  {
    id: 'OC-1004',
    carrierId: '1',
    trackingCode: 'BR55555555',
    invoiceNumber: 'NF-6100',
    recipientName: 'Ana Pereira',
    state: 'RS',
    status: OccurrenceStatus.OPEN,
    createdAt: '2023-11-05T08:30:00',
    occurrenceDate: '2023-11-05',
    invoiceValue: 89.90,
    freightValue: 15.00,
    flagResent: false,
    flagInvoiceDispute: false,
    flagLostReturn: false,
    notes: [
      { id: '1', date: '2023-11-05T08:30', text: 'Cliente alega que status consta entregue mas não recebeu.', user: 'SAC' }
    ]
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Carlos Admin',
    email: 'acarlos@hidran.com.br',
    password: 'hidran@2265',
    role: UserRole.MASTER
  },
  {
    id: 'u2',
    name: 'Operador Logístico',
    email: 'operador@hidran.com.br',
    password: '123',
    role: UserRole.USER
  }
];

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'l1',
    action: 'Sistema Iniciado',
    details: 'Banco de dados inicial carregado.',
    userId: 'system',
    userName: 'Sistema',
    timestamp: new Date().toISOString()
  }
];