import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Plus, Trash2, Shield, User as UserIcon, Save, Edit2 } from 'lucide-react';

import { supabase } from '../services/supabase';

interface UsersPageProps {
  users: User[];
  onRefresh: () => Promise<void>;
  logAction: (action: string, details: string) => void;
  currentUser: User;
}

const UsersPage: React.FC<UsersPageProps> = ({ users, onRefresh, logAction, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.USER
  });

  const openNew = () => {
    setEditingUserId(null);
    setFormData({ name: '', email: '', password: '', role: UserRole.USER });
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUserId) {
        // Update profile
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            role: formData.role
          })
          .eq('id', editingUserId);

        if (error) throw error;
        logAction('Editou Usuário', `Alterou dados do usuário ${formData.name}`);
      } else {
        // Create new user via Edge Function
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role
          }
        });

        if (error) throw error;
        logAction('Criou Usuário', `Adicionou o usuário ${formData.name} (${formData.role})`);
      }

      await onRefresh();
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: UserRole.USER });
    } catch (err: any) {
      alert(`Erro: ${err.message || 'Verifique se a função create-user foi implantada'}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser.id) {
      alert("Você não pode excluir a si mesmo.");
      return;
    }

    if (confirm(`Excluir perfil de ${name}? (Isso não remove o usuário do Auth do Supabase)`)) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) {
        await onRefresh();
        logAction('Excluiu Usuário', `Removeu o perfil de ${name}`);
      } else {
        alert("Erro ao excluir usuário.");
      }
    }
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h2>
          <p className="text-slate-500">Controle de acesso ao sistema.</p>
        </div>
        <button
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Nome</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Email</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Permissão</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-4 text-sm font-medium text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                    {(user.name || '?').charAt(0)}
                  </div>
                  {user.name}
                </td>
                <td className="p-4 text-sm text-slate-600">{user.email}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === UserRole.MASTER ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => openEdit(user)}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                    title="Editar Usuário"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-2"
                    title="Excluir Usuário"
                    disabled={user.id === currentUser.id}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {editingUserId ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {!editingUserId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      className={inputClass}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Senha Inicial</label>
                    <input
                      type="password"
                      required
                      className={inputClass}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </>
              )}

              {editingUserId && (
                <div className="opacity-60">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email (Gestão via Auth)</label>
                  <input
                    type="email"
                    disabled
                    className={`${inputClass} bg-slate-50`}
                    value={formData.email}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Permissão</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: UserRole.USER })}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border ${formData.role === UserRole.USER ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-slate-200 text-slate-500'}`}
                  >
                    <UserIcon size={16} /> Usuário
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: UserRole.MASTER })}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border ${formData.role === UserRole.MASTER ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'border-slate-200 text-slate-500'}`}
                  >
                    <Shield size={16} /> Master
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} /> {isSubmitting ? 'Salvando...' : (editingUserId ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;