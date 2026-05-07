// ============================================================
// FRAMEWORK DEFINITIONS  (CEK removed — it's an output checker)
// ============================================================

export const FRAMEWORKS = {
  ROSES: {
    tagline: {
      id: 'Cocok untuk task kompleks & terstruktur',
      en: 'Best for complex, structured tasks',
    },
    description: {
      id: 'Framework paling lengkap. Bagus untuk task yang butuh banyak konteks dan langkah yang jelas.',
      en: 'Most comprehensive framework. Great for tasks needing rich context and clear steps.',
    },
    components: ['Role', 'Objective', 'Scenario', 'Expectations', 'Steps'],
    componentDescriptions: {
      id: {
        Role: 'Tentukan peran atau keahlian yang kamu minta dari AI — siapa AI dalam konteks ini?',
        Objective: 'Jelaskan tujuan atau hasil yang ingin kamu capai secara spesifik dan terukur.',
        Scenario: 'Berikan konteks situasi atau latar belakang bisnis yang relevan.',
        Expectations: 'Tentukan format, panjang, gaya, dan standar output yang kamu harapkan.',
        Steps: 'Uraikan langkah-langkah atau urutan pengerjaan yang harus diikuti AI.',
      },
      en: {
        Role: 'Define the role or expertise you want the AI to take — who is the AI in this context?',
        Objective: 'State the specific, measurable goal or outcome you want to achieve.',
        Scenario: 'Provide relevant situation context or business background.',
        Expectations: 'Specify the format, length, style, and standards you expect in the output.',
        Steps: 'Outline the steps or order of work the AI should follow.',
      },
    },
    examples: {
      id: [
        'Role → "Sebagai senior copywriter berpengalaman di industri fintech..."',
        'Objective → "...buatkan 3 variasi headline iklan untuk produk tabungan otomatis."',
        'Scenario → "Target audiens adalah millennial 25-35 tahun yang baru kerja pertama kali."',
        "Expectations → \"Setiap headline maksimal 10 kata, tone energetik, hindari kata 'investasi'.\"",
        'Steps → "Pertama buat headline untuk pain point, kedua untuk aspiration, ketiga untuk social proof."',
      ],
      en: [
        'Role → "As a senior copywriter experienced in fintech..."',
        'Objective → "...create 3 ad headline variations for an auto-savings product."',
        'Scenario → "Target audience is millennials aged 25–35 at their first job."',
        'Expectations → "Each headline max 10 words, energetic tone, avoid the word \'investment\'."',
        'Steps → "First a pain-point headline, second an aspiration headline, third social proof."',
      ],
    },
  },

  PESAN: {
    tagline: {
      id: 'Untuk konten, copywriting & komunikasi',
      en: 'For content, copywriting & communication',
    },
    description: {
      id: 'Dirancang untuk task kreatif dan komunikasi. Fokus pada tone, nuansa, dan batasan yang jelas.',
      en: 'Designed for creative tasks and communication. Focuses on tone, nuance, and clear constraints.',
    },
    components: ['Peran', 'Esensi', 'Situasi', 'Aturan', 'Nuansa'],
    componentDescriptions: {
      id: {
        Peran: 'Posisi atau keahlian yang kamu minta dari AI.',
        Esensi: 'Inti atau hasil akhir yang paling penting — apa yang harus ada di output?',
        Situasi: 'Konteks bisnis, audiens, atau kondisi yang melatarbelakangi permintaan ini.',
        Aturan: 'Batasan, larangan, atau constraints yang harus dipatuhi AI.',
        Nuansa: 'Format output, tone, dan gaya penyampaian yang diinginkan.',
      },
      en: {
        Peran: 'Role or expertise you want from the AI.',
        Esensi: 'Core essence or most important element — what must be in the output?',
        Situasi: 'Business context, audience, or conditions behind this request.',
        Aturan: 'Constraints, restrictions, or rules the AI must follow.',
        Nuansa: 'Output format, tone, and delivery style you want.',
      },
    },
    examples: {
      id: [
        'Peran → "Berperan sebagai social media manager brand skincare lokal."',
        'Esensi → "Buat caption Instagram yang mendorong audience untuk komen dan share."',
        'Situasi → "Brand kami baru 6 bulan, target audiens perempuan 20-28 tahun, produk baru: serum vitamin C."',
        'Aturan → "Jangan gunakan emoji lebih dari 3, hindari klaim medis, maksimal 150 kata."',
        'Nuansa → "Tone: akrab dan menyenangkan. Format: hook di kalimat pertama + body + CTA."',
      ],
      en: [
        'Peran → "Act as a social media manager for a local skincare brand."',
        'Esensi → "Create an Instagram caption that drives comments and shares."',
        'Situasi → "Brand is 6 months old, target: women 20–28, new product: vitamin C serum."',
        'Aturan → "Max 3 emojis, no medical claims, max 150 words."',
        'Nuansa → "Tone: friendly and fun. Format: hook + body + CTA."',
      ],
    },
  },

  SIP: {
    tagline: {
      id: 'Paling sederhana — cocok untuk pemula',
      en: 'Simplest — great for beginners',
    },
    description: {
      id: 'Hanya 3 komponen. Mulai dari sini kalau kamu baru belajar prompting.',
      en: 'Only 3 components. Start here if you\'re new to prompting.',
    },
    components: ['Siapa saya', 'Ingin apa', 'Penyajiannya'],
    componentDescriptions: {
      id: {
        'Siapa saya': 'Perkenalkan dirimu — siapa kamu dan apa konteks pekerjaanmu?',
        'Ingin apa': 'Apa yang kamu inginkan dari AI? Sebutkan goal atau tugasnya dengan spesifik.',
        'Penyajiannya': 'Bagaimana kamu ingin hasil disajikan? (format, struktur, panjang)',
      },
      en: {
        'Siapa saya': 'Introduce yourself — who are you and what is your work context?',
        'Ingin apa': 'What do you want from the AI? State the goal or task specifically.',
        'Penyajiannya': 'How do you want the result presented? (format, structure, length)',
      },
    },
    examples: {
      id: [
        'Siapa saya → "Saya adalah guru SD kelas 4 yang mengajar matematika."',
        'Ingin apa → "Saya ingin membuat 5 soal cerita tentang penjumlahan dan pengurangan."',
        'Penyajiannya → "Sajikan dalam format bernomor, tingkat kesulitan mudah ke sedang, gunakan konteks sehari-hari seperti belanja dan bermain."',
      ],
      en: [
        'Siapa saya → "I am a 4th grade elementary school teacher teaching math."',
        'Ingin apa → "I want to create 5 word problems about addition and subtraction."',
        'Penyajiannya → "Present in numbered format, easy to medium difficulty, using everyday contexts like shopping and playing."',
      ],
    },
  },
};

