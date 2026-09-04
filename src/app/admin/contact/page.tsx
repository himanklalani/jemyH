'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle2, Circle, Clock, MessageSquare, Loader2, Search } from 'lucide-react';

export default function AdminContactInboxPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const router = useRouter();

  const fetchContacts = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin/login');

    try {
      const url = `/api/admin/contact${selectedStatus ? `?status=${selectedStatus}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [selectedStatus]);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8"><div className="w-8 h-8 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin mx-auto mt-20"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Support Inbox</h1>
          <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Manage customer inquiries and styling requests.</p>
        </div>
        
        <div className="flex bg-[var(--color-admin-surface)] p-1 rounded-lg border border-[var(--color-admin-border)]">
          {['', 'open', 'replied', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-colors ${selectedStatus === status ? 'bg-[var(--color-admin-bg)] text-[var(--color-gold-primary)] shadow' : 'text-[var(--color-admin-text-muted)] hover:text-white'}`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-admin-surface)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
             <MessageSquare size={48} className="text-[var(--color-admin-text-muted)] opacity-20 mb-4" />
             <p className="text-[var(--color-admin-text-muted)] text-sm mt-2">No messages found in this category.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-admin-border)]">
            {contacts.map((contact) => (
              <div key={contact._id} className={`p-6 transition-colors ${contact.status === 'open' ? 'bg-[var(--color-admin-bg)]/50' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${contact.status === 'open' ? 'bg-red-500' : contact.status === 'resolved' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <h3 className="font-bold text-[var(--color-admin-text)] text-lg">{contact.subject}</h3>
                    <span className="text-xs text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)] px-2 py-1 rounded-md">
                      {new Date(contact.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {contact.status !== 'resolved' && (
                      <button 
                        onClick={() => updateStatus(contact._id, 'resolved')}
                        disabled={actionLoading === contact._id}
                        className="flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-green-500 hover:text-white transition-colors"
                      >
                        {actionLoading === contact._id ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Resolve</>}
                      </button>
                    )}
                    {contact.status === 'open' && (
                      <button 
                        onClick={() => updateStatus(contact._id, 'replied')}
                        disabled={actionLoading === contact._id}
                        className="flex items-center gap-2 bg-[var(--color-admin-bg)] text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)] px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:text-[var(--color-gold-primary)] hover:border-[var(--color-gold-primary)] transition-colors"
                      >
                        {actionLoading === contact._id ? <Loader2 size={14} className="animate-spin" /> : <><Mail size={14} /> Mark Replied</>}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-3 space-y-4">
                    <div className="bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] p-4 rounded-lg">
                      <p className="text-[var(--color-admin-text)] text-sm whitespace-pre-wrap font-serif leading-relaxed">
                        {contact.message}
                      </p>
                    </div>
                  </div>
                  
                  <div className="col-span-1 border-l border-[var(--color-admin-border)] pl-6 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-1">Customer</p>
                      <p className="text-sm font-semibold text-[var(--color-admin-text)]">{contact.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-1">Email</p>
                      <a href={`mailto:${contact.email}`} className="text-sm text-[var(--color-gold-primary)] hover:underline">{contact.email}</a>
                    </div>
                    {contact.phone && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-1">Phone</p>
                        <p className="text-sm text-[var(--color-admin-text)]">{contact.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
