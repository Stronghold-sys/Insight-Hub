'use client'

import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, HelpCircle, Star, MessageSquare, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminCmsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FAQ Forms states
  const [faqForm, setFaqForm] = useState({ id: 0, question: '', answer: '', category: 'umum', orderNumber: 0 });
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [showFaqModal, setShowFaqModal] = useState(false);

  // Testi Forms states
  const [testiForm, setTestiForm] = useState({ id: 0, name: '', role: '', quote: '', rating: 5, planName: 'Premium' });
  const [editingTesti, setEditingTesti] = useState<any>(null);
  const [showTestiModal, setShowTestiModal] = useState(false);

  // Article Forms states
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [articleForm, setArticleForm] = useState({
    id: '',
    title: '',
    slug: '',
    category: 'Attachment Style',
    excerpt: '',
    content: '',
    coverImage: '',
    authorName: 'Tim Insight Hub',
    readTime: '5 menit',
    isTrending: false,
    isPublished: true,
  });

  const fetchCmsData = async () => {
    try {
      const res = await fetch('/api/admin/cms');
      const data = await res.json();
      if (data.success) {
        setFaqs(data.faqs);
        setTestimonials(data.testimonials);
        setArticles(data.articles);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCmsData();
  }, []);

  // FAQ Handlers
  const handleOpenCreateFaq = () => {
    setEditingFaq(null);
    setFaqForm({ id: 0, question: '', answer: '', category: 'umum', orderNumber: 0 });
    setShowFaqModal(true);
  };

  const handleOpenEditFaq = (faq: any) => {
    setEditingFaq(faq);
    setFaqForm({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'umum',
      orderNumber: faq.order_number || 0
    });
    setShowFaqModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'faq',
          action: editingFaq ? 'update' : 'create',
          id: faqForm.id,
          data: faqForm
        }),
      });
      if (res.ok) {
        setShowFaqModal(false);
        fetchCmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Beneran mau hapus FAQ ini?')) return;
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'faq', action: 'delete', id }),
      });
      if (res.ok) fetchCmsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Testimonial Handlers
  const handleOpenCreateTesti = () => {
    setEditingTesti(null);
    setTestiForm({ id: 0, name: '', role: '', quote: '', rating: 5, planName: 'Premium' });
    setShowTestiModal(true);
  };

  const handleOpenEditTesti = (testi: any) => {
    setEditingTesti(testi);
    setTestiForm({
      id: testi.id,
      name: testi.name,
      role: testi.role || '',
      quote: testi.quote,
      rating: testi.rating || 5,
      planName: testi.plan_name || 'Premium'
    });
    setShowTestiModal(true);
  };

  const handleSaveTesti = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'testimonial',
          action: editingTesti ? 'update' : 'create',
          id: testiForm.id,
          data: testiForm
        }),
      });
      if (res.ok) {
        setShowTestiModal(false);
        fetchCmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTesti = async (id: number) => {
    if (!confirm('Beneran mau hapus testimoni ini?')) return;
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'testimonial', action: 'delete', id }),
      });
      if (res.ok) fetchCmsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Article Handlers
  const handleOpenCreateArticle = () => {
    setEditingArticle(null);
    setArticleForm({
      id: '',
      title: '',
      slug: '',
      category: 'Attachment Style',
      excerpt: '',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      authorName: 'Tim Insight Hub',
      readTime: '5 menit',
      isTrending: false,
      isPublished: true,
    });
    setShowArticleModal(true);
  };

  const handleOpenEditArticle = (art: any) => {
    setEditingArticle(art);
    let catName = 'Attachment Style';
    if (art.category_id === 1) catName = 'Attachment Style';
    else if (art.category_id === 2) catName = 'Love Language';
    else if (art.category_id === 3) catName = 'Komunikasi';

    setArticleForm({
      id: art.id,
      title: art.title,
      slug: art.slug,
      category: catName,
      excerpt: art.excerpt || '',
      content: art.content || '',
      coverImage: art.cover_image || '',
      authorName: art.author_name || 'Tim Insight Hub',
      readTime: art.read_time || '5 menit',
      isTrending: !!art.is_trending,
      isPublished: !!art.is_published,
    });
    setShowArticleModal(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'article',
          action: editingArticle ? 'update' : 'create',
          id: articleForm.id,
          data: articleForm
        }),
      });
      if (res.ok) {
        setShowArticleModal(false);
        fetchCmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Beneran mau hapus artikel ini?')) return;
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'article', action: 'delete', id }),
      });
      if (res.ok) fetchCmsData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 36, height: 36, marginBottom: 12 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat data CMS...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Content Management System (CMS)</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Kelola data publikasi website seperti FAQ, Testimoni, dan Artikel Edukasi.</p>
      </div>

      {/* Article Panel */}
      <div className="card glass" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} /> Artikel Edukasi (Draft & Published)
          </h3>
          <button onClick={handleOpenCreateArticle} className="btn btn-primary btn-sm">
            <Plus size={12} /> Tambah Artikel
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {articles.map(art => (
            <div key={art.id} style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{art.title}</p>
                  <span style={{ fontSize: 10, fontWeight: 800, background: art.is_published ? 'rgba(23,184,151,0.1)' : 'rgba(211,47,47,0.1)', color: art.is_published ? 'var(--teal)' : 'var(--error)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                    {art.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px' }}>Slug: <code style={{ color: 'var(--brand-blue)' }}>{art.slug}</code></p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 10px', height: 34, overflow: 'hidden', textOverflow: 'ellipsis' }}>{art.excerpt}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Penulis: {art.author_name} {art.is_trending ? '· Trending' : ''}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <button onClick={() => handleOpenEditArticle(art)} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', gap: 4 }}>
                  <Edit size={12} /> Edit
                </button>
                <button onClick={() => handleDeleteArticle(art.id)} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', gap: 4, color: 'var(--error)', borderColor: 'rgba(211,47,47,0.2)' }}>
                  <Trash2 size={12} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: FAQs & Testimonials */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* FAQ Panel */}
        <div className="card glass" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={16} /> FAQ List
            </h3>
            <button onClick={handleOpenCreateFaq} className="btn btn-primary btn-sm">
              <Plus size={12} /> Tambah FAQ
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
            {faqs.map(faq => (
              <div key={faq.id} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleOpenEditFaq(faq)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)', paddingRight: 40 }}>Q: {faq.question}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>A: {faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Panel */}
        <div className="card glass" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={16} /> Testimonial List
            </h3>
            <button onClick={handleOpenCreateTesti} className="btn btn-primary btn-sm">
              <Plus size={12} /> Tambah Testi
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
            {testimonials.map(t => (
              <div key={t.id} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleOpenEditTesti(t)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteTesti(t.id)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingRight: 40 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({t.role})</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', filter: 'none', background: 'transparent' }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <form onSubmit={handleSaveFaq} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0 }}>{editingFaq ? 'Edit FAQ' : 'Tambah FAQ'}</h3>
              <div>
                <label className="label">Pertanyaan</label>
                <input required className="input" placeholder="Tanya apa?" value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} />
              </div>
              <div>
                <label className="label">Jawaban</label>
                <textarea required className="input" rows={3} placeholder="Jawabannya..." value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} />
              </div>
              <div>
                <label className="label">Kategori</label>
                <select className="input" value={faqForm.category} onChange={e => setFaqForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="umum">Umum</option>
                  <option value="langganan">Langganan</option>
                  <option value="fitur">Fitur</option>
                  <option value="keamanan">Keamanan</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowFaqModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {showTestiModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', filter: 'none', background: 'transparent' }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <form onSubmit={handleSaveTesti} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0 }}>{editingTesti ? 'Edit Testimoni' : 'Tambah Testimoni'}</h3>
              <div>
                <label className="label">Nama Pengguna</label>
                <input required className="input" placeholder="Nama..." value={testiForm.name} onChange={e => setTestiForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Pekerjaan / Peran</label>
                <input required className="input" placeholder="Misal: Mahasiswa, Designer..." value={testiForm.role} onChange={e => setTestiForm(f => ({ ...f, role: e.target.value }))} />
              </div>
              <div>
                <label className="label">Kutipan Review</label>
                <textarea required className="input" rows={3} placeholder="Gue ngerasa..." value={testiForm.quote} onChange={e => setTestiForm(f => ({ ...f, quote: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowTestiModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', filter: 'none', background: 'transparent' }}>
          <div className="modal-content" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <form onSubmit={handleSaveArticle} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0 }}>{editingArticle ? 'Edit Artikel' : 'Tambah Artikel'}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Judul Artikel</label>
                  <input required className="input" placeholder="Judul artikel..." value={articleForm.title} onChange={e => {
                    const t = e.target.value;
                    const s = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setArticleForm(f => ({ ...f, title: t, slug: editingArticle ? f.slug : s }));
                  }} />
                </div>
                <div>
                  <label className="label">Slug URL</label>
                  <input required className="input" placeholder="slug-artikel" value={articleForm.slug} onChange={e => setArticleForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Kategori</label>
                  <select className="input" value={articleForm.category} onChange={e => setArticleForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="Attachment Style">Attachment Style</option>
                    <option value="Love Language">Love Language</option>
                    <option value="Komunikasi">Komunikasi</option>
                  </select>
                </div>
                <div>
                  <label className="label">Waktu Baca</label>
                  <input className="input" placeholder="e.g. 5 menit" value={articleForm.readTime} onChange={e => setArticleForm(f => ({ ...f, readTime: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">URL Gambar Sampul</label>
                <input className="input" placeholder="https://images.unsplash.com/..." value={articleForm.coverImage} onChange={e => setArticleForm(f => ({ ...f, coverImage: e.target.value }))} />
              </div>

              <div>
                <label className="label">Penulis</label>
                <input className="input" placeholder="Nama penulis..." value={articleForm.authorName} onChange={e => setArticleForm(f => ({ ...f, authorName: e.target.value }))} />
              </div>

              <div>
                <label className="label">Ringkasan (Excerpt)</label>
                <input className="input" placeholder="Ringkasan singkat untuk list preview..." value={articleForm.excerpt} onChange={e => setArticleForm(f => ({ ...f, excerpt: e.target.value }))} />
              </div>

              <div>
                <label className="label">Konten Artikel</label>
                <textarea required className="input" rows={6} placeholder="Tulis artikel lengkap di sini..." value={articleForm.content} onChange={e => setArticleForm(f => ({ ...f, content: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={articleForm.isTrending} onChange={e => setArticleForm(f => ({ ...f, isTrending: e.target.checked }))} />
                  Trending
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={articleForm.isPublished} onChange={e => setArticleForm(f => ({ ...f, isPublished: e.target.checked }))} />
                  Published (Tampilkan ke Publik)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowArticleModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Simpan Artikel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
