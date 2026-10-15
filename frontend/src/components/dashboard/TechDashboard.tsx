import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import { getDashboardMetrics, getAllTickets, getUser } from '../../lib/api';

export default function TechDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!user || user.role !== 'TECHNICIAN') { window.location.href = '/'; return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, t] = await Promise.all([getDashboardMetrics(), getAllTickets()]);
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
      <Sidebar currentPage="tech-dashboard" />
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Technician Dashboard</h1>
          <p className="text-sm text-white/70 mt-1">Real-time overview of all support operations.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Open Issues" value={metrics?.openTickets || 0} highlight />
              <MetricCard label="Urgent Requests" value={metrics?.openUrgentTickets || 0} urgent />
              <MetricCard label="Assigned Tickets" value={metrics?.assignedTickets || 0} />
              <MetricCard label="Completed" value={metrics?.completedTickets || 0} />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/20 p-5 shadow-xl">
                <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider">In Progress</p>
                <p className="text-2xl font-bold text-[#111111] mt-2">{metrics?.inProgressTickets || 0}</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/20 p-5 shadow-xl">
                <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Total Tickets</p>
                <p className="text-2xl font-bold text-[#111111] mt-2">{metrics?.totalTickets || 0}</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/20 p-5 shadow-xl">
                <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider">High Priority</p>
                <p className="text-2xl font-bold text-[#111111] mt-2">{metrics?.highPriorityTickets || 0}</p>
              </div>
            </div>

            {/* Quick Action */}
            <div className="mb-8">
              <a
                href="/technician/queue"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#111111] hover:bg-white/90 text-sm font-semibold rounded-lg shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
                </svg>
                Open Support Queue
              </a>
            </div>

            {/* Recent Urgent Tickets */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#111111]">Priority Tickets</h2>
                <a href="/technician/queue" className="text-sm text-[#666666] hover:text-[#111111] transition-colors">
                  View all →
                </a>
              </div>
              {tickets.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-[#D4D4D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-sm font-medium text-[#111111]">All clear</h3>
                  <p className="mt-1 text-sm text-[#666666]">No tickets in the queue at the moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E5E5]">
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">ID</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Title</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Reporter</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Priority</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Assigned</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F5]">
                      {tickets.slice(0, 8).map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-[#FAFAFA] transition-colors cursor-pointer" onClick={() => window.location.href = `/tickets/${ticket.id}`}>
                          <td className="px-6 py-3.5 text-sm text-[#666666]">#{ticket.id}</td>
                          <td className="px-6 py-3.5 text-sm font-medium text-[#111111]">{ticket.title}</td>
                          <td className="px-6 py-3.5 text-sm text-[#666666]">{ticket.reportedBy?.name || '—'}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getPriorityClass(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getStatusClass(ticket.status)}`}>
                              {formatStatus(ticket.status)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-[#666666]">{ticket.assignedTo?.name || '—'}</td>
                          <td className="px-6 py-3.5 text-sm text-[#666666]">{formatDate(ticket.createdAt)}</td>
                        </tr>
                      ))}
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

function MetricCard({ label, value, highlight, urgent }: { label: string; value: number; highlight?: boolean; urgent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 backdrop-blur-md shadow-xl transition-all ${
      urgent
        ? 'bg-[#111111]/95 text-white border-white/20 ring-1 ring-white/10'
        : 'bg-white/95 border-white/20 text-[#111111]'
    }`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${urgent ? 'text-white/70' : 'text-[#666666]'}`}>{label}</p>
      <p className={`text-3xl font-bold mt-2 ${urgent ? 'text-white' : 'text-[#111111]'}`}>{value}</p>
    </div>
  );
}
