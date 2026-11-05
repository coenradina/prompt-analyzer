import { FRAMEWORKS, analyzeWithKeywords } from './frameworks.js';
import { analyzeWithGroq, getRemainingRequests } from './api.js';

// ============================================================
// STATE
// ============================================================
const state = {
  step: 1,           // 1 | 2 | 3
  framework: null,   // 'ROSES' | 'PESAN' | 'SIP'
  prompt: '',
  lang: 'id',
  theme: 'dark',
  lastResult: null,
};

// ============================================================
// I18N
// ============================================================
const T = {
  id: {
    s1Title: 'Pilih Formula Prompt',
    s1Sub: 'Setiap formula cocok untuk situasi yang berbeda. Pilih yang sesuai kebutuhanmu.',
    dot1: 'Pilih Formula', dot2: 'Tulis Prompt', dot3: 'Lihat Hasil',
    back: 'Kembali', backEdit: 'Edit Prompt', retry: 'Analisis Ulang',
    inputLabel: 'Prompt kamu',
    guideTitle: 'Panduan menulis',
    exampleLabel: 'Contoh prompt lengkap:',
    placeholder: 'Tulis atau paste prompt-mu di sini...',
    privacyNote: 'Prompt dikirim ke Groq untuk dianalisis dan tidak disimpan oleh situs ini. Jangan tempel data pribadi atau rahasia.',
    charLabel: 'karakter',
    analyzeBtn: 'Analisis Sekarang',
    loading: 'Menganalisis prompt dengan AI...',
    errTitle: 'Ups, ada masalah',
    errRetry: 'Coba Lagi',
    labelBreakdown: 'Detail per Komponen',
    labelOverall: 'Feedback Keseluruhan',
    verdicts: { high: 'Sangat Bagus! 🎉', good: 'Bagus', fair: 'Lumayan', low: 'Perlu Perbaikan' },
    verdictDesc: {
      high: 'Prompt kamu sudah sangat lengkap dan terstruktur. AI akan dengan mudah memahami dan mengikuti instruksimu.',
      good: 'Prompt kamu sudah cukup baik! Ada beberapa bagian kecil yang bisa diperkuat untuk hasil yang lebih optimal.',
      fair: 'Ada beberapa komponen penting yang masih kurang. Perbaiki bagian yang ditandai untuk hasil yang jauh lebih baik.',
      low: 'Prompt masih terlalu umum. Tambahkan lebih banyak konteks dan detail agar AI bisa membantu dengan lebih tepat.',
    },
    quotaLabel: (n) => n === 0 ? 'Kuota habis hari ini' : `${n} analisis tersisa`,
    scoreChips: { 2: 'Lengkap', 1: 'Sebagian', 0: 'Tidak Ada' },
    fallback: 'Mode fallback aktif — hasil berdasarkan deteksi kata kunci',
  },
  en: {
    s1Title: 'Choose a Prompt Formula',
    s1Sub: 'Each formula suits different situations. Pick the one that fits your need.',
    dot1: 'Pick Formula', dot2: 'Write Prompt', dot3: 'See Results',
    back: 'Back', backEdit: 'Edit Prompt', retry: 'Re-analyze',
    inputLabel: 'Your prompt',
    guideTitle: 'Writing guide',
    exampleLabel: 'Full prompt example:',
    placeholder: 'Write or paste your prompt here...',
    privacyNote: 'Your prompt is sent to Groq for analysis and is not stored by this site. Do not paste personal or confidential data.',
    charLabel: 'characters',
    analyzeBtn: 'Analyze Now',
    loading: 'Analyzing your prompt with AI...',
    errTitle: 'Oops, something went wrong',
    errRetry: 'Try Again',
    labelBreakdown: 'Component Details',
    labelOverall: 'Overall Feedback',
    verdicts: { high: 'Excellent! 🎉', good: 'Good', fair: 'Fair', low: 'Needs Work' },
    verdictDesc: {
      high: 'Your prompt is very complete and well-structured. The AI will easily understand and follow your instructions.',
      good: 'Your prompt is solid! A few small areas could be strengthened for even better results.',
      fair: 'Some important components are missing. Improve the flagged areas for much better AI responses.',
      low: 'The prompt is too vague. Add more context and detail so the AI can help you more precisely.',
    },
    quotaLabel: (n) => n === 0 ? 'Daily quota exhausted' : `${n} analyses left today`,
    scoreChips: { 2: 'Complete', 1: 'Partial', 0: 'Missing' },
    fallback: 'Fallback mode — results based on keyword detection',
  },
};

