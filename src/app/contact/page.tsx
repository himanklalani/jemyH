'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Loader2, MapPin, Phone, Mail } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setErrorMsg(data.message || 'Failed to send message');
      }
    } catch (err: any) {
      setErrorMsg('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EAEBE6] text-indigo-900 pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-clash font-bold uppercase tracking-[-0.02em] mb-4">Contact the Atelier</h1>
          <p className="text-lg opacity-70 font-serif">Reach out to our stylists, artisans, or concierge for tailored assistance.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 max-w-5xl mx-auto">
          
          {/* Contact Details */}
          <div className="flex flex-col justify-center space-y-12">
            <div>
              <div className="flex items-center gap-3 text-gold-primary mb-3">
                <MapPin size={20} />
                <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-indigo-900">Flagship Studio</h3>
              </div>
              <p className="font-serif text-lg opacity-80 leading-relaxed">
                42 Optical Ave<br />
                Design District<br />
                Mumbai, MH 400001
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-3 text-gold-primary mb-3">
                <Mail size={20} />
                <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-indigo-900">Digital Concierge</h3>
              </div>
              <p className="font-serif text-lg opacity-80 leading-relaxed">
                concierge@jemy.com<br />
                support@jemy.com
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 text-gold-primary mb-3">
                <Phone size={20} />
                <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-indigo-900">Direct Line</h3>
              </div>
              <p className="font-serif text-lg opacity-80 leading-relaxed">
                +91 (800) 555-JEMY<br />
                Mon-Fri, 9am - 6pm IST
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-indigo-900/5">
            {success ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <CheckCircle2 size={64} className="text-green-500 mb-6" />
                <h2 className="font-display font-bold text-2xl text-indigo-900 mb-2">Message Received</h2>
                <p className="text-indigo-900/60 font-serif">Our concierge will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{errorMsg}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-900/50 mb-2">Full Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-gold-primary transition-colors text-sm" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-900/50 mb-2">Email Address</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-gold-primary transition-colors text-sm" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-900/50 mb-2">Phone (Optional)</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-gold-primary transition-colors text-sm" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-900/50 mb-2">Subject</label>
                    <select required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-gold-primary transition-colors text-sm appearance-none">
                      <option value="">Select Topic...</option>
                      <option value="Prescription Inquiry">Prescription Inquiry</option>
                      <option value="Order Status">Order Status</option>
                      <option value="Returns/Exchanges">Returns & Exchanges</option>
                      <option value="Styling Advice">Styling Advice</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-900/50 mb-2">Message</label>
                  <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-gold-primary transition-colors text-sm resize-none" placeholder="How can we assist you?" />
                </div>

                <button disabled={loading} type="submit" className="w-full bg-indigo-900 text-white rounded-xl py-5 font-bold text-[11px] uppercase tracking-widest hover:bg-gold-primary hover:text-indigo-950 transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Message</>}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
