'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldAlert, KeyRound, CheckCircle2, User, Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const fetchUsers = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin/login');

    try {
      const res = await fetch(`/api/admin/users?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleAction = async (id: string, action: 'suspend' | 'activate' | 'reset-password') => {
    if (action === 'reset-password') {
      if (!confirm('This will invalidate the user\'s current password and send them a secure reset link. Proceed?')) return;
    } else {
      if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    }
    
    setActionLoading(`${id}-${action}`);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });
      
      const data = await res.json();
      if (res.ok) {
        if (action === 'reset-password') {
          alert('Password reset email dispatched via Brevo successfully.');
        }
        fetchUsers();
      } else {
        alert(data.message);
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
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Customer Moderation</h1>
        <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Manage user accounts, enforce suspensions, and trigger secure resets.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-[var(--color-admin-surface)] p-4 rounded-xl border border-[var(--color-admin-border)] flex gap-4">
        <div className="flex-1 flex items-center gap-3 bg-[var(--color-admin-bg)] px-4 py-2 rounded-lg border border-[var(--color-admin-border)] focus-within:border-[var(--color-gold-primary)] transition-colors">
          <Search size={16} className="text-[var(--color-admin-text-muted)]" />
          <input 
            type="text" 
            placeholder="Search by name, email, or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-[var(--color-admin-text)]"
          />
        </div>
      </div>

      <div className="bg-[var(--color-admin-surface)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
             <User size={48} className="text-[var(--color-admin-text-muted)] opacity-20 mb-4" />
             <p className="text-[var(--color-admin-text-muted)] text-sm mt-2">No users found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-admin-bg)] border-b border-[var(--color-admin-border)]">
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Customer Details</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Join Date</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-[var(--color-admin-border)] last:border-0 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-admin-bg)] flex items-center justify-center border border-[var(--color-admin-border)] shrink-0">
                        <span className="text-[var(--color-gold-primary)] font-bold text-sm">{user.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-admin-text)]">{user.name}</p>
                        <p className="text-xs text-[var(--color-admin-text-muted)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-[var(--color-admin-text-muted)]">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1
                      ${user.isSuspended ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                      {user.isSuspended ? <ShieldAlert size={10} /> : <CheckCircle2 size={10} />}
                      {user.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleAction(user._id, 'reset-password')}
                        disabled={actionLoading === `${user._id}-reset-password`}
                        className="flex items-center justify-center w-8 h-8 bg-[var(--color-admin-bg)] text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)] rounded hover:text-[var(--color-gold-primary)] hover:border-[var(--color-gold-primary)] transition-colors"
                        title="Force Password Reset (Email)"
                      >
                        {actionLoading === `${user._id}-reset-password` ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      </button>
                      
                      {user.isSuspended ? (
                        <button 
                          onClick={() => handleAction(user._id, 'activate')}
                          disabled={actionLoading === `${user._id}-activate`}
                          className="flex items-center justify-center h-8 px-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                        >
                          {actionLoading === `${user._id}-activate` ? <Loader2 size={14} className="animate-spin" /> : 'Reactivate'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAction(user._id, 'suspend')}
                          disabled={actionLoading === `${user._id}-suspend`}
                          className="flex items-center justify-center h-8 px-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                        >
                          {actionLoading === `${user._id}-suspend` ? <Loader2 size={14} className="animate-spin" /> : 'Suspend'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
