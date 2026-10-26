import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import { getAllTickets, getTechnicians, updateTicket, getUser } from '../../lib/api';

export default function SupportQueue() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('SLA');
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

  const getSlaHours = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 2;
      case 'HIGH': return 4;
      case 'MEDIUM': return 8;
      case 'LOW': return 24;
      default: return 8;
    }
  };

  const getSlaDetails = (ticket: any) => {
    const slaHours = getSlaHours(ticket.priority);
    const createdTime = new Date(ticket.createdAt).getTime();
    const targetTime = createdTime + slaHours * 3600 * 1000;
    const isCompleted = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
    const now = Date.now();
    const remainingMs = targetTime - now;
    const isBreached = !isCompleted && remainingMs < 0;
    const isDueSoon = !isCompleted && remainingMs > 0 && remainingMs <= 2 * 3600 * 1000;

    const absDiff = Math.abs(remainingMs);
    const diffHours = Math.floor(absDiff / (1000 * 60 * 60));
    const diffMins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      isCompleted,
      isBreached,
      isDueSoon,
      remainingMs,
      badgeText: isCompleted ? 'Resolved' : isBreached ? `Breached by ${diffHours}h ${diffMins}m` : `${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m left`,
    };
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const sla = getSlaDetails(t);
    const matchesSla =
      slaFilter === 'ALL' ||
      (slaFilter === 'BREACHED' && sla.isBreached) ||
      (slaFilter === 'DUE_SOON' && sla.isDueSoon) ||
      (slaFilter === 'ON_TRACK' && !sla.isBreached && !sla.isCompleted);

    const matchesSearch =
      search === '' ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      (t.reportedBy?.name && t.reportedBy.name.toLowerCase().includes(search.toLowerCase())) ||
      (t.createdByName && t.createdByName.toLowerCase().includes(search.toLowerCase())) ||
      String(t.id).includes(search);

    return matchesStatus && matchesPriority && matchesCategory && matchesSla && matchesSearch;
  });

  // Sort
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'SLA') {
      const aSla = getSlaDetails(a);
      const bSla = getSlaDetails(b);
      if (aSla.isBreached && !bSla.isBreached) return -1;
      if (!aSla.isBreached && bSla.isBreached) return 1;
      return aSla.remainingMs - bSla.remainingMs;
    }
    if (sortBy === 'PRIORITY') {
      const pMap: any = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (pMap[a.priority] ?? 4) - (pMap[b.priority] ?? 4);
    }
    if (sortBy === 'OLDEST') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Priority', 'Status', 'Category', 'Reporter', 'Assigned To', 'Created At'];
    const rows = sortedTickets.map((t) => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      t.category,
      `"${(t.reportedBy?.name || t.createdByName || 'Employee').replace(/"/g, '""')}"`,
      `"${(t.assignedTo?.name || t.assignedToName || 'Unassigned').replace(/"/g, '""')}"`,
      t.createdAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HelpDesk360_IncidentQueue_${new Date().toISOString().slice(0, 10)}.csv`);
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
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // KPI calculations
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const breachedCount = tickets.filter(t => getSlaDetails(t).isBreached).length;
  const unassignedCount = tickets.filter(t => !t.assignedTo?.id && !t.assignedToId && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

  return (
    <div className="min-h-screen portal-bg">
      <Sidebar currentPage="queue" />
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Support Queue</h1>
            <p className="text-sm text-white/70 mt-1">Real-time triage, SLA escalation tracking, and technical dispatch</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg backdrop-blur-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg backdrop-blur-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Live Operational Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] block">Unassigned Backlog</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{unassignedCount}</span>
            <span className="text-[11px] text-[#888888]">Awaiting initial technician dispatch</span>
          </div>
          <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] block">In Active Work</span>
            <span className="text-2xl font-extrabold text-sky-600 mt-1 block">{inProgressCount}</span>
            <span className="text-[11px] text-[#888888]">Currently in progress</span>
          </div>
          <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] block">SLA Breached</span>
            <span className="text-2xl font-extrabold text-red-600 mt-1 block">{breachedCount}</span>
            <span className="text-[11px] text-red-500 font-semibold">Immediate escalation required</span>
          </div>
          <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] block">Total Incidents</span>
            <span className="text-2xl font-extrabold text-[#111111] mt-1 block">{tickets.length}</span>
            <span className="text-[11px] text-[#888888]">Recorded in system</span>
          </div>
        </div>

        {/* Multi-Filter & Search Controls */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-5 mb-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-80">
              <input
                type="text"
                placeholder="Search by ticket #, employee, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111] shadow-xs"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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

          {/* Secondary Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#F0F0F0]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider mr-1">Priority:</span>
              {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((pr) => (
                <button
                  key={pr}
                  onClick={() => setPriorityFilter(pr)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    priorityFilter === pr
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#EAEAEA]'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>

            {/* Category & SLA Dropdowns */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-[#666666]">
                <span className="font-semibold text-[#888888]">SLA:</span>
                <select
                  value={slaFilter}
                  onChange={(e) => setSlaFilter(e.target.value)}
                  className="bg-white border border-[#E0E0E0] rounded-lg px-2.5 py-1 text-xs text-[#111111] focus:outline-hidden"
                >
                  <option value="ALL">All SLAs</option>
                  <option value="BREACHED">⚠️ Breached Only</option>
                  <option value="DUE_SOON">⚡ Due Soon (&lt;2h)</option>
                  <option value="ON_TRACK">✓ On Track</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-[#666666]">
                <span className="font-semibold text-[#888888]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-[#E0E0E0] rounded-lg px-2.5 py-1 text-xs text-[#111111] focus:outline-hidden"
                >
                  <option value="SLA">SLA Urgency</option>
                  <option value="PRIORITY">Highest Priority</option>
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Queue Table */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-16 text-center text-sm text-[#888888]">Loading corporate incident queue...</div>
          ) : sortedTickets.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-sm font-bold text-[#111111]">No tickets matching active filters</p>
              <p className="text-xs text-[#888888] mt-1">Adjust search terms or reset the status/SLA filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    <th className="py-3 px-4">Incident</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">SLA Countdown</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Tech</th>
                    <th className="py-3 px-4">Reporter</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {sortedTickets.map((t) => {
                    const sla = getSlaDetails(t);
                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-[#F9F9F9] transition-all ${
                          sla.isBreached ? 'bg-red-50/40' : t.priority === 'URGENT' ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-4 px-4 max-w-xs">
                          <a href={`/tickets/${t.id}`} className="font-semibold text-[#111111] hover:underline block truncate">
                            #{t.id} — {t.title}
                          </a>
                          <span className="text-[11px] text-[#666666]">
                            {t.category?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${getPriorityClass(t.priority)}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            sla.isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : sla.isBreached
                              ? 'bg-red-100 text-red-800 ring-1 ring-red-400'
                              : sla.isDueSoon
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}>
                            {sla.badgeText}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
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
                        <td className="py-4 px-4 whitespace-nowrap">
                          {t.assignedTo?.name || t.assignedToName ? (
                            <span className="text-xs font-medium text-[#111111] bg-[#F5F5F5] px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                              {t.assignedTo?.name || t.assignedToName}
                            </span>
                          ) : (
                            <button
                              disabled={actionLoading === t.id}
                              onClick={() => handleQuickAssign(t.id, currentUser?.id || 1)}
                              className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 px-2.5 py-1 rounded-md transition-all cursor-pointer shadow-xs"
                            >
                              + Claim Ticket
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-[#111111] whitespace-nowrap">
                          {t.reportedBy?.name || t.createdByName || 'Employee'}
                        </td>
                        <td className="py-4 px-4 text-xs text-[#888888] whitespace-nowrap">
                          {formatDate(t.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <a
                            href={`/tickets/${t.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-[#111111] text-white hover:bg-[#333333] rounded-lg transition-all shadow-xs"
                          >
                            Manage →
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
