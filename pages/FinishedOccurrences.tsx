import React, { useState } from 'react';
import { Occurrence, Carrier, OccurrenceStatus } from '../types';
import { Search, RotateCcw, Package, Calendar, DollarSign, CheckCircle } from 'lucide-react';

interface FinishedOccurrencesProps {
    occurrences: Occurrence[];
    carriers: Carrier[];
    restoreOccurrence: (id: string) => void;
    currentUser: any;
    users: any[];
}

const FinishedOccurrences: React.FC<FinishedOccurrencesProps> = ({ occurrences, carriers, restoreOccurrence, currentUser, users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [restoreModalId, setRestoreModalId] = useState<string | null>(null);

    // Helper functions
    const getCarrierName = (id: string) => carriers.find(c => c.id === id)?.name || 'N/A';
    const getCarrierColor = (id: string) => carriers.find(c => c.id === id)?.color || '#94a3b8';

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('pt-BR');
        } catch {
            return dateString;
        }
    };

    const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);

    // Filter DONE and ARCHIVED status
    const finishedItems = occurrences.filter(o =>
        o.status === OccurrenceStatus.DONE ||
        o.status === OccurrenceStatus.ARCHIVED
    );

    // Filter based on search
    const filteredItems = finishedItems.filter(o => {
        const carrierName = (getCarrierName(o.carrierId) || '').toLowerCase();
        const search = (searchTerm || '').toLowerCase();

        const id = o.id || '';
        const recipient = o.recipientName || '';
        const tracking = o.trackingCode || '';
        const invoice = o.invoiceNumber || '';

        return id.toLowerCase().includes(search) ||
            recipient.toLowerCase().includes(search) ||
            tracking.toLowerCase().includes(search) ||
            invoice.includes(search) ||
            carrierName.includes(search);
    });

    const isMaster = currentUser?.role === 'Master';

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="text-green-500" />
                        Ocorrências Finalizadas
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Histórico de todas as reclamações concluídas e arquivadas.
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar ID, Cliente, Pedido ou Transportadora..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                <th className="p-4">ID Pedido / Ocorrência</th>
                                <th className="p-4">Transportadora</th>
                                <th className="p-4">Cliente / Destinatário</th>
                                <th className="p-4">Data Abertura</th>
                                <th className="p-4">Data Finalização</th>
                                <th className="p-4">Valor Total</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        Nenhuma ocorrência finalizada encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedOccurrence(item)}
                                    >
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-blue-600 text-sm">#{item.id}</span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar size={10} /> NF: {item.invoiceNumber}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className="px-2 py-1 rounded-md text-xs font-medium border"
                                                style={{
                                                    borderColor: `${getCarrierColor(item.carrierId)}40`,
                                                    backgroundColor: `${getCarrierColor(item.carrierId)}10`,
                                                    color: getCarrierColor(item.carrierId)
                                                }}
                                            >
                                                {getCarrierName(item.carrierId)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 font-medium text-sm">{item.recipientName}</span>
                                                <span className="text-xs text-slate-400">{item.state}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {formatDate(item.createdAt)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {item.finishedAt ? formatDate(item.finishedAt) : '-'}
                                        </td>
                                        <td className="p-4 font-medium text-slate-700">
                                            {formatCurrency(item.invoiceValue)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Deseja restaurar a ocorrência ${item.id} para "Em Aberto"?`)) {
                                                        restoreOccurrence(item.id);
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-blue-600 flex items-center gap-1 ml-auto text-sm transition-colors opacity-0 group-hover:opacity-100"
                                                title="Restaurar ocorrência"
                                            >
                                                <RotateCcw size={16} />
                                                Restaurar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination / Footer */}
            <div className="mt-4 flex justify-between items-center text-xs text-slate-400 px-2">
                <span>Mostrando {filteredItems.length} registros</span>
            </div>

            {/* Detail Modal */}
            {selectedOccurrence && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-fade-in">

                        {/* Details Panel */}
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {selectedOccurrence.id}
                                    <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
                                        Concluído
                                    </span>
                                </h2>
                                <button onClick={() => setSelectedOccurrence(null)} className="text-slate-400 hover:text-slate-600">
                                    Fechar
                                </button>
                            </div>

                            {/* Data Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Rastreio</span>
                                    <div className="font-medium text-slate-800 flex items-center gap-2">
                                        <Package size={16} className="text-blue-500" /> {selectedOccurrence.trackingCode}
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Nota Fiscal</span>
                                    <div className="font-medium text-slate-800 flex items-center gap-2">
                                        <DollarSign size={16} className="text-blue-500" /> {selectedOccurrence.invoiceNumber}
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Valor NF</span>
                                    <div className="font-medium text-slate-800">{formatCurrency(selectedOccurrence.invoiceValue)}</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Valor Frete</span>
                                    <div className="font-medium text-slate-800">{formatCurrency(selectedOccurrence.freightValue)}</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 col-span-2">
                                    <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Destinatário & Local</span>
                                    <div className="font-medium text-slate-800">
                                        {selectedOccurrence.recipientName} - {selectedOccurrence.state}
                                    </div>
                                </div>
                            </div>

                            {/* Responsibles (Read Only) */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsáveis</label>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedOccurrence.responsibleUsers || []).map(uid => {
                                        const u = users?.find(user => user.id === uid);
                                        if (!u) return null;
                                        return (
                                            <span key={uid} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-100">
                                                {u.name}
                                            </span>
                                        );
                                    })}
                                    {(!selectedOccurrence.responsibleUsers || selectedOccurrence.responsibleUsers.length === 0) && (
                                        <span className="text-sm text-slate-400 italic">Nenhum responsável atribuído.</span>
                                    )}
                                </div>
                            </div>

                            {/* Flags Summary */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ações Registradas</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedOccurrence.flagResent && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">Reenvio</span>}
                                    {selectedOccurrence.flagInvoiceDispute && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200">Contestação Frete</span>}
                                    {selectedOccurrence.flagLostReturn && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">Extravio</span>}
                                    {selectedOccurrence.flagDamage && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-200">Avaria</span>}
                                    {!selectedOccurrence.flagResent && !selectedOccurrence.flagInvoiceDispute && !selectedOccurrence.flagLostReturn && !selectedOccurrence.flagDamage &&
                                        <span className="text-sm text-slate-400 italic">Nenhuma ação especial registrada.</span>
                                    }
                                </div>
                            </div>

                            {/* Master Edit Hint */}
                            {isMaster && (
                                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs">
                                    <strong>Nota para Master:</strong> Para editar os dados desta ocorrência, utilize a função "Restaurar" na tabela para trazê-la de volta ao quadro Kanban. A edição direta em itens finalizados é restrita para manter a integridade do histórico.
                                </div>
                            )}
                        </div>

                        {/* History Panel (Right) */}
                        <div className="md:w-1/3 bg-white border-l border-slate-100 flex flex-col h-full max-h-[400px] md:max-h-full">
                            <div className="p-4 border-b border-slate-100 font-bold text-slate-700">Histórico</div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedOccurrence.notes.map(note => (
                                    <div key={note.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">
                                            {note.user.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100 flex-1">
                                            <p className="text-sm text-slate-900 mb-1">{note.text}</p>
                                            <span className="text-xs text-slate-400">{formatDate(note.date)} • {note.user}</span>
                                        </div>
                                    </div>
                                ))}
                                {selectedOccurrence.notes.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm mt-10">Nenhum comentário registrado.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FinishedOccurrences;
