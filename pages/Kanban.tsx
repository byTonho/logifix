import React, { useState } from 'react';
import { Occurrence, Carrier, OccurrenceStatus, User } from '../types';
import {
  Filter, MapPin, Package, FileText, ChevronRight, AlertCircle,
  CornerUpLeft, DollarSign, ArchiveRestore, Send, User as UserIcon, Trash2, Edit2, CheckCircle, Save
} from 'lucide-react';

interface KanbanProps {
  occurrences: Occurrence[];
  carriers: Carrier[];
  updateOccurrence: (updated: Occurrence) => void;
  deleteOccurrence: (id: string) => void;
  addNote: (occurrenceId: string, text: string) => Promise<void>;
  updateNote: (noteId: string, text: string) => Promise<void>;
  currentUser: User;
  logAction: (action: string, details: string) => void;
}

const Kanban: React.FC<KanbanProps> = ({
  occurrences,
  carriers,
  updateOccurrence,
  deleteOccurrence,
  addNote,
  updateNote,
  currentUser,
  logAction
}) => {
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<Occurrence | null>(null);
  const [newNote, setNewNote] = useState('');

  // Interaction Tracking (Unread Notes)
  const [seenNotes, setSeenNotes] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem('logifix_seen_notes');
    return stored ? JSON.parse(stored) : {};
  });

  const markAsSeen = (occurrenceId: string, count: number) => {
    const updated = { ...seenNotes, [occurrenceId]: count };
    setSeenNotes(updated);
    localStorage.setItem('logifix_seen_notes', JSON.stringify(updated));
  };

  // States for Note Editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // States for Full Card Editing
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editFormData, setEditFormData] = useState<Occurrence | null>(null);

  // Sync selected card with global state
  React.useEffect(() => {
    if (selectedCard) {
      const updated = occurrences.find(o => o.id === selectedCard.id);
      if (updated) setSelectedCard(updated);
    }
  }, [occurrences]);

  // Kanban Columns
  const columns = [
    { id: OccurrenceStatus.OPEN, label: 'Em Aberto', color: 'border-slate-300' },
    { id: OccurrenceStatus.ANALYSIS, label: 'Aguardando Resposta', color: 'border-blue-400' },
    { id: OccurrenceStatus.BLOCK_RETURN, label: 'Bloqueio / Devolução', color: 'border-orange-400' },
    { id: OccurrenceStatus.FINANCE_AUDIT, label: 'Auditoria Financeira', color: 'border-purple-400' },
    { id: OccurrenceStatus.DONE, label: 'Concluído', color: 'border-green-400' },
  ];

  const filteredOccurrences = selectedCarrierId === 'all'
    ? occurrences
    : occurrences.filter(o => o.carrierId === selectedCarrierId);

  const getCarrier = (id: string) => carriers.find(c => c.id === id);

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('cardId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: OccurrenceStatus) => {
    const cardId = e.dataTransfer.getData('cardId');
    const card = occurrences.find(o => o.id === cardId);
    if (card && card.status !== status) {
      updateOccurrence({ ...card, status });
      logAction('Moveu Ocorrência', `Moveu ${card.id} para ${status}`);
    }
  };

  // --- Detail Modal Actions ---
  const handleAddNote = async () => {
    if (!selectedCard || !newNote.trim()) return;

    await addNote(selectedCard.id, newNote);
    logAction('Adicionou Nota', `Comentou na ocorrência ${selectedCard.id}: "${newNote.substring(0, 30)}..."`);
    setNewNote('');
  };

  const startEditNote = (noteId: string, text: string) => {
    setEditingNoteId(noteId);
    setEditingNoteText(text);
  };

  const saveEditNote = async () => {
    if (!selectedCard || !editingNoteId) return;

    await updateNote(editingNoteId, editingNoteText);
    logAction('Editou Nota', `Alterou uma nota existente em ${selectedCard.id}`);
    setEditingNoteId(null);
  };

  const handleStatusChange = (newStatus: OccurrenceStatus) => {
    if (!selectedCard) return;
    const updated = { ...selectedCard, status: newStatus };
    updateOccurrence(updated);
    setSelectedCard(updated);
    logAction('Alterou Status', `Alterou status de ${selectedCard.id} para ${newStatus}`);
  };

  const toggleFlag = (flag: 'flagResent' | 'flagInvoiceDispute' | 'flagLostReturn') => {
    if (!selectedCard) return;
    const isActivating = !selectedCard[flag];
    const flagNames = {
      flagResent: 'Produto Reenviado',
      flagInvoiceDispute: 'Contestar Fatura',
      flagLostReturn: 'Extravio na Devolução'
    };

    const updated = { ...selectedCard, [flag]: isActivating };
    updateOccurrence(updated);
    setSelectedCard(updated);
    logAction('Alterou Opção', `${isActivating ? 'Ativou' : 'Desativou'} ${flagNames[flag]} em ${selectedCard.id}`);
  };

  const handleResentUpdate = (field: 'resentCarrierId' | 'resentTrackingCode', value: string) => {
    if (!selectedCard) return;
    const updated = { ...selectedCard, [field]: value };
    updateOccurrence(updated);
    setSelectedCard(updated);
    logAction('Atualizou Reenvio', `Alterou dados de reenvio em ${selectedCard.id}`);
  }

  // --- Full Card Edit Logic ---
  const enableCardEdit = () => {
    setIsEditingCard(true);
    setEditFormData(JSON.parse(JSON.stringify(selectedCard)));
  };

  const saveCardEdit = () => {
    if (editFormData) {
      updateOccurrence(editFormData);
      setSelectedCard(editFormData);
      setIsEditingCard(false);
      logAction('Editou Ocorrência', `Alterou dados principais da ocorrência ${editFormData.id}`);
    }
  };

  const handleDeleteCard = () => {
    if (!selectedCard) return;
    if (confirm('Tem certeza que deseja excluir esta ocorrência permanentemente?')) {
      deleteOccurrence(selectedCard.id);
      logAction('Excluiu Ocorrência', `Removeu permanentemente a ocorrência ${selectedCard.id}`);
      setSelectedCard(null);
    }
  }

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR');
    } catch (e) { return isoString; }
  };

  const editInputClass = "w-full border border-blue-300 rounded p-1 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="h-full flex flex-col">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ocorrências</h2>
          <p className="text-slate-500 text-sm">Arraste os cards para atualizar o status.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select
            value={selectedCarrierId}
            onChange={(e) => setSelectedCarrierId(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">Todas as Transportadoras</option>
            {carriers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full min-w-full pb-4">
          {columns.map(col => (
            <div
              key={col.id}
              className="flex-1 flex flex-col bg-slate-100 rounded-xl min-w-[250px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`p-4 border-b-4 ${col.color} bg-white rounded-t-xl shadow-sm z-10 sticky top-0`}>
                <h3 className="font-bold text-slate-700 flex justify-between">
                  {col.label}
                  <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">
                    {filteredOccurrences.filter(o => o.status === col.id).length}
                  </span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar">
                {filteredOccurrences
                  .filter(o => o.status === col.id)
                  .map(card => {
                    const carrier = getCarrier(card.carrierId);
                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onClick={() => {
                          setSelectedCard(card);
                          markAsSeen(card.id, card.notes.length);
                        }}
                        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
                      >
                        {/* Carrier Strip */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: carrier?.color || '#ccc' }}
                        />

                        <div className="pl-3 relative">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-slate-400 font-medium">{card.id}</span>
                            <div className="flex items-center gap-2">
                              {card.notes.length > (seenNotes[card.id] || 0) && (
                                <div className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                                  {card.notes.length - (seenNotes[card.id] || 0)}
                                </div>
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {card.state}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-semibold text-slate-800 text-sm mb-1">{card.recipientName}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                            <Package size={12} /> {card.trackingCode}
                          </p>
                          {/* Carrier Name in Card */}
                          <p className="text-[10px] text-slate-400 mb-3 font-medium uppercase tracking-wide">
                            {carrier?.name}
                          </p>

                          <div className="flex gap-1 flex-wrap">
                            {/* Flags Badges Mini */}
                            {card.flagResent && <span className="w-2 h-2 rounded-full bg-blue-500" title="Reenviado"></span>}
                            {card.flagInvoiceDispute && <span className="w-2 h-2 rounded-full bg-amber-500" title="Contestar Fatura"></span>}
                            {card.flagLostReturn && <span className="w-2 h-2 rounded-full bg-red-500" title="Extravio Devolução"></span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-fade-in">

            {/* Left: Details & Actions */}
            <div className="md:w-1/2 p-6 border-r border-slate-100 overflow-y-auto bg-slate-50">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {selectedCard.id}
                    <span
                      className="text-xs text-white px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: getCarrier(selectedCard.carrierId)?.color }}
                    >
                      {getCarrier(selectedCard.carrierId)?.name}
                    </span>
                  </h2>
                </div>
                <div className="flex gap-2">
                  {isEditingCard ? (
                    <button onClick={saveCardEdit} className="text-green-600 hover:bg-green-50 p-2 rounded"><CheckCircle size={20} /></button>
                  ) : (
                    <button onClick={enableCardEdit} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit2 size={20} /></button>
                  )}
                  <button onClick={handleDeleteCard} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 size={20} /></button>
                </div>
              </div>

              {/* Data Grid (Editable) */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Rastreio</span>
                  {isEditingCard ? (
                    <input className={editInputClass} value={editFormData?.trackingCode} onChange={e => setEditFormData({ ...editFormData!, trackingCode: e.target.value })} />
                  ) : (
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      <Package size={16} className="text-blue-500" /> {selectedCard.trackingCode}
                    </div>
                  )}
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Nota Fiscal</span>
                  {isEditingCard ? (
                    <input className={editInputClass} value={editFormData?.invoiceNumber} onChange={e => setEditFormData({ ...editFormData!, invoiceNumber: e.target.value })} />
                  ) : (
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" /> {selectedCard.invoiceNumber}
                    </div>
                  )}
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Valor NF</span>
                  {isEditingCard ? (
                    <input type="number" className={editInputClass} value={editFormData?.invoiceValue} onChange={e => setEditFormData({ ...editFormData!, invoiceValue: parseFloat(e.target.value) })} />
                  ) : (
                    <div className="font-medium text-slate-800">R$ {selectedCard.invoiceValue?.toFixed(2)}</div>
                  )}
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Valor Frete</span>
                  {isEditingCard ? (
                    <input type="number" className={editInputClass} value={editFormData?.freightValue} onChange={e => setEditFormData({ ...editFormData!, freightValue: parseFloat(e.target.value) })} />
                  ) : (
                    <div className="font-medium text-slate-800">R$ {selectedCard.freightValue?.toFixed(2)}</div>
                  )}
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 col-span-2">
                  <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Destinatário</span>
                  {isEditingCard ? (
                    <div className="flex gap-2">
                      <input className={`${editInputClass} w-2/3`} value={editFormData?.recipientName} onChange={e => setEditFormData({ ...editFormData!, recipientName: e.target.value })} />
                      <input className={`${editInputClass} w-1/3`} value={editFormData?.state} onChange={e => setEditFormData({ ...editFormData!, state: e.target.value })} />
                    </div>
                  ) : (
                    <div className="font-medium text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-2"><UserIcon size={16} className="text-slate-400" /> {selectedCard.recipientName}</span>
                      <span className="flex items-center gap-1 text-slate-500"><MapPin size={14} /> {selectedCard.state}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Mover */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mover para etapa</label>
                <select
                  value={selectedCard.status}
                  onChange={(e) => handleStatusChange(e.target.value as OccurrenceStatus)}
                  className="w-full p-3 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(OccurrenceStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Advanced Actions (Financial/Logistics) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase">Ações Especiais</label>

                {/* Resent Logic */}
                <div className={`rounded-lg border transition-all overflow-hidden ${selectedCard.flagResent ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}>
                  <button
                    onClick={() => toggleFlag('flagResent')}
                    className="w-full flex items-center justify-between p-3"
                  >
                    <div className={`flex items-center gap-3 ${selectedCard.flagResent ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>
                      <CornerUpLeft size={18} />
                      <span className="font-medium text-sm">Produto Reenviado?</span>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedCard.flagResent ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                      {selectedCard.flagResent && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </button>

                  {selectedCard.flagResent && (
                    <div className="px-3 pb-3 pt-0 border-t border-blue-200 mt-1">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-blue-800">Nova Transportadora</label>
                          <select
                            value={selectedCard.resentCarrierId || ''}
                            onChange={(e) => handleResentUpdate('resentCarrierId', e.target.value)}
                            className="w-full text-sm bg-white border border-blue-300 rounded p-1.5 mt-1 text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Selecione...</option>
                            {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-blue-800">Novo Rastreio</label>
                          <input
                            type="text"
                            value={selectedCard.resentTrackingCode || ''}
                            onChange={(e) => handleResentUpdate('resentTrackingCode', e.target.value)}
                            className="w-full text-sm bg-white border border-blue-300 rounded p-1.5 mt-1 text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Código..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleFlag('flagInvoiceDispute')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedCard.flagInvoiceDispute ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 hover:border-amber-300 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} />
                    <div className="text-left">
                      <span className={`font-medium text-sm block ${selectedCard.flagInvoiceDispute ? 'font-bold' : ''}`}>Contestar Fatura</span>
                      <span className="text-[10px] opacity-75">Solicitar remoção da cobrança</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedCard.flagInvoiceDispute ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`}>
                    {selectedCard.flagInvoiceDispute && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </button>

                <button
                  onClick={() => toggleFlag('flagLostReturn')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedCard.flagLostReturn ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 hover:border-red-300 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <ArchiveRestore size={18} />
                    <div className="text-left">
                      <span className={`font-medium text-sm block ${selectedCard.flagLostReturn ? 'font-bold' : ''}`}>Extravio na Devolução</span>
                      <span className="text-[10px] opacity-75">Sinalizar reembolso do item</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedCard.flagLostReturn ? 'bg-red-500 border-red-500' : 'border-slate-300'}`}>
                    {selectedCard.flagLostReturn && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </button>

              </div>
            </div>

            {/* Right: Timeline & Chat */}
            <div className="md:w-1/2 flex flex-col h-full max-h-[600px] md:max-h-full">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                <h3 className="font-bold text-slate-700">Histórico de Resolução</h3>
                <button onClick={() => { setSelectedCard(null); setIsEditingCard(false); }} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                  Fechar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {selectedCard.notes.map(note => (
                  <div key={note.id} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">
                      {note.user.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100 flex-1 relative">
                      {editingNoteId === note.id ? (
                        <div>
                          <textarea
                            className="w-full p-2 border border-blue-300 rounded text-sm mb-2 text-slate-900 bg-white"
                            rows={3}
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingNoteId(null)} className="text-xs text-slate-500">Cancelar</button>
                            <button onClick={saveEditNote} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-slate-900 mb-1">{note.text}</p>
                          <span className="text-xs text-slate-400">{formatDateTime(note.date)} • {note.user}</span>
                          <button
                            onClick={() => startEditNote(note.id, note.text)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500"
                          >
                            <Edit2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar nota interna..."
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-900 bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button
                    onClick={handleAddNote}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;