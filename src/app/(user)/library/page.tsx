'use client'

import { useState, useEffect } from 'react'
import { Library, BookOpen, MessageSquare, Clipboard, CheckCircle, Copy, Search, Filter, ExternalLink, Heart, Star, Play, GraduationCap, FileText, Bookmark, BookmarkCheck, X, Clock } from 'lucide-react'

// ========================
// STATIC CONTENT (comprehensive library data without emojis)
// ========================
const MINI_GUIDES = [
  {
    id: 'g1',
    title: 'Cara Minta Maaf yang Beneran (Tanpa "Tapi")',
    desc: 'Akui kesalahan secara spesifik, validasi dampak perasaan dia, tawarkan solusi nyata, dan singkirkan kata "tapi". Permintaan maaf sejati bukan tentang kamu, tapi tentang dampak ke orang lain.',
    readTime: '4 menit',
    category: 'Apologi',
    difficulty: 'Mudah',
    tips: ['Sebut apa yang kamu lakukan dengan spesifik', 'Jangan defensif / kasih alasan', 'Tanya apa yang dia butuhkan', 'Komit untuk berubah, bukan janji kosong'],
  },
  {
    id: 'g2',
    title: 'Set Boundaries Tanpa Terasa Jahat',
    desc: 'Batas diri bukan bentuk penolakan, tapi bentuk self-respect. Jelasin kebutuhanmu dengan "I statement", bukan tuduhan. Konsistensi jauh lebih penting daripada cara penyampaiannya.',
    readTime: '5 menit',
    category: 'Boundaries',
    difficulty: 'Sedang',
    tips: ['Mulai dari batas kecil dulu', 'Gunakan "Aku butuh..." bukan "Kamu selalu..."', 'Oke untuk nolak tanpa penjelasan panjang', 'Batas bisa berubah sesuai konteks'],
  },
  {
    id: 'g3',
    title: 'Keluar dari Loop Silent Treatment',
    desc: 'Diam yang berkepanjangan lebih merusak dari konflik terbuka. Minta jeda yang punya kepastian: "Aku butuh 30 menit, setelah itu kita ngobrol." Diam tanpa batas = penghukuman.',
    readTime: '6 menit',
    category: 'Konflik',
    difficulty: 'Sedang',
    tips: ['Bedakan diam untuk recharge vs diam untuk hukum', 'Kasih kepastian kapan kamu kembali', 'Hadapi masalahnya, bukan orang-nya', 'Bicarakan pola ini saat suasana hati netral'],
  },
  {
    id: 'g4',
    title: 'Cara Dengerin yang Beneran (Active Listening)',
    desc: 'Mendengarkan bukan menunggu giliran bicara. Fokus ke perasaan dan kebutuhan di balik kata-kata. Tahan dorongan untuk langsung kasih solusi atau perbandingan.',
    readTime: '5 menit',
    category: 'Komunikasi',
    difficulty: 'Mudah',
    tips: ['Kontak mata, bukan scroll HP', 'Parafrase apa yang kamu dengar', 'Tanya "Apa yang kamu butuhkan dari aku sekarang?"', 'Jangan buru-buru kasih solusi'],
  },
  {
    id: 'g5',
    title: 'Cara Ekspresikan Perasaan Tanpa Menyalahkan',
    desc: 'Gunakan formula: "Aku merasa [emosi] ketika [situasi] karena aku butuh [kebutuhan]." Ini jauh lebih efektif dari "Kamu selalu..." yang bikin orang defensif.',
    readTime: '4 menit',
    category: 'Komunikasi',
    difficulty: 'Mudah',
    tips: ['Fokus ke perasaan KAMU, bukan perilaku mereka', 'Hindari kata "selalu" dan "tidak pernah"', 'Ungkap kebutuhan, bukan tuntutan', 'Pilih waktu yang tepat — jangan saat lagi panas'],
  },
  {
    id: 'g6',
    title: 'Deteksi Red Flag vs Deal Breaker',
    desc: 'Red flag adalah pola yang perlu diperhatikan. Deal breaker adalah hal yang nggak bisa kamu kompromikan. Tahu bedanya biar kamu bisa evaluasi hubungan dengan lebih jernih.',
    readTime: '7 menit',
    category: 'Relasi',
    difficulty: 'Sedang',
    tips: ['Catat pola, bukan insiden satu kali', 'Bedakan deal breaker vs ketidaknyamanan sementara', 'Red flag bisa berubah kalau ada kemauan bersama', 'Deal breaker tidak perlu penjelasan ke siapapun'],
  },
]

