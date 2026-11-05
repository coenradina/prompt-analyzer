// ============================================================
// QUOTA DISPLAY
// The real limit (3 per day per visitor) is enforced by the server proxy.
// This local copy only drives the badge in the header.
// ============================================================
const RATE_KEY = 'pa_usage';
const DAILY_LIMIT = 3;

// Public URL of the proxy, which holds the Groq key server-side.
const ANALYZE_URL =
  import.meta.env.VITE_ANALYZE_URL ||
  'https://us-central1-aastr-portfolio.cloudfunctions.net/analyzePrompt';

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function getRateState() {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return { date: todayStr(), count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayStr()) return { date: todayStr(), count: 0 };
    return parsed;
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

export function getRemainingRequests() {
  return Math.max(0, DAILY_LIMIT - getRateState().count);
}

function storeRemaining(remaining) {
  const count = DAILY_LIMIT - Math.max(0, Math.min(DAILY_LIMIT, Number(remaining) || 0));
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify({ date: todayStr(), count }));
  } catch {}
}

// ============================================================
// INDONESIAN ERROR MESSAGES
// ============================================================
function toIndonesianError(err) {
  const msg = err?.message || '';
  const status = err?.status || 0;

  if (err?.type === 'rate_limit_local') {
    return `Kamu sudah mencapai batas 3 analisis hari ini. Coba lagi besok ya! 🙏`;
  }
  if (err?.type === 'busy') {
    return `Kuota analisis AI hari ini sudah habis untuk semua pengguna. Coba lagi besok ya.`;
  }
  if (status === 403) {
    return `Permintaan ditolak oleh server. Buka aplikasi ini dari aastr.id/prompt-analyzer.`;
  }
  if (status === 503 || status === 502 || status >= 500) {
    return `Server AI sedang sibuk atau bermasalah. Ini bukan salah kamu — coba lagi dalam beberapa menit.`;
  }
  if (status === 422 || status === 400 || status === 413) {
    return `Prompt tidak bisa diproses. Pastikan panjangnya maksimal 4.000 karakter.`;
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
    return `Tidak bisa terhubung ke server. Periksa koneksi kamu, lalu coba lagi.`;
  }
  if (msg.includes('JSON') || msg.includes('parse')) {
    return `AI memberikan jawaban yang tidak bisa dibaca. Coba analisis ulang — biasanya berhasil di percobaan kedua.`;
  }
  return `Terjadi kesalahan yang tidak terduga. Coba lagi, atau refresh halaman jika masalah berlanjut.`;
}

// ============================================================
// ANALYZE (via server proxy)
// ============================================================

/**
 * Asks the proxy to analyze a prompt against a framework.
 * Returns { total_score, component_scores, overall_feedback }
 * Throws an error with an Indonesian `.userMessage` if anything goes wrong.
 */
export async function analyzeWithGroq(userPrompt, framework, components, lang) {
  if (getRemainingRequests() <= 0) {
    const err = new Error('Local rate limit exceeded');
    err.type = 'rate_limit_local';
    err.userMessage = toIndonesianError(err);
    throw err;
  }

  let res;
  try {
    res = await fetch(ANALYZE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt, framework, lang }),
    });
  } catch (fetchErr) {
    const err = new Error(fetchErr.message);
    err.userMessage = toIndonesianError(fetchErr);
    throw err;
  }

  let body = null;
  try { body = await res.json(); } catch {}

  if (!res.ok) {
    const err = new Error(body?.message || `HTTP ${res.status}`);
    err.status = res.status;
    if (res.status === 429 && body?.code === 'daily_limit') {
      storeRemaining(0);
      err.type = 'rate_limit_local';
    } else if (res.status === 429 && body?.code === 'busy') {
      err.type = 'busy';
    }
    err.userMessage = toIndonesianError(err);
    throw err;
  }

  if (!body?.result) {
    const err = new Error('JSON parse error');
    err.userMessage = toIndonesianError(err);
    throw err;
  }

  storeRemaining(body.remaining);
  return normaliseResult(body.result, components, components.length * 2);
}

function normaliseResult(raw, components, maxScore) {
  const componentScores = {};
  let rawTotal = 0;

  for (const comp of components) {
    const entry = raw.component_scores?.[comp] || {};
    const score = Math.min(2, Math.max(0, Math.round(Number(entry.score) || 0)));
    rawTotal += score;
    componentScores[comp] = {
      score,
      max: 2,
      feedback: entry.feedback || '',
    };
  }

  const total = Math.round((rawTotal / maxScore) * 10 * 10) / 10;

  return {
    total_score: Number.isFinite(total) ? total : 0,
    component_scores: componentScores,
    overall_feedback: raw.overall_feedback || '',
  };
}