// ============================================================
// KEYWORD FALLBACK SCORER (used if no API key)
// ============================================================
const KEYWORDS = {
  ROSES: {
    Role: ['sebagai', 'kamu adalah', 'bertindak', 'you are', 'act as', 'as a', 'expert', 'ahli', 'berperan', 'posisikan'],
    Objective: ['tujuan', 'goal', 'ingin', 'butuh', 'hasilkan', 'buat', 'tulis', 'create', 'generate', 'write', 'bantu'],
    Scenario: ['konteks', 'situasi', 'latar belakang', 'perusahaan', 'bisnis', 'context', 'background', 'company', 'project', 'tim'],
    Expectations: ['format', 'panjang', 'gaya', 'tone', 'struktur', 'style', 'length', 'bullet', 'bahasa', 'gunakan', 'hindari'],
    Steps: ['langkah', 'step', 'pertama', 'kedua', 'first', 'second', 'mulai', 'kemudian', 'then', 'next', 'akhirnya'],
  },
  PESAN: {
    Peran: ['sebagai', 'kamu adalah', 'you are', 'act as', 'expert', 'ahli', 'berperan', 'saya adalah', 'i am', 'posisi'],
    Esensi: ['tujuan', 'goal', 'ingin', 'butuh', 'hasilkan', 'buat', 'tulis', 'create', 'generate', 'bantu'],
    Situasi: ['konteks', 'situasi', 'latar belakang', 'perusahaan', 'bisnis', 'context', 'background', 'company', 'project'],
    Aturan: ['jangan', 'tidak boleh', 'hindari', 'harus', 'wajib', 'batasan', "don't", 'avoid', 'must', 'constraint', 'maksimal'],
    Nuansa: ['format', 'tone', 'gaya', 'struktur', 'style', 'formal', 'informal', 'santai', 'profesional', 'template'],
  },
  SIP: {
    'Siapa saya': ['saya adalah', 'saya seorang', 'i am', "i'm a", 'sebagai seorang', 'saya bekerja', 'profesi', 'jabatan', 'my role'],
    'Ingin apa': ['ingin', 'mau', 'butuh', 'perlu', 'tolong', 'bantu', 'want', 'need', 'please', 'help', 'buat', 'create', 'tulis'],
    'Penyajiannya': ['format', 'tampilkan', 'sajikan', 'dalam bentuk', 'present', 'show', 'bullet', 'tabel', 'table', 'poin', 'list'],
  },
};

function statusFromScore(score) {
  if (score >= 2) return 'Excellent';
  if (score >= 1) return 'Fair';
  return 'Needs Work';
}

export function analyzeWithKeywords(prompt, framework, lang) {
  const fw = FRAMEWORKS[framework];
  const kws = KEYWORDS[framework];
  const lower = prompt.toLowerCase();
  const words = lower.split(/\s+/).length;

  const componentScores = {};
  let rawTotal = 0;

  for (const comp of fw.components) {
    const matches = (kws[comp] || []).filter(kw => lower.includes(kw));
    let score = 0;
    if (matches.length >= 3 || (matches.length >= 1 && words > 60)) score = 2;
    else if (matches.length >= 1) score = 1;

    rawTotal += score;
    componentScores[comp] = {
      score,
      max: 2,
      feedback: score === 0
        ? (lang === 'id' ? `Komponen ini tidak ditemukan dalam prompt kamu.` : `This component is missing from your prompt.`)
        : score === 1
        ? (lang === 'id' ? `Komponen ini ada tapi bisa lebih diperjelas dan dispesifikkan.` : `This component is present but could be more specific.`)
        : (lang === 'id' ? `Komponen ini sudah terpenuhi dengan baik.` : `This component is well covered.`),
    };
  }

  const maxPossible = fw.components.length * 2;
  const total = Math.round((rawTotal / maxPossible) * 10 * 10) / 10;

  const overall = lang === 'id'
    ? `Analisis ini menggunakan metode deteksi kata kunci (mode fallback karena API tidak tersedia). Skor mungkin tidak seakurat analisis AI. Total skor: ${total}/10.`
    : `This analysis used keyword detection (fallback mode, API unavailable). Score may be less accurate than AI analysis. Total score: ${total}/10.`;

  return { total_score: total, component_scores: componentScores, overall_feedback: overall, isFallback: true };
}