// ============================================================
// DOM HELPERS
// ============================================================
const $ = (id) => document.getElementById(id);
const t = () => T[state.lang];

function setText(id, val) {
  const el = $(id);
  if (el) el.textContent = val;
}

// ============================================================
// QUOTA BADGE
// ============================================================
function updateQuotaBadge() {
  const n = getRemainingRequests(); // null = unlimited (dev mode)
  const badge = $('quota-badge');
  const label = $('quota-label');
  if (label) {
    label.textContent = n === null ? 'Unlimited (dev)' : t().quotaLabel(n);
  }
  if (badge) {
    badge.classList.remove('warn', 'empty');
    if (n === null) badge.style.borderColor = 'var(--green)';
    else { badge.style.borderColor = ''; }
    if (n === 0) badge.classList.add('empty');
    else if (n === 1) badge.classList.add('warn');
  }
}

// ============================================================
// PROGRESS BAR
// ============================================================
function updateProgress(step) {
  const fill = $('progress-fill');
  if (fill) fill.style.width = `${((step - 1) / 2) * 100}%`;

  [1, 2, 3].forEach(i => {
    const dot = $(`dot-${i}`);
    if (!dot) return;
    dot.classList.remove('active', 'done');
    if (i < step) dot.classList.add('done');
    else if (i === step) dot.classList.add('active');
  });
}

// ============================================================
// STEP TRANSITIONS
// ============================================================
function goToStep(next) {
  const current = $(`step-${state.step}`);
  const target = $(`step-${next}`);
  if (!current || !target) return;

  current.classList.remove('active');
  target.classList.add('active');

  // Scroll result panel to top when entering step 3
  target.scrollIntoView({ behavior: 'instant', block: 'start' });
  window.scrollTo(0, 0);

  state.step = next;
  updateProgress(next);
}

// ============================================================
// STEP 1 — ATTACH CARD LISTENERS (cards are hardcoded in HTML)
// ============================================================
function attachCardListeners() {
  document.querySelectorAll('.formula-card[data-fw]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.framework = btn.getAttribute('data-fw');
      renderStep2Guide();
      goToStep(2);
    });
  });
}

// Update i18n text on the hardcoded cards
function updateCardText(lang) {
  const fw = FRAMEWORKS;
  const map = {
    'roses-tagline': fw.ROSES.tagline[lang],
    'roses-desc':    fw.ROSES.description[lang],
    'pesan-tagline': fw.PESAN.tagline[lang],
    'pesan-desc':    fw.PESAN.description[lang],
    'sip-tagline':   fw.SIP.tagline[lang],
    'sip-desc':      fw.SIP.description[lang],
  };
  for (const [id, text] of Object.entries(map)) {
    const el = $(id);
    if (el) el.textContent = text;
  }
}

// ============================================================
// STEP 2 — GUIDE + INPUT
// ============================================================
function renderStep2Guide() {
  const fw = FRAMEWORKS[state.framework];
  if (!fw) return;

  setText('guide-fw-badge', state.framework);
  setText('guide-title', t().guideTitle);
  setText('example-label', t().exampleLabel);
  setText('input-label', t().inputLabel);
  $('prompt-input').placeholder = t().placeholder;
  setText('privacy-note', t().privacyNote);

  // Components guide
  const compContainer = $('guide-components');
  if (compContainer) {
    compContainer.innerHTML = '';
    const descs = fw.componentDescriptions[state.lang];
    for (const comp of fw.components) {
      const el = document.createElement('div');
      el.className = 'guide-comp';
      el.innerHTML = `
        <span class="guide-comp-letter">${comp[0]}</span>
        <div class="guide-comp-body">
          <div class="guide-comp-name">${comp}</div>
          <div class="guide-comp-desc">${descs[comp]}</div>
        </div>
      `;
      compContainer.appendChild(el);
    }
  }

  // Example lines
  const exContainer = $('guide-example');
  if (exContainer) {
    exContainer.innerHTML = '';
    const examples = fw.examples[state.lang];
    for (const ex of examples) {
      const parts = ex.split('→');
      const line = document.createElement('div');
      line.className = 'guide-example-line';
      if (parts.length === 2) {
        line.innerHTML = `<strong>${parts[0].trim()} →</strong> ${parts[1].trim()}`;
      } else {
        line.textContent = ex;
      }
      exContainer.appendChild(line);
    }
  }

  // Restore saved prompt if any
  const ta = $('prompt-input');
  if (ta && state.prompt) ta.value = state.prompt;
  updateAnalyzeBtn();
}