const TEMPLATES = [
  {
    id: 't1',
    category: 'Minta Maaf',
    title: 'Setelah Ngomong Kasar atau Nada Tinggi',
    text: 'Gue minta maaf ya tadi sempat ngomong dengan nada yang nggak enak. Gue sadar itu bikin lo nggak nyaman dan terluka. Gue lagi overwhelmed tadi, tapi itu bukan alasan buat ngomong kayak gitu. Kalau lo mau, bisa cerita apa yang paling bikin lo terluka biar gue lebih paham?',
    tags: ['konflik', 'emosi', 'apologi'],
  },
  {
    id: 't2',
    category: 'Boundaries',
    title: 'Butuh Waktu Sendiri Tanpa Drama',
    text: 'Gue sayang sama lo, tapi malam ini gue beneran butuh waktu sendiri dulu buat recharge. Bukan karena marah sama lo — gue cuma butuh ruang sebentar. Kita lanjut ngobrol besok ya, makasih udah ngerti.',
    tags: ['me-time', 'boundaries', 'ketenangan'],
  },
  {
    id: 't3',
    category: 'Konfrontasi',
    title: 'Bahas Pola yang Sering Muncul',
    text: 'Bisa ngobrol bentar nggak? Ada sesuatu yang mau gue share dan gue harap kita bisa bahas dengan tenang. Gue ngerasa [emosi] setiap kali [situasi] terjadi, dan gue butuh kita cari solusi bareng. Lo ada waktu kapan?',
    tags: ['konflik', 'direct', 'calm'],
  },
  {
    id: 't4',
    category: 'Follow-up',
    title: 'Setelah Lama Nggak Ada Kabar',
    text: 'Hei, gue tadi kepikiran soal lo. Harap semua baik-baik aja. Gue nggak ada maksud ngejar atau nge-pressure — cuma genuinely pengen tau kabar lo. Kalau lo lagi butuh ruang, it\'s okay. Gue di sini kalau lo mau ngobrol.',
    tags: ['check-in', 'gentle', 'concern'],
  },
  {
    id: 't5',
    category: 'Expressing Need',
    title: 'Minta Kepastian Tanpa Terkesan Clingy',
    text: 'Gue tau lo lagi sibuk dan gue nggak mau nge-pressure. Cuma, kalau lo sempet kasih update singkat soal gimana kita ini, itu bakal bantu gue nggak overthinking. Gue butuh kepastian buat bisa tenang, bukan buat mengontrol lo.',
    tags: ['reassurance', 'anxious', 'communication'],
  },
  {
    id: 't6',
    category: 'Rekonsiliasi',
    title: 'Setelah Konflik Besar yang Belum Selesai',
    text: 'Gue masih memikirkan pertengkaran kita kemarin. Gue nggak mau itu jadi tembok di antara kita. Gue mau kita sama-sama cari jalan keluar — bukan siapa yang menang. Kalau lo juga mau, kita bisa ngobrol pelan-pelan kapan lo siap.',
    tags: ['rekonsiliasi', 'konflik', 'resolusi'],
  },
]

