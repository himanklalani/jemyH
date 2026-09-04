'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, Plus, Trash2, Loader2, Save, FileText } from 'lucide-react';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBlog, setNewBlog] = useState({ 
    title: '', slug: '', excerpt: '', content: '', author: { name: 'JEMY Editors' }, isPublished: false 
  });
  const router = useRouter();

  const fetchBlogs = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin/login');

    try {
      const res = await fetch(`/api/admin/blogs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleCreate = async () => {
    if (!newBlog.title || !newBlog.content || !newBlog.excerpt) return alert('Title, excerpt, and content are required');
    if (!newBlog.slug) {
      newBlog.slug = newBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    setActionLoading('create');
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/blogs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...newBlog, publishedAt: newBlog.isPublished ? new Date() : null })
      });
      const data = await res.json();
      if (res.ok) {
        setNewBlog({ title: '', slug: '', excerpt: '', content: '', author: { name: 'JEMY Editors' }, isPublished: false });
        setIsCreating(false);
        fetchBlogs();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article completely?')) return;
    setActionLoading(id);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBlogs();
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
          <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Editorial Desk</h1>
          <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Write and publish articles for the JEMY storefront.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded hover:bg-white transition-colors"
        >
          {isCreating ? 'Cancel' : <><Plus size={16} /> New Article</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-[var(--color-admin-surface)] p-6 rounded-xl border border-[var(--color-admin-border)] space-y-4 mb-8">
          <h3 className="text-[var(--color-gold-primary)] font-serif text-xl">Draft New Article</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-2">Headline</label>
              <input 
                type="text" 
                value={newBlog.title}
                onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded px-4 py-2 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-2">Custom Slug (Optional)</label>
              <input 
                type="text" 
                value={newBlog.slug}
                onChange={(e) => setNewBlog({ ...newBlog, slug: e.target.value })}
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded px-4 py-2 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                placeholder="auto-generated-if-empty"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-2">Excerpt (Short Summary)</label>
            <textarea 
              value={newBlog.excerpt}
              onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
              className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded px-4 py-2 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)] h-20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-2">Full Content (Markdown or HTML)</label>
            <textarea 
              value={newBlog.content}
              onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
              className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded px-4 py-2 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)] h-64 font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input 
              type="checkbox" 
              id="isPublished"
              checked={newBlog.isPublished}
              onChange={(e) => setNewBlog({ ...newBlog, isPublished: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isPublished" className="text-sm text-[var(--color-admin-text)] cursor-pointer">Publish immediately to storefront</label>
          </div>

          <button 
            onClick={handleCreate}
            disabled={actionLoading === 'create'}
            className="flex items-center gap-2 mt-4 bg-[var(--color-admin-text)] text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded hover:bg-[var(--color-gold-primary)] transition-colors"
          >
            {actionLoading === 'create' ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Article</>}
          </button>
        </div>
      )}

      <div className="bg-[var(--color-admin-surface)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
             <FileText size={48} className="text-[var(--color-admin-text-muted)] opacity-20 mb-4" />
             <p className="text-[var(--color-admin-text-muted)] text-sm mt-2">No articles written yet.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-admin-bg)] border-b border-[var(--color-admin-border)]">
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Article</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="border-b border-[var(--color-admin-border)] last:border-0 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-[var(--color-admin-text)] line-clamp-1">{blog.title}</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] line-clamp-1">{blog.excerpt}</p>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-admin-text-muted)]">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1
                      ${blog.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {blog.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(blog._id)}
                      disabled={actionLoading === blog._id}
                      className="inline-flex items-center justify-center w-8 h-8 bg-[var(--color-admin-bg)] text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)] rounded hover:text-red-400 hover:border-red-400 transition-colors"
                    >
                      {actionLoading === blog._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
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
