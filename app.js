/* ========================================================
   Raíces · SPA educativa
   ======================================================== */

// ---------- Math rendering (KaTeX) ----------
function tex(source, displayMode = true) {
  if (typeof katex === 'undefined') return source;
  try {
    return katex.renderToString(source, { displayMode, throwOnError: false, output: 'html' });
  } catch {
    return source;
  }
}

// ---------- Persistencia (localStorage) ----------
const STORAGE_KEY = 'raices-v1';

const persisted = {
  flashcards: { right: [], wrong: [] },
  quiz: { games: 0, bestScore: 0, totalCorrect: 0, totalQuestions: 0 },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.flashcards) Object.assign(persisted.flashcards, saved.flashcards);
    if (saved.quiz) Object.assign(persisted.quiz, saved.quiz);
  } catch { /* estado corrupto: arranca limpio */ }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)); } catch { /* storage lleno */ }
}

loadState();

// ---------- Tabs / navegación ----------
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle('active', t === tab));
    views.forEach(v => v.classList.toggle('active', v.id === target));
  });
});

// ========================================================
// MÓDULO 1 — Flashcards
// ========================================================
const flashcards = Array.from({ length: 20 }, (_, i) => ({
  radicand: (i + 1) ** 2,
  answer: i + 1,
}));

const fcState = {
  order: flashcards.map((_, i) => i),
  index: 0,
  flipped: false,
  mode: 'secuencial',
  right: new Set(persisted.flashcards.right),
  wrong: new Set(persisted.flashcards.wrong),
};

const fcEl = {
  stage: document.querySelector('.flashcard-stage'),
  card: document.getElementById('flashcard'),
  number: document.getElementById('fc-number'),
  answer: document.getElementById('fc-answer'),
  progress: document.getElementById('fc-progress'),
  progressLabel: document.getElementById('fc-progress-label'),
  prev: document.getElementById('fc-prev'),
  next: document.getElementById('fc-next'),
  right: document.getElementById('fc-right'),
  wrong: document.getElementById('fc-wrong'),
  reset: document.getElementById('fc-reset'),
  statRight: document.getElementById('fc-stat-right'),
  statWrong: document.getElementById('fc-stat-wrong'),
  modeBtns: document.querySelectorAll('.mode-btn'),
  actions: document.querySelector('.flashcard-actions'),
};

const fcCardHTML = fcEl.stage.innerHTML;

function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildOrder() {
  if (fcState.mode === 'aleatorio') return shuffleArray(flashcards.map((_, i) => i));
  if (fcState.mode === 'repaso') return [...fcState.wrong];
  return flashcards.map((_, i) => i);
}

function renderEmptyRepaso() {
  fcEl.stage.innerHTML = `
    <div class="empty-state">
      <span class="empty-state-emoji">🌟</span>
      <h3>No tenés nada por repasar</h3>
      <p>Cuando te equivoques en alguna carta, aparecerá acá para volver a practicarla. Por ahora, ¡impecable!</p>
    </div>
  `;
  fcEl.actions.style.visibility = 'hidden';
  updateStats();
  fcEl.progress.style.width = '100%';
  fcEl.progressLabel.textContent = '0 / 0';
}

function restoreCardMarkup() {
  if (!document.getElementById('flashcard')) {
    fcEl.stage.innerHTML = fcCardHTML;
    fcEl.card = document.getElementById('flashcard');
    fcEl.number = document.getElementById('fc-number');
    fcEl.answer = document.getElementById('fc-answer');
    attachCardFlip();
  }
  fcEl.actions.style.visibility = 'visible';
}

function attachCardFlip() {
  fcEl.card.addEventListener('click', () => {
    fcState.flipped = !fcState.flipped;
    fcEl.card.classList.toggle('flipped', fcState.flipped);
    if (fcState.flipped) {
      fcEl.right.hidden = false;
      fcEl.wrong.hidden = false;
    }
  });
}

attachCardFlip();

function updateStats() {
  fcEl.statRight.textContent = fcState.right.size;
  fcEl.statWrong.textContent = fcState.wrong.size;
}

function currentCard() {
  return flashcards[fcState.order[fcState.index]];
}