function updateAnalyzeBtn() {
  const ta = $('prompt-input');
  const btn = $('analyze-btn');
  if (ta && btn) btn.disabled = ta.value.trim().length < 20;
}

// ============================================================
// STEP 3 — ANALYSIS
// ============================================================
async function runAnalysis() {
  state.prompt = $('prompt-input')?.value?.trim() || '';
  if (!state.prompt || !state.framework) return;

  goToStep(3);

  // Show loading
  $('loading-state').style.display = 'flex';
  $('error-state').style.display = 'none';
  $('results-content').style.display = 'none';

  updateQuotaBadge();

  const fw = FRAMEWORKS[state.framework];
  let result;
  let isFallback = false;

  try {
    result = await analyzeWithGroq(state.prompt, state.framework, fw.components, state.lang);
  } catch (err) {
    // Show error — don't fallback silently for quota errors
    if (err.type === 'rate_limit_local') {
      showError(err.userMessage);
      return;
    }
    // For other errors, try keyword fallback and show both
    isFallback = true;
    result = analyzeWithKeywords(state.prompt, state.framework, state.lang);
    result.apiErrorMsg = err.userMessage;
  }

  state.lastResult = result;
  $('loading-state').style.display = 'none';
  renderResults(result, isFallback);
  updateQuotaBadge();
}

function showError(msg) {
  $('loading-state').style.display = 'none';
  $('results-content').style.display = 'none';
  const errState = $('error-state');
  errState.style.display = 'flex';
  setText('error-title', t().errTitle);
  setText('error-msg', msg);
  setText('error-retry-label', t().errRetry);
}

function renderResults(result, isFallback) {
  $('results-content').style.display = 'block';

  // Score hero
  const score = result.total_score;
  const scoreEl = $('score-num');

  // Color + verdict
  let verdictKey, color;
  if (score >= 8) { verdictKey = 'high'; color = 'var(--green)'; }
  else if (score >= 6) { verdictKey = 'good'; color = 'var(--accent)'; }
  else if (score >= 4) { verdictKey = 'fair'; color = 'var(--yellow)'; }
  else { verdictKey = 'low'; color = 'var(--red)'; }

  // Animate score counter
  let current = 0;
  const step = score / 35;
  const timer = setInterval(() => {
    current = Math.min(current + step, score);
    if (scoreEl) scoreEl.textContent = current.toFixed(1);
    if (current >= score) {
      if (scoreEl) scoreEl.textContent = score.toFixed(1);
      clearInterval(timer);
    }
  }, 14);

  if (scoreEl) scoreEl.style.color = color;
  const verdictEl = $('score-verdict');
  if (verdictEl) { verdictEl.textContent = t().verdicts[verdictKey]; verdictEl.style.color = color; }
  setText('score-desc', t().verdictDesc[verdictKey]);
  setText('score-fw-badge', state.framework);

  // Fallback notice
  const fallbackEl = $('fallback-notice');
  if (fallbackEl) {
    if (isFallback) {
      fallbackEl.style.display = 'flex';
      // Show API error if one caused the fallback
      const msg = result.apiErrorMsg
        ? `⚠️ ${result.apiErrorMsg} — menampilkan hasil fallback.`
        : t().fallback;
      const msgEl = $('fallback-msg');
      if (msgEl) msgEl.textContent = msg;
    } else {
      fallbackEl.style.display = 'none';
    }
  }

  // Breakdown cards
  const list = $('breakdown-list');
  if (list) {
    list.innerHTML = '';
    for (const [comp, data] of Object.entries(result.component_scores)) {
      const s = data.score; // 0, 1, or 2
      const pipColor = s === 2 ? 'score-2' : s === 1 ? 'score-1' : '';

      const card = document.createElement('div');
      card.className = 'breakdown-card';
      card.innerHTML = `
        <div class="bk-header">
          <span class="bk-name"></span>
          <div class="bk-score-chip">
            <div class="score-pips">
              <div class="pip ${s >= 1 ? `filled ${pipColor}` : ''}"></div>
              <div class="pip ${s >= 2 ? `filled ${pipColor}` : ''}"></div>
            </div>
            <span class="bk-score-text">${s}/2 — ${t().scoreChips[s]}</span>
          </div>
        </div>
        <p class="bk-feedback"></p>
      `;
      // Model output is untrusted text: set it with textContent, never innerHTML.
      card.querySelector('.bk-name').textContent = comp;
      card.querySelector('.bk-feedback').textContent = data.feedback || '';
      list.appendChild(card);
    }
  }

  setText('label-breakdown', t().labelBreakdown);
  setText('label-overall', t().labelOverall);
  setText('retry-label', t().retry);
  setText('back2-label', t().backEdit);

  const overallCard = $('overall-card');
  if (overallCard) overallCard.textContent = result.overall_feedback || '';
}

