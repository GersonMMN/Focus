// ==========================================
// FOCUS — app.js v5 (Integração com API)
// ==========================================

const API_BASE = 'http://localhost:8080/api';

// Estado global
let authToken      = localStorage.getItem('focus_token') || null;
let totalKm        = 0;
let activeDays     = 0;
let streakCurrent  = 0;
let streakBestVal  = 0;
let workoutsCache  = [];
let chart          = null;
let currentChartType   = 'line';
let currentWorkoutType = 'corrida';
let calYear, calMonth;

// ==========================================
// API HELPER
// ==========================================

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error('Sessão expirada.');
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : null;
}

function isoToPtBR(iso) {
  if (!iso) return new Date().toLocaleDateString('pt-BR');
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function parseDate(str) {
  const parts = str.split('/');
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

// ==========================================
// DICAS DO DIA (Gemini API)
// ==========================================

const API_KEY = '{{APIKEY}}';
const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const CATEGORIAS_DICAS = [
  'hidratação', 'recuperação muscular', 'treino',
  'nutrição esportiva', 'mentalidade atlética',
  'corrida', 'sono e descanso'
];

const gerarDicaAI = async () => {
  const categoria = CATEGORIAS_DICAS[Math.floor(Math.random() * CATEGORIAS_DICAS.length)];
  const prompt = `
    ## Especialidade
    Você é um especialista em performance esportiva e saúde para atletas amadores e profissionais.

    ## Tarefa
    Gere UMA dica prática e motivadora sobre o tema: "${categoria}"

    ## Regras
    - A dica deve ser objetiva, entre 1 e 2 frases
    - Máximo de 180 caracteres no total
    - Inclua um dado concreto quando possível (percentuais, tempo, números)
    - Tom direto e motivador, sem saudações ou despedidas

    ## Resposta
    Responda APENAS com o texto da dica, nada mais.
  `;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
};

const showTip = async () => {
  const el = document.getElementById('tipText');
  if (!el) return;
  el.textContent = 'Carregando dica...';
  try {
    const dica = await gerarDicaAI();
    if (dica) el.textContent = dica;
  } catch {
    el.textContent = 'Não foi possível carregar a dica. Tente novamente.';
  }
};

const nextTip = () => setTimeout(showTip, 200);

// ==========================================
// UTILS
// ==========================================

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ==========================================
// AUTH TABS
// ==========================================

function showLogin() {
  document.getElementById('loginForm').style.display    = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('tabLogin').classList.add('active');
  document.getElementById('tabRegister').classList.remove('active');
  clearError('loginError');
}

function showRegister() {
  document.getElementById('loginForm').style.display    = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('tabRegister').classList.add('active');
  document.getElementById('tabLogin').classList.remove('active');
  clearError('registerError');
}

// ==========================================
// CADASTRO
// ==========================================

async function register() {
  clearError('registerError');
  const name     = document.getElementById('registerName').value.trim();
  const email    = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!name)                { showError('registerError', 'Por favor, informe seu nome.'); return; }
  if (!isValidEmail(email)) { showError('registerError', 'Informe um email válido.'); return; }
  if (password.length < 6)  { showError('registerError', 'A senha deve ter pelo menos 6 caracteres.'); return; }

  try {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    showToast('Conta criada! Faça login.', 'success');
    showLogin();
  } catch (err) {
    showError('registerError', 'Erro ao criar conta. ' + (err.message || 'Tente novamente.'));
  }
}

// ==========================================
// LOGIN / LOGOUT
// ==========================================

async function login() {
  clearError('loginError');
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) { showError('loginError', 'Preencha email e senha.'); return; }

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authToken = data.token;
    localStorage.setItem('focus_token', data.token);
    localStorage.setItem('focus_user',  data.name  || '');
    localStorage.setItem('focus_email', data.email || '');

    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    await initApp();
  } catch (err) {
    const offline = err.message === 'Failed to fetch';
    showError('loginError', offline
      ? 'Servidor indisponível. Certifique-se que o backend está rodando.'
      : 'Email ou senha inválidos.');
  }
}

function logout() {
  authToken     = null;
  workoutsCache = [];
  totalKm = activeDays = streakCurrent = streakBestVal = 0;
  localStorage.removeItem('focus_token');

  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('app').style.display        = 'none';
  document.getElementById('loginEmail').value    = '';
  document.getElementById('loginPassword').value = '';
  clearError('loginError');
  showLogin();
}

// ==========================================
// INIT / LOAD DATA
// ==========================================

async function initApp() {
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();

  await loadAllData();

  updateStats();
  updateHeaderAvatar();
  initChart();
  loadKmHistory();
  showDashboardScreen();
  showTip();
  renderWaterGlasses();
  updateWaterDisplay();
  updateStreak();
  updateGoalsDisplay();
  renderCalendar();
  initGoalInputs();
  initWaterUnit();
}