function renderFlashcard() {
  if (fcState.order.length === 0) {
    renderEmptyRepaso();
    return;
  }
  restoreCardMarkup();

  const card = currentCard();
  fcEl.number.textContent = card.radicand;
  fcEl.answer.textContent = card.answer;

  fcState.flipped = false;
  fcEl.card.classList.remove('flipped');

  const total = fcState.order.length;
  const pct = ((fcState.index + 1) / total) * 100;
  fcEl.progress.style.width = `${pct}%`;
  fcEl.progressLabel.textContent = `${fcState.index + 1} / ${total}`;

  fcEl.right.hidden = true;
  fcEl.wrong.hidden = true;

  updateStats();
}

fcEl.next.addEventListener('click', () => {
  if (fcState.order.length === 0) return;
  fcState.index = (fcState.index + 1) % fcState.order.length;
  renderFlashcard();
});

fcEl.prev.addEventListener('click', () => {
  if (fcState.order.length === 0) return;
  fcState.index = (fcState.index - 1 + fcState.order.length) % fcState.order.length;
  renderFlashcard();
});

fcEl.right.addEventListener('click', () => {
  const id = fcState.order[fcState.index];
  fcState.right.add(id);
  fcState.wrong.delete(id);
  persisted.flashcards.right = [...fcState.right];
  persisted.flashcards.wrong = [...fcState.wrong];
  saveState();

  if (fcState.mode === 'repaso') {
    fcState.order = buildOrder();
    if (fcState.order.length === 0) { renderFlashcard(); return; }
    if (fcState.index >= fcState.order.length) fcState.index = 0;
    renderFlashcard();
  } else {
    advance();
  }
});

fcEl.wrong.addEventListener('click', () => {
  const id = fcState.order[fcState.index];
  fcState.wrong.add(id);
  fcState.right.delete(id);
  persisted.flashcards.right = [...fcState.right];
  persisted.flashcards.wrong = [...fcState.wrong];
  saveState();
  advance();
});

function advance() {
  if (fcState.index < fcState.order.length - 1) {
    fcState.index += 1;
  } else {
    fcState.index = 0;
    if (fcState.mode === 'aleatorio') fcState.order = shuffleArray(fcState.order);
  }
  renderFlashcard();
}

fcEl.reset.addEventListener('click', () => {
  fcState.right.clear();
  fcState.wrong.clear();
  persisted.flashcards.right = [];
  persisted.flashcards.wrong = [];
  saveState();
  fcState.order = buildOrder();
  fcState.index = 0;
  renderFlashcard();
});

fcEl.modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    fcEl.modeBtns.forEach(b => b.classList.toggle('active', b === btn));
    fcState.mode = btn.dataset.mode;
    fcState.order = buildOrder();
    fcState.index = 0;
    renderFlashcard();
  });
});

renderFlashcard();

