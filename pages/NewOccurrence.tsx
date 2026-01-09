import React, { useState } from 'react';
import { Carrier, Occurrence, OccurrenceStatus, User } from '../types';
import { Save } from 'lucide-react';

interface NewOccurrenceProps {
  carriers: Carrier[];
  addOccurrence: (occ: Occurrence) => void;
  setActivePage: (page: string) => void;
  currentUser: User;
  logAction: (action: string, details: string) => void;
}

const NewOccurrence: React.FC<NewOccurrenceProps> = ({ carriers, addOccurrence, setActivePage, currentUser, logAction }) => {
  const [formData, setFormData] = useState({
    carrierId: '',
    trackingCode: '',
    invoiceNumber: '',
    recipientName: '',
    state: '',
    initialNote: '',
    occurrenceDate: new Date().toISOString().split('T')[0],
    invoiceValue: '',
    freightValue: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.carrierId) {
        alert("Selecione uma transportadora");
        return;
    }

    const newOcc: Occurrence = {
      id: `OC-${Math.floor(Math.random() * 10000)}`,
      carrierId: formData.carrierId,
      trackingCode: formData.trackingCode,
      invoiceNumber: formData.invoiceNumber,
      recipientName: formData.recipientName,
      state: formData.state.toUpperCase(),
      status: OccurrenceStatus.OPEN,
      createdAt: new Date().toISOString(),
      occurrenceDate: formData.occurrenceDate,
      invoiceValue: parseFloat(formData.invoiceValue) || 0,
      freightValue: parseFloat(formData.freightValue) || 0,
      flagResent: false,
      flagInvoiceDispute: false,
      flagLostReturn: false,
      notes: [
        {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          text: formData.initialNote || 'Reclamação aberta.',
          user: currentUser.name
        }
      ]
    };

    addOccurrence(newOcc);
    logAction('Nova Ocorrência', `Criou a ocorrência ${newOcc.id} para ${newOcc.recipientName}`);
    setActivePage('kanban');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Nova Ocorrência</h2>
        <p className="text-slate-500">Registre problemas com entregas para iniciar o acompanhamento.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Transportadora</label>
                <select 
                    name="carrierId" 
                    value={formData.carrierId}
                    onChange={handleChange}
                    className={inputClass}
                    required
                >
                    <option value="">Selecione...</option>
                    {carriers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.segment})</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data da Ocorrência</label>
                <input 
                    type="date" 
                    name="occurrenceDate"
                    value={formData.occurrenceDate}
                    onChange={handleChange}
                    className={inputClass}
                    required
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Rastreio</label>
                <input 
                    type="text" 
                    name="trackingCode"
                    value={formData.trackingCode}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ex: BR123456789"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Destinatário</label>
                <input 
                    type="text" 
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nome completo"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado (UF)</label>
                <input 
                    type="text" 
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    maxLength={2}
                    className={`${inputClass} uppercase`}
                    placeholder="Ex: SP"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nº Nota Fiscal</label>
                <input 
                    type="text" 
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ex: 54902"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor da NF (R$)</label>
                  <input 
                      type="number" 
                      step="0.01"
                      name="invoiceValue"
                      value={formData.invoiceValue}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="0,00"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor do Frete (R$)</label>
                  <input 
                      type="number" 
                      step="0.01"
                      name="freightValue"
                      value={formData.freightValue}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="0,00"
                  />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Observação Inicial</label>
                <textarea 
                    name="initialNote"
                    value={formData.initialNote}
                    onChange={handleChange}
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Descreva o problema (atraso, extravio, avaria...)"
                    required
                />
            </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
                <Save size={20} />
                Registrar Ocorrência
            </button>
        </div>

      </form>
    </div>
  );
};

export default NewOccurrence;