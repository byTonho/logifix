import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Carriers from './pages/Carriers';
import NewOccurrence from './pages/NewOccurrence';
import Login from './pages/Login';
import UsersPage from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import FinishedOccurrences from './pages/FinishedOccurrences';

import { Carrier, Occurrence, User, AuditLog, OccurrenceStatus } from './types';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState('dashboard');

  // Data States
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);

  // Auth & Data Fetching
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      setCurrentUser({
        id: userId,
        email: profile?.email || '',
        name: profile?.name || 'Usuário',
        role: profile?.role || 'Usuário',
        password: '',
      });

      if (profile?.role === 'Master') {
        await fetchAllProfiles();
      }

      // Load initial data
      await Promise.all([
        fetchCarriers(),
        fetchOccurrences(),
        fetchLogs()
      ]);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarriers = async () => {
    const { data, error } = await supabase.from('carriers').select('*');
    if (!error && data) {
      setCarriers(data.map(c => ({
        id: c.id,
        name: c.name,
        segment: c.segment,
        color: c.color
      })));
    }
  };

  const fetchOccurrences = async () => {
    const { data, error } = await supabase
      .from('occurrences')
      .select('*, notes:occurrence_notes(*)');

    if (!error && data) {
      setOccurrences(data.map(o => ({
        id: o.id,
        carrierId: o.carrier_id,
        trackingCode: o.tracking_code,
        invoiceNumber: o.invoice_number,
        recipientName: o.recipient_name,
        state: o.state,
        status: o.status,
        createdAt: o.created_at,
        occurrenceDate: o.occurrence_date,
        finishedAt: o.finished_at,
        invoiceValue: parseFloat(o.invoice_value),
        freightValue: parseFloat(o.freight_value),
        flagResent: o.flag_resent,
        resentCarrierId: o.resent_carrier_id,
        resentTrackingCode: o.resent_tracking_code,
        flagInvoiceDispute: o.flag_invoice_dispute,
        flagLostReturn: o.flag_lost_return,
        flagDamage: o.flag_damage,
        responsibleUsers: o.responsible_users || [],
        notes: (o.notes || [])
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((n: any) => ({
            id: n.id,
            date: n.created_at,
            text: n.content,
            user: n.user_name
          }))
      })));
    }
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLogs(data.map(l => ({
        id: l.id,
        action: l.action,
        details: l.details,
        userId: l.user_id,
        userName: l.user_name,
        timestamp: l.created_at
      })));
    }
  };

  const fetchAllProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      setUsers(data.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email || '',
        password: '',
        role: p.role as any
      })));
    }
  };

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActivePage('dashboard');
    // Data is fetched via fetchUserProfile on auth state change
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Logging Helper
  const logAction = async (action: string, details: string) => {
    if (!currentUser) return;

    const { data, error } = await supabase.from('audit_logs').insert({
      action,
      details,
      user_id: currentUser.id,
      user_name: currentUser.name
    }).select().single();

    if (!error && data) {
      const newLog: AuditLog = {
        id: data.id,
        action: data.action,
        details: data.details,
        userId: data.user_id,
        userName: data.user_name,
        timestamp: data.created_at
      };
      setLogs(prev => [newLog, ...prev]);
    }
  };

  // Handlers
  const addOccurrence = async (newOcc: Occurrence): Promise<{ success: boolean; duplicateId?: string }> => {
    // Check for duplicate invoice number
    const { data: existing } = await supabase
      .from('occurrences')
      .select('id')
      .eq('invoice_number', newOcc.invoiceNumber)
      .single();

    if (existing) {
      return { success: false, duplicateId: existing.id };
    }

    // Default Responsible Logic ('Carlos')
    const carlos = users.find(u => u.name.includes('Carlos'));
    if (carlos) {
      if (!newOcc.responsibleUsers) newOcc.responsibleUsers = [];
      if (!newOcc.responsibleUsers.includes(carlos.id)) {
        newOcc.responsibleUsers.push(carlos.id);
      }
    }

    const { error: occError } = await supabase.from('occurrences').insert({
      id: newOcc.id,
      carrier_id: newOcc.carrierId,
      tracking_code: newOcc.trackingCode,
      invoice_number: newOcc.invoiceNumber,
      recipient_name: newOcc.recipientName,
      state: newOcc.state,
      status: newOcc.status,
      occurrence_date: newOcc.occurrenceDate,
      invoice_value: newOcc.invoiceValue.toString(),
      freight_value: newOcc.freightValue.toString(),
      flag_resent: newOcc.flagResent,
      resent_carrier_id: newOcc.resentCarrierId,
      resent_tracking_code: newOcc.resentTrackingCode,
      flag_invoice_dispute: newOcc.flagInvoiceDispute,
      flag_lost_return: newOcc.flagLostReturn,
      flag_damage: newOcc.flagDamage,
      responsible_users: newOcc.responsibleUsers
    });

    if (!occError) {
      // If there are initial notes (usually 1 from NewOccurrence)
      if (newOcc.notes.length > 0) {
        await Promise.all(newOcc.notes.map(note =>
          supabase.from('occurrence_notes').insert({
            occurrence_id: newOcc.id,
            user_name: note.user,
            content: note.text
          })
        ));
      }
      await fetchOccurrences();
      return { success: true };
    } else {
      console.error('Error adding occurrence:', occError);
      return { success: false };
    }
  };

  const restoreOccurrence = async (id: string) => {
    // Find 'Carlos' to add as responsible
    const carlos = users.find(u => u.name.includes('Carlos'));
    let updates: any = { status: OccurrenceStatus.OPEN, finished_at: null };

    if (carlos) {
      // Need to fetch current responsible users first or just append? 
      // For simplicity/performance, we might overwrite or we need to look up current occurrence from state
      const currentOcc = occurrences.find(o => o.id === id);
      let currentResponsibles = currentOcc?.responsibleUsers || [];
      if (!currentResponsibles.includes(carlos.id)) {
        updates.responsible_users = [...currentResponsibles, carlos.id];
      }
    }

    const { error } = await supabase
      .from('occurrences')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await fetchOccurrences();
      logAction('Restaurou Ocorrência', `Reabriu a ocorrência ${id}`);
    }
  };

  const addNote = async (occurrenceId: string, text: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('occurrence_notes').insert({
      occurrence_id: occurrenceId,
      user_name: currentUser.name,
      content: text
    });
    if (!error) {
      await fetchOccurrences();
    }
  };

  const updateNote = async (noteId: string, text: string) => {
    const { error } = await supabase
      .from('occurrence_notes')
      .update({ content: text })
      .eq('id', noteId);
    if (!error) {
      await fetchOccurrences();
    }
  };

  const updateOccurrence = async (updated: Occurrence) => {
    const { error } = await supabase
      .from('occurrences')
      .update({
        carrier_id: updated.carrierId,
        tracking_code: updated.trackingCode,
        status: updated.status,
        occurrence_date: updated.occurrenceDate,
        invoice_value: updated.invoiceValue.toString(),
        freight_value: updated.freightValue.toString(),
        flag_resent: updated.flagResent,
        resent_carrier_id: updated.resentCarrierId,
        resent_tracking_code: updated.resentTrackingCode,
        flag_invoice_dispute: updated.flagInvoiceDispute,
        flag_lost_return: updated.flagLostReturn,
        flag_damage: updated.flagDamage,
        responsible_users: updated.responsibleUsers,
        finished_at: (updated.status === 'Concluído' || updated.status === 'Arquivado')
          ? (updated.finishedAt || new Date().toISOString())
          : null
      })
      .eq('id', updated.id);

    if (!error) {
      await fetchOccurrences();
    } else {
      console.error('Error updating occurrence:', error);
    }
  };

  const deleteOccurrence = async (id: string) => {
    const { error } = await supabase.from('occurrences').delete().eq('id', id);
    if (!error) {
      setOccurrences(prev => prev.filter(o => o.id !== id));
    }
  };

  const addCarrier = async (newCarrier: Omit<Carrier, 'id'>) => {
    const { error } = await supabase.from('carriers').insert({
      name: newCarrier.name,
      segment: newCarrier.segment,
      color: newCarrier.color
    });
    if (!error) {
      await fetchCarriers();
    }
  };

  const updateCarrier = async (updated: Carrier) => {
    const { error } = await supabase
      .from('carriers')
      .update({
        name: updated.name,
        segment: updated.segment,
        color: updated.color
      })
      .eq('id', updated.id);
    if (!error) {
      await fetchCarriers();
    }
  };

  const deleteCarrier = async (id: string) => {
    const { error } = await supabase.from('carriers').delete().eq('id', id);
    if (!error) {
      setCarriers(prev => prev.filter(c => c.id !== id));
    }
  };

  // Router Switch
  const renderContent = () => {
    if (!currentUser) return <Login onLogin={handleLogin} />;

    switch (activePage) {
      case 'dashboard':
        return <Dashboard occurrences={occurrences} carriers={carriers} />;
      case 'kanban':
        return (
          <Kanban
            occurrences={occurrences}
            carriers={carriers}
            updateOccurrence={updateOccurrence}
            deleteOccurrence={deleteOccurrence}
            addNote={addNote}
            updateNote={updateNote}
            currentUser={currentUser}
            users={users}
            logAction={logAction}
            initialCardId={selectedOccurrenceId}
            clearInitialCardId={() => setSelectedOccurrenceId(null)}
          />
        );
      case 'finished-occurrences':
        return (
          <FinishedOccurrences
            occurrences={occurrences}
            carriers={carriers}
            restoreOccurrence={restoreOccurrence}
          />
        );
      case 'carriers':
        return (
          <Carriers
            carriers={carriers}
            addCarrier={addCarrier}
            updateCarrier={updateCarrier}
            deleteCarrier={deleteCarrier}
            currentUser={currentUser}
            logAction={logAction}
          />
        );
      case 'new-occurrence':
        return (
          <NewOccurrence
            carriers={carriers}
            addOccurrence={addOccurrence}
            setActivePage={setActivePage}
            currentUser={currentUser}
            logAction={logAction}
            onGoToOccurrence={(id) => {
              setSelectedOccurrenceId(id);
              setActivePage('kanban');
            }}
          />
        );
      case 'users':
        return (
          <UsersPage
            users={users}
            onRefresh={fetchAllProfiles}
            currentUser={currentUser}
            logAction={logAction}
          />
        );
      case 'logs':
        return <AuditLogs logs={logs} />;
      default:
        return <Dashboard occurrences={occurrences} carriers={carriers} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 animate-pulse">Carregando LogiFix...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      occurrences={occurrences}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;