// ========================================================
// MÓDULO 2 — Propiedades (con KaTeX + anti-errores)
// ========================================================
const properties = [
  {
    color: 'c1',
    icon: '×',
    title: 'Producto de bases iguales',
    formula: 'a^n \\cdot a^m = a^{n+m}',
    desc: 'Cuando multiplicás potencias con la misma base, sumás los exponentes.',
    antiError: {
      tex: 'a^n + a^m \\neq a^{n+m}',
      text: 'La SUMA no se comporta como el producto. Esto sólo vale cuando las multiplicás.',
    },
    inputs: [
      { key: 'a', label: 'a', value: 2, min: 1, max: 10 },
      { key: 'n', label: 'n', value: 3, min: 0, max: 8 },
      { key: 'm', label: 'm', value: 2, min: 0, max: 8 },
    ],
    compute: ({ a, n, m }) => {
      const result = Math.pow(a, n + m);
      return `${a}^{${n}} \\cdot ${a}^{${m}} = ${a}^{${n}+${m}} = \\htmlClass{katex-final}{${result}}`;
    },
  },
  {
    color: 'c2',
    icon: '÷',
    title: 'Cociente de bases iguales',
    formula: '\\frac{a^n}{a^m} = a^{n-m}',
    desc: 'Al dividir potencias de la misma base, restás los exponentes.',
    antiError: {
      tex: '\\frac{a^n}{a^m} \\neq a^{n/m}',
      text: 'Los exponentes se RESTAN, no se dividen entre sí.',
    },
    inputs: [
      { key: 'a', label: 'a', value: 3, min: 1, max: 10 },
      { key: 'n', label: 'n', value: 5, min: 0, max: 8 },
      { key: 'm', label: 'm', value: 2, min: 0, max: 8 },
    ],
    compute: ({ a, n, m }) => {
      const result = Math.pow(a, n - m);
      const finalStr = Number.isInteger(result) ? result : fmt(result);
      return `\\frac{${a}^{${n}}}{${a}^{${m}}} = ${a}^{${n}-${m}} = \\htmlClass{katex-final}{${finalStr}}`;
    },
  },
  {
    color: 'c3',
    icon: '^',
    title: 'Potencia de potencia',
    formula: '(a^n)^m = a^{n \\cdot m}',
    desc: 'Cuando una potencia se eleva a otro exponente, los multiplicás.',
    antiError: {
      tex: '(a^n)^m \\neq a^{n+m}',
      text: 'Acá se MULTIPLICAN los exponentes, no se suman. Ojo con confundirlo con el producto de bases iguales.',
    },
    inputs: [
      { key: 'a', label: 'a', value: 2, min: 1, max: 5 },
      { key: 'n', label: 'n', value: 3, min: 1, max: 5 },
      { key: 'm', label: 'm', value: 2, min: 1, max: 4 },
    ],
    compute: ({ a, n, m }) => {
      const result = Math.pow(a, n * m);
      return `(${a}^{${n}})^{${m}} = ${a}^{${n} \\cdot ${m}} = \\htmlClass{katex-final}{${result}}`;
    },
  },
  {
    color: 'c4',
    icon: '·',
    title: 'Potencia de un producto',
    formula: '(a \\cdot b)^n = a^n \\cdot b^n',
    desc: 'La potencia se reparte entre los factores del producto.',
    antiError: {
      tex: '(a + b)^n \\neq a^n + b^n',
      text: 'Sólo funciona con PRODUCTO, no con suma. Con suma hay que desarrollar el binomio (eso viene más adelante).',
    },
    inputs: [
      { key: 'a', label: 'a', value: 2, min: 1, max: 10 },
      { key: 'b', label: 'b', value: 3, min: 1, max: 10 },
      { key: 'n', label: 'n', value: 2, min: 0, max: 5 },
    ],
    compute: ({ a, b, n }) => {
      const result = Math.pow(a * b, n);
      return `(${a} \\cdot ${b})^{${n}} = ${a}^{${n}} \\cdot ${b}^{${n}} = \\htmlClass{katex-final}{${result}}`;
    },
  },
  {
    color: 'c5',
    icon: '√',
    title: 'Raíz de un producto',
    formula: '\\sqrt{a \\cdot b} = \\sqrt{a} \\cdot \\sqrt{b}',
    desc: 'La raíz del producto es el producto de las raíces.',
    antiError: {
      tex: '\\sqrt{a + b} \\neq \\sqrt{a} + \\sqrt{b}',
      text: 'MUY importante: sólo con producto, no con suma. Este error es clásico en pruebas.',
    },
    inputs: [
      { key: 'a', label: 'a', value: 4, min: 1, max: 100 },
      { key: 'b', label: 'b', value: 9, min: 1, max: 100 },
    ],
    compute: ({ a, b }) => {
      const result = Math.sqrt(a * b);
      const sa = fmt(Math.sqrt(a));
      const sb = fmt(Math.sqrt(b));
      const finalStr = fmt(result);
      return `\\sqrt{${a} \\cdot ${b}} = \\sqrt{${a}} \\cdot \\sqrt{${b}} = ${sa} \\cdot ${sb} = \\htmlClass{katex-final}{${finalStr}}`;
    },
  },
  {
    color: 'c6',
    icon: 'ⁿ√',
    title: 'Raíz de una raíz',
    formula: '\\sqrt[n]{\\sqrt[m]{a}} = \\sqrt[n \\cdot m]{a}',
    desc: 'Raíz de una raíz: los índices se multiplican.',
    antiError: {
      tex: '\\sqrt{\\sqrt{a}} \\neq \\sqrt{a}',
      text: 'Los índices se MULTIPLICAN. Raíz cuadrada de raíz cuadrada es raíz cuarta, no raíz cuadrada.',
    },
    inputs: [
      { key: 'a', label: 'a', value: 64, min: 1, max: 1000 },
      { key: 'n', label: 'n', value: 2, min: 2, max: 4 },
      { key: 'm', label: 'm', value: 3, min: 2, max: 4 },
    ],
    compute: ({ a, n, m }) => {
      const result = Math.pow(a, 1 / (n * m));
      const finalStr = fmt(result);
      return `\\sqrt[${n}]{\\sqrt[${m}]{${a}}} = \\sqrt[${n} \\cdot ${m}]{${a}} = \\sqrt[${n * m}]{${a}} = \\htmlClass{katex-final}{${finalStr}}`;
    },
  },
  {
    color: 'c1',
    icon: '^/',
    title: 'Raíz como potencia fraccionaria',
    formula: '\\sqrt[n]{a^m} = a^{\\frac{m}{n}}',
    desc: 'Toda raíz se puede escribir como una potencia con exponente fraccionario: el numerador es el exponente del radicando, el denominador es el índice.',
    antiError: {
      tex: '\\sqrt[n]{a^m} \\neq a^{\\frac{n}{m}}',
      text: 'El índice de la raíz va en el DENOMINADOR, no en el numerador. Esto se confunde todo el tiempo.',
    },
    inputs: [
      { key: 'a', label: 'a', value: 8, min: 1, max: 100 },
      { key: 'm', label: 'm', value: 2, min: 1, max: 6 },
      { key: 'n', label: 'n', value: 3, min: 2, max: 5 },
    ],
    compute: ({ a, m, n }) => {
      const result = Math.pow(a, m / n);
      const finalStr = fmt(result);
      return `\\sqrt[${n}]{${a}^{${m}}} = ${a}^{\\frac{${m}}{${n}}} = \\htmlClass{katex-final}{${finalStr}}`;
    },
  },
];

