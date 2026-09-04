import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import Blog from '@/models/Blog';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  await dbConnect();
  const blog = await Blog.findOne({ slug: params.slug, isPublished: true }).lean() as any;
  if (!blog) return { title: 'Not Found | JEMY' };
  
  const title = `${blog.seo?.metaTitle || blog.title} | JEMY`;
  const description = blog.seo?.metaDescription || blog.excerpt || '';
  const image = blog.coverImage || '/images/jemy-og.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: blog.title }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function EditorialArticlePage({ params }: { params: { slug: string } }) {
  await dbConnect();
  const blog = await Blog.findOne({ slug: params.slug, isPublished: true }).lean();
  
  if (!blog) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] pt-32 pb-24 transition-colors duration-700 ease-[var(--ease-power4-out)]">
      <article className="max-w-[800px] mx-auto px-6 lg:px-12">
        <Link href="/editorial" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-gold-primary transition-colors mb-12">
          <ArrowLeft size={14} /> Back to Editorial
        </Link>
        
        <header className="mb-16">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-6">
            <span>{blog.category || 'Editorial'}</span>
            <span>•</span>
            <span>{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : 'Recent'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-6">{blog.title}</h1>
          <p className="text-lg md:text-xl font-clash uppercase tracking-widest opacity-70 leading-relaxed border-l-2 border-gold-primary pl-6 py-2">
            {blog.excerpt}
          </p>
        </header>

        {blog.coverImage && (
          <div className="w-full aspect-[21/9] mb-16 relative overflow-hidden bg-white/5">
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div 
          className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:font-normal prose-a:text-gold-primary prose-a:no-underline hover:prose-a:underline max-w-none prose-p:opacity-80 prose-li:opacity-80"
          dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }}
        />

        <div className="mt-24 pt-12 border-t border-[var(--theme-text)]/10 flex items-center gap-6">
          {blog.author?.avatar ? (
            <img src={blog.author.avatar} alt={blog.author.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--theme-text)]/5 flex items-center justify-center font-serif text-2xl">
              {blog.author?.name?.charAt(0) || 'J'}
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Written by</p>
            <p className="font-serif text-xl">{blog.author?.name || 'JEMY Editorial Team'}</p>
            {blog.author?.bio && <p className="text-sm opacity-70 mt-1 max-w-md">{blog.author.bio}</p>}
          </div>
        </div>
      </article>
    </main>
  );
}