// ============================================================
// APPLY I18N
// ============================================================
function applyI18N() {
  const lang = state.lang;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('data-lang', lang);

  setText('s1-title', T[lang].s1Title);
  setText('s1-subtitle', T[lang].s1Sub);
  setText('dot-label-1', T[lang].dot1);
  setText('dot-label-2', T[lang].dot2);
  setText('dot-label-3', T[lang].dot3);
  setText('back1-label', T[lang].back);
  setText('back2-label', T[lang].backEdit);
  setText('retry-label', T[lang].retry);
  setText('loading-text', T[lang].loading);
  setText('analyze-label', T[lang].analyzeBtn);
  setText('lang-label', lang === 'id' ? 'EN' : 'ID');

  updateCardText(lang);
  if (state.framework) renderStep2Guide();
  if (state.lastResult) renderResults(state.lastResult, state.lastResult.isFallback);
}

// ============================================================
// INIT
// ============================================================
function init() {
  attachCardListeners();
  applyI18N();
  updateProgress(1);
  updateQuotaBadge();

  // Prompt textarea
  const ta = $('prompt-input');
  if (ta) {
    ta.addEventListener('input', () => {
      const len = ta.value.length;
      setText('char-count', `${len} ${t().charLabel}`);
      updateAnalyzeBtn();
    });
  }

  // Analyze button
  $('analyze-btn')?.addEventListener('click', runAnalysis);

  // Cmd+Enter shortcut
  ta?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const btn = $('analyze-btn');
      if (btn && !btn.disabled) runAnalysis();
    }
  });

  // Back buttons
  $('back-1')?.addEventListener('click', () => {
    state.prompt = $('prompt-input')?.value?.trim() || '';
    goToStep(1);
  });

  $('back-2')?.addEventListener('click', () => {
    goToStep(2);
    // Restore prompt
    const ta = $('prompt-input');
    if (ta && state.prompt) ta.value = state.prompt;
    updateAnalyzeBtn();
  });

  // Retry
  $('retry-btn')?.addEventListener('click', runAnalysis);
  $('error-retry-btn')?.addEventListener('click', () => {
    goToStep(2, 'back');
  });

  // Language toggle
  $('lang-toggle')?.addEventListener('click', () => {
    state.lang = state.lang === 'id' ? 'en' : 'id';
    applyI18N();
  });

  // Theme toggle
  $('theme-toggle')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    if (state.theme === 'light') {
      root.setAttribute('data-theme', 'light');
      $('icon-sun').style.display = 'none';
      $('icon-moon').style.display = 'block';
    } else {
      root.removeAttribute('data-theme');
      $('icon-sun').style.display = 'block';
      $('icon-moon').style.display = 'none';
    }
  });
}

init();
