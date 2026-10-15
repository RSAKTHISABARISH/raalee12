import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import { getTicket, getTicketHistory, updateTicket, getTechnicians, getUser } from '../../lib/api';

interface TicketDetailProps {
  ticketId: number;
}

export default function TicketDetail({ ticketId }: TicketDetailProps) {
  const [ticket, setTicket] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusVal, setStatusVal] = useState('');
  const [techVal, setTechVal] = useState<string>('');
  const [comment, setComment] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentUser = getUser();
  const isTech = currentUser?.role === 'TECHNICIAN';

  useEffect(() => {
    loadData();
  }, [ticketId]);

  const loadData = async () => {
    try {
      const [t, h, techs] = await Promise.all([
        getTicket(ticketId),
        getTicketHistory(ticketId),
        isTech ? getTechnicians().catch(() => []) : Promise.resolve([]),
      ]);
      setTicket(t);
      setHistory(h);
      setTechnicians(techs);
      setStatusVal(t.status);
      setTechVal(t.assignedToId ? String(t.assignedToId) : '');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: any = {
        status: statusVal,
      };
      if (techVal) {
        payload.assignedTo = parseInt(techVal, 10);
      }
      await updateTicket(ticketId, payload);
      setSuccessMsg('Ticket updated successfully!');
      setComment('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update ticket');
    } finally {
      setUpdating(false);
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
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="text-sm text-[#888888]">Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6">
        <h2 className="text-lg font-bold text-[#111111] mb-2">Ticket Not Found</h2>
        <a href={isTech ? '/technician/dashboard' : '/dashboard'} className="text-sm underline text-[#111111]">
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen portal-bg">
      <Sidebar currentPage={isTech ? 'queue' : 'my-tickets'} />
      <main className="lg:ml-64 p-6 lg:p-8 max-w-5xl">
        {/* Top Back Link */}
        <div className="mb-6">
          <a
            href={isTech ? '/technician/queue' : '/tickets/my'}
            className="inline-flex items-center text-xs font-semibold text-white/80 hover:text-white gap-1 transition-default"
          >
            ← Back to {isTech ? 'Support Queue' : 'My Tickets'}
          </a>
        </div>

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
                  {ticket.category?.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#111111]">{ticket.title}</h1>
            </div>
            <div className="text-xs text-[#888888] md:text-right">
              <div>Created: <span className="font-medium text-[#111111]">{formatDate(ticket.createdAt)}</span></div>
              {ticket.updatedAt && (
                <div className="mt-1">Updated: <span className="font-medium text-[#111111]">{formatDate(ticket.updatedAt)}</span></div>
              )}
            </div>
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
              <span className="font-semibold text-[#111111]">{ticket.createdByName || 'Employee'}</span>
              <span className="text-[#888888] block text-[11px]">{ticket.createdByEmail}</span>
            </div>
            <div>
              <span className="text-[#888888] block mb-1">Department</span>
              <span className="font-semibold text-[#111111]">{ticket.createdByDepartment || 'General'}</span>
            </div>
            <div>
              <span className="text-[#888888] block mb-1">Assigned Technician</span>
              <span className="font-semibold text-[#111111]">{ticket.assignedToName || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-[#888888] block mb-1">Resolution State</span>
              <span className="font-semibold text-[#111111]">{ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'Completed' : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Update Form (Technician or Close action for Employee) */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-6 lg:p-8 mb-8 shadow-xl">
          <h2 className="text-lg font-bold text-[#111111] mb-1">Update Ticket Lifecycle</h2>
          <p className="text-xs text-[#666666] mb-6">Modify ticket status, assign technical owners, or add audit notes</p>

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-[#FEE2E2] border border-[#DC2626] text-[#DC2626] text-xs rounded-lg">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3.5 bg-[#ECFDF5] border border-[#059669] text-[#059669] text-xs rounded-lg">
              {successMsg}
            </div>
          )}

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

            {isTech && (
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
                      {tc.name} ({tc.department || 'IT'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label htmlFor="update-comment" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                Status Change Note / Resolution Summary (Optional)
              </label>
              <textarea
                id="update-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Log diagnostic findings, software patch applied, or steps for the user..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111]"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                id="apply-update-btn"
                disabled={updating}
                className="px-6 py-2.5 bg-[#111111] hover:bg-[#333333] disabled:bg-[#888888] text-white text-sm font-medium rounded-lg transition-default cursor-pointer"
              >
                {updating ? 'Saving Changes...' : 'Save & Record in History'}
              </button>
            </div>
          </form>
        </div>

        {/* Audit Trail / Status History Timeline */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-[#111111] mb-1">Status History & Audit Trail</h2>
          <p className="text-xs text-[#666666] mb-6">Complete immutable record of all lifecycle transitions</p>

          {history.length === 0 ? (
            <p className="text-xs text-[#888888]">No status history events recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E5]">
              {history.map((h, idx) => (
                <div key={h.id || idx} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-[#111111] border-2 border-white"></div>
                  <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-1">
                      <span className="font-semibold text-[#111111]">
                        {(h.oldStatus || h.fromStatus) ? (
                          <>
                            <span className="text-[#888888]">{(h.oldStatus || h.fromStatus).replace('_', ' ')}</span> →{' '}
                            <span className="text-[#111111]">{(h.newStatus || h.toStatus).replace('_', ' ')}</span>
                          </>
                        ) : (
                          <span>Created ticket as {(h.newStatus || h.toStatus || 'OPEN').replace('_', ' ')}</span>
                        )}
                      </span>
                      <span className="text-[#888888]">{formatDate(h.changedAt || h.createdAt)}</span>
                    </div>
                    <div className="text-xs text-[#666666]">
                      Action recorded by: <span className="font-medium text-[#111111]">{h.changedBy?.name || h.changedByName || 'System'}</span>
                    </div>
                    {h.comment && (
                      <div className="mt-2 text-xs text-[#333333] bg-white p-2.5 rounded border border-[#EBEBEB]">
                        "{h.comment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
