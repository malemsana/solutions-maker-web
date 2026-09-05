// Continua AI Gateway — multi-provider layer (Gemini + OpenCode Zen)
// Preserves original task prompts; adds model registry, providers, and task-aware router.
// Public compat: window.Gemini.extractChapterQuestions / solveQuestion / fixLatex
// New API: window.AI.refreshModels / getModels / getRoutingPolicy / setTaskModel / getStatus

const MATHS_SYSTEM_PROMPT = String.raw`You are an expert NCERT Mathematics educator, textbook author, and mathematics editor.

Your task is to solve the provided NCERT Mathematics question and produce the final student-facing solution.

The solution will be used as published educational content. Write it as a carefully edited solution from a high-quality Indian mathematics textbook or study-material book such as NCERT-aligned reference material.

The output must be mathematically rigorous, curriculum-appropriate, natural, concise, and easy for a student to follow.

Do not write like an AI assistant, chatbot, tutor, or reasoning trace.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MATHEMATICAL CORRECTNESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Solve the question completely and correctly.
- Check every calculation, algebraic transformation, identity, theorem, and conclusion before producing the answer.
- Do not invent information that is not present in the question.
- Do not silently change the question.
- Do not omit a necessary mathematical step.
- Do not include unnecessary calculations or explanations merely to make the solution longer.

The final answer must be independently understandable by a student reading only the question and the solution.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. NCERT AND CURRICULUM ALIGNMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Follow the mathematical conventions, terminology, definitions, identities, theorems, and methods appropriate for the student's grade and the relevant NCERT chapter.

Prefer methods that are normally taught in the relevant NCERT curriculum.

If multiple methods are mathematically valid, prefer the method that:

- is appropriate for the student's grade;
- is consistent with the relevant NCERT chapter;
- uses concepts the student is expected to know;
- produces a clear and natural textbook solution.

Do not unnecessarily introduce advanced mathematics.

For example, do not use calculus, advanced coordinate methods, vectors, matrices, or other higher-level techniques when a standard school-level NCERT method is appropriate.

The solution should be suitable for inclusion in an NCERT-aligned study book.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. TEXTBOOK / HUMAN EDITORIAL STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write like a human mathematics educator and textbook editor.

The finished solution should resemble published educational material rather than an AI-generated answer.

The mathematics itself should carry most of the structure.

Use concise explanatory sentences to connect mathematical expressions, deductions, substitutions, and conclusions.

Do not narrate every action performed by the solver.

Avoid conversational or instructional AI language such as:

- "Let's solve this step by step."
- "First, we need to..."
- "Now we will calculate..."
- "Let's calculate..."
- "We can see that..."
- "As we can see..."
- "Let's substitute..."
- "This gives us..."
- "Finally, we have..."
- "We have successfully solved the problem."

Do not talk about yourself or your reasoning process.

Do not write commentary about how you are solving the problem.

The solution should read as if it was written directly for a mathematics book.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. MATHEMATICAL HEADINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use conventional mathematical headings when they are appropriate.

Common headings include:

1. Given
2. To Find
3. To Prove
4. Construction
5. Proof
6. Solution
7. Therefore

Do NOT force all of these headings into every question.

Choose headings according to the nature of the problem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. IMPORTANT: DO NOT NUMBER PROCEDURAL STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Do not turn the mathematical working into a numbered list such as:

1. Step 1: Find the value of...
2. Step 2: Substitute...
3. Step 3: Simplify...
4. Step 4: Obtain the answer.

This is not the desired style. Calculations and reasoning that follow should flow naturally without artificial "Step 1", "Step 2", "Step 3" labels.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. FINAL ANSWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End the solution with a clear mathematical conclusion.

Use natural textbook wording such as:

Therefore, the required value is ...
Hence, the HCF is ...
Thus, the required length is ...
Therefore, the correct option is **(C)**.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY the finished student-facing solution.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. MARKDOWN AND LATEX FORMATTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The solution will be rendered as Markdown with LaTeX mathematical notation.

Use Markdown for document structure and LaTeX for mathematical expressions.

### Inline mathematics

Use LaTeX delimiters for mathematical expressions appearing within a sentence:

\( ... \)

For example:

The value of \(x\) is \(5\).

Do not write:

The value of x is 5.

when the expression is mathematical and would benefit from mathematical notation.

### Display mathematics

Use display LaTeX for important equations, calculations, identities, and derivations:

\[
2x + 5 = 17
\]

\[
2x = 12
\]

\[
x = 6
\]

Use display mathematics when an equation is an important part of the solution or when it improves readability.

### Aligned calculations

For a sequence of related calculations, use an aligned LaTeX environment where appropriate:

\[
\begin{aligned}
225 &= 135 \times 1 + 90 \\
135 &= 90 \times 1 + 45 \\
90 &= 45 \times 2 + 0
\end{aligned}
\]

This is preferred over placing several unrelated equations in a single paragraph.

### Fractions

Use proper LaTeX fractions:

\[
\frac{a}{b}
\]

not:

a/b

### Powers and indices

Use LaTeX:

\[
x^2,\quad a^3,\quad x_n,\quad 2^{n+1}
\]

### Roots

Use:

\[
\sqrt{x},\quad \sqrt{a+b},\quad \sqrt[3]{x}
\]

### Greek letters and mathematical symbols

Use LaTeX rather than textual approximations:

\[
\theta,\quad \alpha,\quad \beta,\quad \pi,\quad \Delta
\]

Use appropriate mathematical operators and symbols:

\[
\leq,\quad \geq,\quad \neq,\quad \pm,\quad \times,\quad \div
\]

### Equations and derivations

Keep mathematical transformations visually clear.

For example:

\[
\begin{aligned}
(x+2)^2 &= 25\\
x+2 &= \pm5\\
x &= 3 \quad \text{or} \quad x=-7
\end{aligned}
\]

Do not place a long mathematical derivation inside ordinary prose.

### Text inside mathematics

When words are required inside a mathematical expression, use:

\[
\text{HCF}(135,225)=45
\]

rather than attempting to format the words as ordinary mathematical variables.

### Units

Keep numerical values and units readable:

\[
5\text{ cm}
\]

or, where appropriate in the surrounding prose:

\(5\) cm.

### Geometry

Use LaTeX for angles, lengths, and mathematical relationships:

\[
\angle ABC = \angle BCA
\]

\[
AB = AC
\]

\[
\triangle ABC
\]

### Sets and intervals

Use appropriate LaTeX notation:

\[
A = \{1,2,3,4\}
\]

\[
x \in \mathbb{R}
\]

### Cases

For piecewise expressions, use LaTeX cases:

\[
f(x)=
\begin{cases}
x^2, & x\geq0,\\
-x^2, & x<0.
\end{cases}
\]

### Markdown

Use Markdown naturally for textual structure.

Appropriate examples include:

**1. Given**

**2. To Prove**

**Proof:**

**Therefore,**

Use bullet lists only when the mathematical content genuinely consists of separate items.

Do not turn mathematical working into a Markdown numbered list merely to create structure.

### Do not use code formatting for mathematics

Never place mathematical expressions inside backticks or code blocks.

Incorrect:

\`x^2 + y^2 = r^2\`

Correct:

\[
x^2+y^2=r^2
\]

### Do not use Unicode substitutes when LaTeX is clearer

Prefer:

\[
\frac{1}{2},\quad \sqrt{3},\quad \theta,\quad \leq
\]

rather than:

½, √3, θ, ≤

Use ordinary Unicode text only when it is genuinely preferable for normal prose.

### Formatting principle

Markdown structures the solution.

LaTeX represents the mathematics.

Do not use Markdown as a substitute for mathematical notation.
Do not use plain text where a mathematical LaTeX expression would be clearer.

The final output must be valid, consistently formatted Markdown containing renderable LaTeX.`;

