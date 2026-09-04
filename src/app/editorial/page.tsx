import dbConnect from '@/lib/mongoose';
import Blog from '@/models/Blog';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Editorial | JEMY',
  description: 'The latest news, guides, and inspiration from JEMY.',
};

export default async function EditorialPage() {
  await dbConnect();
  // Fetch published blogs
  const blogs = await Blog.find({ isPublished: true }).sort({ publishedAt: -1 }).lean();

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] pt-32 pb-24 transition-colors duration-700 ease-[var(--ease-power4-out)]">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-clash font-bold uppercase tracking-[-0.02em] mb-4">The Editorial</h1>
          <p className="text-lg opacity-60 max-w-2xl font-serif">Deep dives into optical architecture, material science, and luxury aesthetic principles.</p>
        </div>

        {blogs.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-40">
            <BookOpen size={48} className="mb-4" />
            <p className="text-xl font-clash uppercase tracking-widest">Check Back Soon</p>
            <p className="text-sm font-serif mt-2">Our editors are crafting new pieces.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog: any) => (
              <Link 
                href={`/editorial/${blog.slug}`} 
                key={blog._id.toString()}
                className="group flex flex-col h-full border border-[var(--theme-text)]/10 hover:border-gold-primary transition-colors bg-white/5 backdrop-blur-sm p-6"
              >
                {blog.coverImage && (
                  <div className="aspect-[16/9] w-full mb-6 overflow-hidden bg-white/10 relative">
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[var(--ease-power4-out)]" />
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-4">
                    <span>{blog.category || 'Editorial'}</span>
                    <span>{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <h2 className="text-2xl font-serif mb-4 group-hover:text-gold-primary transition-colors">{blog.title}</h2>
                  <p className="text-sm opacity-70 mb-8 line-clamp-3 leading-relaxed">{blog.excerpt}</p>
                  <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest group-hover:text-gold-primary transition-colors">
                    Read Article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