async function loadAllData() {
  try {
    const [profile, workouts, goals] = await Promise.all([
      apiFetch('/profile'),
      apiFetch('/workouts'),
      apiFetch('/goals'),
    ]);
    applyProfile(profile);
    applyWorkouts(workouts);
    applyGoals(goals);
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    showToast('Erro ao conectar ao servidor.', 'error');
  }
}

function applyProfile(data) {
  if (!data) return;
  totalKm       = Number(data.totalKm)    || 0;
  activeDays    = Number(data.activeDays) || 0;
  streakCurrent = Number(data.streak)     || 0;
  streakBestVal = Number(data.streakBest) || 0;

  localStorage.setItem('focus_user',         data.name         || '');
  localStorage.setItem('focus_email',        data.email        || '');
  localStorage.setItem('focus_height',       data.height       || '');
  localStorage.setItem('focus_weight',       data.weight       || '');
  localStorage.setItem('focus_lastImc',      data.lastImc      || '');
  localStorage.setItem('focus_lastImcLabel', data.lastImcLabel || '');
}

function applyWorkouts(data) {
  if (!Array.isArray(data)) return;
  workoutsCache = data
    .map(w => ({
      id:       w.id,
      type:     w.type     || 'corrida',
      km:       w.km       || 0,
      duration: w.duration || 0,
      date:     isoToPtBR(w.date),
    }))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

function applyGoals(data) {
  if (!data) return;
  if (data.dailyGoal)  localStorage.setItem('focus_goalDaily',  data.dailyGoal);
  if (data.weeklyGoal) localStorage.setItem('focus_goalWeekly', data.weeklyGoal);
  if (data.annualGoal) localStorage.setItem('focus_goalAnnual', data.annualGoal);
}

// ==========================================
// AVATAR / NAV
// ==========================================

function updateHeaderAvatar() {
  const name = localStorage.getItem('focus_user') || 'F';
  const el   = document.getElementById('headerAvatar');
  if (el) el.textContent = name.charAt(0).toUpperCase();
}

function showDashboard(linkEl) {
  document.getElementById('dashboardScreen').style.display = 'block';
  document.getElementById('profileScreen').style.display  = 'none';
  updateNavActive(linkEl);
}

function showProfile(linkEl) {
  document.getElementById('dashboardScreen').style.display = 'none';
  document.getElementById('profileScreen').style.display  = 'block';
  loadProfileData();
  updateStats();
  renderAthleteLevel();
  renderMedals();
  updateNavActive(linkEl);
}

function showDashboardScreen() {
  document.getElementById('dashboardScreen').style.display = 'block';
  document.getElementById('profileScreen').style.display  = 'none';
}

function updateNavActive(activeLink) {
  if (!activeLink) return;
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  activeLink.classList.add('active');
}

// ==========================================
// WORKOUT TYPES
// ==========================================

const DISTANCE_TYPES = ['corrida', 'ciclismo', 'natação', 'caminhada'];

function onWorkoutTypeChange(select) {
  currentWorkoutType = select.value;
  const isDistance = DISTANCE_TYPES.includes(currentWorkoutType);
  document.getElementById('kmInputGroup').style.display       = isDistance ? 'flex' : 'none';
  document.getElementById('durationInputGroup').style.display = isDistance ? 'none' : 'flex';
}

// ==========================================
// GRÁFICO DE DESEMPENHO
// ==========================================

const TYPE_COLORS = {
  corrida:    { border: '#e8191a', bg: 'rgba(232,25,26,0.12)',  bar: 'rgba(232,25,26,0.75)' },
  ciclismo:   { border: '#f5a623', bg: 'rgba(245,166,35,0.12)', bar: 'rgba(245,166,35,0.75)' },
  natação:    { border: '#00aaff', bg: 'rgba(0,170,255,0.12)',  bar: 'rgba(0,170,255,0.75)' },
  musculação: { border: '#a855f7', bg: 'rgba(168,85,247,0.12)', bar: 'rgba(168,85,247,0.75)' },
  yoga:       { border: '#4cca6e', bg: 'rgba(76,202,110,0.12)', bar: 'rgba(76,202,110,0.75)' },
  caminhada:  { border: '#ff9060', bg: 'rgba(255,144,96,0.12)', bar: 'rgba(255,144,96,0.75)' },
  geral:      { border: '#e8191a', bg: 'rgba(232,25,26,0.12)',  bar: 'rgba(232,25,26,0.65)' },
};

function getChartFilter() {
  const sel = document.getElementById('chartTypeFilter');
  return sel ? sel.value : 'geral';
}

function getWeeklyData(filterType) {
  const history    = getKmHistory();
  const days       = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const now        = new Date();
  const weekData   = Array(7).fill(0);
  const weekLabels = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    weekLabels.push(days[d.getDay()]);
    const dateStr = d.toLocaleDateString('pt-BR');
    history.forEach(h => {
      const hType     = h.type || 'corrida';
      const matchType = filterType === 'geral' || hType === filterType;
      if (h.date === dateStr && matchType) {
        weekData[6 - i] += DISTANCE_TYPES.includes(hType) ? (h.km || 0) : (h.duration || 0);
      }
    });
  }
  return { labels: weekLabels, data: weekData };
}