const EXTRACTION_SYSTEM_PROMPT = `You are the extraction stage of an NCERT textbook digitization pipeline.
Your job is to transcribe and extract ALL exercises and numbered questions from the supplied PDF.
Rules:
1. Preserve exact exercise group names (e.g., "Exercise 1.1", "Exercise 1.2", "Miscellaneous Exercise") and question numbering exactly as printed.
2. If a question contains a diagram, geometry figure, graph, circuit, or visual required to solve:
   - Insert "[IMAGE/DIAGRAM — HUMAN REVIEW REQUIRED]" in the text;
   - Set warn="yes";
   - Estimate the 1-based pageNumber where it appears.
3. Extract MCQ options separately if present.
4. Return ONLY a JSON object matching the requested schema.`;

const LATEX_FIX_SYSTEM_PROMPT = `You are a strict LaTeX formatting engine and mathematical typography fixer.

CRITICAL INSTRUCTIONS:
- DO NOT SOLVE THE PROBLEM.
- DO NOT ANSWER THE QUESTION.
- DO NOT ADD WORKING STEPS, CALCULATIONS, REASONING, OR CONCLUSIONS.
- DO NOT ALTER THE WORDING, MEANING, QUESTIONS, OR ANSWERS OF THE INPUT.
- YOUR ONLY TASK IS TO FIX LATEX SYNTAX AND ENCLOSE MATHEMATICAL NOTATION IN VALID DELIMITERS.

RULES:
1. Preserve 100% of the input text, sentences, options, numbers, and document structure.
2. Format inline math using \\( ... \\) or $ ... $.
3. Format display equations using \\[ ... \\] or $$ ... $$.
4. Fix broken LaTeX commands and syntax (e.g. frac -> \\frac, sqrt -> \\sqrt, times -> \\times, theta -> \\theta, degree -> ^\\circ, mismatched braces).
5. STRICTLY PRESERVE all Markdown image links, diagram references (such as ![Figure](assets/...) or ![...](...)), and HTML tags. Do NOT alter asset paths.
6. Output ONLY the formatted text with NO conversational introductory or concluding text.`;

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------
const TASKS = {
  EXTRACTION: 'extraction',
  SOLVING: 'solving',
  LATEX_FIX: 'latex_fix'
};

const ZEN_BASE_URL = 'https://opencode.ai/zen/v1';
const GEMINI_LIST_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash'
];

let AI_DEBUG = false;
try {
  if (typeof window !== 'undefined' && window.AI_DEBUG === true) AI_DEBUG = true;
} catch (e) { /* ignore */ }

function aiLog(...args) {
  const enabled = AI_DEBUG || (typeof window !== 'undefined' && window.AI_DEBUG === true);
  if (enabled) console.log('[AI Router]', ...args);
}

function maskKey(k) {
  if (!k) return '';
  const s = String(k).trim();
  if (s.length <= 8) return '****';
  return s.slice(0, 4) + '…' + s.slice(-4);
}

function credFingerprint(keyStr) {
  let h = 0;
  const s = String(keyStr || '');
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
  return 'k' + h.toString(36) + '_' + String(s.length);
}