function fmt(num) {
  if (!Number.isFinite(num)) return '—';
  if (Number.isInteger(num)) return String(num);
  return Number(num.toFixed(4)).toString();
}

function renderProperties() {
  const grid = document.getElementById('props-grid');
  properties.forEach((prop, idx) => {
    const card = document.createElement('article');
    card.className = 'prop-card';
    card.innerHTML = `
      <div class="prop-head">
        <div class="prop-icon ${prop.color}">${prop.icon}</div>
        <h3 class="prop-title">${prop.title}</h3>
      </div>
      <div class="prop-formula">${tex(prop.formula)}</div>
      <p class="prop-desc">${prop.desc}</p>
      <div class="anti-error">
        <span class="anti-error-icon">⚠️</span>
        <div class="anti-error-body">
          <div class="anti-error-tex">${tex(prop.antiError.tex)}</div>
          <div class="anti-error-text">${prop.antiError.text}</div>
        </div>
      </div>
      <div class="prop-playground">
        <span class="prop-playground-label">Probá con tus números</span>
        <div class="prop-inputs">
          ${prop.inputs.map(inp => `
            <div class="prop-input-group">
              <label for="p${idx}-${inp.key}">${inp.label}</label>
              <input
                id="p${idx}-${inp.key}"
                class="prop-input"
                type="number"
                min="${inp.min}"
                max="${inp.max}"
                value="${inp.value}"
                data-key="${inp.key}" />
            </div>
          `).join('')}
        </div>
        <div class="prop-result" id="p${idx}-result"></div>
      </div>
    `;
    grid.appendChild(card);

    const inputs = card.querySelectorAll('.prop-input');
    const resultEl = card.querySelector(`#p${idx}-result`);

    const update = () => {
      const values = {};
      inputs.forEach(inp => {
        const v = Number(inp.value);
        values[inp.dataset.key] = Number.isFinite(v) ? v : 0;
      });
      try {
        const expr = prop.compute(values);
        resultEl.innerHTML = typeof katex !== 'undefined'
          ? katex.renderToString(expr, { displayMode: true, throwOnError: false, output: 'html', trust: true, strict: false })
          : expr;
      } catch {
        resultEl.textContent = '—';
      }
    };

    inputs.forEach(inp => inp.addEventListener('input', update));
    update();
  });
}