function initChart() {
  const ctx = document.getElementById('performanceChart');
  if (!ctx) return;
  if (chart) { chart.destroy(); chart = null; }

  const filterType = getChartFilter();
  const colors     = TYPE_COLORS[filterType] || TYPE_COLORS['geral'];

  if (currentChartType === 'bar') {
    const weekly    = getWeeklyData(filterType);
    const barColors = weekly.data.map((v, i) =>
      i === 6 ? colors.bar : colors.bar.replace(/[\d.]+\)$/, '0.35)')
    );
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weekly.labels,
        datasets: [{ label: getLabelForFilter(filterType), data: weekly.data, backgroundColor: barColors, borderColor: 'transparent', borderRadius: 8, borderSkipped: false }]
      },
      options: chartOptions('bar', filterType)
    });
  } else {
    const history  = getKmHistory();
    const filtered = filterType === 'geral' ? history : history.filter(h => (h.type || 'corrida') === filterType);
    const labels   = filtered.map((_, i) => `T${i + 1}`);
    const data     = filtered.map(h => DISTANCE_TYPES.includes(h.type || 'corrida') ? (h.km || 0) : (h.duration || 0));
    const pointColors = filtered.map(h => (TYPE_COLORS[h.type || 'corrida'] || TYPE_COLORS.geral).border);

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: getLabelForFilter(filterType), data,
          borderColor: colors.border, backgroundColor: colors.bg,
          pointBackgroundColor: filterType === 'geral' ? pointColors : colors.border,
          pointBorderColor: '#fff', pointRadius: 4, pointHoverRadius: 7,
          tension: 0.45, fill: true, borderWidth: 2,
        }]
      },
      options: chartOptions('line', filterType)
    });
  }
}

function getLabelForFilter(filterType) {
  if (filterType === 'geral') return 'Todos os treinos';
  if (DISTANCE_TYPES.includes(filterType)) return `KM — ${filterType}`;
  return `Minutos — ${filterType}`;
}

function chartOptions(type, filterType) {
  const colors     = TYPE_COLORS[filterType] || TYPE_COLORS['geral'];
  const isDistance = filterType === 'geral' || DISTANCE_TYPES.includes(filterType);
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#aaa', font: { family: 'DM Sans', size: 12 } } },
      tooltip: {
        backgroundColor: '#1a1a1a', titleColor: '#fff', bodyColor: '#aaa',
        borderColor: colors.border, borderWidth: 1,
        callbacks: { label: (ctx) => isDistance ? ` ${ctx.parsed.y} km` : ` ${ctx.parsed.y} min` }
      }
    },
    scales: {
      x: { ticks: { color: '#666', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#666', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
    }
  };
}

function switchChart(type, btn) {
  currentChartType = type;
  document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  initChart();
}

// ==========================================
// KM HISTORY — usa workoutsCache
// ==========================================

function getKmHistory() {
  return workoutsCache;
}

function loadKmHistory() {
  const history = getKmHistory();
  const kmList  = document.getElementById('kmList');
  if (!kmList) return;
  kmList.innerHTML = '';
  if (history.length === 0) {
    kmList.innerHTML = '<p class="empty-state">Nenhum treino registrado ainda.</p>';
    return;
  }
  [...history].reverse().slice(0, 10).forEach(entry => {
    appendKmItem(entry.km, entry.date, entry.type || 'corrida', entry.duration, false);
  });
}

const WORKOUT_EMOJI = {
  corrida: '🏃', ciclismo: '🚴', natação: '🏊', musculação: '🏋️', yoga: '🧘', caminhada: '🚶'
};

function appendKmItem(km, date, type, duration, prepend = true) {
  const kmList = document.getElementById('kmList');
  if (!kmList) return;
  const empty = kmList.querySelector('.empty-state');
  if (empty) empty.remove();

  const emoji  = WORKOUT_EMOJI[type] || '🏃';
  const item   = document.createElement('div');
  item.classList.add('km-item');
  const detail = km ? `+${km} km` : `${duration} min`;
  item.innerHTML = `
    <span class="km-val">${emoji} ${detail}</span>
    <span class="km-type-badge">${type}</span>
    <span class="km-date">${date}</span>
  `;
  if (prepend) kmList.prepend(item);
  else kmList.appendChild(item);
}

// ==========================================
// ADICIONAR TREINO
// ==========================================