function prettyDisplayName(sourceId) {
  return String(sourceId || '')
    .replace(/^models\//, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase()) || String(sourceId || 'Unknown');
}

function classifyError(status, text) {
  const t = String(text || '').toLowerCase();
  if (status === 401 || status === 403 ||
      t.includes('api key not valid') || t.includes('invalid api key') ||
      t.includes('incorrect api key') || t.includes('unauthorized') ||
      t.includes('permission_denied')) {
    return 'AUTH_ERROR';
  }
  if (status === 429 || status === 503 ||
      t.includes('resource_exhausted') || t.includes('quota') ||
      t.includes('rate limit') || t.includes('rate_limit') ||
      t.includes('too many requests') || t.includes('overloaded')) {
    return 'RATE_LIMITED';
  }
  if (status === 404 || t.includes('not found') || t.includes('model_not_found') ||
      t.includes('is not found') || t.includes('unknown model')) {
    return 'MODEL_UNAVAILABLE';
  }
  if (status === 400 || status === 422 || t.includes('invalid_argument') ||
      t.includes('invalid request')) {
    return 'INVALID_REQUEST';
  }
  if (status === 500 || status === 502 || status === 504 || status === 529 ||
      t.includes('internal error') || t.includes('temporarily unavailable') ||
      t.includes('timeout') || t.includes('fetch failed') || t.includes('networkerror') ||
      t.includes('failed to fetch')) {
    return 'TEMPORARY_ERROR';
  }
  return status === 0 ? 'TEMPORARY_ERROR' : 'UNKNOWN_ERROR';
}

function tryParseJsonObject(text) {
  if (!text) throw new Error('Empty model response.');
  let t = String(text).trim();
  // Strip markdown code fences if present
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1].trim();
  const parsed = JSON.parse(t);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Model did not return a JSON object.');
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// KeyPoolManager (Gemini key pool — preserved behaviour, refactored)
// ---------------------------------------------------------------------------
class KeyPoolManager {
  constructor() {
    this.keyIndex = 0;
    this.cooldowns = new Map(); // keyString -> cooldownExpiryTimestamp
  }

  getValidKeys(cfg) {
    let keys = [];
    if (Array.isArray(cfg?.apiKeys) && cfg.apiKeys.length > 0) {
      keys = cfg.apiKeys.filter(k => k && k.key && k.key.trim());
    } else if (cfg?.gemini && Array.isArray(cfg.gemini.apiKeys) && cfg.gemini.apiKeys.length > 0) {
      keys = cfg.gemini.apiKeys.filter(k => k && k.key && k.key.trim());
    } else if (cfg?.apiKey && cfg.apiKey.trim()) {
      keys = [{ id: 'key_1', name: 'Default Key', key: cfg.apiKey.trim() }];
    } else if (typeof window !== 'undefined' && window.Storage) {
      try {
        keys = window.Storage.getApiKeys();
      } catch (e) { keys = []; }
    }
    return keys;
  }

  markRateLimited(keyStr, durationMs = 60000) {
    const until = Date.now() + durationMs;
    this.cooldowns.set(keyStr, until);
    console.warn(`[KeyManager] Gemini API Key (${maskKey(keyStr)}) in cooldown for ${Math.round(durationMs / 1000)}s`);
  }

  isKeyInCooldown(keyStr) {
    const expiry = this.cooldowns.get(keyStr);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.cooldowns.delete(keyStr);
      return false;
    }
    return true;
  }

  // Legacy rotation helper — preserved for backward compatibility.
  async executeWithRotation(modelName, payload, cfg) {
    const keys = this.getValidKeys(cfg);
    if (!keys.length) {
      throw new Error('No Gemini API Key found. Please add an API Key in Settings.');
    }
    const totalKeys = keys.length;
    let attempts = 0;
    let lastError = null;
    while (attempts < totalKeys) {
      const candidateIndex = (this.keyIndex + attempts) % totalKeys;
      const keyObj = keys[candidateIndex];
      const keyStr = keyObj.key.trim();
      if (this.isKeyInCooldown(keyStr) && totalKeys > 1) {
        attempts++;
        continue;
      }
      this.keyIndex = (candidateIndex + 1) % totalKeys;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(keyStr)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          return await res.json();
        }
        const errText = await res.text();
        const category = classifyError(res.status, errText);
        if (category === 'RATE_LIMITED' || category === 'TEMPORARY_ERROR') {
          this.markRateLimited(keyStr, 60000);
          lastError = new Error(`Key "${keyObj.name || 'Key'}" hit rate limit (HTTP ${res.status}).`);
          attempts++;
          continue;
        }
        throw new Error(errText || `API request failed with status ${res.status}`);
      } catch (err) {
        if (err.message.includes('rate limit') || err.message.includes('RESOURCE_EXHAUSTED')) {
          attempts++;
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error('All configured API Keys are currently rate-limited. Please wait a minute or add more keys in Settings.');
  }
}

const keyPool = new KeyPoolManager();

// ---------------------------------------------------------------------------
// Model normalization
// ---------------------------------------------------------------------------
function normalizeGeminiModels(apiResponse, opts = {}) {
  const out = [];
  const rawList = Array.isArray(apiResponse?.models) ? apiResponse.models : [];
  for (const m of rawList) {
    const fullName = String(m?.name || '');
    const sourceId = fullName.replace(/^models\//, '').trim();
    if (!sourceId) continue;
    const methods = Array.isArray(m?.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
    const supportsGenerate = methods.length === 0 || methods.includes('generateContent');
    if (!supportsGenerate) continue;
    out.push({
      id: `gemini:${sourceId}`,
      provider: 'gemini',
      sourceId,
      displayName: m?.displayName || prettyDisplayName(sourceId),
      available: true,
      free: null, // Gemini pricing not exposed via list API; unknown
      capabilities: {
        text: true,
        vision: true,
        pdf: true,
        structuredOutput: true,
        reasoning: true,
        unknown: []
      },
      protocol: 'gemini-generate-content',
      contextLength: m?.inputTokenLimit || null,
      raw: opts.keepRaw ? m : undefined
    });
  }
  return out;
}

function geminiFallbackModels() {
  return GEMINI_FALLBACK_MODELS.map(sourceId => ({
    id: `gemini:${sourceId}`,
    provider: 'gemini',
    sourceId,
    displayName: prettyDisplayName(sourceId),
    available: true,
    free: null,
    capabilities: {
      text: true,
      vision: true,
      pdf: true,
      structuredOutput: true,
      reasoning: true,
      unknown: []
    },
    protocol: 'gemini-generate-content',
    contextLength: null,
    fallback: true
  }));
}

function isFreeFromZenPricing(model) {
  // Prefer actual pricing metadata; fall back to name heuristic only when absent.
  const pricing = model?.pricing || model?.price || model?.cost || null;
  if (pricing && typeof pricing === 'object') {
    const vals = [];
    for (const k of ['prompt', 'input', 'input_price', 'completion', 'output', 'output_price']) {
      if (pricing[k] !== undefined && pricing[k] !== null) vals.push(Number(pricing[k]));
    }
    if (vals.length > 0 && vals.every(v => !Number.isNaN(v))) {
      return vals.every(v => v === 0);
    }
  }
  for (const k of ['input_price', 'output_price', 'prompt_price', 'completion_price']) {
    if (model && model[k] !== undefined && model[k] !== null) {
      // single-field pricing present
    }
  }
  if (typeof model?.is_free === 'boolean') return model.is_free;
  if (typeof model?.free === 'boolean') return model.free;
  // Heuristic fallback only
  const id = String(model?.id || '').toLowerCase();
  if (id.includes(':free') || id.endsWith('-free') || id.endsWith('_free') || id.includes('free')) return true;
  return null; // unknown
}

function normalizeZenModels(apiResponse) {
  const rawList = Array.isArray(apiResponse?.data)
    ? apiResponse.data
    : Array.isArray(apiResponse?.models) ? apiResponse.models : [];
  const out = [];
  for (const m of rawList) {
    const sourceId = String(m?.id || m?.model || '').trim();
    if (!sourceId) continue;
    const free = isFreeFromZenPricing(m);
    // Protocol: retain whatever Zen returns; default to chat-completions for
    // OpenAI-compatible models, mark unknown when ambiguous.
    let protocol = 'chat-completions';
    const apiType = String(m?.api || m?.protocol || m?.endpoint || '').toLowerCase();
    if (apiType.includes('response') && !apiType.includes('chat')) protocol = 'responses';
    else if (apiType.includes('chat') || apiType.includes('completions')) protocol = 'chat-completions';
    else if (!m?.id) protocol = 'unknown';
    const caps = {
      text: true,
      // Vision / pdf / structured-output unknown from a generic catalog —
      // mark as unknown (null) so auto-routing excludes them where required.
      vision: null,
      pdf: false,
      structuredOutput: null,
      reasoning: null,
      unknown: ['vision', 'structuredOutput']
    };
    // Narrow, conservative upgrades based on explicit metadata only.
    const capHints = m?.capabilities || m?.features || {};
    if (capHints.vision === true || m?.vision === true || m?.supports_vision === true) {
      caps.vision = true;
      caps.unknown = caps.unknown.filter(x => x !== 'vision');
    }
    if (m?.supports_pdf === true || capHints.pdf === true) caps.pdf = true;
    if (m?.supports_response_format === true || capHints.structuredOutput === true) {
      caps.structuredOutput = true;
      caps.unknown = caps.unknown.filter(x => x !== 'structuredOutput');
    }
    out.push({
      id: `zen:${sourceId}`,
      provider: 'zen',
      sourceId,
      displayName: m?.name || prettyDisplayName(sourceId),
      available: true,
      free,
      capabilities: caps,
      protocol,
      contextLength: m?.context_length || m?.contextLength || m?.max_tokens || m?.context_window || null,
      raw: undefined
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------
const GeminiProvider = {
  name: 'gemini',
  protocol: 'gemini-generate-content',

  getKeys(cfg) {
    return keyPool.getValidKeys(cfg);
  },

  async discoverModels(cfg) {
    const keys = this.getKeys(cfg);
    if (!keys.length) return { models: [], status: 'no-keys' };
    const firstKey = keys[0].key.trim();
    try {
      const res = await fetch(`${GEMINI_LIST_URL}?key=${encodeURIComponent(firstKey)}`);
      if (!res.ok) {
        const t = await res.text();
        const cat = classifyError(res.status, t);
        if (cat === 'AUTH_ERROR') throw new Error('Gemini API key is invalid.');
        throw new Error(`Gemini model list failed (HTTP ${res.status}).`);
      }
      const data = await res.json();
      const models = normalizeGeminiModels(data);
      if (!models.length) return { models: geminiFallbackModels(), status: 'fallback' };
      return { models, status: 'ok' };
    } catch (err) {
      // Preserve old behaviour: configured keys still work with known model IDs.
      return { models: geminiFallbackModels(), status: 'fallback', error: err.message };
    }
  },

  async generateContent(sourceId, geminiPayload, keyStr) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(sourceId)}:generateContent?key=${encodeURIComponent(keyStr)}`;
    const t0 = performance.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });
    const latencyMs = Math.round(performance.now() - t0);
    if (res.ok) {
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.map(p => (typeof p?.text === 'string' ? p.text : '')).join('');
      if (!text) throw Object.assign(new Error('Gemini returned an empty response.'), { category: 'TEMPORARY_ERROR' });
      return {
        text,
        provider: 'gemini',
        model: sourceId,
        modelId: `gemini:${sourceId}`,
        usage: data?.usageMetadata || null,
        latencyMs
      };
    }
    const errText = await res.text();
    const category = classifyError(res.status, errText);
    const err = new Error(errText?.slice(0, 500) || `Gemini request failed (HTTP ${res.status}).`);
    err.category = category;
    err.status = res.status;
    throw err;
  }
};

const ZenProvider = {
  name: 'zen',
  protocol: 'chat-completions',

  getKey(cfg) {
    if (cfg?.zen?.apiKey && String(cfg.zen.apiKey).trim()) return String(cfg.zen.apiKey).trim();
    if (cfg?.zenApiKey && String(cfg.zenApiKey).trim()) return String(cfg.zenApiKey).trim();
    try {
      if (typeof window !== 'undefined' && window.Storage && typeof window.Storage.getZenKey === 'function') {
        return window.Storage.getZenKey();
      }
    } catch (e) { /* ignore */ }
    try {
      return (localStorage.getItem('zen_api_key') || '').trim();
    } catch (e) { return ''; }
  },

  async discoverModels(cfg) {
    const apiKey = this.getKey(cfg);
    if (!apiKey) return { models: [], status: 'no-keys' };
    try {
      const res = await fetch(`${ZEN_BASE_URL}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!res.ok) {
        const t = await res.text();
        const cat = classifyError(res.status, t);
        if (cat === 'AUTH_ERROR') throw new Error('Zen API key is invalid.');
        throw new Error(`Zen model list failed (HTTP ${res.status}).`);
      }
      const data = await res.json();
      const models = normalizeZenModels(data);
      return { models, status: 'ok' };
    } catch (err) {
      return { models: [], status: 'error', error: err.message };
    }
  },

  buildMessages(systemText, userText, imageDataUris = []) {
    if (!imageDataUris.length) {
      return [
        { role: 'system', content: systemText },
        { role: 'user', content: userText }
      ];
    }
    const content = [{ type: 'text', text: userText }];
    for (const uri of imageDataUris) {
      content.push({ type: 'image_url', image_url: { url: uri } });
    }
    return [
      { role: 'system', content: systemText },
      { role: 'user', content }
    ];
  },

  extractTextFromChat(data) {
    const msg = data?.choices?.[0]?.message;
    const content = msg?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(p => (typeof p?.text === 'string' ? p.text : '')).join('');
    }
    return '';
  },

  async chat(sourceId, systemText, userText, { imageDataUris = [], temperature = 0.1, jsonMode = false } = {}, apiKey) {
    const t0 = performance.now();
    const body = {
      model: sourceId,
      messages: this.buildMessages(systemText, userText, imageDataUris),
      temperature
    };
    if (jsonMode) body.response_format = { type: 'json_object' };
    const res = await fetch(`${ZEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    const latencyMs = Math.round(performance.now() - t0);
    if (res.ok) {
      const data = await res.json();
      const text = this.extractTextFromChat(data);
      if (!text) {
        const err = new Error('Zen returned an empty response.');
        err.category = 'TEMPORARY_ERROR';
        throw err;
      }
      return {
        text,
        provider: 'zen',
        model: sourceId,
        modelId: `zen:${sourceId}`,
        usage: data?.usage || null,
        latencyMs
      };
    }
    const errText = await res.text();
    const category = classifyError(res.status, errText);
    const err = new Error(errText?.slice(0, 500) || `Zen request failed (HTTP ${res.status}).`);
    err.category = category;
    err.status = res.status;
    throw err;
  }
};

// ---------------------------------------------------------------------------
// Capability filtering
// ---------------------------------------------------------------------------
function taskRequirements(task, opts = {}) {
  if (task === TASKS.EXTRACTION) {
    return { task, requiresVision: true, requiresPdfInput: true, requiresStructuredOutput: true, requiresTextGeneration: true };
  }
  if (task === TASKS.SOLVING) {
    return {
      task,
      requiresVision: !!opts.requiresVision,
      requiresPdfInput: false,
      requiresStructuredOutput: false,
      requiresTextGeneration: true
    };
  }
  return { task, requiresVision: false, requiresPdfInput: false, requiresStructuredOutput: false, requiresTextGeneration: true };
}

function isModelEligibleForTask(model, req) {
  if (!model || model.available === false) return { ok: false, reason: 'Model is unavailable.' };
  const caps = model.capabilities || {};
  if (req.requiresTextGeneration && caps.text === false) {
    return { ok: false, reason: 'Model does not support text generation.' };
  }
  if (req.requiresVision && caps.vision !== true) {
    return { ok: false, reason: 'Model does not support image input.' };
  }
  if (req.requiresPdfInput && caps.pdf !== true) {
    return { ok: false, reason: 'Model does not support PDF input.' };
  }
  if (req.requiresStructuredOutput && caps.structuredOutput !== true) {
    return { ok: false, reason: 'Model does not support structured output.' };
  }
  if (!model.protocol || model.protocol === 'unknown') {
    return { ok: false, reason: 'Model protocol is unknown.' };
  }
  return { ok: true };
}

function resolveLegacyModelId(rawId) {
  if (!rawId) return null;
  const s = String(rawId).trim();
  if (!s || s === 'auto') return null;
  if (s.includes(':')) return s;
  return `gemini:${s}`;
}

// ---------------------------------------------------------------------------
// AI Router
// ---------------------------------------------------------------------------
class AIRouter {
  constructor() {
    this.registry = new Map(); // modelId -> model meta
    this.providerStatus = {
      gemini: { state: 'unknown', count: 0, error: null },
      zen: { state: 'unknown', count: 0, error: null }
    };
    this.resourceCooldowns = new Map(); // resourceId -> expiry ts
    this.resourceLastUsed = new Map(); // resourceId -> ts
    this.modelStats = new Map(); // `${task}:${modelId}` -> stats
    this.rotationIndex = 0;
    this.lastUsage = null; // {task, modelId, provider, fallback, latencyMs}
    this.lastFallbackInfo = null;
    this.refreshInFlight = null;
  }

  getConfig() {
    try {
      if (typeof window !== 'undefined' && window.Storage) {
        return window.Storage.getConfig();
      }
    } catch (e) { /* ignore */ }
    return { gemini: { apiKeys: [] }, zen: { apiKey: '' }, routing: {} };
  }

  routingFor(task) {
    const cfg = this.getConfig();
    const r = cfg?.routing?.[task] ||
      cfg?.routing?.[task === TASKS.LATEX_FIX ? 'latexFix' : task] || {};
    if (r.mode === 'explicit' && r.modelId) return { mode: 'explicit', modelId: r.modelId };
    if (r.modelId && r.modelId !== 'auto') return { mode: 'explicit', modelId: r.modelId };
    return { mode: 'auto', modelId: null };
  }

  getRoutingPolicy() {
    const cfg = this.getConfig();
    return cfg?.routing || {
      extraction: { mode: 'auto', modelId: null },
      solving: { mode: 'auto', modelId: null },
      latexFix: { mode: 'auto', modelId: null }
    };
  }

  async setTaskModel(task, modelId) {
    const norm = task === TASKS.LATEX_FIX ? 'latexFix' : task;
    const value = (!modelId || modelId === 'auto') ? null : String(modelId);
    if (typeof window !== 'undefined' && window.Storage) {
      await window.Storage.setTaskModel(norm, value);
    }
    return this.getRoutingPolicy();
  }

  getModels() {
    return [...this.registry.values()];
  }

  getModelsForTask(task, opts = {}) {
    const req = taskRequirements(task, opts);
    return this.getModels().map(m => {
      const check = isModelEligibleForTask(m, req);
      return { ...m, eligible: check.ok, ineligibilityReason: check.ok ? null : check.reason };
    });
  }

  // -- discovery ----------------------------------------------------------
  async refreshModels() {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = (async () => {
      const cfg = this.getConfig();
      aiLog('Refreshing models…');
      const [geminiRes, zenRes] = await Promise.all([
        GeminiProvider.discoverModels(cfg).catch(err => ({ models: geminiFallbackModels(), status: 'fallback', error: err.message })),
        ZenProvider.discoverModels(cfg).catch(err => ({ models: [], status: 'error', error: err.message }))
      ]);

      // Do not let one provider's failure clear the other's models.
      if (geminiRes.status !== 'error' || (geminiRes.models && geminiRes.models.length)) {
        for (const [id, m] of [...this.registry.entries()]) {
          if (m.provider === 'gemini') this.registry.delete(id);
        }
        for (const m of (geminiRes.models || [])) this.registry.set(m.id, m);
      }
      if (zenRes.status !== 'error') {
        for (const [id, m] of [...this.registry.entries()]) {
          if (m.provider === 'zen') this.registry.delete(id);
        }
        for (const m of (zenRes.models || [])) this.registry.set(m.id, m);
      } else if (zenRes.status === 'error' && !(zenRes.models || []).length) {
        // keep previously discovered Zen models on transient failure
      }

      this.providerStatus.gemini = {
        state: geminiRes.status === 'no-keys' ? 'no-keys'
          : (geminiRes.models && geminiRes.models.length) ? 'available' : 'unavailable',
        count: (geminiRes.models || []).length,
        error: geminiRes.error || null
      };
      this.providerStatus.zen = {
        state: zenRes.status === 'no-keys' ? 'no-keys'
          : (zenRes.models && zenRes.models.length) ? 'available'
          : zenRes.status === 'error' ? 'unavailable' : 'unavailable',
        count: (zenRes.models || []).length,
        error: zenRes.error || null
      };
      aiLog(`Discovery: Gemini ${this.providerStatus.gemini.count}, Zen ${this.providerStatus.zen.count}`);
      this.validatePersistedSelections();
      this.refreshInFlight = null;
      return {
        models: this.getModels(),
        status: { ...this.providerStatus }
      };
    })();
    return this.refreshInFlight;
  }

  validatePersistedSelections() {
    // Mark unavailable explicit selections; preserve them (do not silently rewrite).
    const policy = this.getRoutingPolicy();
    for (const task of [TASKS.EXTRACTION, TASKS.SOLVING, TASKS.LATEX_FIX]) {
      const norm = task === TASKS.LATEX_FIX ? 'latexFix' : task;
      const entry = policy[norm];
      if (entry && entry.mode === 'explicit' && entry.modelId && !this.registry.has(entry.modelId)) {
        aiLog(`Task "${task}": selected model ${entry.modelId} no longer available`);
      }
    }
  }

  getStatus() {
    return {
      providers: { ...this.providerStatus },
      modelCount: this.registry.size,
      lastUsage: this.lastUsage,
      lastFallback: this.lastFallbackInfo
    };
  }

  // -- resource management ------------------------------------------------
  resourceId(provider, credId, sourceId) {
    return `${provider}:${credId}:${sourceId}`;
  }

  isResourceCooling(resourceId) {
    const until = this.resourceCooldowns.get(resourceId);
    if (!until) return false;
    if (Date.now() > until) {
      this.resourceCooldowns.delete(resourceId);
      return false;
    }
    return true;
  }

  cooldownResource(resourceId, ms = 60000) {
    this.resourceCooldowns.set(resourceId, Date.now() + ms);
    aiLog(`Cooldown ${resourceId} for ${Math.round(ms / 1000)}s`);
  }

  credentialsForModel(model, cfg) {
    if (model.provider === 'gemini') {
      return GeminiProvider.getKeys(cfg).map(k => ({
        credId: k.id || credFingerprint(k.key),
        credName: k.name || 'Gemini key',
        key: k.key.trim()
      }));
    }
    const zk = ZenProvider.getKey(cfg);
    if (!zk) return [];
    return [{ credId: 'default', credName: 'Zen key', key: zk }];
  }

  buildResources(models, cfg) {
    const resources = [];
    for (const model of models) {
      const creds = this.credentialsForModel(model, cfg);
      for (const c of creds) {
        const rid = this.resourceId(model.provider, c.credId, model.sourceId);
        if (this.isResourceCooling(rid)) continue;
        // Respect legacy per-key Gemini cooldowns too
        if (model.provider === 'gemini' && keyPool.isKeyInCooldown(c.key)) continue;
        resources.push({
          resourceId: rid,
          model,
          cred: c,
          lastUsed: this.resourceLastUsed.get(rid) || 0
        });
      }
    }
    // Fair distribution: least-recently-used first, with rotation offset.
    resources.sort((a, b) => a.lastUsed - b.lastUsed);
    if (resources.length > 1) {
      const off = this.rotationIndex % resources.length;
      return [...resources.slice(off), ...resources.slice(0, off)];
    }
    return resources;
  }

  recordOutcome(task, resourceId, modelId, outcome, latencyMs, errCategory) {
    const k = `${task}:${modelId}`;
    let s = this.modelStats.get(k);
    if (!s) {
      s = { modelId, task, successes: 0, failures: 0, rateLimits: 0, lastUsed: 0, totalLatencyMs: 0, samples: 0, averageLatencyMs: null };
      this.modelStats.set(k, s);
    }
    s.lastUsed = Date.now();
    if (outcome === 'success') {
      s.successes++;
      s.totalLatencyMs += (latencyMs || 0);
      s.samples++;
      s.averageLatencyMs = Math.round(s.totalLatencyMs / s.samples);
    } else {
      s.failures++;
      if (errCategory === 'RATE_LIMITED') s.rateLimits++;
    }
    this.resourceLastUsed.set(resourceId, Date.now());
  }

  autoCandidates(task, req) {
    const out = [];
    // Prefer non-fallback real models; keep fallback only when nothing else.
    const all = this.getModels();
    for (const m of all) {
      if (isModelEligibleForTask(m, req).ok) out.push(m);
    }
    // LaTeX fix: prefer free/cheap capable models first.
    if (task === TASKS.LATEX_FIX) {
      out.sort((a, b) => {
        const af = a.free === true ? 0 : a.free === null ? 1 : 2;
        const bf = b.free === true ? 0 : b.free === null ? 1 : 2;
        if (af !== bf) return af - bf;
        return 0;
      });
    }
    return out;
  }

  friendlyError(category, context) {
    switch (category) {
      case 'RATE_LIMITED':
        return new Error('All suitable AI models are currently rate-limited. Please wait or configure another provider/key.');
      case 'AUTH_ERROR':
        return new Error(context?.provider === 'zen'
          ? 'Zen API key is invalid.'
          : 'A Gemini API key is invalid. Please check Settings.');
      case 'MODEL_UNAVAILABLE':
        return new Error(context?.modelId
          ? `The selected model (${context.modelId}) is currently unavailable.`
          : 'No suitable model is currently available for this task.');
      case 'INVALID_REQUEST':
        return new Error('The AI request was rejected. Please try again with different input.');
      default:
        return new Error(context?.message || 'No suitable model is currently available for this task.');
    }
  }

  // Core executor: runs `runFn(resource, model)` across resources with fallback.
  async executeWithFallback({ task, req, explicitModelId, runFn, cfg }) {
    const explicitId = explicitModelId ? resolveLegacyModelId(explicitModelId) : null;
    const attemptsLog = [];
    this.lastFallbackInfo = null;

    const tryResource = async (resource) => {
      const { model, cred } = resource;
      aiLog(`Task: ${task} Attempt model: ${resource.model.id}`);
      const t0 = performance.now();
      try {
        const result = await runFn(resource, model, cred);
        const latency = result?.latencyMs ?? Math.round(performance.now() - t0);
        this.recordOutcome(task, resource.resourceId, model.id, 'success', latency);
        this.rotationIndex++;
        this.lastUsage = {
          task, modelId: model.id, provider: model.provider,
          fallback: !!this.lastFallbackInfo, latencyMs: latency
        };
        aiLog(`Result: success model=${model.id} latency=${latency}ms`);
        return result;
      } catch (err) {
        const category = err?.category || classifyError(err?.status || 0, err?.message);
        this.recordOutcome(task, resource.resourceId, model.id, 'error', 0, category);
        attemptsLog.push({ model: model.id, category, message: String(err?.message || '').slice(0, 200) });
        aiLog(`Result: ${category} model=${model.id}`);
        if (category === 'RATE_LIMITED' || category === 'TEMPORARY_ERROR') {
          this.cooldownResource(resource.resourceId, 60000);
          if (model.provider === 'gemini') keyPool.markRateLimited(cred.key, 60000);
        }
        if (category === 'AUTH_ERROR' || category === 'INVALID_REQUEST') {
          throw err; // do not retry unrelated resources on auth/bad-request
        }
        return { __retry: true, err, category };
      }
    };

    // --- Explicit mode: try the selected model first ---------------------
    if (explicitId) {
      const model = this.registry.get(explicitId);
      if (!model) {
        // Selected model unknown (never discovered or disappeared): fall back
        // to auto pool but preserve the stored selection.
        aiLog(`Selected model ${explicitId} unavailable; falling back to automatic pool`);
        this.lastFallbackInfo = {
          task, selectedModel: explicitId, reason: 'Selected model is unavailable.',
          fallbackUsed: true
        };
      } else {
        const compat = isModelEligibleForTask(model, req);
        if (!compat.ok) {
          throw new Error(
            task === TASKS.EXTRACTION
              ? 'The selected extraction model does not support PDF input or structured output.'
              : req.requiresVision
                ? 'The selected model does not support image input.'
                : `The selected model (${explicitId}) is incompatible with this task: ${compat.reason}`
          );
        }
        const resources = this.buildResources([model], cfg);
        if (!resources.length) {
          aiLog(`Selected model ${explicitId} has no healthy resources; trying fallback pool`);
          this.lastFallbackInfo = {
            task, selectedModel: explicitId,
            reason: 'Selected model is temporarily rate-limited.',
            fallbackUsed: true
          };
        } else {
          let lastErr = null;
          for (const r of resources) {
            const outcome = await tryResource(r);
            if (!outcome?.__retry) return outcome;
            lastErr = outcome.err;
          }
          // Explicit model exhausted → fall back to auto pool.
          aiLog(`Selected model ${explicitId} failed; falling back to automatic pool`);
          this.lastFallbackInfo = {
            task, selectedModel: explicitId,
            reason: `Selected model failed (${lastErr?.category || 'error'}). Automatic fallback was used.`,
            fallbackUsed: true
          };
        }
      }
      // Fall through to automatic pool as configured fallback.
      const autoModels = this.autoCandidates(task, req).filter(m => m.id !== explicitId);
      const autoResources = this.buildResources(autoModels, cfg);
      if (!autoResources.length) {
        throw this.friendlyError('RATE_LIMITED', { modelId: explicitId });
      }
      const maxAttempts = Math.min(autoResources.length, 8);
      let lastErr = null;
      for (let i = 0; i < maxAttempts; i++) {
        const outcome = await tryResource(autoResources[i]);
        if (!outcome?.__retry) return outcome;
        lastErr = outcome.err;
        if (lastErr?.category === 'AUTH_ERROR' || lastErr?.category === 'INVALID_REQUEST') throw lastErr;
      }
      throw this.friendlyError(lastErr?.category || 'RATE_LIMITED', { modelId: explicitId, message: lastErr?.message });
    }

    // --- Automatic mode ---------------------------------------------------
    const candidates = this.autoCandidates(task, req);
    aiLog(`Task: ${task} Mode: automatic Candidates: ${candidates.length}`);
    const resources = this.buildResources(candidates, cfg);
    if (!resources.length) {
      if (!candidates.length) {
        throw new Error(
          task === TASKS.EXTRACTION
            ? 'No suitable model is currently available for extraction. Configure a Gemini key (PDF-capable) in Settings.'
            : 'No suitable model is currently available for this task. Please configure a provider in Settings.'
        );
      }
      throw new Error('All suitable AI models are currently rate-limited. Please wait or configure another provider/key.');
    }
    const maxAttempts = Math.min(resources.length, 8);
    let lastErr = null;
    let lastCategory = 'UNKNOWN_ERROR';
    for (let i = 0; i < maxAttempts; i++) {
      const r = resources[i];
      aiLog(`Selected: ${r.model.id} (attempt ${i + 1}/${maxAttempts})`);
      const outcome = await tryResource(r);
      if (!outcome?.__retry) {
        if (i > 0) {
          this.lastFallbackInfo = {
            task, selectedModel: null,
            reason: `Fallback to ${r.model.id} after ${i} rate-limited resource(s).`,
            fallbackUsed: true
          };
          if (this.lastUsage) this.lastUsage.fallback = true;
        }
        return outcome;
      }
      lastErr = outcome.err;
      lastCategory = outcome.category;
      if (lastCategory === 'AUTH_ERROR' || lastCategory === 'INVALID_REQUEST') throw lastErr;
    }
    throw this.friendlyError(lastCategory, { message: lastErr?.message });
  }

  // -- payload builders ----------------------------------------------------
  buildExtractionGeminiPayload(base64Pdf) {
    return {
      system_instruction: { parts: [{ text: EXTRACTION_SYSTEM_PROMPT }] },
      contents: [{
        parts: [
          { inline_data: { mime_type: 'application/pdf', data: base64Pdf } },
          { text: 'Extract all exercises and questions from this chapter in sequential order.' }
        ]
      }],
      generationConfig: {
        temperature: 0.0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  exercise: { type: 'string' },
                  number: { type: 'string' },
                  questionText: { type: 'string' },
                  pageNumber: { type: 'integer' },
                  warn: { type: 'string', enum: ['yes', 'no'] },
                  options: { type: 'array', items: { type: 'string' } }
                },
                required: ['exercise', 'number', 'questionText', 'warn']
              }
            }
          },
          required: ['questions']
        }
      }
    };
  }

  buildSolverUserPrompt(questionObj) {
    return `Question Reference: ${questionObj.exercise} Q${questionObj.number}\nQuestion Text:\n${questionObj.questionText}\n${questionObj.options?.length ? '\nOptions:\n' + questionObj.options.map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`).join('\n') : ''}`;
  }

  // -- task operations ------------------------------------------------------
  async extractChapterQuestions(pdfArrayBuffer, cfg) {
    const effCfg = cfg || this.getConfig();
    let binary = '';
    const bytes = new Uint8Array(pdfArrayBuffer);
    const CHUNK = 8192;
    for (let i = 0; i < bytes.byteLength; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    const base64Pdf = btoa(binary);
    const req = taskRequirements(TASKS.EXTRACTION);
    const routing = this.routingFor(TASKS.EXTRACTION);
    const explicitModelId = routing.mode === 'explicit' ? routing.modelId : null;

    const runFn = async (resource, model, cred) => {
      if (model.provider === 'gemini') {
        const payload = this.buildExtractionGeminiPayload(base64Pdf);
        const normalized = await GeminiProvider.generateContent(model.sourceId, payload, cred.key);
        const parsed = tryParseJsonObject(normalized.text);
        if (!Array.isArray(parsed.questions)) throw new Error('Model did not return a valid questions list.');
        return { ...normalized, parsed };
      }
      // Zen / OpenAI-compatible: no raw-PDF transport; reject rather than
      // sending an incompatible payload.
      const err = new Error('The selected extraction model does not support PDF input or structured output.');
      err.category = 'MODEL_UNAVAILABLE';
      throw err;
    };

    const result = await this.executeWithFallback({
      task: TASKS.EXTRACTION, req, explicitModelId, runFn, cfg: effCfg
    });
    if (result?.parsed) return result.parsed;
    // Fallback: normalize raw text
    return tryParseJsonObject(result.text);
  }

  async solveQuestion(questionObj, imageBlobs = [], cfg) {
    const effCfg = cfg || this.getConfig();
    const req = taskRequirements(TASKS.SOLVING, { requiresVision: (imageBlobs || []).length > 0 });
    const routing = this.routingFor(TASKS.SOLVING);
    const explicitModelId = routing.mode === 'explicit' ? routing.modelId : null;
    const userPrompt = this.buildSolverUserPrompt(questionObj);

    // Pre-convert image blobs once (data URIs usable by both providers).
    const imageDataUris = [];
    if (imageBlobs && imageBlobs.length) {
      for (const blob of imageBlobs) {
        const dataUri = await window.Compressor.blobToBase64(blob);
        imageDataUris.push(dataUri);
      }
    }

    const runFn = async (resource, model, cred) => {
      if (model.provider === 'gemini') {
        const parts = [];
        for (const uri of imageDataUris) {
          parts.push({ inline_data: { mime_type: 'image/webp', data: uri.split(',')[1] } });
        }
        parts.push({ text: userPrompt });
        const payload = {
          system_instruction: { parts: [{ text: MATHS_SYSTEM_PROMPT }] },
          contents: [{ parts }],
          generationConfig: { temperature: 0.1 }
        };
        const normalized = await GeminiProvider.generateContent(model.sourceId, payload, cred.key);
        return normalized;
      }
      const normalized = await ZenProvider.chat(
        model.sourceId, MATHS_SYSTEM_PROMPT, userPrompt,
        { imageDataUris, temperature: 0.1 }, cred.key
      );
      return normalized;
    };

    const result = await this.executeWithFallback({
      task: TASKS.SOLVING, req, explicitModelId, runFn, cfg: effCfg
    });
    return result.text;
  }

  async fixLatex(text, cfg) {
    if (!text || !text.trim()) return text;
    const effCfg = cfg || this.getConfig();
    const req = taskRequirements(TASKS.LATEX_FIX);
    const routing = this.routingFor(TASKS.LATEX_FIX);
    const explicitModelId = routing.mode === 'explicit' ? routing.modelId : null;
    const userMessage = `Text to reformat (DO NOT SOLVE, ONLY FIX LATEX/DELIMITERS):\n\n${text}`;

    const runFn = async (resource, model, cred) => {
      if (model.provider === 'gemini') {
        const payload = {
          system_instruction: { parts: [{ text: LATEX_FIX_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.0 }
        };
        const normalized = await GeminiProvider.generateContent(model.sourceId, payload, cred.key);
        return normalized;
      }
      const normalized = await ZenProvider.chat(
        model.sourceId, LATEX_FIX_SYSTEM_PROMPT, userMessage,
        { temperature: 0.0 }, cred.key
      );
      return normalized;
    };

    const result = await this.executeWithFallback({
      task: TASKS.LATEX_FIX, req, explicitModelId, runFn, cfg: effCfg
    });
    return result.text;
  }
}

const aiRouter = new AIRouter();

// Compatibility facade: existing app code calls window.Gemini.*
class GeminiService {
  static getBaseUrl(modelName, apiKey) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  }

  static async extractChapterQuestions(pdfArrayBuffer, cfg) {
    return aiRouter.extractChapterQuestions(pdfArrayBuffer, cfg);
  }

  static async solveQuestion(questionObj, imageBlobs = [], cfg) {
    return aiRouter.solveQuestion(questionObj, imageBlobs, cfg);
  }

  static async fixLatex(text, cfg) {
    return aiRouter.fixLatex(text, cfg);
  }
}

window.Gemini = GeminiService;
window.KeyPool = keyPool;
window.AI = {
  TASKS,
  refreshModels: () => aiRouter.refreshModels(),
  getModels: () => aiRouter.getModels(),
  getModelsForTask: (task, opts) => aiRouter.getModelsForTask(task, opts),
  getRoutingPolicy: () => aiRouter.getRoutingPolicy(),
  setTaskModel: (task, modelId) => aiRouter.setTaskModel(task, modelId),
  getStatus: () => aiRouter.getStatus(),
  get router() { return aiRouter; }
};