const GLOSSARY = [
  { term: 'Anxious Attachment', desc: 'Gaya kelekatan di mana seseorang punya kecenderungan cemas berlebihan akan penolakan, sangat butuh kepastian konstan dari pasangan.' },
  { term: 'Avoidant Attachment', desc: 'Gaya kelekatan di mana seseorang merasa risih dengan kedekatan emosional intens dan memilih independensi penuh untuk menghindari kerentanan.' },
  { term: 'Secure Attachment', desc: 'Gaya kelekatan yang sehat — merasa nyaman dengan kedekatan tapi juga nyaman sendiri. Bisa percaya tanpa anxious.' },
  { term: 'Gaslighting', desc: 'Bentuk manipulasi di mana seseorang membuat orang lain meragukan ingatan, persepsi, atau kewarasan mereka sendiri secara sistematis.' },
  { term: 'Assertive Communication', desc: 'Gaya komunikasi jujur dan terbuka mengenai perasaan/kebutuhan sendiri dengan tetap menghargai batas dan perasaan orang lain.' },
  { term: 'Love Language', desc: 'Cara seseorang merasa paling dicintai dan cara mereka mengekspresikan cinta — words, acts, gifts, time, atau touch.' },
  { term: 'Emotional Regulation', desc: 'Kemampuan mengelola, menyesuaikan, dan merespons emosi dengan cara yang sehat dan proporsional sesuai situasi.' },
  { term: 'Passive Aggressive', desc: 'Ekspresi kemarahan secara tidak langsung — diam, sindiran, sabotase halus, atau menunda — bukannya mengutarakan langsung.' },
  { term: 'Mixed Signals', desc: 'Ketika seseorang mengirimkan pesan yang saling bertentangan antara kata-kata, tindakan, dan body language.' },
  { term: 'Bid for Connection', desc: 'Usaha kecil untuk mendapat perhatian, respons, atau kedekatan dari pasangan. Bisa verbal atau non-verbal.' },
  { term: 'Stonewalling', desc: 'Menarik diri dari interaksi sepenuhnya — menutup diri, tidak merespons, atau pura-pura tidak hadir secara emosional.' },
  { term: 'Flooding', desc: 'Keadaan di mana seseorang merasa kewalahan secara emosional hingga tidak bisa berpikir jernih atau berkomunikasi efektif.' },
]

const CATEGORIES = ['Semua', 'Komunikasi', 'Boundaries', 'Konflik', 'Apologi', 'Relasi', 'Emosi']

interface BookmarkItem {
  id: string
  type: string
}

