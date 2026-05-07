// ============================================================
// RATE LIMITER  — only active when VITE_ENABLE_RATE_LIMIT=true
// ============================================================
const RATE_LIMIT_ENABLED = import.meta.env.VITE_ENABLE_RATE_LIMIT === 'true';
const RATE_KEY = 'pa_usage';
const DAILY_LIMIT = 3;

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
  if (!RATE_LIMIT_ENABLED) return null; // null = unlimited
  return Math.max(0, DAILY_LIMIT - getRateState().count);
}

function incrementRate() {
  const state = getRateState();
  const next = { date: todayStr(), count: state.count + 1 };
  localStorage.setItem(RATE_KEY, JSON.stringify(next));
  return next;
}

// ============================================================
// INDONESIAN ERROR MESSAGES
// ============================================================
function toIndonesianError(err) {
  const msg = err?.message || '';
  const status = err?.status || 0;

  // Rate limit exceeded (our own)
  if (err?.type === 'rate_limit_local') {
    return `Kamu sudah mencapai batas 3 analisis hari ini. Coba lagi besok ya! 🙏`;
  }

  // Groq API errors
  if (status === 401 || msg.includes('401') || msg.includes('invalid_api_key')) {
    return `API key tidak valid atau sudah kadaluarsa. Pastikan kamu sudah mengisi API key yang benar di file .env, lalu restart aplikasinya.`;
  }
  if (status === 429 || msg.includes('429') || msg.includes('rate_limit')) {
    return `Terlalu banyak permintaan ke AI dalam waktu singkat. Tunggu sekitar 1 menit, lalu coba lagi.`;
  }
  if (status === 503 || msg.includes('503') || msg.includes('overloaded')) {
    return `Server AI sedang sangat sibuk saat ini. Coba lagi dalam beberapa menit ya.`;
  }
  if (status >= 500) {
    return `Ada masalah di server AI (error ${status}). Ini bukan salah kamu — coba lagi dalam beberapa menit.`;
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
    return `Tidak bisa terhubung ke internet. Periksa koneksi kamu, lalu coba lagi.`;
  }
  if (msg.includes('JSON') || msg.includes('parse')) {
    return `AI memberikan jawaban yang tidak bisa dibaca. Coba analisis ulang — biasanya berhasil di percobaan kedua.`;
  }
  if (!import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_API_KEY === 'your_groq_api_key_here') {
    return `API key belum diatur. Isi nilai VITE_GROQ_API_KEY di file .env, lalu restart dev server.`;
  }

  return `Terjadi kesalahan yang tidak terduga. Coba lagi, atau refresh halaman jika masalah berlanjut.`;
}

// ============================================================
// GROQ API CLIENT
// ============================================================
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

/**
 * Calls Groq to analyze a prompt against a framework.
 * Returns { total_score, component_scores, overall_feedback }
 * Throws an error with an Indonesian `.userMessage` if anything goes wrong.
 */
export async function analyzeWithGroq(userPrompt, framework, components, lang) {
  // 1. Check local rate limit (only in prod)
  if (RATE_LIMIT_ENABLED) {
    const rateState = getRateState();
    if (rateState.count >= DAILY_LIMIT) {
      const err = new Error('Local rate limit exceeded');
      err.type = 'rate_limit_local';
      err.userMessage = toIndonesianError(err);
      throw err;
    }
  }

  // 2. Check key
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    const err = new Error('Missing API key');
    err.userMessage = toIndonesianError(err);
    throw err;
  }

  // 3. Build prompt
  const systemPrompt = buildSystemPrompt(framework, components, lang);
  const maxScore = components.length * 2;

  // 4. Call API
  let res;
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Prompt yang perlu dianalisis:\n\n${userPrompt}` },
        ],
      }),
    });
  } catch (fetchErr) {
    const err = new Error(fetchErr.message);
    err.userMessage = toIndonesianError(fetchErr);
    throw err;
  }

  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch {}
    const err = new Error(body?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.userMessage = toIndonesianError(err);
    throw err;
  }

  // 5. Parse response
  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    const err = new Error('JSON parse error');
    err.userMessage = toIndonesianError(parseErr);
    throw err;
  }

  let parsed;
  try {
    const content = data.choices[0].message.content;
    parsed = JSON.parse(content);
  } catch (parseErr) {
    const err = new Error('JSON parse error');
    err.userMessage = toIndonesianError(parseErr);
    throw err;
  }

  // 6. Validate + normalise structure
  const result = normaliseResult(parsed, components, maxScore);

  // 7. Increment rate counter only on success (only in prod)
  if (RATE_LIMIT_ENABLED) incrementRate();

  return result;
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

// ============================================================
// SYSTEM PROMPT BUILDER
// ============================================================
function buildSystemPrompt(frameworkName, components, lang) {
  const langInstruction = lang === 'id'
    ? 'Seluruh teks feedback dan overall_feedback HARUS dalam Bahasa Indonesia yang jelas dan natural.'
    : 'All feedback text and overall_feedback MUST be in clear, natural English.';

  const componentList = components
    .map(c => `  - "${c}"`)
    .join('\n');

  return `Kamu adalah seorang ahli evaluasi prompt AI yang memberikan feedback jujur, spesifik, dan actionable.

Framework yang digunakan: ${frameworkName}
Komponen yang harus dievaluasi:
${componentList}

${langInstruction}

Tugasmu:
Evaluasi prompt yang diberikan user terhadap setiap komponen framework ${frameworkName}. Berikan skor dan feedback yang konkret.

Aturan scoring per komponen (skala 0–2):
- 0: Komponen ini sama sekali tidak ada dalam prompt, atau sangat samar sehingga tidak berguna
- 1: Ada sinyal komponen ini, tapi tidak lengkap, terlalu umum, atau bisa diperjelas
- 2: Komponen ini hadir dengan jelas, spesifik, dan memberikan konteks yang cukup

Aturan feedback per komponen:
- Jelaskan APA yang sudah ada (atau tidak ada) di prompt untuk komponen ini
- Berikan SATU saran konkret yang spesifik (bukan generik) untuk memperbaikinya jika skornya < 2
- Jangan ulangi isi prompt secara kata per kata — parafrase dan analisis
- Panjang: 2–3 kalimat per komponen

Kembalikan HANYA JSON valid dengan format persis ini — tidak ada teks di luar JSON:
{
  "component_scores": {
    "<nama_komponen_persis_seperti_daftar_di_atas>": {
      "score": <0, 1, atau 2>,
      "feedback": "<2-3 kalimat feedback>"
    }
  },
  "overall_feedback": "<3-4 kalimat ringkasan kualitas prompt secara keseluruhan dan 2 prioritas perbaikan utama>"
}`;
}
