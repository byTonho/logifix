import React, { useState } from 'react';
import { Occurrence, Carrier, OccurrenceStatus } from '../types';
import { Search, RotateCcw, Package, Calendar, DollarSign, CheckCircle } from 'lucide-react';

interface FinishedOccurrencesProps {
    occurrences: Occurrence[];
    carriers: Carrier[];
    restoreOccurrence: (id: string) => void;
}

const FinishedOccurrences: React.FC<FinishedOccurrencesProps> = ({ occurrences, carriers, restoreOccurrence }) => {
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

    // Filter DONE and ARCHIVED status
    const finishedItems = occurrences.filter(o =>
        o.status === OccurrenceStatus.DONE ||
        o.status === OccurrenceStatus.ARCHIVED
    );

    // Filter based on search
    const filteredItems = finishedItems.filter(o => {
        const carrierName = getCarrierName(o.carrierId).toLowerCase();
        const search = searchTerm.toLowerCase();

        return o.id.toLowerCase().includes(search) ||
            o.recipientName.toLowerCase().includes(search) ||
            o.trackingCode.toLowerCase().includes(search) ||
            o.invoiceNumber.includes(search) ||
            carrierName.includes(search);
    });

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
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
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
                                                onClick={() => {
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

            {/* Pagination Footer (Static for now) */}
            <div className="mt-4 flex justify-between items-center text-xs text-slate-400 px-2">
                <span>Mostrando {filteredItems.length} registros</span>
                <div className="flex gap-2">
                    <button disabled className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-300 cursor-not-allowed">Anterior</button>
                    <button disabled className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-300 cursor-not-allowed">Próximo</button>
                </div>
            </div>
        </div>
    );
};

export default FinishedOccurrences;
