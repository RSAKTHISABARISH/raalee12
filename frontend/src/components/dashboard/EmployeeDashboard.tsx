import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import { getDashboardMetrics, getMyTickets, getUser } from '../../lib/api';

export default function EmployeeDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!user) { window.location.href = '/'; return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, t] = await Promise.all([getDashboardMetrics(), getMyTickets()]);
      setMetrics(m);
      setTickets(t);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getSlaHours = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 2;
      case 'HIGH': return 4;
      case 'MEDIUM': return 8;
      case 'LOW': return 24;
      default: return 8;
    }
  };

  const getSlaBadge = (ticket: any) => {
    const isCompleted = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
    if (isCompleted) {
      return { text: '✓ Resolved', class: 'bg-emerald-100 text-emerald-800' };
    }
    const slaHours = getSlaHours(ticket.priority);
    const target = new Date(ticket.createdAt).getTime() + slaHours * 3600 * 1000;
    const remaining = target - Date.now();
    if (remaining < 0) {
      return { text: '⚠️ Breached', class: 'bg-red-100 text-red-800 font-bold' };
    }
    const mins = Math.floor(remaining / (1000 * 60));
    const hours = Math.floor(mins / 60);
    return {
      text: `${hours > 0 ? `${hours}h ` : ''}${mins % 60}m left`,
      class: 'bg-sky-100 text-sky-800',
    };
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'RESOLVED': return 'status-resolved';
      case 'CLOSED': return 'status-closed';
      default: return '';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'priority-urgent';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  };

  const formatStatus = (s: string) => s.replace('_', ' ').replace(/-/g, ' ');

  return (
    <div className="min-h-screen portal-bg">
      <Sidebar currentPage="dashboard" />
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Employee'}</h1>
            <p className="text-sm text-white/70 mt-1">Here is an overview of your active support requests and SLA status.</p>
          </div>
          <a
            href="/tickets/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#111111] hover:bg-white/90 text-sm font-semibold rounded-xl shadow-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Submit New Incident
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-3 border-white border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard label="My Open Tickets" value={tickets.filter(t => t.status === 'OPEN').length} sub="Under initial review" />
              <MetricCard label="In Active Work" value={tickets.filter(t => t.status === 'IN_PROGRESS').length} sub="Technician working" />
              <MetricCard label="Resolved / Closed" value={tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length} sub="Successfully completed" />
              <MetricCard label="Total Requests" value={tickets.length} sub="Lifetime submissions" />
            </div>

            {/* Recent Tickets Table */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#111111]">Recent Support Incidents</h2>
                  <p className="text-xs text-[#666666]">Track progress and live technician notes</p>
                </div>
                <a href="/tickets/my" className="text-xs font-semibold text-[#111111] hover:underline">
                  View all tickets →
                </a>
              </div>
              {tickets.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <h3 className="mt-4 text-sm font-medium text-[#111111]">No tickets submitted yet</h3>
                  <p className="mt-1 text-xs text-[#666666]">Submit your first IT service request to get assistance.</p>
                  <a
                    href="/tickets/create"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-[#333333] transition-all"
                  >
                    + Create Ticket
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wider text-[#666666]">
                        <th className="py-3 px-6">Incident</th>
                        <th className="py-3 px-6">Priority</th>
                        <th className="py-3 px-6">SLA Status</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Created</th>
                        <th className="py-3 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F5]">
                      {tickets.slice(0, 6).map((ticket) => {
                        const sla = getSlaBadge(ticket);
                        return (
                          <tr
                            key={ticket.id}
                            className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                            onClick={() => window.location.href = `/tickets/${ticket.id}`}
                          >
                            <td className="px-6 py-4 max-w-xs">
                              <span className="font-semibold text-[#111111] block truncate">
                                #{ticket.id} — {ticket.title}
                              </span>
                              <span className="text-[11px] text-[#888888]">{ticket.category?.replace(/_/g, ' ')}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md ${getPriorityClass(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sla.class}`}>
                                {sla.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusClass(ticket.status)}`}>
                                {formatStatus(ticket.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-[#888888] whitespace-nowrap">
                              {formatDate(ticket.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <span className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                                View Details →
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl transition-all">
      <p className="text-xs font-bold text-[#666666] uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-extrabold text-[#111111] mt-2">{value}</p>
      {sub && <p className="text-[11px] text-[#888888] mt-1.5">{sub}</p>}
    </div>
  );
}