async function addKm() {
  const isDistance = DISTANCE_TYPES.includes(currentWorkoutType);
  let km = 0, duration = 0;

  if (isDistance) {
    km = parseFloat(document.getElementById('kmInput').value);
    if (!km || km <= 0 || isNaN(km)) { showToast('Digite um valor de KM válido.', 'error'); return; }
  } else {
    duration = parseInt(document.getElementById('durationInput').value);
    if (!duration || duration <= 0 || isNaN(duration)) { showToast('Digite a duração do treino.', 'error'); return; }
  }

  try {
    const workout = await apiFetch('/workouts', {
      method: 'POST',
      body: JSON.stringify({
        type:     currentWorkoutType,
        km:       isDistance ? km       : null,
        duration: isDistance ? null     : duration,
      }),
    });

    const entry = {
      id:       workout.id,
      type:     workout.type     || currentWorkoutType,
      km:       workout.km       || 0,
      duration: workout.duration || 0,
      date:     isoToPtBR(workout.date),
    };
    workoutsCache.push(entry);

    const profile = await apiFetch('/profile');
    applyProfile(profile);

    initChart();
    appendKmItem(entry.km, entry.date, entry.type, entry.duration);
    updateStats();
    updateGoalsDisplay();
    updateStreak();
    renderCalendar();
    checkMedals();

    if (isDistance) {
      document.getElementById('kmInput').value = '';
      showToast(`${km} km de ${currentWorkoutType} registrados! 💪`, 'success');
    } else {
      document.getElementById('durationInput').value = '';
      showToast(`${duration} min de ${currentWorkoutType} registrados! 💪`, 'success');
    }
  } catch (err) {
    showToast('Erro ao registrar treino.', 'error');
    console.error(err);
  }
}

// ==========================================
// STATS
// ==========================================

function updateStats() {
  setText('profileKm',    totalKm);
  setText('activeDays',   activeDays);
  setText('totalKmBadge', totalKm);
  setText('profileStreak', streakCurrent);
}

// ==========================================
// STREAK
// ==========================================

function getCurrentStreak() {
  return streakCurrent;
}

function updateStreak() {
  const streak = streakCurrent;
  const best   = streakBestVal;
  const last   = workoutsCache.length > 0 ? workoutsCache[workoutsCache.length - 1].date : '—';

  setText('streakNumber',     streak);
  setText('streakBest',       best);
  setText('streakLastActive', last);
  setText('streakBadgeTop',   streak);
  setText('headerStreakCount', streak);

  const messages = [
    streak === 0 ? 'Registre um treino para começar sua sequência!' : '',
    streak >= 1  ? `Boa! Você está há ${streak} dia(s) em sequência.` : '',
    streak >= 7  ? '🔥 Uma semana consecutiva! Incrível!' : '',
    streak >= 14 ? '⚡ Duas semanas! Você é imparável!' : '',
    streak >= 30 ? '🏆 30 dias! Atleta de elite!' : '',
  ].filter(Boolean).pop();

  setText('streakMessage', messages);
}

// ==========================================
// METAS DE DISTÂNCIA
// ==========================================

function initGoalInputs() {
  setValue('goalDailyInput',  localStorage.getItem('focus_goalDaily')  || '');
  setValue('goalWeeklyInput', localStorage.getItem('focus_goalWeekly') || '');
  setValue('goalAnnualInput', localStorage.getItem('focus_goalAnnual') || '');
}

async function saveGoals() {
  const daily  = document.getElementById('goalDailyInput')?.value  || '';
  const weekly = document.getElementById('goalWeeklyInput')?.value || '';
  const annual = document.getElementById('goalAnnualInput')?.value || '';

  try {
    await apiFetch('/goals', {
      method: 'PUT',
      body: JSON.stringify({
        dailyGoal:  Number(daily)  || 0,
        weeklyGoal: Number(weekly) || 0,
        annualGoal: Number(annual) || 0,
      }),
    });
    if (daily)  localStorage.setItem('focus_goalDaily',  daily);
    if (weekly) localStorage.setItem('focus_goalWeekly', weekly);
    if (annual) localStorage.setItem('focus_goalAnnual', annual);
    updateGoalsDisplay();
    showToast('Metas salvas!', 'success');
  } catch (err) {
    showToast('Erro ao salvar metas.', 'error');
    console.error(err);
  }
}

function getKmForPeriod(period) {
  const history = getKmHistory();
  const now     = new Date();
  return history.reduce((acc, h) => {
    if (!DISTANCE_TYPES.includes(h.type || 'corrida')) return acc;
    const d = parseDate(h.date);
    if (period === 'daily'  && h.date === now.toLocaleDateString('pt-BR')) return acc + (h.km || 0);
    if (period === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      if (d >= startOfWeek) return acc + (h.km || 0);
    }
    if (period === 'annual' && d.getFullYear() === now.getFullYear()) return acc + (h.km || 0);
    return acc;
  }, 0);
}

