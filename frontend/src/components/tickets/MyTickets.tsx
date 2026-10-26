import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import { getMyTickets } from '../../lib/api';

export default function MyTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
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
      return { text: '✓ SLA Met', class: 'bg-emerald-100 text-emerald-800' };
    }
    const slaHours = getSlaHours(ticket.priority);
    const createdTime = new Date(ticket.createdAt).getTime();
    const targetTime = createdTime + slaHours * 3600 * 1000;
    const remainingMs = targetTime - Date.now();

    if (remainingMs < 0) {
      return { text: '⚠️ SLA Breached', class: 'bg-red-100 text-red-800 font-bold' };
    }
    const diffHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const diffMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      text: `⏱ ${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m left`,
      class: 'bg-sky-100 text-sky-800',
    };
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      search === '' ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).includes(search);
    return matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Priority', 'Status', 'Category', 'Created At'];
    const rows = filteredTickets.map((t) => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      t.category,
      t.createdAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `My_HelpDesk_Incidents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen portal-bg">
      <Sidebar currentPage="my-tickets" />
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Support Tickets</h1>
            <p className="text-sm text-white/70 mt-1">Real-time status tracking for all your corporate IT requests</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <a
              href="/tickets/create"
              id="new-ticket-action-btn"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-[#111111] hover:bg-white/90 text-sm font-semibold rounded-xl transition-all shadow-lg"
            >
              + Create New Ticket
            </a>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search by ticket #, title, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111] shadow-xs"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'bg-[#F5F5F5] text-[#666666] hover:text-[#111111]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Table / List */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-16 text-center text-sm text-[#888888]">Loading your tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-[#111111]">No tickets found</p>
              <p className="text-xs text-[#888888] mt-1">Submit a new request or adjust your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    <th className="py-3 px-4">Incident</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">SLA Status</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredTickets.map((t) => {
                    const slaBadge = getSlaBadge(t);
                    return (
                      <tr key={t.id} className="hover:bg-[#F9F9F9] transition-all">
                        <td className="py-4 px-4 max-w-xs">
                          <a href={`/tickets/${t.id}`} className="font-semibold text-[#111111] hover:underline block truncate">
                            #{t.id} — {t.title}
                          </a>
                          <span className="text-xs text-[#888888] line-clamp-1 mt-0.5">{t.description}</span>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-[#444444] whitespace-nowrap">
                          {t.category?.replace(/_/g, ' ')}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${getPriorityClass(t.priority)}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full ${slaBadge.class}`}>
                            {slaBadge.text}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusClass(t.status)}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-[#666666] whitespace-nowrap">
                          {t.assignedTo?.name || t.assignedToName || 'Unassigned'}
                        </td>
                        <td className="py-4 px-4 text-xs text-[#888888] whitespace-nowrap">
                          {formatDate(t.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <a
                            href={`/tickets/${t.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold border border-[#E5E5E5] hover:border-[#111111] rounded-lg transition-all shadow-xs"
                          >
                            View Incident →
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
