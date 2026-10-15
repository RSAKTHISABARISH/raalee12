import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import { createTicket } from '../../lib/api';

const CATEGORIES = [
  { value: 'HARDWARE', label: 'Hardware (Monitors, Keyboards, Laptops)' },
  { value: 'SOFTWARE', label: 'Software & Application Issues' },
  { value: 'NETWORK', label: 'Network & VPN Connectivity' },
  { value: 'ACCESS_RIGHTS', label: 'Access Rights & Security Permissions' },
  { value: 'OTHER', label: 'Other Inquiries' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', desc: 'Minor issue, general question' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Standard business impact' },
  { value: 'HIGH', label: 'High', desc: 'Work impaired for single user' },
  { value: 'URGENT', label: 'Urgent', desc: 'System outage / mission critical' },
];

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SOFTWARE');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setLoading(true);
    try {
      const created = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      setSuccess('Support ticket created successfully!');
      setTimeout(() => {
        window.location.href = `/tickets/${created.id}`;
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen portal-bg">
      <Sidebar currentPage="create" />
      <main className="lg:ml-64 p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Support Ticket</h1>
          <p className="text-sm text-white/70 mt-1">Submit your IT service request to the technician team</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#DC2626] text-[#DC2626] text-sm rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-[#ECFDF5] border border-[#059669] text-[#059669] text-sm rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-6 lg:p-8 shadow-xl">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="ticket-title" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                Ticket Title <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="ticket-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dual monitor display flickers or VPN connection timeout"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-default"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="ticket-category" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                Issue Category <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="ticket-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-default"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                Urgency & Priority <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.value;
                  return (
                    <button
                      type="button"
                      key={p.value}
                      id={`priority-${p.value.toLowerCase()}`}
                      onClick={() => setPriority(p.value)}
                      className={`p-3.5 text-left border rounded-lg transition-default cursor-pointer ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-white'
                          : 'border-[#E5E5E5] bg-white text-[#111111] hover:border-[#CCCCCC]'
                      }`}
                    >
                      <div className="font-semibold text-sm">{p.label}</div>
                      <div className={`text-xs mt-1 ${isSelected ? 'text-[#CCCCCC]' : 'text-[#666666]'}`}>
                        {p.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="ticket-desc" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                Detailed Description <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                id="ticket-desc"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide steps to reproduce, error codes, device serial numbers, or impact on your workflow..."
                className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-default resize-y"
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
              <a
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-medium text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-lg transition-default"
              >
                Cancel
              </a>
              <button
                type="submit"
                id="submit-ticket-btn"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#111111] hover:bg-[#333333] disabled:bg-[#888888] rounded-lg transition-default flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Ticket</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