function setProgress(fillId, pctId, current, goal) {
  const pct   = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const fill  = document.getElementById(fillId);
  const pctEl = document.getElementById(pctId);
  if (fill) {
    fill.style.width      = pct + '%';
    fill.style.background = pct >= 100
      ? 'linear-gradient(90deg, #4cca6e, #36b85a)'
      : 'linear-gradient(90deg, var(--red-dark), var(--red))';
  }
  if (pctEl) pctEl.textContent = pct + '%';
}

function updateGoalsDisplay() {
  const daily  = Number(localStorage.getItem('focus_goalDaily')  || 0);
  const weekly = Number(localStorage.getItem('focus_goalWeekly') || 0);
  const annual = Number(localStorage.getItem('focus_goalAnnual') || 0);

  const dKm = parseFloat(getKmForPeriod('daily').toFixed(2));
  const wKm = parseFloat(getKmForPeriod('weekly').toFixed(2));
  const aKm = parseFloat(getKmForPeriod('annual').toFixed(2));

  setText('goalDailyKm',  dKm);
  setText('goalWeeklyKm', wKm);
  setText('goalAnnualKm', aKm);

  setProgress('progressDaily',  'pctDaily',  dKm, daily);
  setProgress('progressWeekly', 'pctWeekly', wKm, weekly);
  setProgress('progressAnnual', 'pctAnnual', aKm, annual);
}

// ==========================================
// HIDRATAÇÃO (localStorage + sincroniza API)
// ==========================================

function getWaterUnit() {
  return localStorage.getItem('focus_waterUnit') || 'copos';
}

function initWaterUnit() {
  setWaterUnit(getWaterUnit(), true);
}

function setWaterUnit(unit, silent = false) {
  localStorage.setItem('focus_waterUnit', unit);

  const btnCopos  = document.getElementById('btnUnitCopos');
  const btnLitros = document.getElementById('btnUnitLitros');
  const unitLabel = document.getElementById('waterUnitLabel');
  const countUnit = document.getElementById('waterCountUnit');
  const addBtn    = document.getElementById('btnAddWater');
  const remBtn    = document.getElementById('btnRemoveWater');
  const goalInput = document.getElementById('waterGoalInput');

  if (btnCopos)  btnCopos.classList.toggle('active',  unit === 'copos');
  if (btnLitros) btnLitros.classList.toggle('active', unit === 'litros');

  const isLitros = unit === 'litros';
  const unitTxt  = isLitros ? 'L' : 'copos';

  if (unitLabel) unitLabel.textContent = unitTxt;
  if (countUnit) countUnit.textContent = unitTxt;
  if (addBtn)    addBtn.textContent    = isLitros ? '+ 0,25 L' : '+ 1 copo';
  if (remBtn)    remBtn.textContent    = isLitros ? '– 0,25 L' : '– 1 copo';

  if (goalInput) {
    if (isLitros) {
      goalInput.placeholder = '2'; goalInput.step = '0.25'; goalInput.max = '10';
      const saved = localStorage.getItem('focus_waterGoal_litros');
      goalInput.value = saved || '';
    } else {
      goalInput.placeholder = '8'; goalInput.step = '1'; goalInput.max = '20';
      const saved = localStorage.getItem('focus_waterGoal_copos');
      goalInput.value = saved || '';
    }
  }

  renderWaterGlasses();
  updateWaterDisplay();
}

function getWaterGoal() {
  const unit = getWaterUnit();
  const inp  = document.getElementById('waterGoalInput');
  const key  = unit === 'litros' ? 'focus_waterGoal_litros' : 'focus_waterGoal_copos';
  if (inp && inp.value) { localStorage.setItem(key, inp.value); return parseFloat(inp.value); }
  const saved = localStorage.getItem(key);
  if (saved) return parseFloat(saved);
  return unit === 'litros' ? 2 : 8;
}

function getWaterStep() {
  return getWaterUnit() === 'litros' ? 0.25 : 1;
}

function getWaterCount() {
  const today    = new Date().toLocaleDateString('pt-BR');
  const unit     = getWaterUnit();
  const dateKey  = `focus_waterDate_${unit}`;
  const countKey = `focus_waterCount_${unit}`;
  const saved    = localStorage.getItem(dateKey);
  if (saved !== today) {
    localStorage.setItem(dateKey, today);
    localStorage.setItem(countKey, 0);
    return 0;
  }
  return Number(localStorage.getItem(countKey) || 0);
}

function setWaterCount(n) {
  const unit     = getWaterUnit();
  const countKey = `focus_waterCount_${unit}`;
  const step     = getWaterStep();
  const rounded  = parseFloat((Math.max(0, Math.round(n / step) * step)).toFixed(2));
  localStorage.setItem(countKey, rounded);
  renderWaterGlasses();
  updateWaterDisplay();
  if (authToken) {
    apiFetch('/hydration', { method: 'POST', body: JSON.stringify({ count: rounded, unit }) })
      .catch(err => console.error('Erro ao sincronizar hidratação:', err));
  }
  if (rounded >= getWaterGoal()) {
    localStorage.setItem('focus_hydroMedal', '1');
    checkMedals();
  }
}

