'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ArrowLeft, BookOpen, Clock, Calendar, Bookmark, Share2, MessageCircle, AlertCircle } from 'lucide-react'
import { BLOG_POSTS } from '@/lib/data'

// Rich content for each article to make the page extremely comprehensive and informative
const ARTICLE_CONTENTS: Record<string, {
  subtitle: string;
  intro: string;
  sections: { title: string; content: string }[];
  conclusion: string;
  keyTakeaway: string;
}> = {
  'kenapa-sering-ghosting': {
    subtitle: 'Mengupas akar psikologis di balik hilangnya seseorang tanpa kabar.',
    intro: 'Kamu lagi asik chat, tiba-tiba dia hilang tanpa jejak. Atau jangan-jangan, justru kamu yang sering melakukan ini? Ghosting sering kali dicap sebagai tindakan pengecut atau jahat. Namun, jika kita bedah dari sudut pandang psikologi relasi, ghosting adalah salah satu bentuk pertahanan diri (self-protection) yang tidak disadari akibat ketidakmampuan mengelola kecemasan konflik.',
    sections: [
      {
        title: 'Hubungan Erat dengan Attachment Style',
        content: 'Orang yang sering melakukan ghosting biasanya memiliki Avoidant Attachment Style. Mereka merasa sangat tidak nyaman dengan kedekatan emosional yang terlalu intim. Ketika hubungan mulai terasa serius, alarm bawah sadar mereka berbunyi, mendeteksi kedekatan sebagai ancaman terhadap kebebasan mereka. Respons instingtif mereka adalah menjauh untuk memulihkan rasa aman.'
      },
      {
        title: 'Takut Menghadapi Konfrontasi',
        content: 'Menyatakan bahwa kita tidak tertarik lagi pada seseorang membutuhkan keberanian emosional. Bagi sebagian orang, menolak orang lain secara langsung menimbulkan rasa bersalah yang luar biasa. Untuk menghindari rasa bersalah dan kecemasan saat melihat orang lain sedih atau marah, mereka memilih jalan pintas: menghilang.'
      },
      {
        title: 'Bagaimana Memutus Siklus Ini?',
        content: 'Jika kamu adalah pelaku ghosting, mulailah melatih komunikasi asertif. Katakan dengan jujur namun sopan jika kamu merasa hubungan ini tidak bisa dilanjutkan. Kalimat sederhana seperti "Aku menghargai waktu kita bareng, tapi aku ngerasa kita kurang cocok untuk lanjut" jauh lebih menghargai kemanusiaan orang lain dibanding diam seribu bahasa.'
      }
    ],
    conclusion: 'Ghosting mungkin terasa mudah bagi pelaku untuk jangka pendek, tetapi meninggalkan utang emosional bagi kedua belah pihak. Bagi korban, hal ini memicu overthinking, sedangkan bagi pelaku, ini memperkuat pola lari dari masalah.',
    keyTakeaway: 'Komunikasi yang jujur, meski terasa canggung di awal, adalah pondasi hubungan yang waras dan dewasa.'
  },
  'love-language-bisa-berubah': {
    subtitle: 'Bagaimana preferensi kasih sayang kita berevolusi seiring waktu dan kedewasaan.',
    intro: 'Dulu kamu merasa paling dicintai kalau pacar memuji penampilanmu (Words of Affirmation). Sekarang, kamu justru lebih tersentuh kalau dia berinisiatif mencuci piring atau membantumu mengerjakan tugas (Acts of Service). Apakah ini normal? Jawabannya: Sangat normal. Love language bukanlah sifat kepribadian yang kaku dan permanen, melainkan cerminan kebutuhan emosional kita saat ini.',
    sections: [
      {
        title: 'Kebutuhan Emosional Mengikuti Fase Hidup',
        content: 'Fase hidup yang berbeda menuntut bentuk dukungan yang berbeda. Saat masih sekolah, pujian verbal atau hadiah kecil mungkin terasa sangat mendominasi. Namun, saat memasuki dunia kerja yang penuh tekanan, bantuan nyata untuk meringankan beban harian (Acts of Service) atau waktu berkualitas tanpa gangguan ponsel (Quality Time) sering kali bergeser menjadi kebutuhan utama.'
      },
      {
        title: 'Pengaruh Pengalaman Masa Lalu',
        content: 'Pengalaman hubungan sebelumnya juga ikut membentuk love language kita. Seseorang yang pernah mengalami pengkhianatan mungkin akan lebih menghargai Quality Time dan Physical Touch sebagai penegasan keamanan hubungan. Kepercayaan yang pulih mengubah cara kita mengapresiasi kehadiran pasangan.'
      },
      {
        title: 'Pentingnya Re-assessment Berkala',
        content: 'Karena preferensi bisa bergeser, sangat disarankan bagi pasangan untuk melakukan tes secara berkala. Ini bukan untuk mencari siapa yang salah, melainkan untuk memperbarui data Insight Hub kita tentang apa yang membuat pasangan merasa dihargai saat ini.'
      }
    ],
    conclusion: 'Menyadari bahwa bahasa kasih bisa berubah membantu kita terhindar dari asumsi usang. Jangan berasumsi pasanganmu masih menginginkan hal yang sama seperti tiga tahun lalu.',
    keyTakeaway: 'Teruslah berkomunikasi dan lakukan pembaruan profil relasi secara berkala agar tidak salah paham.'
  },
  'cara-ngomong-saat-kesel': {
    subtitle: 'Panduan praktis mengekspresikan kemarahan tanpa merusak ikatan hubungan.',
    intro: 'Marah itu manusiawi dan sehat. Yang tidak sehat adalah cara kita mengekspresikannya. Sering kali saat kesal, kita menyerang karakter orang lain atau justru diam seribu bahasa (silent treatment). Keduanya sama-sama merusak. Kuncinya adalah merubah cara penyampaian pesan agar kemarahan kita dipahami, bukan memicu sikap defensif pasangan.',
    sections: [
      {
        title: 'Gunakan "I-Statement" Ketimbang "You-Statement"',
        content: 'Fokuslah pada perasaanmu sendiri, bukan kesalahan pasangan. Alih-alih berkata "Kamu selalu telat dan gak pernah mikirin perasaan aku!" cobalah ubah menjadi "Aku merasa tidak dihargai ketika harus menunggu lama tanpa kabar, karena waktu luangku sangat terbatas." Kalimat kedua menjelaskan dampak tindakan tanpa langsung menyudutkan karakter pasangan.'
      },
      {
        title: 'Pahami Pemicu Emosimu (Trigger)',
        content: 'Sebelum berbicara, ambil jeda. Tanyakan pada dirimu sendiri: Apakah kemarahan ini murni karena kejadian sekarang, atau ada akumulasi kelelahan kerja, kurang tidur, atau luka lama yang terpancing? Berbicara saat tensi emosi berada di puncak (level stres 8 ke atas) hanya akan menghasilkan kata-kata yang disesali kemudian.'
      },
      {
        title: 'Sepakati Waktu untuk Membahas Masalah',
        content: 'Hindari membahas hal sensitif saat pasangan baru pulang kerja atau sedang sibuk. Ajukan waktu yang netral: "Ada hal yang mengganjal di perasaanku soal kemarin. Kapan kita bisa ngobrol santai tanpa keganggu?" Hal ini memberikan persiapan mental bagi kedua belah pihak.'
      }
    ],
    conclusion: 'Mengelola amarah bukan berarti menahannya. Ini tentang menyalurkan energi kemarahan menjadi solusi konstruktif untuk memperkuat batasan diri (boundaries).',
    keyTakeaway: 'Komunikasi asertif adalah jembatan antara meredam perasaan dan meledak secara destruktif.'
  },
  'tanda-anxious-attachment': {
    subtitle: 'Mengenali kecenderungan cemas dalam relasi dan langkah awal memulihkannya.',
    intro: 'Apakah kamu sering merasa panik jika pasangan lambat membalas pesan? Apakah kamu terus-menerus membutuhkan penegasan (reassurance) bahwa dia masih mencintaimu? Jika iya, kamu mungkin memiliki Anxious Attachment Style. Memahami pola cemas ini adalah langkah pertama untuk membangun hubungan yang lebih tenang dan aman.',
    sections: [
      {
        title: 'Asal-usul Pola Cemas',
        content: 'Gaya kelekatan cemas terbentuk sejak masa kecil, biasanya karena perhatian orang tua atau pengasuh yang tidak konsisten — kadang sangat hangat, kadang dingin atau abai. Akibatnya, anak tumbuh dengan keyakinan bahwa kasih sayang adalah sesuatu yang tidak stabil dan harus terus diperjuangkan secara aktif.'
      },
      {
        title: 'Mekanisme Protes (Protest Behavior)',
        content: 'Saat merasa terancam akan ditinggalkan, orang dengan tipe cemas sering menunjukkan perilaku protes. Ini bisa berupa menelepon berkali-kali, mengirim pesan kemarahan, mengancam akan pergi padahal ingin ditahan, atau mencoba membuat pasangan cemburu. Ini adalah upaya bawah sadar untuk memulihkan koneksi, namun sayangnya sering kali malah menjauhkan pasangan.'
      },
      {
        title: 'Langkah Regulasi Mandiri',
        content: 'Ketika rasa cemas mulai menyerang, lakukan grounding. Ingatkan dirimu: "Pesan yang belum dibalas tidak sama dengan penolakan atau perpisahan. Aku aman secara mandiri." Tulis kekhawatiranmu di jurnal hubungan sebelum merespons pasangan agar pikiranmu lebih jernih.'
      }
    ],
    conclusion: 'Mengubah pola cemas menjadi secure membutuhkan waktu dan kesabaran. Jangan menghakimi dirimu sendiri; pola ini adalah hasil adaptasi masa lalu yang kini tidak lagi membantumu.',
    keyTakeaway: 'Rasa aman sejati dimulai dari kemampuan menenangkan diri sendiri (self-soothing) sebelum mencari validasi eksternal.'
  },
  'konflik-yang-sehat': {
    subtitle: 'Mengapa hubungan tanpa pertengkaran justru rawan, dan bagaimana mengelola konflik dengan benar.',
    intro: 'Banyak orang mengira hubungan yang ideal adalah hubungan yang bebas dari konflik. Pandangan ini keliru. Hubungan tanpa konflik sering kali menandakan adanya penekanan emosi (suppression) di mana salah satu atau kedua pihak takut menyuarakan ketidakpuasan mereka. Konflik adalah kesempatan emas untuk menyelaraskan ekspektasi dan memperdalam Insight Hub.',
    sections: [
      {
        title: 'Konflik sebagai Alat Diagnosis',
        content: 'Pertengkaran menunjukkan titik-titik di mana batasan diri kita atau pasangan saling bergesekan. Dari sini kita tahu aspek apa yang membutuhkan kompromi baru. Tanpa adanya gesekan ini, kita tidak akan pernah tahu di mana batas kenyamanan masing-masing.'
      },
      {
        title: 'Fokus pada Masalah, Bukan Memenangkan Debat',
        content: 'Tujuan konflik yang sehat adalah menemukan solusi bersama, bukan membuktikan siapa yang benar dan siapa yang salah. Ketika kamu fokus untuk memenangkan argumen, hubunganmu yang kalah. Dengarkan perspektif pasangan tanpa langsung menyela atau merancang balasan di kepalamu.'
      },
      {
        title: 'Aturan "Time-Out" saat Kewalahan',
        content: 'Jika diskusi mulai memanas dan emosi meledak, mintalah time-out secara asertif: "Aku ngerasa emosiku mulai naik dan aku gak mau ngomong kasar. Boleh kita break 20 menit dulu untuk tenangin diri, baru lanjut ngobrol?" Pastikan kamu kembali membahasnya setelah tenang agar tidak berubah menjadi silent treatment.'
      }
    ],
    conclusion: 'Konflik tidak akan menghancurkan hubungan yang kuat jika dikelola dengan empati, rasa hormat, dan komitmen untuk saling mendengarkan.',
    keyTakeaway: 'Bukan tentang seberapa sering kita berdebat, melainkan bagaimana kita berbaikan (repair) setelah perdebatan selesai.'
  },
  'passive-aggressive-explained': {
    subtitle: 'Memahami dampak racun diam dan sindiran halus, serta cara mengubahnya jadi asertif.',
    intro: 'Berkata "Aku gak apa-apa" dengan nada ketus, mendiamkan pasangan selama berhari-hari, atau menyindir secara halus di media sosial adalah contoh klasik dari perilaku pasif-agresif. Perilaku ini merusak karena mengirimkan sinyal ganda yang membingungkan dan menghalangi penyelesaian masalah secara langsung.',
    sections: [
      {
        title: 'Kenapa Kita Memilih Pasif-Agresif?',
        content: 'Perilaku pasif-agresif biasanya lahir dari rasa takut akan konflik langsung atau keyakinan bahwa mengungkapkan kemarahan secara terbuka adalah hal yang buruk. Akibatnya, kemarahan yang ditekan keluar dalam bentuk penolakan halus, ketidakkooperatifan, atau sarkasme.'
      },
      {
        title: 'Dampak Buruk bagi Pasangan',
        content: 'Pasif-agresif menciptakan iklim hubungan yang penuh ketegangan dan ketidakpastian. Pasangan akan merasa seperti berjalan di atas pecahan kaca, selalu cemas menebak-nebak apa kesalahan mereka. Ini mengikis rasa aman dan kedekatan emosional.'
      },
      {
        title: 'Ubah Sandi Menjadi Asertif',
        content: 'Latihlah untuk langsung menyuarakan unek-unek secara lugas. Alih-alih mendiamkan pasangan agar dia "berpikir sendiri", katakan dengan jelas: "Aku kecewa karena kamu lupa rencana makan malam kita hari ini. Aku butuh kita jadwalkan ulang." Ini menghemat energi emosional kedua belah pihak.'
      }
    ],
    conclusion: 'Kejujuran yang disampaikan dengan penuh rasa hormat jauh lebih menyelamatkan hubungan dibanding keheningan yang penuh amarah.',
    keyTakeaway: 'Katakan apa yang kamu maksudkan, dan maksudkan apa yang kamu katakan. Komunikasi langsung adalah kunci hubungan sehat.'
  },
  'secure-attachment-guide': {
    subtitle: 'Membangun pelabuhan emosional yang stabil, tenang, dan saling percaya.',
    intro: 'Orang dengan secure attachment style tidak terlahir begitu saja; mereka dibentuk oleh pengalaman atau secara sadar melatih diri mereka. Jika kamu sering merasa cemas atau menghindar dalam hubungan, jangan khawatir. Kelekatan aman (secure attachment) adalah keterampilan relasional yang sepenuhnya bisa dipelajari dan dilatih dengan komitmen dan kesadaran diri.',
    sections: [
      {
        title: 'Grounding Emosi Secara Mandiri',
        content: 'Kunci utama secure attachment adalah kemampuan menenangkan diri sendiri (self-soothing) saat badai kecemasan datang. Ketahuilah bahwa perasaan cemas yang muncul sering kali hanyalah gaung trauma masa lalu, bukan cerminan fakta objektif hubunganmu hari ini.'
      },
      {
        title: 'Berkomunikasi Tanpa Kode dan Taktik',
        content: 'Orang yang secure berbicara jujur tentang kebutuhan mereka tanpa manipulasi, ngambek, atau silent treatment. Mereka berani bilang: "Aku butuh waktu berdua malam ini" atau "Aku merasa canggung dengan pembicaraan tadi" tanpa takut ditolak.'
      },
      {
        title: 'Menjaga Keseimbangan Kedekatan & Kemandirian',
        content: 'Hubungan yang sehat memberikan ruang bagi kedua belah pihak untuk tumbuh secara personal. Kamu tidak kehilangan dirimu di dalam relasi, dan kamu juga tidak menutup diri dari ketergantungan yang sehat dengan pasangan.'
      }
    ],
    conclusion: 'Secure attachment bukan berarti tidak pernah bertengkar, melainkan tahu cara menyelesaikan perbedaan dengan kepala dingin dan saling merangkul setelahnya.',
    keyTakeaway: 'Keamanan emosional sejati tumbuh dari keterbukaan yang asertif dan komitmen untuk saling memahami tanpa asumsi.'
  },
  'kalimat-bikin-tidak-dihargai': {
    subtitle: 'Kalimat-kalimat "sepele" yang perlahan tapi pasti merusak penghargaan diri pasangan.',
    intro: 'Kata-kata memiliki kekuatan luar biasa dalam hubungan. Sering kali, konflik besar bukan disebabkan oleh masalah prinsipil, melainkan akumulasi dari kalimat-kalimat kecil yang meremehkan perasaan pasangan. Mari kita bedah kalimat apa saja yang harus kita hindari demi menjaga kesehatan emosi pasangan.',
    sections: [
      {
        title: 'Meremehkan Emosi: "Ah lebay banget lo!"',
        content: 'Menyebut perasaan pasangan "lebay" atau "berlebihan" adalah bentuk invalidasi emosional. Ini membuat mereka merasa bersalah karena merasakan sesuatu, mengikis rasa percaya diri, dan membuat mereka enggan terbuka lagi di masa depan.'
      },
      {
        title: 'Menyumbat Komunikasi: "Terserah kamu deh, capek."',
        content: 'Kalimat ini adalah bentuk pengabaian (stonewalling) halus. Ketika kita menolak berdiskusi dan memilih lari dari argumen secara sepihak, pasangan akan merasa dibiarkan menghadapi masalah sendirian tanpa penyelesaian.'
      },
      {
        title: 'Membandingkan: "Kok kamu gak kayak dia sih?"',
        content: 'Perbandingan merusak pilar keunikan hubungan. Pasangan butuh dicintai karena siapa mereka, bukan dibanding-bandingkan dengan pencapaian atau sifat orang lain.'
      }
    ],
    conclusion: 'Belajarlah menggunakan bahasa yang memvalidasi dan mendengarkan secara aktif. Komunikasi yang menghargai adalah bahan bakar utama relasi yang awet.',
    keyTakeaway: 'Sebelum berbicara saat kesal, tanyakan pada diri sendiri: Apakah kata-kata ini membangun solusi atau meruntuhkan harga diri pasangan?'
  },
  'kerentanan-kekuatan': {
    subtitle: 'Mengapa membuka diri dan menunjukkan kelemahan adalah kunci keintiman sejati.',
    intro: 'Banyak dari kita tumbuh dengan keyakinan bahwa menunjukkan kelemahan atau rasa takut adalah tanda kerapuhan. Namun, di dalam hubungan romantis, kerentanan (vulnerability) justru merupakan kekuatan terbesar yang menjembatani keintiman emosional. Tanpa keberanian untuk terbuka, hubungan akan tetap terasa dangkal.',
    sections: [
      {
        title: 'Melepas Topeng Sempurna',
        content: 'Kita sering ingin terlihat selalu kuat, cerdas, dan mandiri di depan pasangan. Padahal, membiarkan pasangan melihat ketakutan, kegagalan, dan luka kita adalah tanda bahwa kita memercayai mereka sepenuhnya. Ini mengundang mereka untuk melakukan hal yang sama.'
      },
      {
        title: 'Koneksi Tumbuh dari Kelemahan Bersama',
        content: 'Ketika kita berani berkata "Aku takut gagal" atau "Aku ngerasa gak aman hari ini", kita menciptakan ruang empati yang murni. Pasangan tidak akan merasa dituntut untuk menjadi sempurna juga.'
      },
      {
        title: 'Membagi Batasan Diri Secara Jujur',
        content: 'Menyampaikan batasan diri (boundaries) membutuhkan kerentanan. Menjelaskan mengapa suatu hal membuat kita tidak nyaman membantu pasangan memahami peta emosi kita secara utuh.'
      }
    ],
    conclusion: 'Relasi yang dewasa tidak dibangun oleh dua orang yang sempurna, melainkan dua orang tidak sempurna yang berani jujur dan saling merangkul kelemahan masing-masing.',
    keyTakeaway: 'Keintiman emosional yang kokoh tidak akan pernah terwujud tanpa adanya keberanian untuk membiarkan diri kita terlihat apa adanya.'
  },
  'over-giving-dalam-hubungan': {
    subtitle: 'Mendeteksi pola pengorbanan berlebihan yang tidak seimbang dalam relasi.',
    intro: 'Mencintai berarti memberi, itu benar. Namun, jika kamu selalu menjadi pihak yang memberi waktu, perhatian, energi, dan materi, sementara pasanganmu hanya menerima tanpa timbal balik yang setara — kamu mungkin terjebak dalam pola over-giving. Pola ini melelahkan secara mental dan berujung pada rasa dongkol yang terpendam.',
    sections: [
      {
        title: 'Akar dari People Pleasing',
        content: 'Over-giving sering kali berakar dari ketakutan akan penolakan atau perasaan bahwa kita tidak cukup berharga jika tidak berguna bagi orang lain. Kita memberi secara berlebihan sebagai jaminan agar pasangan tidak meninggalkan kita.'
      },
      {
        title: 'Kehilangan Batasan Diri (Loss of Boundaries)',
        content: 'Saat sibuk memenuhi kebutuhan pasangan, kita kerap melupakan kebutuhan kita sendiri. Kita mengabaikan kesehatan fisik, hobi, dan pertemanan demi mendahulukan kebahagiaan pasangan.'
      },
      {
        title: 'Membangun Resiproksitas yang Sehat',
        content: 'Hubungan adalah jalan dua arah yang membutuhkan keseimbangan (resiprokal). Latihlah dirimu untuk menolak secara asertif jika kapasitas energimu sedang penuh, dan biarkan pasangan mengambil peran untuk merawatmu juga.'
      }
    ],
    conclusion: 'Pengorbanan yang sehat memiliki batas. Jangan sampai demi mempertahankan hubungan dengan orang lain, kamu mengorbankan hubungan dengan dirimu sendiri.',
    keyTakeaway: 'Resiproksitas adalah bukti bahwa kedua belah pihak sama-sama menghargai dan memperjuangkan keberadaan satu sama lain.'
  },
  'overthinking-malam-hari': {
    subtitle: 'Mengurai cemas malam hari dan cara menenangkan pikiran yang bising.',
    intro: 'Kenapa ya, pikiran-pikiran cemas soal masa depan, kesalahan masa lalu, atau chat pasangan yang singkat selalu menyerang tepat saat kita memejamkan mata di malam hari? Overthinking malam hari bukan pertanda kamu aneh. Ini adalah sinyal dari otakmu yang akhirnya mendapat keheningan setelah seharian penuh distreksi aktivitas.',
    sections: [
      {
        title: 'Otak Memproses Unek-unek yang Tertunda',
        content: 'Sepanjang siang, kesibukan bekerja atau belajar membuat kita mengabaikan kecemasan kecil. Saat malam tiba dan stimulan luar mereda, otak memanfaatkan momen tenang tersebut untuk memproses perasaan-perasaan tidak nyaman yang belum terselesaikan.'
      },
      {
        title: 'Metode Brain Dumping di Jurnal',
        content: 'Salah satu cara meredakan kebisingan otak adalah menuangkannya ke dalam tulisan sebelum tidur. Lakukan brain dump di Jurnal Insight Hub: tulis semua ketakutan, rencana besok, atau kekesalanmu secara bebas tanpa disensor sampai kepalamu terasa enteng.'
      },
      {
        title: 'Teknik Grounding 5-4-3-2-1',
        content: 'Saat pikiran mulai melantur ke skenario terburuk hubungan, kembalikan kesadaranmu ke saat ini. Rasakan kasur yang kamu tiduri, dengar suara kipas angin, dan tarik napas dalam secara perlahan untuk menurunkan level stres fisikmu.'
      }
    ],
    conclusion: 'Overthinking malam tidak perlu dilawan dengan paksa. Cukup akui kehadirannya, tuliskan, lalu biarkan pikiranmu beristirahat secara bertahap.',
    keyTakeaway: 'Menuliskan kecemasan di atas kertas memindahkan beban dari kepala ke media luar, memberi otak sinyal aman untuk tidur.'
  },
  'rebuild-trust-setelah-rusak': {
    subtitle: 'Langkah-langkah konkret membangun kembali fondasi kepercayaan yang hancur.',
    intro: 'Ini adalah salah satu proses paling menantang dalam hubungan. Membangun kembali kepercayaan yang rusak akibat pengkhianatan atau kebohongan membutuhkan waktu yang lama, konsistensi total dari pelaku, dan kebesaran hati dari korban untuk belajar menerima kembali secara bertahap.',
    sections: [
      {
        title: 'Transparansi Penuh Tanpa Rahasia',
        content: 'Pihak yang melanggar kepercayaan wajib memberikan transparansi penuh untuk meredakan kecurigaan korban. Ini termasuk memberikan penjelasan jujur, bersikap terbuka tentang aktivitas harian, dan tidak defensif saat ditanya.'
      },
      {
        title: 'Konsistensi Tindakan vs Kata-kata',
        content: 'Janji manis tidak akan cukup. Kepercayaan hanya dibangun lewat tindakan nyata yang konsisten dari waktu ke waktu. Jika kamu bilang akan memberi kabar jam 7 malam, pastikan kamu benar-benar melakukannya secara tepat waktu.'
      },
      {
        title: 'Proses Pemulihan yang Tidak Instan',
        content: 'Kedua belah pihak harus memahami bahwa pemulihan trust mengalami pasang surut. Korban mungkin akan mengalami momen di mana luka lama terpicu kembali. Pelaku harus tetap sabar dan suportif dalam mendampingi emosi pasangan.'
      }
    ],
    conclusion: 'Rebuild trust adalah kerja keras tim. Hubungan bisa pulih bahkan menjadi lebih kuat, asalkan kedua belah pihak berkomitmen penuh untuk belajar dari kesalahan.',
    keyTakeaway: 'Kepercayaan dibangun dengan sendok demi sendok lewat konsistensi harian, namun bisa tumpah sekaligus jika tidak dijaga dengan hati-hati.'
  }
};

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(false)
  const [copied, setCopied] = useState(false)

  const slug = params.slug as string
  const post = BLOG_POSTS.find(p => p.slug === slug)
  const content = ARTICLE_CONTENTS[slug]

  useEffect(() => {
    if (!post) return;

    const checkBookmarkStatus = async () => {
      try {
        const res = await fetch('/api/user/bookmarks')
        const data = await res.json()
        if (data.success && data.bookmarks) {
          const isSaved = data.bookmarks.some((b: any) => b.id === post.id && b.type === 'article')
          setBookmarked(isSaved)
          localStorage.setItem(`bookmark_blog_${post.id}`, isSaved ? 'true' : 'false')
          return
        }
      } catch (e) {
        console.error('Gagal mengambil status bookmark dari database:', e)
      }

      // Fallback ke local storage jika database tidak terjangkau / user tidak login
      const saved = localStorage.getItem(`bookmark_blog_${post.id}`)
      if (saved === 'true') {
        setBookmarked(true)
      }
    };

    checkBookmarkStatus()
  }, [post])

  if (!post || !content) {
    return (
      <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: 32 }}>
          <AlertCircle size={40} color="var(--error)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Artikel Gak Ketemu</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
            Maaf banget, artikel yang kamu cari gak ada di radar kami atau mungkin udah dipindahkan ke kategori lain.
          </p>
          <Link href="/blog" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            <ArrowLeft size={16} />
            Balik ke Blog
          </Link>
        </div>
      </div>
    )
  }

  const handleBookmark = async () => {
    const nextState = !bookmarked
    setBookmarked(nextState)
    localStorage.setItem(`bookmark_blog_${post.id}`, nextState ? 'true' : 'false')

    // Add to user bookmarks in DB if logged in
    try {
      await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'article', itemId: post.id, action: nextState ? 'add' : 'remove' })
      })
    } catch (e) {
      console.error('Failed to sync bookmark to DB', e)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Related posts (excluding current post, same category if possible)
  const relatedPosts = BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 2)

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 40, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        
        {/* Back navigation */}
        <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24, transition: 'color 150ms ease' }} onMouseOver={e => e.currentTarget.style.color = 'var(--brand-blue)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ArrowLeft size={16} />
          Kembali ke Blog
        </Link>

        {/* Article Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-blue)', background: 'rgba(2,134,195,0.08)', padding: '3px 10px', borderRadius: 20 }}>
              {post.category}
            </span>
            {post.trending && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#white', background: '#F5A623', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                Trending
              </span>
            )}
          </div>
          
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 12, letterSpacing: '-0.02em' }}>
            {post.title}
          </h1>
          
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
            {content.subtitle}
          </p>

          {/* Meta Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 0', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                <Image src={post.author.avatar} alt={post.author.name} fill style={{ objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{post.author.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  <span style={{ marginRight: 8 }}>{post.publishedAt}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={10} /> {post.readTime}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleBookmark}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6, borderColor: bookmarked ? 'var(--brand-blue)' : 'var(--border)' }}
              >
                <Bookmark size={14} fill={bookmarked ? 'var(--brand-blue)' : 'none'} color={bookmarked ? 'var(--brand-blue)' : 'currentColor'} />
                {bookmarked ? 'Tersimpan' : 'Simpan'}
              </button>
              <button
                onClick={handleShare}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6 }}
              >
                <Share2 size={14} />
                {copied ? 'Tersalin!' : 'Bagikan'}
              </button>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div style={{ position: 'relative', width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', marginBottom: 32, border: '1px solid var(--border-subtle)' }}>
          <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} priority />
        </div>

        {/* Article Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          {/* Content */}
          <article style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)' }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 24, paddingLeft: 16, borderLeft: '4px solid var(--brand-blue)' }}>
              {content.intro}
            </p>

            {content.sections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, marginTop: 24 }}>
                  {idx + 1}. {section.title}
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {section.content}
                </p>
              </div>
            ))}

            {/* Key Takeaway Box */}
            <div style={{ background: 'rgba(23,184,151,0.05)', borderLeft: '4px solid var(--teal)', padding: '20px 24px', borderRadius: '0 8px 8px 0', margin: '32px 0' }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pesan Kunci
              </h4>
              <p style={{ fontSize: 14, fontStyle: 'italic', margin: 0, color: 'var(--text-primary)' }}>
                {content.keyTakeaway}
              </p>
            </div>

            <p style={{ margin: '24px 0 0', color: 'var(--text-secondary)' }}>
              {content.conclusion}
            </p>
          </article>

          {/* Disclaimer / Call to action */}
          <div className="card" style={{ padding: 24, background: 'var(--surface)', marginTop: 20, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(2,134,195,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={18} color="var(--brand-blue)" />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 6px' }}>Mau ngerti pola relasi kamu lebih dalam?</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
                  Ayo isi 19 assessment relasi kami secara gratis untuk mengetahui attachment style, love language, gaya komunikasi, dan conflict repair kamu.
                </p>
                <Link href="/daftar" className="btn btn-primary btn-sm">
                  Coba Gratis Sekarang
                </Link>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 32, marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>Mungkin Kamu Juga Suka</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {relatedPosts.map(p => (
                <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card card-hover" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: 120, width: '100%' }}>
                      <Image src={p.coverImage} alt={p.title} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 10, color: 'var(--brand-blue)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{p.category}</span>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4, flex: 1 }}>{p.title}</h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 767px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
