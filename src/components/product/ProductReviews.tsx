'use client';

import { useEffect, useState } from 'react';
import { Star, ThumbsUp, Loader2 } from 'lucide-react';

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, count: 0 });
  
  const [isWriting, setIsWriting] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        
        // Calculate average
        if (data.reviews.length > 0) {
          const sum = data.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
          setStats({ average: sum / data.reviews.length, count: data.reviews.length });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ ...newReview, productId })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsWriting(false);
        setNewReview({ rating: 5, title: '', comment: '' });
        fetchReviews();
      } else {
        setErrorMsg(data.message || 'Error submitting review');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-indigo-900/40" /></div>;
  }

  return (
    <div className="py-16 max-w-[1600px] mx-auto px-6 lg:px-12 border-t border-indigo-900/10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Left Column: Summary */}
        <div className="lg:col-span-1">
          <h2 className="font-display font-bold text-3xl text-indigo-900 mb-6">Customer Reviews</h2>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="font-display font-bold text-5xl text-indigo-900">
              {stats.count > 0 ? stats.average.toFixed(1) : '0.0'}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex text-gold-primary">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} fill={i <= Math.round(stats.average) ? "currentColor" : "none"} strokeWidth={i <= Math.round(stats.average) ? 0 : 2} />
                ))}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-900/50">Based on {stats.count} reviews</span>
            </div>
          </div>

          <button 
            onClick={() => setIsWriting(!isWriting)}
            className="w-full py-4 border-2 border-indigo-900 text-indigo-900 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-indigo-900 hover:text-white transition-colors"
          >
            {isWriting ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {/* Right Column: Review List */}
        <div className="lg:col-span-3">
          {isWriting && (
            <form onSubmit={handleSubmit} className="mb-12 bg-white p-6 rounded-2xl border border-indigo-900/10 shadow-sm">
              <h3 className="font-display font-bold text-xl text-indigo-900 mb-4">Share Your Experience</h3>
              {errorMsg && <div className="p-3 mb-4 text-xs font-bold bg-red-50 text-red-600 rounded">{errorMsg}</div>}
              
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-indigo-900/50 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button type="button" key={i} onClick={() => setNewReview({...newReview, rating: i})} className="text-gold-primary">
                      <Star size={24} fill={i <= newReview.rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-indigo-900/50 mb-2">Review Title</label>
                <input required type="text" value={newReview.title} onChange={e => setNewReview({...newReview, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-gold-primary" />
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-widest text-indigo-900/50 mb-2">Review Comments</label>
                <textarea required rows={4} value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-gold-primary" />
              </div>
              
              <button disabled={submitLoading} type="submit" className="bg-indigo-900 text-white px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gold-primary hover:text-indigo-950 transition-colors disabled:opacity-50 flex items-center gap-2">
                {submitLoading && <Loader2 size={14} className="animate-spin" />} Submit Review
              </button>
            </form>
          )}

          <div className="space-y-8">
            {reviews.length === 0 && !isWriting ? (
              <div className="py-12 text-center text-indigo-900/40 font-semibold">No reviews yet. Be the first to review!</div>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="bg-white p-6 md:p-8 rounded-2xl border border-indigo-900/5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex text-gold-primary mb-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} strokeWidth={i <= review.rating ? 0 : 2} />
                        ))}
                      </div>
                      <h3 className="font-display font-bold text-lg text-indigo-900">{review.title}</h3>
                    </div>
                    <span className="text-xs font-mono text-indigo-900/40">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="text-indigo-900/70 text-sm leading-relaxed mb-6 text-pretty">
                    "{review.comment}"
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-indigo-900/5 pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-900/50">
                      {review.user?.name || 'Customer'} {review.isVerifiedBuyer && <span className="text-green-600 ml-2">✓ Verified Buyer</span>}
                    </span>
                    <button className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-900/40 hover:text-gold-primary transition-colors">
                      <ThumbsUp size={12} /> {review.helpfulVotes || 0} Helpful
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