function addWater()    { setWaterCount(getWaterCount() + getWaterStep()); }
function removeWater() { setWaterCount(getWaterCount() - getWaterStep()); }
function resetWater()  { setWaterCount(0); }

function renderWaterGlasses() {
  const container = document.getElementById('waterGlasses');
  if (!container) return;
  const unit  = getWaterUnit();
  const goal  = getWaterGoal();
  const count = getWaterCount();
  const step  = getWaterStep();

  container.innerHTML = '';
  const totalSteps = Math.min(Math.round(goal / step), unit === 'litros' ? 12 : 20);

  for (let i = 0; i < totalSteps; i++) {
    const thisVal = (i + 1) * step;
    const isFull  = count >= thisVal - 0.001;
    const g = document.createElement('div');
    g.className = 'glass ' + (isFull ? 'glass-full' : '');
    g.title     = unit === 'litros' ? `${thisVal.toFixed(2)} L` : `Copo ${i + 1}`;
    g.onclick   = () => setWaterCount(isFull ? i * step : thisVal);
    g.innerHTML = isFull ? '💧' : '🫙';
    container.appendChild(g);
  }
}

function updateWaterDisplay() {
  const unit  = getWaterUnit();
  const goal  = getWaterGoal();
  const count = getWaterCount();
  const pct   = goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0;

  setText('waterCount',       unit === 'litros' ? count.toFixed(2) : count);
  setText('waterGoalDisplay', unit === 'litros' ? goal.toFixed(2)  : goal);
  setText('hydrationDate',    new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));

  const fill = document.getElementById('progressWater');
  if (fill) fill.style.width = pct + '%';

  const inp = document.getElementById('waterGoalInput');
  if (inp && !inp.value) inp.value = unit === 'litros' ? goal.toFixed(2) : goal;
}

// ==========================================
// CALENDÁRIO HEATMAP
// ==========================================

function getActivityForDate(dateStr) {
  return getKmHistory().filter(h => h.date === dateStr);
}

function getHeatLevel(entries) {
  const totalKmDay = entries.reduce((a, h) => a + (h.km || 0), 0);
  const count = entries.length;
  if (count === 0) return 0;
  if (totalKmDay < 3 && count < 2) return 1;
  if (totalKmDay < 8 && count < 4) return 2;
  return 3;
}

