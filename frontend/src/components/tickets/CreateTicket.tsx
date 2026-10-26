import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import { createTicket } from '../../lib/api';

const CATEGORIES = [
  { value: 'HARDWARE', label: 'Hardware (Monitors, Laptops, Peripherals)' },
  { value: 'SOFTWARE', label: 'Software & Business Applications' },
  { value: 'NETWORK', label: 'Network, VPN & WiFi Connectivity' },
  { value: 'ACCOUNT_ACCESS', label: 'Account Access, SSO & Permissions' },
  { value: 'OTHER', label: 'General Technical Inquiry' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', desc: 'Minor inconvenience / general question', sla: '24 hours' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Standard business workflow impact', sla: '8 hours' },
  { value: 'HIGH', label: 'High', desc: 'Critical workflow impaired for user', sla: '4 hours' },
  { value: 'URGENT', label: 'Urgent', desc: 'System outage / mission critical incident', sla: '2 hours' },
];

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SOFTWARE');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Smart suggestion detection
  const detectSmartSuggestions = () => {
    const text = (title + ' ' + description).toLowerCase();
    let suggestedCat = null;
    let suggestedPri = null;

    if (text.includes('vpn') || text.includes('wifi') || text.includes('network') || text.includes('dns') || text.includes('internet')) {
      suggestedCat = 'NETWORK';
    } else if (text.includes('password') || text.includes('login') || text.includes('access') || text.includes('permission') || text.includes('mfa')) {
      suggestedCat = 'ACCOUNT_ACCESS';
    } else if (text.includes('laptop') || text.includes('monitor') || text.includes('screen') || text.includes('keyboard') || text.includes('printer')) {
      suggestedCat = 'HARDWARE';
    }

    if (text.includes('outage') || text.includes('crash') || text.includes('emergency') || text.includes('down') || text.includes('critical') || text.includes('blocked')) {
      suggestedPri = 'URGENT';
    } else if (text.includes('error') || text.includes('failed') || text.includes('broken')) {
      suggestedPri = 'HIGH';
    }

    return { suggestedCat, suggestedPri };
  };

  const smart = detectSmartSuggestions();
  const hasSuggestion = (smart.suggestedCat && smart.suggestedCat !== category) || (smart.suggestedPri && smart.suggestedPri !== priority);

  const applySuggestions = () => {
    if (smart.suggestedCat) setCategory(smart.suggestedCat);
    if (smart.suggestedPri) setPriority(smart.suggestedPri);
  };

  const handleSimulateAttachment = () => {
    const filename = `system-log-${Date.now().toString().slice(-4)}.log`;
    setAttachedFiles([...attachedFiles, filename]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Please provide a ticket title.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a detailed description of the incident.');
      return;
    }

    setLoading(true);
    try {
      const extraDesc = attachedFiles.length > 0
        ? `${description.trim()}\n\n[Attached Artifacts: ${attachedFiles.join(', ')}]`
        : description.trim();

      const created = await createTicket({
        title: title.trim(),
        description: extraDesc,
        category,
        priority,
      });

      setSuccess('Incident reported successfully! Redirecting to tracking view...');
      setTimeout(() => {
        window.location.href = `/tickets/${created.id}`;
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket.');
      setLoading(false);
    }
  };

  const activePriorityObj = PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];

  return (
    <div className="min-h-screen portal-bg">
      <Sidebar currentPage="create" />
      <main className="lg:ml-64 p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Support Incident</h1>
          <p className="text-sm text-white/70 mt-1">Submit your technical service request for immediate dispatch</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-xl flex items-center gap-3 shadow-lg">
            <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 text-sm rounded-xl flex items-center gap-3 shadow-lg animate-bounce">
            <svg className="w-5 h-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">
          {/* Smart Triage Notification Chip */}
          {hasSuggestion && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">✨</span>
                <div className="text-xs text-indigo-950 font-medium">
                  <strong>Smart Triage detected keywords:</strong> Consider category{' '}
                  {smart.suggestedCat && <span className="font-bold underline">{smart.suggestedCat}</span>}
                  {smart.suggestedPri && <> and priority <span className="font-bold underline">{smart.suggestedPri}</span></>}.
                </div>
              </div>
              <button
                type="button"
                onClick={applySuggestions}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-xs"
              >
                Apply Suggestion
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="ticket-title" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
              Incident Summary / Title <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="ticket-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unable to connect to Corporate VPN from remote location"
              className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111] shadow-xs"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="ticket-category" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                Service Category <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="ticket-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] shadow-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ticket-priority" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                Business Priority <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] shadow-xs"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} Priority ({p.desc})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic SLA Expectation Card */}
          <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                ⏱
              </div>
              <div>
                <span className="font-bold text-[#111111] block">Service Level Agreement (SLA)</span>
                <span className="text-[#666666]">
                  {priority} Priority guarantees initial technician intervention and resolution target within{' '}
                  <strong className="text-[#111111]">{activePriorityObj.sla}</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="ticket-desc" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
              Detailed Description & Steps to Reproduce <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              id="ticket-desc"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact error messages, affected device/workstation IDs, troubleshooting steps already tried, and business impact..."
              className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111] shadow-xs"
            />
          </div>

          {/* Attachment Simulator */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
              Diagnostic Logs & Attachments
            </label>
            <div className="border border-dashed border-[#CCCCCC] rounded-xl p-4 bg-[#FAFAFA] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#666666]">
                {attachedFiles.length === 0 ? (
                  <span>Attach screenshots, error trace logs, or diagnostic dumps (optional)</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E0E0E0] rounded-md font-mono text-[11px] text-[#111111]">
                        📄 {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSimulateAttachment}
                className="px-3.5 py-1.5 bg-white hover:bg-[#F0F0F0] text-[#111111] border border-[#CCCCCC] text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                + Attach System Log
              </button>
            </div>
          </div>

          {/* Submission Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
            <a
              href="/dashboard"
              className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 bg-[#111111] hover:bg-[#333333] disabled:bg-[#888888] text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Dispatching Incident...</span>
                </>
              ) : (
                <>
                  <span>Submit Support Incident</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
