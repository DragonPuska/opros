(function () {
  const form = document.getElementById('surveyForm');
  const steps = Array.from(form.querySelectorAll('.step'));
  const progressBar = document.getElementById('progressBar');
  const resultPreview = document.getElementById('resultPreview');
  const showCollageBtn = document.getElementById('showCollageBtn');
  const collage = document.getElementById('collage');
  const goOutsideText = document.getElementById('goOutsideText');

  const STORAGE_KEY = 'minimal-survey-state-v2';
  const FIELD_ORDER = ['drink', 'shoes', 'dinner', 'decision'];
  let currentStep = 0;

  function updateProgress() {
    const maxStepIndex = steps.length - 2;
    const clamped = Math.min(currentStep, maxStepIndex);
    const pct = Math.round((clamped / Math.max(1, maxStepIndex)) * 100);
    progressBar.style.width = pct + '%';
  }

  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle('step--active', i === index));
    currentStep = index;
    updateProgress();
    persistState();
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) showStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 0) showStep(currentStep - 1);
  }

  function setError(fieldName, message) {
    const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (errorEl) errorEl.textContent = message || '';
  }

  function validateStep(index) {
    const stepEl = steps[index];
    if (!stepEl) return true;

    const stepToField = {
      1: 'drink',
      2: 'shoes',
      3: 'dinner',
      4: 'decision',
    };

    const fieldName = stepToField[index];
    if (!fieldName) return true;

    const node = form.elements[fieldName];
    if (node && node instanceof RadioNodeList) {
      if (!node.value) {
        setError(fieldName, 'Пожалуйста, выберите один вариант.');
        return false;
      }
      setError(fieldName, '');
      return true;
    }

    return true;
  }

  function collectData() {
    const data = {};
    FIELD_ORDER.forEach((name) => {
      const node = form.elements[name];
      if (node && node instanceof RadioNodeList) data[name] = node.value || '';
    });
    return data;
  }

  function persistState() {
    try {
      const state = {
        step: currentStep,
        values: collectData(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      const values = state.values || {};
      for (const [key, value] of Object.entries(values)) {
        const list = Array.from(form.querySelectorAll(`input[type="radio"][name="${key}"]`));
        list.forEach((el) => {
          el.checked = el.value === value;
        });
      }
      const safeStep = Math.min(Number(state.step || 0), steps.length - 2);
      showStep(safeStep);
    } catch (_) {}
  }

  function launchConfetti() {
    const root = document.createElement('div');
    root.className = 'confetti';
    const colors = ['#2b6cff', '#6effd9', '#ffd66e', '#ff8c6a', '#b78cff'];
    const pieces = 120;
    for (let i = 0; i < pieces; i++) {
      const p = document.createElement('div');
      p.className = 'confetti__p';
      const size = 6 + Math.random() * 8;
      p.style.width = `${size}px`;
      p.style.height = `${size * 1.5}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${-10 - Math.random() * 40}vh`;
      p.style.background = colors[i % colors.length];
      p.style.opacity = '1';
      p.style.transform = `translateY(${Math.random() * 10}vh) rotate(${Math.random() * 180}deg)`;
      p.style.transition = `transform ${1500 + Math.random() * 1500}ms cubic-bezier(.2,.6,.2,1), opacity 400ms ease`;
      root.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translateY(${110 + Math.random() * 30}vh) rotate(${360 + Math.random() * 360}deg)`;
      });
    }
    document.body.appendChild(root);
    setTimeout(() => root.remove(), 3500);
  }

  function showCollage() {
    if (showCollageBtn) showCollageBtn.style.display = 'none';
    if (collage) {
      collage.style.display = 'block';
      collage.style.opacity = '0';
      collage.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        collage.style.transition = 'opacity 600ms ease, transform 600ms ease';
        collage.style.opacity = '1';
        collage.style.transform = 'translateY(0)';
      });
    }
    // Просто показываем надпись без возможности клика
    if (goOutsideText) goOutsideText.style.display = 'block';
    launchConfetti();
  }

  // Events
  form.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-action');
    if (!action) return;
    if (action === 'next') nextStep();
    if (action === 'back') prevStep();
  });

  form.addEventListener('change', (e) => {
    const el = e.target;
    if (el && el instanceof HTMLInputElement && el.type === 'radio' && el.name) {
      setError(el.name, '');
    }
    persistState();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    const data = collectData();

    try {
      await new Promise((res) => setTimeout(res, 500));
      console.log('Отправленные ответы:', data);
      if (resultPreview) resultPreview.textContent = JSON.stringify(data, null, 2);
      showStep(steps.length - 1);
      persistState();
    } catch (err) {
      alert('Не удалось отправить. Попробуйте ещё раз.');
    }
  });

  document.addEventListener('keydown', (e) => {
    const isTextInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');
    if (e.key === 'Enter' && !isTextInput) {
      e.preventDefault();
      nextStep();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
      e.preventDefault();
      const lastInteractiveStep = steps.length - 2;
      if (currentStep === lastInteractiveStep) form.requestSubmit();
    }
  });

  if (showCollageBtn) {
    showCollageBtn.addEventListener('click', showCollage);
  }

  // Убрали обработчик клика для goOutsideText - теперь это просто текст

  // Init
  restoreState();
  updateProgress();
})();