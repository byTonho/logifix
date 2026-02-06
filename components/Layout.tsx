import React from 'react';
import { Truck, LayoutDashboard, Trello, PackagePlus, Menu, X, Users, ScrollText, LogOut, UserCircle, CheckCircle } from 'lucide-react';
import { Occurrence, User, UserRole, OccurrenceStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  occurrences: Occurrence[];
  currentUser: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage, occurrences = [], currentUser, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Calculate financial totals (Active Only)
  const isActive = (o: Occurrence) =>
    o.status !== OccurrenceStatus.DONE &&
    o.status !== OccurrenceStatus.ARCHIVED &&
    !o.finishedAt;

  const disputeTotal = occurrences
    .filter(o => o.flagInvoiceDispute && isActive(o))
    .reduce((acc, curr) => acc + (curr.freightValue || 0), 0);

  const lostTotal = occurrences
    .filter(o => o.flagLostReturn && isActive(o))
    .reduce((acc, curr) => acc + (curr.invoiceValue || 0), 0);

  const damageTotal = occurrences
    .filter(o => o.flagDamage && isActive(o))
    .reduce((acc, curr) => acc + (curr.invoiceValue || 0), 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiredRole: null },
    { id: 'kanban', label: 'Ocorrências', icon: Trello, requiredRole: null },
    { id: 'finished-occurrences', label: 'OC. Finalizadas', icon: CheckCircle, requiredRole: null },
    { id: 'carriers', label: 'Transportadoras', icon: Truck, requiredRole: null },
    { id: 'new-occurrence', label: 'Nova Reclamação', icon: PackagePlus, requiredRole: null },
    // Master Only Pages
    { id: 'users', label: 'Usuários', icon: Users, requiredRole: UserRole.MASTER },
    { id: 'logs', label: 'Logs de Auditoria', icon: ScrollText, requiredRole: UserRole.MASTER },
  ];

  const visibleNavItems = navItems.filter(item =>
    !item.requiredRole || item.requiredRole === currentUser.role
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Truck size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">LogiFix - byTonho</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activePage === item.id
                ? 'bg-primary text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile & Financial Summary */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none">{currentUser.name}</span>
                <span className="text-xs text-slate-500">{currentUser.role}</span>
              </div>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-red-400" title="Sair">
              <LogOut size={18} />
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Resumo Financeiro</p>

            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">A Contestar (Frete)</span>
              <span className="text-amber-400 font-bold text-sm">{formatCurrency(disputeTotal)}</span>
            </div>

            <div className="w-full h-px bg-slate-700"></div>

            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">Extravios (Produtos)</span>
              <span className="text-red-400 font-bold text-sm">{formatCurrency(lostTotal)}</span>
            </div>

            <div className="w-full h-px bg-slate-700"></div>

            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">Avaria (Produtos)</span>
              <span className="text-purple-400 font-bold text-sm">{formatCurrency(damageTotal)}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-20 flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Truck size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">LogiFix - byTonho</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-10 pt-20 px-4 space-y-2 flex flex-col">
          <div className="flex-1 space-y-2">
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg border border-slate-700 ${activePage === item.id
                  ? 'bg-primary text-white'
                  : 'text-slate-300'
                  }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-700">
            <button onClick={onLogout} className="w-full flex items-center gap-2 text-red-400 p-2">
              <LogOut size={20} /> Sair ({currentUser.name})
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-20">
        <div className="p-4 md:p-6 w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;