// KaTeX carga con defer después del HTML. Esperamos a que esté listo.
function whenKatexReady(cb) {
  if (typeof katex !== 'undefined') { cb(); return; }
  const check = setInterval(() => {
    if (typeof katex !== 'undefined') { clearInterval(check); cb(); }
  }, 30);
  setTimeout(() => clearInterval(check), 3000);
}

whenKatexReady(() => {
  renderProperties();
});

// ========================================================
// MÓDULO 3 — Quiz (con explicaciones + historial)
// ========================================================
const quizEl = {
  start: document.getElementById('quiz-start'),
  play: document.getElementById('quiz-play'),
  end: document.getElementById('quiz-end'),
  begin: document.getElementById('quiz-begin'),
  restart: document.getElementById('quiz-restart'),
  counter: document.getElementById('quiz-counter'),
  progress: document.getElementById('quiz-progress'),
  question: document.getElementById('quiz-question'),
  options: document.getElementById('quiz-options'),
  feedback: document.getElementById('quiz-feedback'),
  explanation: document.getElementById('quiz-explanation'),
  next: document.getElementById('quiz-next'),
  finalScore: document.getElementById('quiz-final-score'),
  endTitle: document.getElementById('quiz-end-title'),
  endMsg: document.getElementById('quiz-end-msg'),
  endEmoji: document.getElementById('quiz-end-emoji'),
  history: document.getElementById('quiz-history'),
};

const quizState = { questions: [], index: 0, score: 0, locked: false };

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper para preguntas tipo propiedad: mezcla correcto + 3 distractores
function propOptions(correctTex, wrongTexs) {
  return () => shuffleArray([
    { tex: correctTex, isCorrect: true },
    ...wrongTexs.map(t => ({ tex: t, isCorrect: false })),
  ]);
}

// Helper para preguntas numéricas: garantiza 4 opciones únicas (correct + 3 distractores)
function numericOptions(correct, rawDistractors) {
  const seen = new Set([correct]);
  const picked = [];
  for (const d of rawDistractors) {
    if (!seen.has(d) && Number.isFinite(d)) {
      seen.add(d);
      picked.push(d);
      if (picked.length === 3) break;
    }
  }
  // Fallback: offsets around correct si no alcanzan distractores únicos
  let off = 1;
  while (picked.length < 3 && off < 50) {
    for (const v of [correct + off, correct - off]) {
      if (picked.length < 3 && v > 0 && !seen.has(v)) {
        seen.add(v);
        picked.push(v);
      }
    }
    off++;
  }
  const all = [correct, ...picked];
  return () => shuffleArray(all).map(v => ({
    label: String(v),
    isCorrect: v === correct,
  }));
}

