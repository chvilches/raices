/* ========================================================
   Raíces · SPA educativa
   ======================================================== */

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
  seen: new Set(),
  right: new Set(),
  wrong: new Set(),
};

const fcEl = {
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
};

function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function currentCard() {
  return flashcards[fcState.order[fcState.index]];
}

function renderFlashcard() {
  const card = currentCard();
  fcEl.number.textContent = card.radicand;
  fcEl.answer.textContent = card.answer;

  fcState.flipped = false;
  fcEl.card.classList.remove('flipped');

  const total = flashcards.length;
  const pct = ((fcState.index + 1) / total) * 100;
  fcEl.progress.style.width = `${pct}%`;
  fcEl.progressLabel.textContent = `${fcState.index + 1} / ${total}`;

  fcEl.right.hidden = true;
  fcEl.wrong.hidden = true;

  fcEl.statRight.textContent = fcState.right.size;
  fcEl.statWrong.textContent = fcState.wrong.size;
}

fcEl.card.addEventListener('click', () => {
  fcState.flipped = !fcState.flipped;
  fcEl.card.classList.toggle('flipped', fcState.flipped);
  if (fcState.flipped) {
    fcEl.right.hidden = false;
    fcEl.wrong.hidden = false;
    fcState.seen.add(fcState.order[fcState.index]);
  }
});

fcEl.next.addEventListener('click', () => {
  fcState.index = (fcState.index + 1) % flashcards.length;
  renderFlashcard();
});

fcEl.prev.addEventListener('click', () => {
  fcState.index = (fcState.index - 1 + flashcards.length) % flashcards.length;
  renderFlashcard();
});

fcEl.right.addEventListener('click', () => {
  const id = fcState.order[fcState.index];
  fcState.right.add(id);
  fcState.wrong.delete(id);
  nextAfterMark();
});

fcEl.wrong.addEventListener('click', () => {
  const id = fcState.order[fcState.index];
  fcState.wrong.add(id);
  fcState.right.delete(id);
  nextAfterMark();
});

function nextAfterMark() {
  if (fcState.index < flashcards.length - 1) {
    fcState.index += 1;
  } else {
    fcState.index = 0;
    if (fcState.mode === 'aleatorio') {
      fcState.order = shuffleArray(fcState.order);
    }
  }
  renderFlashcard();
}

fcEl.reset.addEventListener('click', () => {
  fcState.index = 0;
  fcState.seen.clear();
  fcState.right.clear();
  fcState.wrong.clear();
  if (fcState.mode === 'aleatorio') {
    fcState.order = shuffleArray(flashcards.map((_, i) => i));
  } else {
    fcState.order = flashcards.map((_, i) => i);
  }
  renderFlashcard();
});

fcEl.modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    fcEl.modeBtns.forEach(b => b.classList.toggle('active', b === btn));
    fcState.mode = btn.dataset.mode;
    fcState.index = 0;
    fcState.order = fcState.mode === 'aleatorio'
      ? shuffleArray(flashcards.map((_, i) => i))
      : flashcards.map((_, i) => i);
    renderFlashcard();
  });
});

renderFlashcard();

