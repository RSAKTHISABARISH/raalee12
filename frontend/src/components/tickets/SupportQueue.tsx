import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import { getAllTickets, getTechnicians, updateTicket, getUser } from '../../lib/api';

export default function SupportQueue() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const currentUser = getUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allTickets, techs] = await Promise.all([
        getAllTickets(),
        getTechnicians().catch(() => []),
      ]);
      setTickets(allTickets);
      setTechnicians(techs);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssign = async (ticketId: number, techId: number) => {
    setActionLoading(ticketId);
    try {
      await updateTicket(ticketId, { assignedTo: techId, status: 'IN_PROGRESS' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign technician');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setActionLoading(ticketId);
    try {
      await updateTicket(ticketId, { status: newStatus });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesSearch =
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.createdByName && t.createdByName.toLowerCase().includes(search.toLowerCase())) ||
      String(t.id).includes(search);

    return matchesStatus && matchesPriority && matchesSearch;
  });

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
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen portal-bg">
      <Sidebar currentPage="queue" />
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Support Queue</h1>
            <p className="text-sm text-white/70 mt-1">Manage, assign, and resolve incoming corporate IT requests</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg backdrop-blur-md transition-default cursor-pointer"
          >
            <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Queue
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-5 mb-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-80">
              <input
                type="text"
                placeholder="Search ticket, employee, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111]"
              />
            </div>
            {/* Status pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-default cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#F5F5F5] text-[#666666] hover:text-[#111111]'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Priority pills */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#F0F0F0]">
            <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider mr-2">Priority:</span>
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((pr) => (
              <button
                key={pr}
                onClick={() => setPriorityFilter(pr)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-default cursor-pointer ${
                  priorityFilter === pr
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#EAEAEA]'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Queue Table */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-sm text-[#888888]">Loading queue...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-[#111111]">No tickets match criteria</p>
              <p className="text-xs text-[#888888] mt-1">Try resetting the status or priority filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Reporter</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assignment</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      className={`hover:bg-[#F9F9F9] transition-default ${
                        t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
                          ? 'bg-[#FFFBEB]/40'
                          : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <a href={`/tickets/${t.id}`} className="font-semibold text-[#111111] hover:underline">
                            #{t.id} — {t.title}
                          </a>
                        </div>
                        <div className="text-xs text-[#666666] mt-0.5">
                          {t.category?.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${getPriorityClass(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-[#111111]">
                        {t.createdByName || 'Employee'}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={t.status}
                          disabled={actionLoading === t.id}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className={`text-xs font-semibold rounded-md px-2.5 py-1 cursor-pointer border-0 ${getStatusClass(t.status)}`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        {t.assignedToName ? (
                          <span className="text-xs font-medium text-[#111111] bg-[#F5F5F5] px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                            {t.assignedToName}
                          </span>
                        ) : (
                          <button
                            disabled={actionLoading === t.id}
                            onClick={() => handleQuickAssign(t.id, currentUser.id)}
                            className="text-xs font-semibold text-[#111111] hover:bg-[#111111] hover:text-white border border-[#111111] px-2.5 py-1 rounded-md transition-default cursor-pointer"
                          >
                            Claim Ticket
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-[#888888] whitespace-nowrap">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <a
                          href={`/tickets/${t.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-[#111111] text-white hover:bg-[#333333] rounded-md transition-default"
                        >
                          Manage
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