function buildQuestionPool() {
  const pool = [];

  // ===== NUMERIC: raíces cuadradas directas (memoria) =====
  for (let i = 1; i <= 20; i++) {
    const n2 = i * i;
    const distractors = new Set();
    while (distractors.size < 3) {
      const v = randomInt(Math.max(1, i - 5), i + 5);
      if (v !== i) distractors.add(v);
    }
    pool.push({
      type: 'numeric',
      tex: `\\sqrt{${n2}} = \\,?`,
      explanation: `Porque ${i} \\times ${i} = ${n2}, entonces \\sqrt{${n2}} = ${i}.`,
      generateOptions: numericOptions(i, [...distractors]),
    });
  }

  // ===== NUMERIC: cálculos simples con raíces de cuadrados perfectos =====
  const perfs = [4, 9, 16, 25, 36, 49, 64, 81, 100];
  for (let i = 0; i < 4; i++) {
    const a = perfs[randomInt(0, perfs.length - 1)];
    const b = perfs[randomInt(0, perfs.length - 1)];
    const sa = Math.sqrt(a);
    const sb = Math.sqrt(b);
    const result = sa * sb;
    pool.push({
      type: 'numeric',
      tex: `\\sqrt{${a}} \\cdot \\sqrt{${b}} = \\,?`,
      explanation: `\\sqrt{${a}} = ${sa} y \\sqrt{${b}} = ${sb}, entonces ${sa} \\cdot ${sb} = ${result}.`,
      generateOptions: numericOptions(result, [sa + sb, sa * 2, sb * 2, Math.max(1, result + 3)]),
    });
  }

  // ===== PROPERTY: producto de bases iguales =====
  for (let i = 0; i < 8; i++) {
    const a = randomInt(2, 7);
    const n = randomInt(2, 5);
    const m = randomInt(2, 5);
    pool.push({
      type: 'property',
      tex: `${a}^{${n}} \\cdot ${a}^{${m}} = \\,?`,
      explanation: `Bases iguales: se SUMAN los exponentes. ${a}^{${n}} \\cdot ${a}^{${m}} = ${a}^{${n}+${m}} = ${a}^{${n + m}}.`,
      generateOptions: propOptions(
        `${a}^{${n}+${m}}`,
        [
          `${a}^{${n} \\cdot ${m}}`,
          `${a}^{${n}-${m}}`,
          `${a * a}^{${n}+${m}}`,
        ]
      ),
    });
  }

  // ===== PROPERTY: cociente de bases iguales =====
  for (let i = 0; i < 8; i++) {
    const a = randomInt(2, 6);
    const n = randomInt(4, 7);
    const m = randomInt(1, n - 1);
    pool.push({
      type: 'property',
      tex: `\\dfrac{${a}^{${n}}}{${a}^{${m}}} = \\,?`,
      explanation: `Bases iguales en división: se RESTAN los exponentes. \\dfrac{${a}^{${n}}}{${a}^{${m}}} = ${a}^{${n}-${m}} = ${a}^{${n - m}}.`,
      generateOptions: propOptions(
        `${a}^{${n}-${m}}`,
        [
          `${a}^{${n}/${m}}`,
          `${a}^{${n}+${m}}`,
          `${a}^{${m}-${n}}`,
        ]
      ),
    });
  }

  // ===== PROPERTY: potencia de potencia =====
  for (let i = 0; i < 6; i++) {
    const a = randomInt(2, 6);
    const n = randomInt(2, 4);
    const m = randomInt(2, 4);
    pool.push({
      type: 'property',
      tex: `(${a}^{${n}})^{${m}} = \\,?`,
      explanation: `Potencia de potencia: los exponentes se MULTIPLICAN. (${a}^{${n}})^{${m}} = ${a}^{${n} \\cdot ${m}} = ${a}^{${n * m}}.`,
      generateOptions: propOptions(
        `${a}^{${n} \\cdot ${m}}`,
        [
          `${a}^{${n}+${m}}`,
          `${a}^{${n}^{${m}}}`,
          `${a}^{${n}} \\cdot ${m}`,
        ]
      ),
    });
  }

  // ===== PROPERTY: potencia de un producto =====
  for (let i = 0; i < 7; i++) {
    const a = randomInt(2, 6);
    const b = randomInt(2, 6);
    const n = randomInt(2, 4);
    pool.push({
      type: 'property',
      tex: `(${a} \\cdot ${b})^{${n}} = \\,?`,
      explanation: `La potencia se reparte entre los factores: (${a} \\cdot ${b})^{${n}} = ${a}^{${n}} \\cdot ${b}^{${n}}.`,
      generateOptions: propOptions(
        `${a}^{${n}} \\cdot ${b}^{${n}}`,
        [
          `${a}^{${n}} + ${b}^{${n}}`,
          `(${a}+${b})^{${n}}`,
          `${a} \\cdot ${b}^{${n}}`,
        ]
      ),
    });
  }

  // ===== PROPERTY: raíz de un producto =====
  for (let i = 0; i < 5; i++) {
    const a = perfs[randomInt(0, perfs.length - 1)];
    const b = perfs[randomInt(0, perfs.length - 1)];
    pool.push({
      type: 'property',
      tex: `\\sqrt{${a} \\cdot ${b}} = \\,?`,
      explanation: `La raíz del producto es el producto de las raíces: \\sqrt{${a} \\cdot ${b}} = \\sqrt{${a}} \\cdot \\sqrt{${b}}.`,
      generateOptions: propOptions(
        `\\sqrt{${a}} \\cdot \\sqrt{${b}}`,
        [
          `\\sqrt{${a}} + \\sqrt{${b}}`,
          `\\sqrt{${a} + ${b}}`,
          `${a} \\cdot ${b}`,
        ]
      ),
    });
  }

  // ===== PROPERTY: raíz de una raíz =====
  for (let i = 0; i < 5; i++) {
    const base = randomInt(2, 3);
    const n = 2;
    const m = randomInt(2, 3);
    const a = Math.pow(base, n * m);
    pool.push({
      type: 'property',
      tex: `\\sqrt[${n}]{\\sqrt[${m}]{${a}}} = \\,?`,
      explanation: `Raíz de raíz: los índices se MULTIPLICAN. \\sqrt[${n}]{\\sqrt[${m}]{${a}}} = \\sqrt[${n} \\cdot ${m}]{${a}} = \\sqrt[${n * m}]{${a}}.`,
      generateOptions: propOptions(
        `\\sqrt[${n * m}]{${a}}`,
        [
          `\\sqrt[${n + m}]{${a}}`,
          `\\sqrt{${a}}`,
          `\\sqrt[${n}]{${a}}`,
        ]
      ),
    });
  }

  // ===== PROPERTY: raíz como potencia fraccionaria =====
  for (let i = 0; i < 6; i++) {
    const base = randomInt(2, 3);
    const n = randomInt(2, 3);
    const m = randomInt(2, 3);
    const a = Math.pow(base, n);
    pool.push({
      type: 'property',
      tex: `\\sqrt[${n}]{${a}^{${m}}} = \\,?`,
      explanation: `Raíz como potencia fraccionaria: el exponente del radicando va en el NUMERADOR, el índice en el DENOMINADOR. \\sqrt[${n}]{${a}^{${m}}} = ${a}^{\\frac{${m}}{${n}}}.`,
      generateOptions: propOptions(
        `${a}^{\\frac{${m}}{${n}}}`,
        [
          `${a}^{\\frac{${n}}{${m}}}`,
          `${a}^{${m}+${n}}`,
          `${a}^{${m}-${n}}`,
        ]
      ),
    });
  }

  return pool;
}