export default function LibraryPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedGuides, setSavedGuides] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [activeTab, setActiveTab] = useState<'guides' | 'templates' | 'glossary'>('guides')
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null)

  const [guides, setGuides] = useState<any[]>(MINI_GUIDES)
  const [templates, setTemplates] = useState<any[]>(TEMPLATES)

  useEffect(() => {
    const fetchSavedGuides = async () => {
      try {
        const res = await fetch('/api/user/bookmarks')
        const data = await res.json()
        if (data.success && data.bookmarks) {
          const guideIds = data.bookmarks
            .filter((b: BookmarkItem) => b.type === 'guide')
            .map((b: BookmarkItem) => b.id)
          setSavedGuides(guideIds)
        }
      } catch (e) {
        console.error('Gagal mengambil bookmark:', e)
      }
    }
    
    const fetchLibraryData = async () => {
      try {
        const res = await fetch('/api/library')
        const data = await res.json()
        if (data.success) {
          if (data.guides && data.guides.length > 0) setGuides(data.guides)
          if (data.templates && data.templates.length > 0) setTemplates(data.templates)
        }
      } catch (e) {
        console.error('Gagal memuat data library:', e)
      }
    }

    fetchSavedGuides()
    fetchLibraryData()
  }, [])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const toggleSave = async (id: string) => {
    const isSaved = savedGuides.includes(id)
    const nextSavedGuides = isSaved
      ? savedGuides.filter(s => s !== id)
      : [...savedGuides, id]

    setSavedGuides(nextSavedGuides)

    try {
      await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'guide',
          itemId: id,
          action: isSaved ? 'remove' : 'add'
        })
      })
    } catch (e) {
      console.error('Gagal mensinkronisasikan bookmark:', e)
      // Rollback
      setSavedGuides(savedGuides)
    }
  }

  const filteredGuides = guides.filter(g => {
    const matchSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.desc.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = activeCategory === 'Semua' || g.category === activeCategory
    return matchSearch && matchCategory
  })

  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.text.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSearch
  })

  const filteredGlossary = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(searchQuery.toLowerCase()) || g.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(2,134,195,0.2), rgba(124,58,237,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(2,134,195,0.3)' }}>
              <Library size={22} color="var(--brand-blue)" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Library Edukasi Relasi</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Panduan praktis, template chat, dan kamus istilah relasi — siap pakai kapanpun.</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Cari panduan, template, atau istilah..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 42, borderRadius: 12 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              title="Bersihkan pencarian"
              aria-label="Bersihkan pencarian"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)', marginBottom: 24, width: 'fit-content' }}>
          {([
            { id: 'guides', icon: BookOpen, label: 'Mini Guides', count: filteredGuides.length },
            { id: 'templates', icon: MessageSquare, label: 'Chat Templates', count: filteredTemplates.length },
            { id: 'glossary', icon: GraduationCap, label: 'Glosarium', count: filteredGlossary.length },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: activeTab === tab.id ? 'var(--brand-blue)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                transition: 'all 150ms ease'
              }}
            >
              <tab.icon size={14} />
              {tab.label}
              <span style={{ fontSize: 11, fontWeight: 700, background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(2,134,195,0.1)', color: activeTab === tab.id ? 'white' : 'var(--brand-blue)', padding: '1px 6px', borderRadius: 999 }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ===== GUIDES TAB ===== */}
        {activeTab === 'guides' && (
          <>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: activeCategory === cat ? 'var(--brand-blue)' : 'rgba(255,255,255,0.4)',
                    color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                    transition: 'all 150ms ease',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredGuides.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ margin: 0, fontSize: 14 }}>Panduan tidak ditemukan. Coba kata kunci lain atau ubah filter.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                {filteredGuides.map(guide => (
                  <div key={guide.id} className="card card-hover animate-fadein" style={{ padding: 0, overflow: 'hidden' }}>
                    <div
                      style={{ padding: '18px 20px', cursor: 'pointer' }}
                      onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(2,134,195,0.1)', color: 'var(--brand-blue)', padding: '2px 8px', borderRadius: 999 }}>{guide.category}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {guide.readTime} baca</span>
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{guide.title}</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{guide.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); toggleSave(guide.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: savedGuides.includes(guide.id) ? 'var(--brand-blue)' : 'var(--text-muted)', padding: '4px 8px', marginLeft: 8, flexShrink: 0 }}
                        >
                          {savedGuides.includes(guide.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Tips */}
                    {expandedGuide === guide.id && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)', paddingTop: 16, animation: 'fadeIn 0.2s ease' }}>
                        <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Tips Praktis:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                          {guide.tips.map((tip: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.4)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.4)', fontSize: 12.5, color: 'var(--text-primary)', alignItems: 'flex-start', backdropFilter: 'blur(8px)' }}>
                              <CheckCircle size={13} color="var(--teal)" style={{ flexShrink: 0, marginTop: 1 }} />
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== TEMPLATES TAB ===== */}
        {activeTab === 'templates' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {filteredTemplates.map(tmpl => (
              <div key={tmpl.id} className="card card-hover animate-fadein" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(23,184,151,0.1)', color: 'var(--teal)', padding: '2px 8px', borderRadius: 999, display: 'block', marginBottom: 2 }}>{tmpl.category}</span>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{tmpl.title}</h4>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '12px 14px', background: 'rgba(255,255,255,0.5)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.4)', marginBottom: 12, backdropFilter: 'blur(8px)' }}>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>&quot;{tmpl.text}&quot;</p>
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {tmpl.tags.map((tag: string) => (
                    <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(2,134,195,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>#{tag}</span>
                  ))}
                </div>

                <button
                  onClick={() => handleCopy(tmpl.text, tmpl.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 6, justifyContent: 'center', fontSize: 12, background: copiedId === tmpl.id ? 'rgba(23,184,151,0.1)' : undefined, color: copiedId === tmpl.id ? 'var(--teal)' : undefined, borderColor: copiedId === tmpl.id ? 'rgba(23,184,151,0.3)' : undefined }}
                >
                  {copiedId === tmpl.id ? <><CheckCircle size={12} /> Tersalin!</> : <><Copy size={12} /> Salin Template</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== GLOSSARY TAB ===== */}
        {activeTab === 'glossary' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Kamus Istilah Relasi & Psikologi</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Penjelasan singkat tapi tajam soal istilah yang sering kamu denger tapi belum terlalu paham.</p>
            </div>
            <div style={{ padding: '8px 0' }}>
              {filteredGlossary.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Istilah tidak ditemukan.
                </div>
              ) : (
                filteredGlossary.map((item, idx) => (
                  <div key={idx} style={{ padding: '16px 20px', borderBottom: idx < filteredGlossary.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--brand-blue)', display: 'block', marginBottom: 4 }}>{item.term}</strong>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