// ========================================================
// MÓDULO 2 — Propiedades
// ========================================================
const properties = [
  {
    color: 'c1',
    icon: '×',
    title: 'Producto de bases iguales',
    formula: 'aⁿ · aᵐ = aⁿ⁺ᵐ',
    desc: 'Cuando multiplicás potencias con la misma base, sumás los exponentes.',
    inputs: [
      { key: 'a', label: 'a', value: 2, min: 1, max: 10 },
      { key: 'n', label: 'n', value: 3, min: 0, max: 8 },
      { key: 'm', label: 'm', value: 2, min: 0, max: 8 },
    ],
    compute: ({ a, n, m }) => {
      const left = Math.pow(a, n) * Math.pow(a, m);
      const right = Math.pow(a, n + m);
      return `${a}^${n} · ${a}^${m} = ${a}^${n + m} = <strong>${left}</strong> ${left === right ? '✓' : '✗'}`;
    },
  },
  {
    color: 'c2',
    icon: '÷',
    title: 'Cociente de bases iguales',
    formula: 'aⁿ / aᵐ = aⁿ⁻ᵐ',
    desc: 'Al dividir potencias de la misma base, restás los exponentes.',
    inputs: [
      { key: 'a', label: 'a', value: 3, min: 1, max: 10 },
      { key: 'n', label: 'n', value: 5, min: 0, max: 8 },
      { key: 'm', label: 'm', value: 2, min: 0, max: 8 },
    ],
    compute: ({ a, n, m }) => {
      const result = Math.pow(a, n - m);
      return `${a}^${n} / ${a}^${m} = ${a}^${n - m} = <strong>${result}</strong>`;
    },
  },
  {
    color: 'c3',
    icon: '^',
    title: 'Potencia de potencia',
    formula: '(aⁿ)ᵐ = aⁿ·ᵐ',
    desc: 'Cuando una potencia se eleva a otro exponente, los multiplicás.',
    inputs: [
      { key: 'a', label: 'a', value: 2, min: 1, max: 5 },
      { key: 'n', label: 'n', value: 3, min: 1, max: 5 },
      { key: 'm', label: 'm', value: 2, min: 1, max: 4 },
    ],
    compute: ({ a, n, m }) => {
      const result = Math.pow(a, n * m);
      return `(${a}^${n})^${m} = ${a}^${n * m} = <strong>${result}</strong>`;
    },
  },
  {
    color: 'c4',
    icon: '·',
    title: 'Potencia de un producto',
    formula: '(a · b)ⁿ = aⁿ · bⁿ',
    desc: 'La potencia se reparte entre los factores del producto.',
    inputs: [
      { key: 'a', label: 'a', value: 2, min: 1, max: 10 },
      { key: 'b', label: 'b', value: 3, min: 1, max: 10 },
      { key: 'n', label: 'n', value: 2, min: 0, max: 5 },
    ],
    compute: ({ a, b, n }) => {
      const left = Math.pow(a * b, n);
      const right = Math.pow(a, n) * Math.pow(b, n);
      return `(${a}·${b})^${n} = ${a}^${n} · ${b}^${n} = <strong>${left}</strong> ${left === right ? '✓' : '✗'}`;
    },
  },
  {
    color: 'c5',
    icon: '√',
    title: 'Raíz de un producto',
    formula: '√(a · b) = √a · √b',
    desc: 'La raíz del producto es el producto de las raíces.',
    inputs: [
      { key: 'a', label: 'a', value: 4, min: 1, max: 100 },
      { key: 'b', label: 'b', value: 9, min: 1, max: 100 },
    ],
    compute: ({ a, b }) => {
      const left = Math.sqrt(a * b);
      const sa = Math.sqrt(a);
      const sb = Math.sqrt(b);
      return `√(${a}·${b}) = √${a} · √${b} = ${fmt(sa)} · ${fmt(sb)} = <strong>${fmt(left)}</strong>`;
    },
  },
  {
    color: 'c6',
    icon: 'ⁿ√',
    title: 'Raíz de una raíz',
    formula: 'ⁿ√(ᵐ√a) = ⁿ·ᵐ√a',
    desc: 'Raíz de una raíz: los índices se multiplican.',
    inputs: [
      { key: 'a', label: 'a', value: 64, min: 1, max: 1000 },
      { key: 'n', label: 'n', value: 2, min: 2, max: 4 },
      { key: 'm', label: 'm', value: 3, min: 2, max: 4 },
    ],
    compute: ({ a, n, m }) => {
      const result = Math.pow(a, 1 / (n * m));
      return `${n}√(${m}√${a}) = ${n * m}√${a} = <strong>${fmt(result)}</strong>`;
    },
  },
];

function fmt(num) {
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
      <div class="prop-formula">${prop.formula}</div>
      <p class="prop-desc">${prop.desc}</p>
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
        resultEl.innerHTML = prop.compute(values);
      } catch {
        resultEl.textContent = '—';
      }
    };

    inputs.forEach(inp => inp.addEventListener('input', update));
    update();
  });
}

renderProperties();

// ========================================================
// MÓDULO 3 — Quiz
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
  finalScore: document.getElementById('quiz-final-score'),
  endTitle: document.getElementById('quiz-end-title'),
  endMsg: document.getElementById('quiz-end-msg'),
  endEmoji: document.getElementById('quiz-end-emoji'),
};

const quizState = {
  questions: [],
  index: 0,
  score: 0,
  locked: false,
};