function startQuiz() {
  const pool = buildQuestionPool();
  quizState.questions = shuffleArray(pool).slice(0, 10);
  quizState.index = 0;
  quizState.score = 0;
  quizState.locked = false;
  quizEl.start.hidden = true;
  quizEl.end.hidden = true;
  quizEl.play.hidden = false;
  renderQuestion();
}

function renderQuestion() {
  const q = quizState.questions[quizState.index];
  quizEl.counter.textContent = `Pregunta ${quizState.index + 1} / 10`;
  quizEl.progress.style.width = `${(quizState.index / 10) * 100}%`;
  quizEl.question.innerHTML = tex(q.tex);
  quizEl.feedback.textContent = '';
  quizEl.feedback.className = 'quiz-feedback';
  quizEl.explanation.hidden = true;
  quizEl.explanation.innerHTML = '';
  quizEl.next.hidden = true;
  quizEl.next.classList.remove('visible');
  quizState.locked = false;

  quizEl.options.innerHTML = '';
  const options = q.generateOptions();
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option' + (q.type === 'property' ? ' quiz-option-latex' : '');
    btn.dataset.correct = opt.isCorrect ? 'true' : 'false';

    if (q.type === 'property') {
      btn.innerHTML = tex(opt.tex, true);
    } else {
      btn.textContent = opt.label;
    }

    btn.addEventListener('click', () => handleAnswer(btn, opt.isCorrect, q));
    quizEl.options.appendChild(btn);
  });
}

