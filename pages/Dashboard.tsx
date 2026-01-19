import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, PackageX, CheckCircle } from 'lucide-react';
import { Occurrence, Carrier, OccurrenceStatus } from '../types';

interface DashboardProps {
  occurrences: Occurrence[];
  carriers: Carrier[];
}

const Dashboard: React.FC<DashboardProps> = ({ occurrences, carriers }) => {
  const [hiddenCarrierKeys, setHiddenCarrierKeys] = useState<string[]>([]);

  // Calculations
  const totalIssues = occurrences.length;
  const activeIssues = occurrences.filter(o => o.status !== OccurrenceStatus.DONE).length;
  const financialDisputes = occurrences.filter(o => o.flagInvoiceDispute).length;
  const lostReturns = occurrences.filter(o => o.flagLostReturn).length;
  const completedIssues = occurrences.filter(o => o.status === OccurrenceStatus.DONE).length;

  // Data for Charts
  const dataByCarrier = carriers.map(c => ({
    name: c.name,
    total: occurrences.filter(o => o.carrierId === c.id).length,
    active: occurrences.filter(o => o.carrierId === c.id && o.status !== OccurrenceStatus.DONE).length
  }));

  const dataByStatus = Object.values(OccurrenceStatus).map(status => ({
    name: status,
    value: occurrences.filter(o => o.status === status).length
  }));

  const COLORS = ['#0088FE', '#00C49F', '#818cf8', '#FFBB28', '#FF8042', '#8884d8'];

  // Identify problematic regions
  const regionCount: Record<string, number> = {};
  occurrences.forEach(o => { regionCount[o.state] = (regionCount[o.state] || 0) + 1; });
  const dataByRegion = Object.keys(regionCount)
    .map(key => ({ name: key, value: regionCount[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  const toggleCarrierLegend = (e: any) => {
    const { dataKey } = e;
    setHiddenCarrierKeys(prev =>
      prev.includes(dataKey) ? prev.filter(k => k !== dataKey) : [...prev, dataKey]
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Visão geral da performance logística e financeira.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Ocorrências</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalIssues}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-600">{activeIssues} ativas no momento</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Ocorrências Concluídas</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{completedIssues}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-600">Casos resolvidos com sucesso</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Contestar Fatura</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{financialDisputes}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-amber-600 font-medium">Ação Financeira Necessária</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Extravios (Devolução)</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{lostReturns}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-600">Requer reembolso integral</span>
          </div>
        </div>
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Ocorrências por Transportadora</h3>
          <p className="text-xs text-slate-400 mb-4">Clique na legenda para filtrar</p>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataByCarrier}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12, fill: '#475569' }}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend onClick={toggleCarrierLegend} cursor="pointer" verticalAlign="top" height={36} />
                <Bar
                  dataKey="total"
                  name="Total Histórico"
                  fill="#cbd5e1"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                  hide={hiddenCarrierKeys.includes('total')}
                />
                <Bar
                  dataKey="active"
                  name="Em Aberto"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                  hide={hiddenCarrierKeys.includes('active')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Status do Pipeline</h3>
          <p className="text-xs text-slate-400 mb-4">Distribuição atual dos chamados</p>
          <div className="h-[400px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Region Analysis */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Estados com Mais Problemas (Top 5)</h3>
        <div className="space-y-4">
          {dataByRegion.map((region, idx) => {
            const maxVal = dataByRegion[0]?.value || 1;
            const percent = Math.round((region.value / totalIssues) * 100);
            const widthPercent = (region.value / maxVal) * 100;

            return (
              <div key={region.name} className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg text-xl font-bold text-slate-700">
                  {region.name}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">{region.value} Ocorrências</span>
                    <span className="text-xs text-slate-500 font-medium">{percent}% do total</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;