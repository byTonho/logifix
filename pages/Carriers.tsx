import React, { useState } from 'react';
import { Plus, Trash2, Building2, Globe, Store, Edit2, Lock } from 'lucide-react';
import { Carrier, SegmentType, User, UserRole } from '../types';

interface CarriersProps {
  carriers: Carrier[];
  currentUser: User;
  logAction: (action: string, details: string) => void;
  deleteCarrier: (id: string) => void;
  addCarrier: (newCarrier: Omit<Carrier, 'id'>) => Promise<void>;
  updateCarrier: (updated: Carrier) => Promise<void>;
}

const Carriers: React.FC<CarriersProps> = ({
  carriers,
  currentUser,
  logAction,
  deleteCarrier,
  addCarrier,
  updateCarrier
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    segment: SegmentType.BOTH as SegmentType,
    color: '#3b82f6'
  });

  const isMaster = currentUser.role === UserRole.MASTER;

  const openNew = () => {
    setEditingId(null);
    setFormData({ name: '', segment: SegmentType.BOTH, color: '#3b82f6' });
    setIsModalOpen(true);
  };

  const openEdit = (carrier: Carrier) => {
    if (!isMaster) return;
    setEditingId(carrier.id);
    setFormData({ name: carrier.name, segment: carrier.segment, color: carrier.color });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateCarrier({ id: editingId, ...formData });
      logAction('Editou Transportadora', `Atualizou dados da transportadora ${formData.name}`);
    } else {
      await addCarrier(formData);
      logAction('Criou Transportadora', `Cadastrou a transportadora ${formData.name}`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir ${name}? Isso pode afetar ocorrências vinculadas.`)) {
      deleteCarrier(id);
      logAction('Excluiu Transportadora', `Removeu a transportadora ${name}`);
    }
  }

  const getSegmentIcon = (type: SegmentType) => {
    switch (type) {
      case SegmentType.ONLINE: return <Globe size={18} />;
      case SegmentType.PHYSICAL: return <Store size={18} />;
      default: return <Building2 size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Transportadoras</h2>
          <p className="text-slate-500">Gerencie seus parceiros logísticos.</p>
        </div>
        {isMaster && (
          <button
            onClick={openNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus size={20} />
            Nova Transportadora
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carriers.map(carrier => (
          <div
            key={carrier.id}
            onClick={() => openEdit(carrier)}
            className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-all group ${isMaster ? 'cursor-pointer' : ''}`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm"
                  style={{ backgroundColor: carrier.color }}
                >
                  {carrier.name.substring(0, 1)}
                </div>
                {isMaster && (
                  <button
                    onClick={(e) => handleDelete(carrier.id, carrier.name, e)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                {carrier.name}
                {isMaster ? (
                  <Edit2 size={14} className="opacity-0 group-hover:opacity-50" />
                ) : (
                  <Lock size={14} className="text-slate-300" title="Apenas leitura" />
                )}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-slate-500 bg-slate-50 py-1 px-3 rounded-full w-fit text-sm">
                {getSegmentIcon(carrier.segment)}
                <span>{carrier.segment}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">Status</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Ativo</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Render only if open to save DOM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {editingId ? 'Editar Transportadora' : 'Cadastrar Transportadora'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Sedex, JadLog..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Segmento de Atuação</label>
                <div className="grid grid-cols-3 gap-2">
                  {[SegmentType.ONLINE, SegmentType.PHYSICAL, SegmentType.BOTH].map((seg) => (
                    <button
                      key={seg}
                      type="button"
                      onClick={() => setFormData({ ...formData, segment: seg })}
                      className={`text-sm py-2 px-1 rounded-lg border transition-all ${formData.segment === seg
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {seg === SegmentType.BOTH ? 'Ambos' : seg.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cor de Identificação</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-sm text-slate-500">Clique para escolher a cor</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carriers;