function handleAnswer(btn, isRight, q) {
  if (quizState.locked) return;
  quizState.locked = true;

  const buttons = quizEl.options.querySelectorAll('.quiz-option');
  buttons.forEach(b => { b.disabled = true; });

  if (isRight) {
    btn.classList.add('correct');
    quizState.score += 1;
    quizEl.feedback.textContent = '¡Correcto! 🎉';
    quizEl.feedback.classList.add('positive');
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });
    quizEl.feedback.textContent = q.type === 'property'
      ? 'Uh, no es ese paso. Mirá el correcto:'
      : 'No era ese valor. Mirá la explicación:';
    quizEl.feedback.classList.add('negative');
  }

  quizEl.explanation.innerHTML = `
    <div class="quiz-explanation-label">${isRight ? '✨ Dato' : '📚 Explicación'}</div>
    <div class="quiz-explanation-body">${tex(q.explanation, true)}</div>
  `;
  quizEl.explanation.hidden = false;

  quizEl.next.hidden = false;
  quizEl.next.classList.add('visible');
  quizEl.next.textContent = quizState.index < 9 ? 'Siguiente →' : 'Ver resultado →';
}

quizEl.next.addEventListener('click', () => {
  if (quizState.index < 9) {
    quizState.index += 1;
    renderQuestion();
  } else {
    finishQuiz();
  }
});

function finishQuiz() {
  quizEl.play.hidden = true;
  quizEl.end.hidden = false;
  quizEl.finalScore.textContent = quizState.score;
  quizEl.progress.style.width = '100%';

  persisted.quiz.games += 1;
  persisted.quiz.totalCorrect += quizState.score;
  persisted.quiz.totalQuestions += 10;
  if (quizState.score > persisted.quiz.bestScore) persisted.quiz.bestScore = quizState.score;
  saveState();

  const score = quizState.score;
  let emoji, title, msg;
  if (score === 10) { emoji = '🏆'; title = '¡Perfecto!'; msg = 'Dominás el tema. Impecable.'; }
  else if (score >= 8) { emoji = '🌟'; title = '¡Excelente!'; msg = 'Casi perfecto. Un par de detalles nomás.'; }
  else if (score >= 6) { emoji = '💪'; title = '¡Muy bien!'; msg = 'Bien encaminada. Seguí practicando las flashcards.'; }
  else if (score >= 4) { emoji = '📚'; title = 'Buen intento'; msg = 'Repasá las propiedades y volvé a probar.'; }
  else { emoji = '🌱'; title = 'Recién arrancando'; msg = 'Tranqui, la práctica hace al maestro. Volvé a las flashcards.'; }

  quizEl.endEmoji.textContent = emoji;
  quizEl.endTitle.textContent = title;
  quizEl.endMsg.textContent = msg;

  renderHistory();

  if (score >= 7) launchConfetti();
}

function renderHistory() {
  const { games, bestScore, totalCorrect, totalQuestions } = persisted.quiz;
  if (games === 0) { quizEl.history.innerHTML = ''; return; }
  const avg = totalQuestions > 0 ? (totalCorrect / totalQuestions * 10).toFixed(1) : '0.0';
  quizEl.history.innerHTML = `
    <div class="quiz-history-item"><span class="quiz-history-value">${games}</span><span class="quiz-history-label">Partidas</span></div>
    <div class="quiz-history-item"><span class="quiz-history-value">${bestScore}</span><span class="quiz-history-label">Mejor</span></div>
    <div class="quiz-history-item"><span class="quiz-history-value">${avg}</span><span class="quiz-history-label">Promedio</span></div>
  `;
}

quizEl.begin.addEventListener('click', startQuiz);
quizEl.restart.addEventListener('click', startQuiz);

// ========================================================
// CONFETTI — canvas vanilla, sin dependencias
// ========================================================
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

function sizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

const confettiColors = ['#FF7B9C', '#C084FC', '#6EE7B7', '#FCD34D', '#7DD3FC', '#F9A8D4', '#8B5CF6'];

function launchConfetti() {
  const particles = [];
  const count = 160;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      size: 6 + Math.random() * 8,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  const start = performance.now();
  const duration = 4000;

  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = now - start;

    particles.forEach(p => {
      p.vy += 0.08;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    if (elapsed < duration) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(frame);
}
