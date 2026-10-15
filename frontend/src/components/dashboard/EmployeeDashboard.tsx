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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-white/70 mt-1">Here's an overview of your support activity.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard label="My Open Tickets" value={tickets.filter(t => t.status === 'OPEN').length} />
              <MetricCard label="In Progress" value={tickets.filter(t => t.status === 'IN_PROGRESS').length} />
              <MetricCard label="Resolved" value={tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length} />
              <MetricCard label="Total Tickets" value={tickets.length} />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <a
                href="/tickets/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#111111] hover:bg-white/90 text-sm font-semibold rounded-lg shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Submit New Ticket
              </a>
            </div>

            {/* Recent Tickets */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#111111]">Recent Tickets</h2>
                <a href="/tickets/my" className="text-sm text-[#666666] hover:text-[#111111] transition-colors">
                  View all →
                </a>
              </div>
              {tickets.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-[#D4D4D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  <h3 className="mt-4 text-sm font-medium text-[#111111]">No tickets yet</h3>
                  <p className="mt-1 text-sm text-[#666666]">Get started by submitting your first support ticket.</p>
                  <a
                    href="/tickets/create"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#111111] text-white text-sm rounded-lg hover:bg-[#333333] transition-all"
                  >
                    Create Ticket
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E5E5]">
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">ID</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Title</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Priority</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F5]">
                      {tickets.slice(0, 5).map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-[#FAFAFA] transition-colors cursor-pointer" onClick={() => window.location.href = `/tickets/${ticket.id}`}>
                          <td className="px-6 py-3.5 text-sm text-[#666666]">#{ticket.id}</td>
                          <td className="px-6 py-3.5 text-sm font-medium text-[#111111]">{ticket.title}</td>
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/20 p-5 shadow-xl">
      <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-[#111111] mt-2">{value}</p>
    </div>
  );
}
