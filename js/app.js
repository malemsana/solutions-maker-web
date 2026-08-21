// Main Application Controller & UI Coordinator
class AppController {
  constructor() {
    this.sessionAssets = new Map(); // path -> objectUrl
    this.activePdfDoc = null;
    this.activePdfBuffer = null;
    this.currentChapterId = 'c10_math_ch1';
    this.questionsList = [];
    this.activeEditingQ = null;
    this.activeDrawerTargetField = 'edQText';

    // Cropper State
    this.cropState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      rect: { x: 0, y: 0, w: 0, h: 0 },
      pageIndex: 1,
      zoomLevel: 1.0,
      dpr: window.devicePixelRatio || 1
    };
  }

  async init() {
    await window.Storage.init();
    const cfg = window.Storage.getConfig();
    if (!cfg.apiKey) this.openSettingsModal();
    await this.loadActiveChapterData();
  }

  getChapterId() {
    const cls = document.getElementById('classNum').value.trim() || '10';
    const subMap = {
      'Mathematics': 'math',
      'Physics': 'phy',
      'Chemistry': 'chem',
      'Biology': 'bio',
      'Science': 'sci',
      'Social Science': 'sst'
    };
    const sub = subMap[document.getElementById('subjectName').value] || 'gen';
    const ch = document.getElementById('chapterNum').value.trim() || '1';
    return `c${cls}_${sub}_ch${ch}`;
  }

  async loadActiveChapterData() {
    this.currentChapterId = this.getChapterId();

    // Hydrate Questions
    this.questionsList = await window.Storage.getAllByIndex('questions', 'chapterId', this.currentChapterId);

    // Hydrate Assets
    const assets = await window.Storage.getAllByIndex('assets', 'chapterId', this.currentChapterId);
    this.sessionAssets.clear();
    assets.forEach(a => {
      this.sessionAssets.set(a.path, URL.createObjectURL(a.blob));
    });

    // Hydrate PDF
    const rawPdf = await window.Storage.get('raw_files', `pdf_${this.currentChapterId}`);
    if (rawPdf) {
      this.activePdfBuffer = rawPdf.data;
      this.activePdfDoc = await pdfjsLib.getDocument({ data: this.activePdfBuffer.slice(0) }).promise;
      document.getElementById('pdfFileLabel').textContent = `${rawPdf.name} (${this.activePdfDoc.numPages} pages)`;
      document.getElementById('extractBtn').disabled = false;
    }

    this.renderQuestionList();
  }

  // --- PDF Upload & Question Extraction ---
  async handlePdfUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    this.currentChapterId = this.getChapterId();
    this.activePdfBuffer = await file.arrayBuffer();

    await window.Storage.put('raw_files', {
      id: `pdf_${this.currentChapterId}`,
      name: file.name,
      data: this.activePdfBuffer,
      updatedAt: Date.now()
    });

    this.activePdfDoc = await pdfjsLib.getDocument({ data: this.activePdfBuffer.slice(0) }).promise;
    document.getElementById('pdfFileLabel').textContent = `${file.name} (${this.activePdfDoc.numPages} pages)`;
    document.getElementById('extractBtn').disabled = false;
  }

  async extractQuestions() {
    const cfg = window.Storage.getConfig();
    if (!cfg.apiKey) { this.openSettingsModal(); return; }
    if (!this.activePdfBuffer) return;

    const btn = document.getElementById('extractBtn');
    btn.disabled = true;
    btn.textContent = 'Extracting via Gemini...';

    try {
      const result = await window.Gemini.extractChapterQuestions(this.activePdfBuffer, cfg);

      this.questionsList = result.questions.map((q, idx) => ({
        id: `q_${Date.now()}_${idx + 1}`,
        chapterId: this.currentChapterId,
        exercise: q.exercise || 'Exercise 1.1',
        number: q.number || String(idx + 1),
        pageNumber: q.pageNumber || 1,
        questionText: q.questionText || '',
        solutionText: '',
        options: q.options || [],
        warn: q.warn === 'yes',
        status: 'extracted',
        lastModified: Date.now()
      }));

      for (const q of this.questionsList) {
        await window.Storage.put('questions', q);
      }

      this.renderQuestionList();
    } catch (err) {
      alert('Extraction failed: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">document_scanner</span> Extract Questions (Gemini)';
    }
  }

  // --- Solving Workflow ---
  async solveQuestion(qId) {
    const q = this.questionsList.find(x => x.id === qId);
    if (!q) return;

    const cfg = window.Storage.getConfig();
    if (!cfg.apiKey) { this.openSettingsModal(); return; }

    q.status = 'solving';
    this.renderQuestionList();

    try {
      // Gather any referenced WebP image blobs
      const imgMatches = [...q.questionText.matchAll(/!\[.*?\]\((assets\/.*?)\)/g)];
      const imageBlobs = [];
      for (const m of imgMatches) {
        const stored = await window.Storage.get('assets', m[1]);
        if (stored?.blob) imageBlobs.push(stored.blob);
      }

      q.solutionText = await window.Gemini.solveQuestion(q, imageBlobs, cfg);
      q.status = 'solved';
      q.lastModified = Date.now();

      await window.Storage.put('questions', q);
      this.renderQuestionList();

      if (this.activeEditingQ?.id === q.id) {
        document.getElementById('edSolText').value = q.solutionText;
        this.renderEditorPreviews();
      }
    } catch (err) {
      alert(`Solving Q${q.number} failed: ` + err.message);
      q.status = 'extracted';
      this.renderQuestionList();
    }
  }

  async solveAllPending() {
    for (const q of this.questionsList) {
      if (q.status !== 'approved') {
        await this.solveQuestion(q.id);
      }
    }
  }

  // --- Editor Modal & Dual Pane Management ---
  openEditor(qId) {
    this.activeEditingQ = this.questionsList.find(x => x.id === qId);
    if (!this.activeEditingQ) return;

    document.body.classList.add('modal-open');
    document.getElementById('edQNum').textContent = `${this.activeEditingQ.exercise} Question ${this.activeEditingQ.number}`;
    document.getElementById('edQText').value = this.activeEditingQ.questionText;
    document.getElementById('edSolText').value = this.activeEditingQ.solutionText || '';

    const badge = document.getElementById('edQBadge');
    badge.className = `badge ${this.activeEditingQ.status === 'approved' ? 'approved' : this.activeEditingQ.warn ? 'warn' : 'ok'}`;
    badge.textContent = this.activeEditingQ.status === 'approved' ? '✓ Approved' : this.activeEditingQ.warn ? '⚠ Diagram Review' : 'Active';

    this.setFieldView('q', 'raw');
    this.setFieldView('sol', 'raw');

    document.getElementById('editorModal').classList.add('open');
    this.closePdfDrawer();
    this.renderEditorPreviews();
  }

  closeEditorModal() {
    document.body.classList.remove('modal-open');
    document.getElementById('editorModal').classList.remove('open');
    this.activeEditingQ = null;
  }

  setFieldView(field, mode) {
    const row = document.getElementById(field === 'q' ? 'rowQ' : 'rowSol');
    row.className = `editor-content-row view-${mode}`;

    const prefix = field === 'q' ? 'btnQ' : 'btnSol';
    ['Raw', 'Split', 'Rendered'].forEach(m => {
      document.getElementById(`${prefix}${m}`).classList.toggle('active', m.toLowerCase() === mode);
    });

    this.renderEditorPreviews();
  }

  renderEditorPreviews() {
    document.getElementById('edQPreview').innerHTML = this.renderMarkdown(document.getElementById('edQText').value);
    document.getElementById('edSolPreview').innerHTML = this.renderMarkdown(document.getElementById('edSolText').value);
    this.renderAssetStrips();
    document.querySelectorAll('.preview-box').forEach(el => this.applyKaTeX(el));
  }

  renderAssetStrips() {
    ['edQText', 'edSolText'].forEach(fieldId => {
      const isQ = fieldId === 'edQText';
      const container = document.getElementById(isQ ? 'qAssetStrip' : 'solAssetStrip');
      const text = document.getElementById(fieldId).value;
      const matches = [...text.matchAll(/!\[(.*?)\]\((assets\/.*?)\)/g)];

      if (!matches.length) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = matches.map(m => {
        const alt = m[1] || 'Figure';
        const path = m[2];
        const objUrl = this.sessionAssets.get(path) || '';
        return `
          <div class="asset-pill">
            <img src="${objUrl}" alt="${alt}">
            <span>${path.split('/').pop()}</span>
            <button onclick="UI.deleteImageReference('${fieldId}', '${path}')" title="Delete Image">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        `;
      }).join('');
    });
  }

  async deleteImageReference(fieldId, assetPath) {
    const ta = document.getElementById(fieldId);
    const regex = new RegExp(`!\\[.*?\\]\\(${assetPath.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\)`, 'g');
    ta.value = ta.value.replace(regex, '').trim();

    await window.Storage.delete('assets', assetPath);
    this.sessionAssets.delete(assetPath);

    this.renderEditorPreviews();
  }

  async saveAndApproveActiveQuestion() {
    if (!this.activeEditingQ) return;
    this.activeEditingQ.questionText = document.getElementById('edQText').value;
    this.activeEditingQ.solutionText = document.getElementById('edSolText').value;
    this.activeEditingQ.warn = false;
    this.activeEditingQ.status = 'approved';
    this.activeEditingQ.lastModified = Date.now();

    await window.Storage.put('questions', this.activeEditingQ);
    this.renderQuestionList();
    this.closeEditorModal();
  }

  solveActiveInEditor() {
    if (!this.activeEditingQ) return;
    this.activeEditingQ.questionText = document.getElementById('edQText').value;
    this.solveQuestion(this.activeEditingQ.id);
  }

  // --- 40% PDF Drawer & High-DPI Cropper ---
  openPdfDrawer(targetFieldId) {
    this.activeDrawerTargetField = targetFieldId;
    const drawer = document.getElementById('pdfDrawer');
    const layout = document.querySelector('.fs-layout');
    drawer.classList.add('open');
    layout.classList.add('drawer-open');
    this.renderPdfThumbnails();
  }

  closePdfDrawer() {
    document.getElementById('pdfDrawer').classList.remove('open');
    document.querySelector('.fs-layout').classList.remove('drawer-open');
  }

  async renderPdfThumbnails() {
    if (!this.activePdfDoc) return;
    const container = document.getElementById('pdfThumbnails');
    container.innerHTML = '';

    for (let pageNum = 1; pageNum <= this.activePdfDoc.numPages; pageNum++) {
      const page = await this.activePdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.95 }); // 90-100 DPI thumbnail

      const card = document.createElement('div');
      card.className = 'thumb-card';
      card.innerHTML = `<b style="font-size:11px;">Page ${pageNum}</b>`;

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;
      card.appendChild(canvas);
      card.onclick = () => this.openHighDpiCropper(pageNum);
      container.appendChild(card);
    }
  }

  async openHighDpiCropper(pageNum) {
    if (!this.activePdfDoc) return;
    this.cropState.pageIndex = pageNum;
    this.cropState.zoomLevel = 1.0;

    document.getElementById('cropperPageTitle').textContent = `High-DPI Cropper — Page ${pageNum}`;
    document.getElementById('cropperModal').classList.add('open');

    const page = await this.activePdfDoc.getPage(pageNum);
    const dpr = window.devicePixelRatio || 1;
    this.cropState.dpr = dpr;

    const baseViewport = page.getViewport({ scale: 2.5 * dpr });
    const canvas = document.getElementById('cropCanvas');
    canvas.width = baseViewport.width;
    canvas.height = baseViewport.height;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: baseViewport }).promise;

    this.fitCropperToScreen();
    this.installCropperEvents();
  }

  fitCropperToScreen() {
    const wrap = document.getElementById('cropWrap');
    const canvas = document.getElementById('cropCanvas');
    const availableW = wrap.clientWidth - 40;
    const availableH = wrap.clientHeight - 40;

    const scaleW = availableW / (canvas.width / this.cropState.dpr);
    const scaleH = availableH / (canvas.height / this.cropState.dpr);
    this.cropState.zoomLevel = Math.min(scaleW, scaleH, 1.0);
    this.applyCropperZoom();
  }

  zoomCropper(delta) {
    this.cropState.zoomLevel = Math.max(0.25, Math.min(this.cropState.zoomLevel + delta, 3.0));
    this.applyCropperZoom();
  }

  applyCropperZoom() {
    const canvas = document.getElementById('cropCanvas');
    const container = document.getElementById('cropContainer');
    const displayW = (canvas.width / this.cropState.dpr) * this.cropState.zoomLevel;
    const displayH = (canvas.height / this.cropState.dpr) * this.cropState.zoomLevel;

    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    container.style.width = `${displayW}px`;
    container.style.height = `${displayH}px`;

    document.getElementById('cropZoomLabel').textContent = `${Math.round(this.cropState.zoomLevel * 100)}%`;
  }

  closeCropperModal() {
    document.getElementById('cropperModal').classList.remove('open');
    document.getElementById('selectionBox').style.display = 'none';
  }

  installCropperEvents() {
    const container = document.getElementById('cropContainer');
    const box = document.getElementById('selectionBox');

    container.onmousedown = e => {
      const rect = container.getBoundingClientRect();
      this.cropState.isDragging = true;
      this.cropState.startX = e.clientX - rect.left;
      this.cropState.startY = e.clientY - rect.top;

      box.style.display = 'block';
      box.style.left = `${this.cropState.startX}px`;
      box.style.top = `${this.cropState.startY}px`;
      box.style.width = '0px';
      box.style.height = '0px';
    };

    window.onmousemove = e => {
      if (!this.cropState.isDragging) return;
      const rect = container.getBoundingClientRect();
      const curX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const curY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      const x = Math.min(curX, this.cropState.startX);
      const y = Math.min(curY, this.cropState.startY);
      const w = Math.abs(curX - this.cropState.startX);
      const h = Math.abs(curY - this.cropState.startY);

      this.cropState.rect = { x, y, w, h };
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
    };

    window.onmouseup = () => { this.cropState.isDragging = false; };
  }

  async confirmCropAndInsert() {
    const { x, y, w, h } = this.cropState.rect;
    if (w < 8 || h < 8) { alert('Please drag to select a diagram region.'); return; }

    const container = document.getElementById('cropContainer');
    const sourceCanvas = document.getElementById('cropCanvas');
    const scaleFactor = sourceCanvas.width / container.offsetWidth;

    const cropCoords = {
      x: x * scaleFactor,
      y: y * scaleFactor,
      w: w * scaleFactor,
      h: h * scaleFactor
    };

    const cfg = window.Storage.getConfig();
    const result = await window.Compressor.cropCanvasToWebP(sourceCanvas, cropCoords, cfg.webpQuality);
    if (!result) return;

    const assetKey = `assets/${this.activeEditingQ.id}_fig_${Date.now()}.webp`;
    await window.Storage.put('assets', {
      path: assetKey,
      chapterId: this.currentChapterId,
      blob: result.blob,
      createdAt: Date.now()
    });

    this.sessionAssets.set(assetKey, result.dataUrl);

    // Insert Markdown Link directly at active cursor
    this.insertSnippet(this.activeDrawerTargetField, `\n\n![Figure](${assetKey})\n\n`, '');
    this.renderEditorPreviews();

    this.closeCropperModal();
    this.closePdfDrawer();
  }

  // --- Continua Package Export ---
  async exportContinuaPackage() {
    if (!this.questionsList.length) { alert('No questions to export.'); return; }

    // 1. Group questions by Exercise for Continua Studio
    const groupsMap = new Map();
    this.questionsList.forEach(q => {
      const ex = q.exercise || 'Exercise 1.1';
      if (!groupsMap.has(ex)) groupsMap.set(ex, []);
      groupsMap.get(ex).push(q);
    });

    let groupOrder = 1;
    const groups = [];

    for (const [friendlyName, qList] of groupsMap.entries()) {
      const questions = qList.map((q, idx) => {
        let structuredOpts = [];
        if (q.options?.length) {
          structuredOpts = q.options.map(opt => ({
            text: opt.replace(/^\(?[A-Da-d]\)?[\s.:)-]+/, '').trim(),
            isCorrect: q.solutionText ? q.solutionText.toLowerCase().includes(opt.toLowerCase().trim()) : false
          }));
        }

        return {
          displayOrder: idx + 1,
          questionText: q.questionText,
          solutionText: q.solutionText || '',
          sourceInfo: `${friendlyName} Q${q.number}`,
          options: structuredOpts
        };
      });

      groups.push({
        friendlyName: friendlyName,
        displayOrder: groupOrder++,
        questions: questions
      });
    }

    const continuaManifest = {
      type: 'NCERT_SOLUTIONS',
      groups: groups
    };

    const baseName = `${this.getChapterId()}_solutions`;

    // Download JSON
    const jsonBlob = new Blob([JSON.stringify(continuaManifest, null, 2)], { type: 'application/json' });
    this.triggerDownload(jsonBlob, `${baseName}.json`);

    // Download Assets ZIP if images exist
    const assets = await window.Storage.getAllByIndex('assets', 'chapterId', this.currentChapterId);
    if (assets.length && window.JSZip) {
      const zip = new JSZip();
      const folder = zip.folder('assets');
      assets.forEach(a => {
        const filename = a.path.replace(/^assets\//, '');
        folder.file(filename, a.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.triggerDownload(zipBlob, `${baseName}_assets.zip`);
    }
  }

  // --- Settings & UI Helpers ---
  openSettingsModal() {
    const cfg = window.Storage.getConfig();
    document.getElementById('cfgApiKey').value = cfg.apiKey;
    document.getElementById('cfgExtractionModel').value = cfg.extractionModel;
    document.getElementById('cfgSolverModel').value = cfg.solverModel;
    document.getElementById('cfgWebpQuality').value = cfg.webpQuality;
    document.getElementById('settingsModal').classList.add('open');
  }

  closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('open');
  }

  saveSettings() {
    window.Storage.saveConfig({
      apiKey: document.getElementById('cfgApiKey').value,
      extractionModel: document.getElementById('cfgExtractionModel').value,
      solverModel: document.getElementById('cfgSolverModel').value,
      webpQuality: parseFloat(document.getElementById('cfgWebpQuality').value || '0.80')
    });
    this.closeSettingsModal();
  }

  renderQuestionList() {
    const container = document.getElementById('questionsContainer');
    const count = this.questionsList.length;
    const approved = this.questionsList.filter(x => x.status === 'approved').length;
    document.getElementById('statsLabel').textContent = `${count} question${count !== 1 ? 's' : ''} (${approved} approved)`;

    if (!count) {
      container.innerHTML = '<div class="empty-placeholder">No questions loaded. Upload a Chapter PDF to begin.</div>';
      return;
    }

    container.innerHTML = this.questionsList.map(q => {
      const isApproved = q.status === 'approved';
      const isWarn = q.warn;
      return `
        <article class="q-card">
          <div class="q-head">
            <div style="display:flex;align-items:center;gap:8px;">
              <b>${this.escapeHtml(q.exercise)} Q${this.escapeHtml(q.number)}</b>
              <span class="badge ${isApproved ? 'approved' : isWarn ? 'warn' : 'ok'}">
                ${isApproved ? '✓ Approved' : isWarn ? '⚠ Diagram Review' : q.status === 'solving' ? '⚡ Solving...' : 'Extracted'}
              </span>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="small" onclick="UI.solveQuestion('${q.id}')">
                <span class="material-symbols-outlined">bolt</span> Solve
              </button>
              <button class="small primary" onclick="UI.openEditor('${q.id}')">
                <span class="material-symbols-outlined">edit</span> Edit / Crop
              </button>
            </div>
          </div>
          <div class="q-body md-content">${this.renderMarkdown(q.questionText)}</div>
          ${q.solutionText ? `
            <div class="solution-view">
              <div style="font-size:11px;color:#93C5FD;font-weight:600;margin-bottom:6px;">Publishing Solution:</div>
              <div class="md-content">${this.renderMarkdown(q.solutionText)}</div>
            </div>
          ` : ''}
        </article>
      `;
    }).join('');

    document.querySelectorAll('.md-content').forEach(el => this.applyKaTeX(el));
  }

  renderMarkdown(content) {
    if (!content || !content.trim()) return '';
    let text = String(content);

    // 1. Substitute session image paths with in-memory object URLs
    for (const [path, url] of this.sessionAssets.entries()) {
      text = text.split(path).join(url);
    }

    // 2. Normalize standalone square-bracketed blocks into display math
    text = text.replace(/(?:^|\n)\s*\[\s*\n([\s\S]*?)\n\s*\]\s*(?:\n|$)/g, '\n\n$$\n$1\n$$\n\n');

    const mathTokens = [];

    // 3. Tokenize Display Math: $$ ... $$ or \[ ... \]
    text = text.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g, (match, p1, p2) => {
      const math = (p1 !== undefined ? p1 : p2).trim();
      const token = `%%KATEX_DISPLAY_${mathTokens.length}%%`;
      mathTokens.push({ token, math, display: true });
      return `\n\n${token}\n\n`;
    });

    // 4. Tokenize Inline Math: \( ... \)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, p1) => {
      const token = `%%KATEX_INLINE_${mathTokens.length}%%`;
      mathTokens.push({ token, math: p1.trim(), display: false });
      return token;
    });

    // 5. Tokenize Inline Math: $ ... $
    text = text.replace(/(^|[^\\])\$([^\$\n\r]+?)\$/g, (match, prefix, math) => {
      const token = `%%KATEX_INLINE_${mathTokens.length}%%`;
      mathTokens.push({ token, math: math.trim(), display: false });
      return prefix + token;
    });

    // 6. Safe Markdown parse
    let html = '';
    if (window.marked && typeof window.marked.parse === 'function') {
      html = window.marked.parse(text, { gfm: true, breaks: true });
    } else {
      html = this.escapeHtml(text);
    }

    // 7. Hydrate Math tokens directly via KaTeX renderToString
    mathTokens.forEach(({ token, math, display }) => {
      let rendered = '';
      if (window.katex && typeof window.katex.renderToString === 'function') {
        try {
          rendered = window.katex.renderToString(math, {
            displayMode: display,
            throwOnError: false
          });
        } catch (e) {
          rendered = display ? `<div class="katex-display">${this.escapeHtml(math)}</div>` : `<span>${this.escapeHtml(math)}</span>`;
        }
      } else {
        rendered = display ? `<div class="katex-display">${this.escapeHtml(math)}</div>` : `<span>${this.escapeHtml(math)}</span>`;
      }
      html = html.split(token).join(rendered);
    });

    return html;
  }

  applyKaTeX(el) {
    if (!el) return;
    if (window.renderMathInElement) {
      try {
        renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        // Fallback handled by renderMarkdown tokenization
      }
    }
  }

  insertSnippet(textareaId, before, after) {
    const ta = document.getElementById(textareaId);
    const sStart = ta.selectionStart;
    const sEnd = ta.selectionEnd;
    const val = ta.value;
    const sel = val.substring(sStart, sEnd);
    ta.value = val.substring(0, sStart) + before + sel + after + val.substring(sEnd);
    ta.focus();
    ta.setSelectionRange(sStart + before.length, sEnd + before.length);
    this.renderEditorPreviews();
  }

  triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
}

window.UI = new AppController();
window.addEventListener('DOMContentLoaded', () => window.UI.init());