import React from 'react';
import { AuditLog } from '../types';
import { Clock, User, Activity } from 'lucide-react';

interface AuditLogsProps {
  logs: AuditLog[];
}

const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  // Sort logs by newest first
  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR');

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Logs de Auditoria</h2>
        <p className="text-slate-500">Registro completo de atividades do sistema.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Data/Hora</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Usuário</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ação</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                   <div className="flex items-center gap-2">
                     <Clock size={14} className="text-slate-400" />
                     {formatDateTime(log.timestamp)}
                   </div>
                </td>
                <td className="p-4 text-sm text-slate-900 font-medium">
                   <div className="flex items-center gap-2">
                     <User size={14} className="text-blue-500" />
                     {log.userName}
                   </div>
                </td>
                <td className="p-4 text-sm text-slate-800 font-semibold">
                   <div className="flex items-center gap-2">
                     <Activity size={14} className="text-amber-500" />
                     {log.action}
                   </div>
                </td>
                <td className="p-4 text-sm text-slate-600">{log.details}</td>
              </tr>
            ))}
            {sortedLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;