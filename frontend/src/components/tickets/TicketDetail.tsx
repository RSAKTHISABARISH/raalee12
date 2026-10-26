import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import { getTicket, getTicketHistory, updateTicket, addTicketComment, getTechnicians, getUser } from '../../lib/api';

interface TicketDetailProps {
  ticketId: number;
}

export default function TicketDetail({ ticketId: initialId }: TicketDetailProps) {
  // Support fallback from pathname in case SSR/hydration mismatch
  const resolvedTicketId = initialId || parseInt(typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean).pop() || '1' : '1', 10);

  const [ticket, setTicket] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusVal, setStatusVal] = useState('');
  const [techVal, setTechVal] = useState<string>('');
  const [comment, setComment] = useState('');
  const [quickComment, setQuickComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const currentUser = getUser();
  const isTech = currentUser?.role === 'TECHNICIAN';

  useEffect(() => {
    loadData();
  }, [resolvedTicketId]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      const [t, h, techs] = await Promise.all([
        getTicket(resolvedTicketId),
        getTicketHistory(resolvedTicketId),
        isTech ? getTechnicians().catch(() => []) : Promise.resolve([]),
      ]);
      setTicket(t);
      setHistory(h);
      setTechnicians(techs);
      setStatusVal(t.status);
      setTechVal(t.assignedTo?.id ? String(t.assignedTo.id) : (t.assignedToId ? String(t.assignedToId) : ''));
    } catch (err: any) {
      showToast(err.message || 'Failed to load ticket details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // SLA Calculation Helpers
  const getSlaHours = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 2;
      case 'HIGH': return 4;
      case 'MEDIUM': return 8;
      case 'LOW': return 24;
      default: return 8;
    }
  };

  const calculateSla = () => {
    if (!ticket) return null;
    const slaHours = getSlaHours(ticket.priority);
    const createdTime = new Date(ticket.createdAt).getTime();
    const targetTime = createdTime + slaHours * 3600 * 1000;
    const isCompleted = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
    
    // If completed, use updated time or now
    const endTime = isCompleted ? (ticket.updatedAt ? new Date(ticket.updatedAt).getTime() : Date.now()) : Date.now();
    const remainingMs = targetTime - endTime;
    const totalSlaMs = slaHours * 3600 * 1000;
    const percentElapsed = Math.min(100, Math.max(0, Math.round(((totalSlaMs - remainingMs) / totalSlaMs) * 100)));

    const isBreached = remainingMs < 0;
    const absDiff = Math.abs(remainingMs);
    const diffHours = Math.floor(absDiff / (1000 * 60 * 60));
    const diffMins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      slaHours,
      targetTime: new Date(targetTime),
      isBreached,
      isCompleted,
      percentElapsed,
      diffText: `${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m`,
    };
  };

  const slaInfo = calculateSla();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const payload: any = {
        status: statusVal,
      };
      if (techVal) {
        payload.assignedTo = parseInt(techVal, 10);
      }
      if (comment.trim()) {
        payload.comment = comment.trim();
      }
      await updateTicket(resolvedTicketId, payload);
      showToast('Ticket updated successfully!');
      setComment('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update ticket', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!currentUser?.id) return;
    setUpdating(true);
    try {
      await updateTicket(resolvedTicketId, {
        assignedTo: currentUser.id,
        status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
        comment: `Self-assigned by ${currentUser.name}`,
      });
      showToast('Assigned to you successfully!');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign ticket', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickResolve = async () => {
    const note = prompt('Enter resolution summary note (optional):', 'Issue resolved and verified with user.');
    if (note === null) return;
    setUpdating(true);
    try {
      await updateTicket(resolvedTicketId, {
        status: 'RESOLVED',
        comment: note || 'Resolved by technician',
      });
      showToast('Ticket marked as Resolved!');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve ticket', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickComment.trim()) return;
    setSubmittingComment(true);

    try {
      const prefix = isInternalNote ? '[INTERNAL NOTE] ' : '';
      await addTicketComment(resolvedTicketId, prefix + quickComment.trim());
      setQuickComment('');
      showToast(isInternalNote ? 'Internal note added' : 'Reply posted to ticket timeline');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add message', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Ticket URL copied to clipboard!', 'info');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
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
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen portal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-3 border-white border-t-transparent rounded-full"></div>
          <p className="text-sm font-medium text-white/80">Loading Incident #{resolvedTicketId}...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen portal-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md shadow-2xl">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#111111] mb-2">Ticket #{resolvedTicketId} Not Found</h2>
          <p className="text-xs text-[#666666] mb-6">This incident record does not exist or you do not have permission to view it.</p>
          <a
            href={isTech ? '/technician/dashboard' : '/dashboard'}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#333333] text-white text-xs font-semibold rounded-lg shadow-md transition-all"
          >
            ← Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen portal-bg">
      <Sidebar currentPage={isTech ? 'queue' : 'my-tickets'} />
      <main className="lg:ml-64 p-6 lg:p-8 max-w-5xl">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-900/90 text-white border-red-500 backdrop-blur-md'
              : toast.type === 'info'
              ? 'bg-blue-900/90 text-white border-blue-500 backdrop-blur-md'
              : 'bg-emerald-900/90 text-white border-emerald-500 backdrop-blur-md'
          }`}>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Navigation & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <a
            href={isTech ? '/technician/queue' : '/tickets/my'}
            className="inline-flex items-center text-xs font-semibold text-white/80 hover:text-white gap-1 transition-all"
          >
            ← Back to {isTech ? 'Support Queue' : 'My Tickets'}
          </a>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy Ticket URL"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg backdrop-blur-md transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Share Link
            </button>
            <button
              onClick={handlePrint}
              title="Print Incident Report"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg backdrop-blur-md transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Export / Print
            </button>
          </div>
        </div>

        {/* SLA Health Banner */}
        {slaInfo && (
          <div className={`mb-6 rounded-xl p-4 border backdrop-blur-md shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            slaInfo.isCompleted
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : slaInfo.isBreached
              ? 'bg-red-950/50 border-red-500/40 text-red-200 ring-1 ring-red-500/30 animate-pulse'
              : 'bg-sky-950/40 border-sky-500/30 text-sky-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                slaInfo.isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : slaInfo.isBreached
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-sky-500/20 text-sky-400'
              }`}>
                {slaInfo.isCompleted ? '✓' : slaInfo.isBreached ? '⚠️' : '⏱'}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {slaInfo.isCompleted
                    ? 'SLA Target Fulfilled'
                    : slaInfo.isBreached
                    ? `SLA Breached by ${slaInfo.diffText}`
                    : `SLA On Track (${slaInfo.diffText} remaining)`}
                </div>
                <div className="text-[11px] opacity-80">
                  Target: {slaInfo.slaHours}h resolution SLA • Due by {formatDate(slaInfo.targetTime.toISOString())}
                </div>
              </div>
            </div>

            {/* SLA Progress Bar */}
            {!slaInfo.isCompleted && (
              <div className="w-full md:w-56">
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span>Elapsed</span>
                  <span>{slaInfo.percentElapsed}%</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      slaInfo.isBreached ? 'bg-red-500' : slaInfo.percentElapsed > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${slaInfo.percentElapsed}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ticket Header Card */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-6 lg:p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#E5E5E5] pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#F0F0F0] text-[#111111] rounded">
                  #{ticket.id}
                </span>
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusClass(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority} PRIORITY
                </span>
                <span className="text-xs font-medium text-[#666666] bg-[#F5F5F5] px-2.5 py-1 rounded-md">
                  {ticket.category?.replace(/_/g, ' ')}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#111111]">{ticket.title}</h1>
            </div>

            {/* Technician Quick Action Bar */}
            {isTech && (
              <div className="flex items-center gap-2 flex-wrap">
                {ticket.assignedTo?.id !== currentUser?.id && (
                  <button
                    onClick={handleAssignToMe}
                    disabled={updating}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Assign to Me
                  </button>
                )}
                {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                  <button
                    onClick={handleQuickResolve}
                    disabled={updating}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Resolve Incident
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-2">Description</h3>
            <p className="text-sm text-[#333333] whitespace-pre-wrap leading-relaxed bg-[#FAFAFA] p-4 rounded-lg border border-[#F0F0F0]">
              {ticket.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E5E5E5] text-xs">
            <div>
              <span className="text-[#888888] block mb-1">Reported By</span>
              <span className="font-semibold text-[#111111]">{ticket.reportedBy?.name || ticket.createdByName || 'Employee'}</span>
              <span className="text-[#888888] block text-[11px]">{ticket.reportedBy?.email || ticket.createdByEmail}</span>
            </div>
            <div>
              <span className="text-[#888888] block mb-1">Role / Department</span>
              <span className="font-semibold text-[#111111]">{ticket.reportedBy?.role || 'EMPLOYEE'}</span>
            </div>
            <div>
              <span className="text-[#888888] block mb-1">Assigned Technician</span>
              <span className="font-semibold text-[#111111]">{ticket.assignedTo?.name || ticket.assignedToName || 'Unassigned'}</span>
              {ticket.assignedTo?.email && (
                <span className="text-[#888888] block text-[11px]">{ticket.assignedTo.email}</span>
              )}
            </div>
            <div>
              <span className="text-[#888888] block mb-1">Created / Updated</span>
              <span className="font-semibold text-[#111111] block">{formatDate(ticket.createdAt)}</span>
              {ticket.updatedAt && (
                <span className="text-[#888888] block text-[11px]">Updated: {formatDate(ticket.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Incident Communication Stream (Comments / Activity) */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-6 lg:p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#111111]">Incident Activity & Communication</h2>
              <p className="text-xs text-[#666666]">Direct updates between reporting employees and assigned support engineers</p>
            </div>
            {isTech && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#444444] bg-[#F5F5F5] px-3 py-1.5 rounded-lg border border-[#E0E0E0]">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Internal Tech Note Only</span>
              </label>
            )}
          </div>

          <form onSubmit={handleAddComment} className="mb-6">
            <div className="relative">
              <textarea
                rows={3}
                value={quickComment}
                onChange={(e) => setQuickComment(e.target.value)}
                placeholder={isInternalNote ? "Add internal technical diagnostics, root cause, or private notes..." : "Post a response or status update to the incident timeline..."}
                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden transition-all ${
                  isInternalNote ? 'border-amber-400 bg-amber-50/30' : 'border-[#E5E5E5] focus:border-[#111111]'
                }`}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submittingComment || !quickComment.trim()}
                  className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer ${
                    isInternalNote
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#111111] hover:bg-[#333333] text-white disabled:bg-[#CCCCCC]'
                  }`}
                >
                  {submittingComment ? 'Sending...' : isInternalNote ? 'Post Internal Note' : 'Send Message'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Lifecycle Management / Form (Technicians or Close action for Employee) */}
        {isTech && (
          <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-6 lg:p-8 mb-8 shadow-xl">
            <h2 className="text-lg font-bold text-[#111111] mb-1">Update Ticket Lifecycle</h2>
            <p className="text-xs text-[#666666] mb-6">Modify ticket status, assign technical owners, or record formal audit transitions</p>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="update-status" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                  Status
                </label>
                <select
                  id="update-status"
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] focus:outline-hidden focus:border-[#111111]"
                >
                  <option value="OPEN">OPEN (Under Review)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Work Underway)</option>
                  <option value="RESOLVED">RESOLVED (Fix Deployed)</option>
                  <option value="CLOSED">CLOSED (Confirmed Closed)</option>
                </select>
              </div>

              <div>
                <label htmlFor="update-tech" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                  Assigned Technician
                </label>
                <select
                  id="update-tech"
                  value={techVal}
                  onChange={(e) => setTechVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] focus:outline-hidden focus:border-[#111111]"
                >
                  <option value="">Unassigned</option>
                  {technicians.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.name} ({tc.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="update-comment" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                  Transition Audit Note / Resolution Details (Optional)
                </label>
                <textarea
                  id="update-comment"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Record formal justification, resolution verification, or customer sign-off..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111]"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-[#111111] hover:bg-[#333333] disabled:bg-[#888888] text-white text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-md"
                >
                  {updating ? 'Saving Changes...' : 'Save & Record in Audit Trail'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Audit Trail / Status History Timeline */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-[#111111] mb-1">Status History & Audit Trail</h2>
          <p className="text-xs text-[#666666] mb-6">Complete immutable record of all lifecycle transitions and notes</p>

          {history.length === 0 ? (
            <p className="text-xs text-[#888888]">No status history events recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E5]">
              {history.map((h, idx) => {
                const isInternal = h.comment && h.comment.startsWith('[INTERNAL NOTE]');
                return (
                  <div key={h.id || idx} className="relative">
                    <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                      isInternal ? 'bg-amber-500' : 'bg-[#111111]'
                    }`}></div>
                    <div className={`border rounded-xl p-4 shadow-xs ${
                      isInternal ? 'bg-amber-50/50 border-amber-200' : 'bg-[#FAFAFA] border-[#E5E5E5]'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-1">
                        <span className="font-semibold text-[#111111]">
                          {h.oldStatus && h.oldStatus !== h.newStatus ? (
                            <>
                              <span className="text-[#888888]">{h.oldStatus.replace('_', ' ')}</span> →{' '}
                              <span className="text-[#111111] font-bold">{h.newStatus.replace('_', ' ')}</span>
                            </>
                          ) : (
                            <span>{(h.newStatus || 'UPDATE').replace('_', ' ')} Event</span>
                          )}
                        </span>
                        <span className="text-[#888888] font-mono text-[11px]">{formatDate(h.changedAt || h.createdAt)}</span>
                      </div>
                      <div className="text-xs text-[#666666] flex items-center gap-2">
                        <span>Action recorded by: <strong className="text-[#111111]">{h.changedBy?.name || 'System Operator'}</strong></span>
                        {isInternal && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                            INTERNAL NOTE
                          </span>
                        )}
                      </div>
                      {h.comment && (
                        <div className="mt-2 text-xs text-[#333333] bg-white p-3 rounded-lg border border-[#E5E5E5] leading-relaxed whitespace-pre-wrap">
                          {isInternal ? h.comment.replace('[INTERNAL NOTE]', '').trim() : h.comment}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