function renderCalendar() {
  const grid  = document.getElementById('calendarGrid');
  const label = document.getElementById('calMonthLabel');
  if (!grid || !label) return;

  const monthNames  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  label.textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  grid.innerHTML    = '';

  ['D','S','T','Q','Q','S','S'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-header'; h.textContent = d;
    grid.appendChild(h);
  });

  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement('div');
    e.className = 'cal-day cal-empty';
    grid.appendChild(e);
  }

  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${String(day).padStart(2,'0')}/${String(calMonth+1).padStart(2,'0')}/${calYear}`;
    const entries = getActivityForDate(dateStr);
    const level   = getHeatLevel(entries);
    const cell    = document.createElement('div');
    cell.className  = `cal-day cal-day-${level}`;
    cell.textContent = day;
    if (day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear())
      cell.classList.add('cal-today');
    if (entries.length > 0)
      cell.title = `${entries.length} treino(s): ${[...new Set(entries.map(e => e.type || 'corrida'))].join(', ')}`;
    grid.appendChild(cell);
  }
}

function changeCalMonth(dir) {
  calMonth += dir;
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0;  calYear++; }
  renderCalendar();
}

// ==========================================
// NÍVEL DO ATLETA
// ==========================================

const LEVELS = [
  { name: 'Iniciante',  min: 0,    max: 50   },
  { name: 'Corredor',   min: 50,   max: 150  },
  { name: 'Atleta',     min: 150,  max: 350  },
  { name: 'Veterano',   min: 350,  max: 700  },
  { name: 'Elite',      min: 700,  max: 1500 },
  { name: 'Lenda',      min: 1500, max: Infinity },
];

function getLevel(km) {
  return LEVELS.find((l, i) => km >= l.min && (km < l.max || i === LEVELS.length - 1));
}

function renderAthleteLevel() {
  const level     = getLevel(totalKm);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];

  setText('athleteLevelName', level.name);

  const fillEl = document.getElementById('levelXpFill');
  const textEl = document.getElementById('levelXpText');
  if (nextLevel) {
    const pct = Math.min(100, Math.round(((totalKm - level.min) / (nextLevel.min - level.min)) * 100));
    if (fillEl) fillEl.style.width = pct + '%';
    if (textEl) textEl.textContent = `${(nextLevel.min - totalKm).toFixed(1)} km para "${nextLevel.name}"`;
  } else {
    if (fillEl) fillEl.style.width = '100%';
    if (textEl) textEl.textContent = 'Nível máximo atingido!';
  }
}

// ==========================================
// MEDALHAS
// ==========================================

const MEDALS = [
  { id: 'first',    icon: '🥇', title: 'Primeira Corrida',  desc: 'Registrou o primeiro treino',      check: (km, days)         => days >= 1 },
  { id: 'km10',     icon: '🏅', title: '10 km',             desc: 'Acumulou 10 km',                   check: (km)                => km >= 10 },
  { id: 'km50',     icon: '🥈', title: '50 km',             desc: 'Acumulou 50 km',                   check: (km)                => km >= 50 },
  { id: 'km100',    icon: '🏆', title: '100 km',            desc: 'Acumulou 100 km — Centurião!',      check: (km)                => km >= 100 },
  { id: 'km500',    icon: '💎', title: '500 km',            desc: 'Acumulou 500 km — Lendário!',       check: (km)                => km >= 500 },
  { id: 'streak7',  icon: '🔥', title: '7 Dias Seguidos',   desc: 'Manteve sequência de 7 dias',       check: (km, days, streak) => streak >= 7 },
  { id: 'streak30', icon: '⚡', title: 'Mês Perfeito',      desc: 'Manteve sequência de 30 dias',      check: (km, days, streak) => streak >= 30 },
  { id: 'days20',   icon: '📅', title: '20 Dias Ativos',    desc: 'Treinou em 20 dias diferentes',     check: (km, days)         => days >= 20 },
  { id: 'hydro',    icon: '💧', title: 'Hidratado',         desc: 'Completou meta de água por 1 dia',  check: ()                  => Boolean(localStorage.getItem('focus_hydroMedal')) },
];

function checkMedals() {
  const streak  = Math.max(streakCurrent, streakBestVal);
  const earned  = MEDALS.filter(m => m.check(totalKm, activeDays, streak));
  const prev    = JSON.parse(localStorage.getItem('focus_medals') || '[]');
  const newOnes = earned.filter(m => !prev.includes(m.id));
  if (newOnes.length) {
    newOnes.forEach(m => showToast(`🏅 Nova conquista: ${m.title}!`, 'success'));
    localStorage.setItem('focus_medals', JSON.stringify(earned.map(m => m.id)));
  }
}

function renderMedals() {
  const grid = document.getElementById('medalsGrid');
  if (!grid) return;
  const streak = Math.max(streakCurrent, streakBestVal);
  grid.innerHTML = MEDALS.map(m => {
    const has = m.check(totalKm, activeDays, streak);
    return `<div class="medal ${has ? 'medal-earned' : 'medal-locked'}" title="${m.desc}">
      <span class="medal-icon">${m.icon}</span>
      <span class="medal-title">${m.title}</span>
    </div>`;
  }).join('');
}

// ==========================================
// PERFIL DO USUÁRIO
// ==========================================

function loadProfileData() {
  const name   = localStorage.getItem('focus_user')   || '';
  const email  = localStorage.getItem('focus_email')  || '';
  const height = localStorage.getItem('focus_height') || '';
  const weight = localStorage.getItem('focus_weight') || '';

  const saudacao = document.getElementById('saudacao');
  if (saudacao) saudacao.innerHTML = `Olá, <span>${name || 'Atleta'}</span>`;

  setValue('profileNameInput',   name);
  setValue('profileEmailInput',  email);
  setValue('profileHeightInput', height);
  setValue('profileWeightInput', weight);

  const avatar = document.getElementById('profileAvatar');
  if (avatar) avatar.textContent = name ? name.charAt(0).toUpperCase() : 'F';

  const savedImc      = localStorage.getItem('focus_lastImc');
  const savedImcLabel = localStorage.getItem('focus_lastImcLabel');
  const profileImcSection = document.getElementById('profileImcSection');
  const profileImcResult  = document.getElementById('profileImcResult');
  if (savedImc && profileImcSection && profileImcResult) {
    profileImcSection.style.display = 'block';
    profileImcResult.textContent    = `${savedImc} — ${savedImcLabel}`;
  }

  renderAthleteLevel();
  renderMedals();
}

async function saveProfile() {
  const name   = document.getElementById('profileNameInput').value.trim();
  const email  = document.getElementById('profileEmailInput').value.trim();
  const height = document.getElementById('profileHeightInput').value;
  const weight = document.getElementById('profileWeightInput').value;

  if (!name) { showToast('Informe seu nome.', 'error'); return; }

  try {
    await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name, email,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
      }),
    });

    localStorage.setItem('focus_user',   name);
    localStorage.setItem('focus_email',  email);
    localStorage.setItem('focus_height', height);
    localStorage.setItem('focus_weight', weight);

    updateHeaderAvatar();
    loadProfileData();
    showToast('Perfil salvo com sucesso!', 'success');
  } catch (err) {
    showToast('Erro ao salvar perfil.', 'error');
    console.error(err);
  }
}

// ==========================================
// CALCULADORA DE IMC
// ==========================================

function calculateIMC() {
  const heightRaw = document.getElementById('height').value.replace(',', '.');
  const weightRaw = document.getElementById('weight').value.replace(',', '.');
  let height = parseFloat(heightRaw);
  let weight = parseFloat(weightRaw);

  if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
    showToast('Preencha altura e peso corretamente.', 'error'); return;
  }
  if (height > 3) height = height / 100;

  const imc      = weight / (height * height);
  const finalImc = imc.toFixed(1);
  const { classification, details, color } = getImcInfo(imc);

  localStorage.setItem('focus_lastImc',      finalImc);
  localStorage.setItem('focus_lastImcLabel', classification);

  const preview = document.getElementById('imcPreview');
  if (preview) {
    preview.style.display = 'block';
    document.getElementById('imcPreviewNumber').textContent = finalImc;
    document.getElementById('imcPreviewNumber').style.color = color;
    document.getElementById('imcPreviewLabel').textContent  = classification;
  }

  openImcModal(finalImc, classification, details, height, weight);
}

function getImcInfo(imc) {
  if (imc < 18.5)  return { classification: 'Abaixo do peso',    details: 'Seu IMC indica que você está abaixo do peso ideal. Considere consultar um nutricionista.', color: '#60aaff' };
  if (imc <= 24.9) return { classification: 'Peso ideal',         details: 'Parabéns! Seu IMC está dentro da faixa considerada saudável pela OMS.', color: '#4cca6e' };
  if (imc <= 29.9) return { classification: 'Sobrepeso',          details: 'Seu IMC indica sobrepeso. Exercícios regulares e alimentação equilibrada podem ajudar.', color: '#f5a623' };
  if (imc <= 34.9) return { classification: 'Obesidade Grau I',   details: 'Seu IMC indica obesidade grau I. Recomenda-se acompanhamento médico e nutricional.', color: '#e8191a' };
  if (imc <= 39.9) return { classification: 'Obesidade Grau II',  details: 'Seu IMC indica obesidade grau II. É importante buscar orientação médica especializada.', color: '#e8191a' };
  return             { classification: 'Obesidade Grau III', details: 'Seu IMC indica obesidade grau III (mórbida). Procure atendimento médico o quanto antes.', color: '#e8191a' };
}

function openImcModal(finalImc, classification, details, height, weight) {
  const modal     = document.getElementById('imcModal');
  const modalText = document.getElementById('modalImcText');
  if (!modal || !modalText) return;

  modalText.innerHTML = `
    <div class="imc-modal-result">
      <span class="imc-label">Seu resultado</span>
      <h1 class="imc-number">${finalImc}</h1>
      <div class="imc-classification">${classification}</div>
    </div>
    <div class="imc-section"><h3>Análise</h3><p>${details}</p></div>
    <div class="imc-section">
      <h3>Como o IMC é calculado</h3>
      <p>O Índice de Massa Corporal divide o peso pela altura elevada ao quadrado.</p>
      <div class="imc-formula">${weight} ÷ (${height.toFixed(2)} × ${height.toFixed(2)}) = ${finalImc}</div>
    </div>
    <div class="imc-warning">
      <h3>Importante</h3>
      <p>O IMC não considera massa muscular, composição corporal, genética ou estrutura óssea.</p>
      <p>Atletas podem apresentar IMC elevado mesmo estando saudáveis. Consulte sempre um profissional de saúde.</p>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeIMCModal() {
  document.getElementById('imcModal').classList.remove('active');
  document.body.style.overflow = '';
}

function closeIMCModalOutside(event) {
  if (event.target === document.getElementById('imcModal')) closeIMCModal();
}

// ==========================================
// INICIALIZAÇÃO DA PÁGINA
// ==========================================

window.addEventListener('load', async () => {
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeIMCModal(); });
  document.getElementById('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
  document.getElementById('loginEmail').addEventListener('keydown',    (e) => { if (e.key === 'Enter') login(); });

  const kmInp = document.getElementById('kmInput');
  if (kmInp) kmInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addKm(); });

  const waterGoalInp = document.getElementById('waterGoalInput');
  if (waterGoalInp) waterGoalInp.addEventListener('change', () => {
    const unit = getWaterUnit();
    const key  = unit === 'litros' ? 'focus_waterGoal_litros' : 'focus_waterGoal_copos';
    localStorage.setItem(key, waterGoalInp.value);
    renderWaterGlasses();
    updateWaterDisplay();
  });

  // Auto-login se token existir
  if (authToken) {
    try {
      await apiFetch('/profile');
      document.getElementById('authScreen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      await initApp();
      return;
    } catch {
      authToken = null;
      localStorage.removeItem('focus_token');
    }
  }

  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('app').style.display        = 'none';
});
