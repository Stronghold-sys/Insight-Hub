'use client'

import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, Edit3, Save, X, Settings, ListPlus } from 'lucide-react';

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit/Create Assessment states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [assessmentForm, setAssessmentForm] = useState({
    id: '',
    title: '',
    description: '',
    category: 'core',
    duration: '8-10 menit',
    color_hex: '#0286C3',
    is_active: true
  });

  // Manage Questions states
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [targetAssessment, setTargetAssessment] = useState<any>(null);
  const [questionsList, setQuestionsList] = useState<any[]>([]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/assessments');
      const data = await res.json();
      if (data.success) {
        setAssessments(data.assessments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Save/Create assessment details
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingAssessment;
      const res = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdit ? 'update_assessment' : 'create_assessment',
          id: isEdit ? editingAssessment.id : undefined,
          data: assessmentForm
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowFormModal(false);
        fetchAssessments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus assessment ini beserta semua data pertanyaan di dalamnya secara permanen?')) return;
    try {
      const res = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_assessment', id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAssessments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open questions editor
  const handleOpenQuestions = async (assessment: any) => {
    setTargetAssessment(assessment);
    setShowQuestionsModal(true);
    setQuestionsList([]);
    try {
      const res = await fetch(`/api/admin/assessments?id=${assessment.id}`);
      const data = await res.json();
      if (data.success) {
        setQuestionsList(data.assessment.questions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestionLocal = () => {
    setQuestionsList([
      ...questionsList,
      {
        id: `q-${Date.now()}`,
        question_text: '',
        options: [
          { id: `opt-a-${Date.now()}`, option_text: '', dimension: 'general', weight: 3 },
          { id: `opt-b-${Date.now()}`, option_text: '', dimension: 'general', weight: 3 }
        ]
      }
    ]);
  };

  const handleRemoveQuestionLocal = (idx: number) => {
    setQuestionsList(questionsList.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    const updated = [...questionsList];
    updated[idx].question_text = text;
    setQuestionsList(updated);
  };

  const handleOptionChange = (qIdx: number, oIdx: number, field: string, val: any) => {
    const updated = [...questionsList];
    updated[qIdx].options[oIdx] = {
      ...updated[qIdx].options[oIdx],
      [field]: val
    };
    setQuestionsList(updated);
  };

  const handleAddOptionLocal = (qIdx: number) => {
    const updated = [...questionsList];
    updated[qIdx].options.push({
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      option_text: '',
      dimension: 'general',
      weight: 3
    });
    setQuestionsList(updated);
  };

  const handleRemoveOptionLocal = (qIdx: number, oIdx: number) => {
    const updated = [...questionsList];
    updated[qIdx].options = updated[qIdx].options.filter((_: any, i: number) => i !== oIdx);
    setQuestionsList(updated);
  };

  const handleSaveQuestions = async () => {
    if (!targetAssessment) return;
    try {
      const res = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_questions',
          id: targetAssessment.id,
          questions: questionsList
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowQuestionsModal(false);
        fetchAssessments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && assessments.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 36, height: 36, marginBottom: 12 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat bank assessment...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Assessments Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Kelola kuis kepribadian relasi, parameter skor evaluasi, dan pertanyaan bank soal.</p>
        </div>
        <button
          onClick={() => {
            setEditingAssessment(null);
            setAssessmentForm({
              id: '',
              title: '',
              description: '',
              category: 'core',
              duration: '8-10 menit',
              color_hex: '#0286C3',
              is_active: true
            });
            setShowFormModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} /> Buat Kuis Baru
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {assessments.map(a => {
          const color = a.color_hex || '#0286C3';
          return (
            <div key={a.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `4px solid ${color}` }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: `${color}15`, color: color, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                    {a.category}
                  </span>
                  <span style={{
                    padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: a.is_active ? 'rgba(23,184,151,0.1)' : 'rgba(211,47,47,0.1)',
                    color: a.is_active ? 'var(--teal)' : 'var(--error)'
                  }}>
                    {a.is_active ? 'Aktif' : 'Draft'}
                  </span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{a.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>{a.description}</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  <span>Durasi: {a.duration}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <HelpCircle size={14} color="var(--brand-blue)" /> {a.questionsCount} soal
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setEditingAssessment(a);
                      setAssessmentForm({
                        id: a.id,
                        title: a.title,
                        description: a.description || '',
                        category: a.category || 'core',
                        duration: a.duration || '8-10 menit',
                        color_hex: a.color_hex || '#0286C3',
                        is_active: !!a.is_active
                      });
                      setShowFormModal(true);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: '6px 0', justifyContent: 'center', gap: 4 }}
                  >
                    <Edit3 size={12} /> Detail
                  </button>
                  <button
                    onClick={() => handleOpenQuestions(a)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: '6px 0', justifyContent: 'center', gap: 4 }}
                  >
                    <ListPlus size={12} /> Bank Soal
                  </button>
                  <button
                    onClick={() => handleDeleteAssessment(a.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px', color: 'var(--error)', borderColor: 'rgba(211,47,47,0.2)' }}
                    title="Hapus Kuis"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE/EDIT KUIS MODAL */}
      {showFormModal && (
        <div className="modal-overlay" style={{ zIndex: 100, backdropFilter: 'none', WebkitBackdropFilter: 'none', filter: 'none', background: 'transparent' }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{editingAssessment ? 'Edit Parameter Kuis' : 'Buat Kuis Baru'}</h3>
              <button onClick={() => setShowFormModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAssessment} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!editingAssessment && (
                <div>
                  <label className="label">ID Kuis Unik (Tanpa spasi, e.g. stress-test)</label>
                  <input required className="input" placeholder="id-kuis" value={assessmentForm.id} onChange={e => setAssessmentForm({ ...assessmentForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                </div>
              )}
              <div>
                <label className="label">Judul Kuis</label>
                <input required className="input" placeholder="Contoh: Stress Response Test" value={assessmentForm.title} onChange={e => setAssessmentForm({ ...assessmentForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Deskripsi</label>
                <textarea required rows={3} className="input" placeholder="Jelaskan apa yang diukur kuis ini..." value={assessmentForm.description} onChange={e => setAssessmentForm({ ...assessmentForm, description: e.target.value })} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Kategori</label>
                  <select className="input" value={assessmentForm.category} onChange={e => setAssessmentForm({ ...assessmentForm, category: e.target.value })}>
                    <option value="core">Core Relationship</option>
                    <option value="communication">Communication</option>
                    <option value="needs">Emotional Needs</option>
                    <option value="regulation">Emotional Regulation</option>
                  </select>
                </div>
                <div>
                  <label className="label">Estimasi Durasi</label>
                  <input required className="input" placeholder="e.g. 5-7 menit" value={assessmentForm.duration} onChange={e => setAssessmentForm({ ...assessmentForm, duration: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
                <div>
                  <label className="label">Warna Aksen (Hex)</label>
                  <input required className="input" type="color" value={assessmentForm.color_hex} onChange={e => setAssessmentForm({ ...assessmentForm, color_hex: e.target.value })} style={{ height: 38, padding: 3 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                  <input id="active-cb" type="checkbox" checked={assessmentForm.is_active} onChange={e => setAssessmentForm({ ...assessmentForm, is_active: e.target.checked })} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                  <label htmlFor="active-cb" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Status Kuis Aktif</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Save size={14} /> Simpan Kuis
                </button>
                <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE QUESTIONS MODAL */}
      {showQuestionsModal && targetAssessment && (
        <div className="modal-overlay" style={{ zIndex: 100, backdropFilter: 'none', WebkitBackdropFilter: 'none', filter: 'none', background: 'transparent' }}>
          <div className="modal-content" style={{ maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Bank Soal: {targetAssessment.title}</h3>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-secondary)' }}>Atur pertanyaan, bobot evaluasi skor, dan dimensi penilaian.</p>
              </div>
              <button onClick={() => setShowQuestionsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Questions List scrollable body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {questionsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border)', borderRadius: 8 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Belum ada soal di dalam kuis ini.</p>
                  <button onClick={handleAddQuestionLocal} className="btn btn-primary btn-sm">Tambah Pertanyaan Pertama</button>
                </div>
              ) : (
                <>
                  {questionsList.map((q, qIdx) => (
                    <div key={q.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 18, background: '#F8FAFC', position: 'relative' }}>
                      <button
                        onClick={() => handleRemoveQuestionLocal(qIdx)}
                        style={{ position: 'absolute', top: 12, right: 12, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                        title="Hapus Pertanyaan"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Pertanyaan {qIdx + 1}</label>
                        <input
                          required
                          className="input"
                          placeholder="Masukkan teks pertanyaan..."
                          value={q.question_text}
                          onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
                        />
                      </div>

                      {/* Options Sub-list */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>Pilihan Jawaban (Opsi)</span>
                          <button type="button" onClick={() => handleAddOptionLocal(qIdx)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 11, color: 'var(--brand-blue)' }}>
                            + Tambah Opsi
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {q.options.map((opt: any, oIdx: number) => (
                            <div key={opt.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <input
                                required
                                className="input"
                                placeholder={`Teks opsi...`}
                                value={opt.option_text}
                                onChange={e => handleOptionChange(qIdx, oIdx, 'option_text', e.target.value)}
                                style={{ flex: 3, fontSize: 12.5 }}
                              />
                              <input
                                required
                                className="input"
                                placeholder="Dimensi (e.g. secure)"
                                value={opt.dimension}
                                onChange={e => handleOptionChange(qIdx, oIdx, 'dimension', e.target.value)}
                                style={{ flex: 1.5, fontSize: 12.5 }}
                              />
                              <input
                                required
                                className="input"
                                type="number"
                                placeholder="Bobot"
                                value={opt.weight}
                                onChange={e => handleOptionChange(qIdx, oIdx, 'weight', parseInt(e.target.value) || 0)}
                                style={{ flex: 0.8, fontSize: 12.5, textAlign: 'center' }}
                              />
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionLocal(qIdx, oIdx)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={handleAddQuestionLocal} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                    + Tambah Pertanyaan Baru
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: '#F8FAFC', borderRadius: '0 0 8px 8px' }}>
              <button
                onClick={handleSaveQuestions}
                disabled={questionsList.length === 0}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', gap: 6 }}
              >
                <Save size={14} />
                Simpan Bank Soal Ke Sistem
              </button>
              <button
                onClick={() => setShowQuestionsModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 1023px) {
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