function buildQuestionPool() {
  const pool = [];

  // Raíces cuadradas directas
  for (let i = 1; i <= 20; i++) {
    pool.push({
      text: `√${i * i} = ?`,
      correct: i,
      generateOptions: () => {
        const opts = new Set([i]);
        while (opts.size < 4) opts.add(randomInt(Math.max(1, i - 5), i + 5));
        return shuffleArray([...opts]);
      },
    });
  }

  // Producto de bases iguales
  for (let i = 0; i < 6; i++) {
    const a = randomInt(2, 5);
    const n = randomInt(1, 4);
    const m = randomInt(1, 4);
    const correct = Math.pow(a, n + m);
    pool.push({
      text: `${a}^${n} · ${a}^${m} = ?`,
      correct,
      generateOptions: () => {
        const opts = new Set([correct]);
        opts.add(Math.pow(a, n * m));
        opts.add(Math.pow(a, n) + Math.pow(a, m));
        while (opts.size < 4) opts.add(Math.pow(a, randomInt(1, 7)));
        return shuffleArray([...opts].slice(0, 4));
      },
    });
  }

  // Raíz de un producto (con perfectos)
  const perfs = [4, 9, 16, 25, 36, 49, 64, 81, 100];
  for (let i = 0; i < 4; i++) {
    const a = perfs[randomInt(0, perfs.length - 1)];
    const b = perfs[randomInt(0, perfs.length - 1)];
    const correct = Math.sqrt(a * b);
    pool.push({
      text: `√(${a} · ${b}) = ?`,
      correct,
      generateOptions: () => {
        const opts = new Set([correct]);
        opts.add(Math.sqrt(a) + Math.sqrt(b));
        opts.add(Math.sqrt(a) * 2);
        while (opts.size < 4) opts.add(randomInt(correct - 10, correct + 10));
        return shuffleArray([...opts].filter(x => x > 0).slice(0, 4));
      },
    });
  }

  // Potencia de potencia
  for (let i = 0; i < 4; i++) {
    const a = randomInt(2, 4);
    const n = randomInt(2, 3);
    const m = randomInt(2, 3);
    const correct = Math.pow(a, n * m);
    pool.push({
      text: `(${a}^${n})^${m} = ?`,
      correct,
      generateOptions: () => {
        const opts = new Set([correct]);
        opts.add(Math.pow(a, n + m));
        opts.add(Math.pow(a, n) * m);
        while (opts.size < 4) opts.add(Math.pow(a, randomInt(2, 6)));
        return shuffleArray([...opts].slice(0, 4));
      },
    });
  }

  return pool;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  quizEl.progress.style.width = `${((quizState.index) / 10) * 100}%`;
  quizEl.question.textContent = q.text;
  quizEl.feedback.textContent = '';
  quizEl.feedback.className = 'quiz-feedback';
  quizState.locked = false;

  quizEl.options.innerHTML = '';
  const options = q.generateOptions();
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(btn, opt, q.correct));
    quizEl.options.appendChild(btn);
  });
}

function handleAnswer(btn, value, correct) {
  if (quizState.locked) return;
  quizState.locked = true;

  const buttons = quizEl.options.querySelectorAll('.quiz-option');
  buttons.forEach(b => { b.disabled = true; });

  if (value === correct) {
    btn.classList.add('correct');
    quizState.score += 1;
    quizEl.feedback.textContent = '¡Correcto! 🎉';
    quizEl.feedback.classList.add('positive');
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => {
      if (Number(b.textContent) === correct) b.classList.add('correct');
    });
    quizEl.feedback.textContent = `La respuesta era ${correct}`;
    quizEl.feedback.classList.add('negative');
  }

  setTimeout(() => {
    if (quizState.index < 9) {
      quizState.index += 1;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }, 1400);
}

function finishQuiz() {
  quizEl.play.hidden = true;
  quizEl.end.hidden = false;
  quizEl.finalScore.textContent = quizState.score;
  quizEl.progress.style.width = '100%';

  const score = quizState.score;
  let emoji, title, msg;
  if (score === 10) {
    emoji = '🏆'; title = '¡Perfecto!'; msg = 'Dominás el tema. Impecable.';
  } else if (score >= 8) {
    emoji = '🌟'; title = '¡Excelente!'; msg = 'Casi perfecto. Un par de detalles nomás.';
  } else if (score >= 6) {
    emoji = '💪'; title = '¡Muy bien!'; msg = 'Bien encaminada. Seguí practicando las flashcards.';
  } else if (score >= 4) {
    emoji = '📚'; title = 'Buen intento'; msg = 'Repasá las propiedades y volvé a probar.';
  } else {
    emoji = '🌱'; title = 'Recién arrancando'; msg = 'Tranqui, la práctica hace al maestro. Volvé a las flashcards.';
  }

  quizEl.endEmoji.textContent = emoji;
  quizEl.endTitle.textContent = title;
  quizEl.endMsg.textContent = msg;

  if (score >= 7) launchConfetti();
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

  let start = performance.now();
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

    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(frame);
}
