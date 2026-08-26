// Direct Client-Side Gemini REST Client
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

class KeyPoolManager {
  constructor() {
    this.keyIndex = 0;
    this.cooldowns = new Map(); // keyString -> cooldownExpiryTimestamp
  }

  getValidKeys(cfg) {
    let keys = [];
    if (Array.isArray(cfg?.apiKeys) && cfg.apiKeys.length > 0) {
      keys = cfg.apiKeys.filter(k => k && k.key && k.key.trim());
    } else if (cfg?.apiKey && cfg.apiKey.trim()) {
      keys = [{ id: 'key_1', name: 'Default Key', key: cfg.apiKey.trim() }];
    } else if (window.Storage) {
      keys = window.Storage.getApiKeys();
    }
    return keys;
  }

  markRateLimited(keyStr, durationMs = 60000) {
    const until = Date.now() + durationMs;
    this.cooldowns.set(keyStr, until);
    console.warn(`[KeyManager] Gemini API Key placed in cooldown for ${Math.round(durationMs / 1000)}s until ${new Date(until).toLocaleTimeString()}`);
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

  // Attempts to execute fn(apiKey) rotating across available keys and handling 429/quota errors
  async executeWithRotation(modelName, payload, cfg) {
    const keys = this.getValidKeys(cfg);
    if (!keys.length) {
      throw new Error('No Gemini API Key found. Please add an API Key in Settings.');
    }

    const totalKeys = keys.length;
    let attempts = 0;
    let lastError = null;

    // Filter out keys in cooldown if healthy keys exist
    while (attempts < totalKeys) {
      const candidateIndex = (this.keyIndex + attempts) % totalKeys;
      const keyObj = keys[candidateIndex];
      const keyStr = keyObj.key.trim();

      if (this.isKeyInCooldown(keyStr) && totalKeys > 1) {
        attempts++;
        continue;
      }

      // Advance starting point for next general request (round-robin)
      this.keyIndex = (candidateIndex + 1) % totalKeys;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(keyStr)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          return data;
        }

        const errText = await res.text();
        const isRateLimit = res.status === 429 || res.status === 503 || errText.includes('RESOURCE_EXHAUSTED') || errText.includes('quota') || errText.includes('rate limit');

        if (isRateLimit) {
          this.markRateLimited(keyStr, 60000);
          lastError = new Error(`Key "${keyObj.name || 'Key'}" hit rate limit (HTTP ${res.status}).`);
          attempts++;
          continue; // seamlessly try next key
        } else {
          // Unrecoverable request error (e.g. invalid argument, bad prompt)
          throw new Error(errText || `API request failed with status ${res.status}`);
        }
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

class GeminiService {
  static getBaseUrl(modelName, apiKey) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  }

  // Question Extraction from Chapter PDF
  static async extractChapterQuestions(pdfArrayBuffer, cfg) {
    let binary = '';
    const bytes = new Uint8Array(pdfArrayBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Pdf = btoa(binary);

    const extractionSystemPrompt = `You are the extraction stage of an NCERT textbook digitization pipeline.
Your job is to transcribe and extract ALL exercises and numbered questions from the supplied PDF.
Rules:
1. Preserve exact exercise group names (e.g., "Exercise 1.1", "Exercise 1.2", "Miscellaneous Exercise") and question numbering exactly as printed.
2. If a question contains a diagram, geometry figure, graph, circuit, or visual required to solve:
   - Insert "[IMAGE/DIAGRAM — HUMAN REVIEW REQUIRED]" in the text;
   - Set warn="yes";
   - Estimate the 1-based pageNumber where it appears.
3. Extract MCQ options separately if present.
4. Return ONLY a JSON object matching the requested schema.`;

    const payload = {
      system_instruction: { parts: [{ text: extractionSystemPrompt }] },
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

    const data = await keyPool.executeWithRotation(cfg.extractionModel, payload, cfg);
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  }

  // Multimodal Question Solver with Subject/Maths Editorial Prompt
  static async solveQuestion(questionObj, imageBlobs = [], cfg) {
    const parts = [];

    // Attach cropped diagrams if present in Markdown
    for (const blob of imageBlobs) {
      const dataUri = await window.Compressor.blobToBase64(blob);
      parts.push({
        inline_data: {
          mime_type: 'image/webp',
          data: dataUri.split(',')[1]
        }
      });
    }

    const userPrompt = `Question Reference: ${questionObj.exercise} Q${questionObj.number}
Question Text:
${questionObj.questionText}
${questionObj.options?.length ? '\nOptions:\n' + questionObj.options.map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`).join('\n') : ''}`;

    parts.push({ text: userPrompt });

    const payload = {
      system_instruction: {
        parts: [{ text: MATHS_SYSTEM_PROMPT }]
      },
      contents: [{ parts }],
      generationConfig: { temperature: 0.1 }
    };

    const data = await keyPool.executeWithRotation(cfg.solverModel, payload, cfg);
    return data.candidates[0].content.parts[0].text;
  }

  // Fast LaTeX Syntax & Formatting Fixer
  static async fixLatex(text, cfg) {
    if (!text || !text.trim()) return text;

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

    const userMessage = `Text to reformat (DO NOT SOLVE, ONLY FIX LATEX/DELIMITERS):\n\n${text}`;

    const payload = {
      system_instruction: {
        parts: [{ text: LATEX_FIX_SYSTEM_PROMPT }]
      },
      contents: [{
        parts: [{ text: userMessage }]
      }],
      generationConfig: { temperature: 0.0 }
    };

    const data = await keyPool.executeWithRotation(cfg.extractionModel, payload, cfg);
    return data.candidates[0].content.parts[0].text;
  }
}

window.Gemini = GeminiService;
window.KeyPool = keyPool;