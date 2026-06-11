// ==========================================
// FOCUS — app.js v5 (Backend integrado)
// ==========================================

const API_BASE = 'http://localhost:8080';

// --- Estado global ---
let totalKm    = 0;
let activeDays = 0;
let streak     = 0;
let streakBest = 0;
let kmHistory  = [];   // workouts da API (oldest-first)
let waterCount = 0;    // hidratação do dia sincronizada com API
let goalsData  = null; // último GoalResponse da API
let chart = null;
let currentChartType = 'line';
let currentWorkoutType = 'corrida';
let calYear, calMonth;

// ==========================================
// CAMADA DE API
// ==========================================

function getToken() {
  return localStorage.getItem('focus_token');
}

async function apiFetch(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

// ==========================================
// DICAS DO DIA
// ==========================================

const showTip = async () => {
  const el = document.getElementById('tipText');
  if (!el) return;
  el.textContent = 'Carregando dica...';
  try {
    const data = await apiFetch('/api/ai/tip');
    el.textContent = data?.tip || 'Nenhuma dica disponível no momento.';
  } catch (err) {
    el.textContent = 'Não foi possível carregar a dica.';
    console.error('Erro ao gerar dica:', err);
  }
};

const nextTip = () => {
  setTimeout(async () => { await showTip(); }, 200);
};

// ==========================================
// UTILS: TOAST
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

// ==========================================
// AUTH TABS
// ==========================================

function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('tabLogin').classList.add('active');
  document.getElementById('tabRegister').classList.remove('active');
  clearError('loginError');
}

function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
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
    await apiFetch('/api/auth/register', 'POST', { name, email, password });
    showToast('Conta criada! Faça login.', 'success');
    showLogin();
  } catch (e) {
    showError('registerError', e.message || 'Erro ao criar conta.');
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
    const data = await apiFetch('/api/auth/login', 'POST', { email, password });
    localStorage.setItem('focus_token', data.token);
    localStorage.setItem('focus_user',  data.name);
    localStorage.setItem('focus_email', data.email);

    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    await initApp();
  } catch (e) {
    showError('loginError', e.message || 'Email ou senha inválidos.');
  }
}

function logout() {
  localStorage.removeItem('focus_token');
  localStorage.removeItem('focus_user');
  localStorage.removeItem('focus_email');
  kmHistory = [];
  goalsData = null;
  totalKm = activeDays = streak = streakBest = waterCount = 0;

  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  clearError('loginError');
  showLogin();
}

// ==========================================
// INIT
// ==========================================

async function initApp() {
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();

  updateHeaderAvatar();
  showDashboardScreen();
  showTip();
  initWaterUnit();

  await loadAllData();
}

async function loadAllData() {
  try {
    const [profile, workouts, goals] = await Promise.all([
      apiFetch('/api/profile'),
      apiFetch('/api/workouts'),
      apiFetch('/api/goals'),
    ]);

    applyProfile(profile);
    applyWorkouts(workouts);
    applyGoals(goals);

    const unit = getWaterUnit();
    const hydration = await apiFetch(`/api/hydration?unit=${encodeURIComponent(unit)}`);
    waterCount = hydration.count || 0;

    updateStats();
    loadKmHistoryUI();
    initChart();
    updateStreak();
    updateGoalsDisplay();
    renderCalendar();
    renderWaterGlasses();
    updateWaterDisplay();
    initGoalInputsFromData();

  } catch (e) {
    showToast('Erro ao carregar dados. Verifique se o servidor está rodando.', 'error');
    console.error(e);
  }
}

function applyProfile(p) {
  totalKm    = p.totalKm    || 0;
  activeDays = p.activeDays || 0;
  streak     = p.streak     || 0;
  streakBest = p.streakBest || 0;
  if (p.name)           localStorage.setItem('focus_user',             p.name);
  if (p.email)          localStorage.setItem('focus_email',            p.email);
  if (p.height != null) localStorage.setItem('focus_height',           p.height);
  if (p.weight != null) localStorage.setItem('focus_weight',           p.weight);
  if (p.lastImc)        localStorage.setItem('focus_lastImc',          p.lastImc);
  if (p.lastImcLabel)   localStorage.setItem('focus_lastImcLabel',     p.lastImcLabel);
  if (p.waterUnit)      localStorage.setItem('focus_waterUnit',        p.waterUnit);
  if (p.waterGoal != null) {
    const key = p.waterUnit === 'litros' ? 'focus_waterGoal_litros' : 'focus_waterGoal_copos';
    localStorage.setItem(key, p.waterGoal);
  }
}

function applyWorkouts(workouts) {
  // API retorna newest-first; inverter para oldest-first (ordem cronológica para o gráfico)
  kmHistory = workouts.slice().reverse();
}

function applyGoals(goals) {
  goalsData = goals;
}

// ==========================================
// AVATAR
// ==========================================

function updateHeaderAvatar() {
  const name = localStorage.getItem('focus_user') || 'F';
  const el = document.getElementById('headerAvatar');
  if (el) el.textContent = name.charAt(0).toUpperCase();
}

// ==========================================
// NAV
// ==========================================

async function showDashboard(linkEl) {
  document.getElementById('dashboardScreen').style.display = 'block';
  document.getElementById('profileScreen').style.display = 'none';
  updateNavActive(linkEl);

  try {
    const [workouts, goals] = await Promise.all([
      apiFetch('/api/workouts'),
      apiFetch('/api/goals'),
    ]);
    applyWorkouts(workouts);
    applyGoals(goals);

    const unit = getWaterUnit();
    const hydration = await apiFetch(`/api/hydration?unit=${encodeURIComponent(unit)}`);
    waterCount = hydration.count || 0;

    loadKmHistoryUI();
    initChart();
    updateStats();
    updateGoalsDisplay();
    updateStreak();
    renderCalendar();
    renderWaterGlasses();
    updateWaterDisplay();
  } catch (e) {
    console.error('Erro ao atualizar dashboard:', e);
  }
}

async function showProfile(linkEl) {
  document.getElementById('dashboardScreen').style.display = 'none';
  document.getElementById('profileScreen').style.display = 'block';
  updateNavActive(linkEl);

  try {
    const profile = await apiFetch('/api/profile');
    applyProfile(profile);
  } catch (e) {
    console.error('Erro ao carregar perfil:', e);
  }

  loadProfileData();
  updateStats();
  renderAthleteLevel();
  await renderMedals();
}

function showDashboardScreen() {
  document.getElementById('dashboardScreen').style.display = 'block';
  document.getElementById('profileScreen').style.display = 'none';
}

function updateNavActive(activeLink) {
  if (!activeLink) return;
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  activeLink.classList.add('active');
}

// ==========================================
// WORKOUT TYPES — DROPDOWN
// ==========================================

const DISTANCE_TYPES = ['corrida', 'ciclismo', 'natação', 'caminhada'];

function onWorkoutTypeChange(select) {
  currentWorkoutType = select.value;
  const isDistance = DISTANCE_TYPES.includes(currentWorkoutType);
  document.getElementById('kmInputGroup').style.display      = isDistance ? 'flex' : 'none';
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
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const now = new Date();
  const weekData   = Array(7).fill(0);
  const weekLabels = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    weekLabels.push(days[d.getDay()]);
    const dateStr = d.toLocaleDateString('pt-BR');
    kmHistory.forEach(h => {
      const hType = h.type || 'corrida';
      const matchType = filterType === 'geral' ? true : hType === filterType;
      if (h.date === dateStr && matchType) {
        if (DISTANCE_TYPES.includes(hType)) {
          weekData[6 - i] += h.km || 0;
        } else {
          weekData[6 - i] += h.duration || 0;
        }
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
  const colors = TYPE_COLORS[filterType] || TYPE_COLORS['geral'];

  if (currentChartType === 'bar') {
    const weekly = getWeeklyData(filterType);
    const barColors = weekly.data.map((v, i) =>
      i === 6 ? colors.bar : colors.bar.replace(/[\d.]+\)$/, '0.35)')
    );
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weekly.labels,
        datasets: [{
          label: getLabelForFilter(filterType),
          data: weekly.data,
          backgroundColor: barColors,
          borderColor: 'transparent',
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: chartOptions('bar', filterType)
    });
  } else {
    let filtered = filterType === 'geral'
      ? kmHistory
      : kmHistory.filter(h => (h.type || 'corrida') === filterType);

    const labels = filtered.map((_, i) => `T${i + 1}`);
    const data   = filtered.map(h =>
      DISTANCE_TYPES.includes(h.type || 'corrida') ? (h.km || 0) : (h.duration || 0)
    );
    const pointColors = filtered.map(h => {
      const c = TYPE_COLORS[h.type || 'corrida'];
      return c ? c.border : '#e8191a';
    });

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: getLabelForFilter(filterType),
          data,
          borderColor: colors.border,
          backgroundColor: colors.bg,
          pointBackgroundColor: filterType === 'geral' ? pointColors : colors.border,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 7,
          tension: 0.45,
          fill: true,
          borderWidth: 2,
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
  const colors = TYPE_COLORS[filterType] || TYPE_COLORS['geral'];
  const isDistance = filterType === 'geral' || DISTANCE_TYPES.includes(filterType);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#aaa', font: { family: 'DM Sans', size: 12 } } },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#fff',
        bodyColor: '#aaa',
        borderColor: colors.border,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => isDistance ? ` ${ctx.parsed.y} km` : ` ${ctx.parsed.y} min`
        }
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
// KM HISTORY
// ==========================================

function getKmHistory() {
  return kmHistory;
}

function loadKmHistoryUI() {
  const kmList = document.getElementById('kmList');
  if (!kmList) return;
  kmList.innerHTML = '';
  if (kmHistory.length === 0) {
    kmList.innerHTML = '<p class="empty-state">Nenhum treino registrado ainda.</p>';
    return;
  }
  // kmHistory é oldest-first; inverter para mostrar os mais recentes primeiro
  [...kmHistory].reverse().slice(0, 10).forEach(entry => {
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
    const res = await apiFetch('/api/workouts', 'POST', {
      type:     currentWorkoutType,
      km:       isDistance ? km : null,
      duration: isDistance ? 0  : duration,
    });

    if (res.newMedals && res.newMedals.length > 0) {
      res.newMedals.forEach(m => showToast(`🏅 Nova conquista: ${m}!`, 'success'));
    }

    // Atualiza profile + workouts + goals após o treino
    const [profile, workouts, goals] = await Promise.all([
      apiFetch('/api/profile'),
      apiFetch('/api/workouts'),
      apiFetch('/api/goals'),
    ]);
    applyProfile(profile);
    applyWorkouts(workouts);
    applyGoals(goals);

    loadKmHistoryUI();
    initChart();
    updateStats();
    updateGoalsDisplay();
    updateStreak();
    renderCalendar();

    if (isDistance) {
      document.getElementById('kmInput').value = '';
      showToast(`${km} km de ${currentWorkoutType} registrados! 💪`, 'success');
    } else {
      document.getElementById('durationInput').value = '';
      showToast(`${duration} min de ${currentWorkoutType} registrados! 💪`, 'success');
    }

  } catch (e) {
    showToast('Erro ao registrar treino: ' + e.message, 'error');
  }
}

// ==========================================
// STATS
// ==========================================

function updateStats() {
  const km      = document.getElementById('profileKm');
  const days    = document.getElementById('activeDays');
  const badge   = document.getElementById('totalKmBadge');
  const streakEl = document.getElementById('profileStreak');

  if (km)       km.textContent      = totalKm;
  if (days)     days.textContent    = activeDays;
  if (badge)    badge.textContent   = totalKm;
  if (streakEl) streakEl.textContent = streak;
}

// ==========================================
// STREAK
// ==========================================

function updateStreak() {
  const lastDate = kmHistory.length > 0
    ? kmHistory[kmHistory.length - 1].date
    : '—';

  const sNum   = document.getElementById('streakNumber');
  const sBest  = document.getElementById('streakBest');
  const sLast  = document.getElementById('streakLastActive');
  const sBadge = document.getElementById('streakBadgeTop');
  const sMsg   = document.getElementById('streakMessage');
  const sHead  = document.getElementById('headerStreakCount');

  if (sNum)   sNum.textContent   = streak;
  if (sBest)  sBest.textContent  = streakBest;
  if (sLast)  sLast.textContent  = lastDate;
  if (sBadge) sBadge.textContent = streak;
  if (sHead)  sHead.textContent  = streak;

  const messages = [
    streak === 0  ? 'Registre um treino para começar sua sequência!' : '',
    streak >= 1   ? `Boa! Você está há ${streak} dia(s) em sequência.` : '',
    streak >= 7   ? '🔥 Uma semana consecutiva! Incrível!' : '',
    streak >= 14  ? '⚡ Duas semanas! Você é imparável!' : '',
    streak >= 30  ? '🏆 30 dias! Atleta de elite!' : '',
  ].filter(Boolean).pop();

  if (sMsg) sMsg.textContent = messages;
}

// ==========================================
// METAS DE DISTÂNCIA
// ==========================================

function initGoalInputsFromData() {
  if (!goalsData) return;
  const d = document.getElementById('goalDailyInput');
  const w = document.getElementById('goalWeeklyInput');
  const a = document.getElementById('goalAnnualInput');
  if (d && goalsData.dailyGoal  != null) d.value = goalsData.dailyGoal;
  if (w && goalsData.weeklyGoal != null) w.value = goalsData.weeklyGoal;
  if (a && goalsData.annualGoal != null) a.value = goalsData.annualGoal;
}

async function saveGoals() {
  const daily  = parseFloat(document.getElementById('goalDailyInput')?.value)  || null;
  const weekly = parseFloat(document.getElementById('goalWeeklyInput')?.value) || null;
  const annual = parseFloat(document.getElementById('goalAnnualInput')?.value) || null;

  try {
    const goals = await apiFetch('/api/goals', 'PUT', {
      dailyGoal:  daily,
      weeklyGoal: weekly,
      annualGoal: annual,
    });
    applyGoals(goals);
    updateGoalsDisplay();
    showToast('Metas salvas!', 'success');
  } catch (e) {
    showToast('Erro ao salvar metas: ' + e.message, 'error');
  }
}

function updateGoalsDisplay() {
  if (!goalsData) return;

  const dKm = parseFloat((goalsData.dailyKm  || 0).toFixed(2));
  const wKm = parseFloat((goalsData.weeklyKm || 0).toFixed(2));
  const aKm = parseFloat((goalsData.annualKm || 0).toFixed(2));

  setText('goalDailyKm',  dKm);
  setText('goalWeeklyKm', wKm);
  setText('goalAnnualKm', aKm);

  setProgress('progressDaily',  'pctDaily',  dKm, goalsData.dailyGoal  || 0);
  setProgress('progressWeekly', 'pctWeekly', wKm, goalsData.weeklyGoal || 0);
  setProgress('progressAnnual', 'pctAnnual', aKm, goalsData.annualGoal || 0);
}

function setProgress(fillId, pctId, current, goal) {
  const pct   = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const fill  = document.getElementById(fillId);
  const pctEl = document.getElementById(pctId);
  if (fill) {
    fill.style.width = pct + '%';
    fill.style.background = pct >= 100
      ? 'linear-gradient(90deg, #4cca6e, #36b85a)'
      : 'linear-gradient(90deg, var(--red-dark), var(--red))';
  }
  if (pctEl) pctEl.textContent = pct + '%';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ==========================================
// HIDRATAÇÃO
// ==========================================

function getWaterUnit() {
  return localStorage.getItem('focus_waterUnit') || 'copos';
}

function initWaterUnit() {
  const unit = getWaterUnit();
  setWaterUnit(unit, true);
}

async function setWaterUnit(unit, silent = false) {
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
      goalInput.placeholder = '2';
      goalInput.step = '0.25';
      goalInput.max  = '10';
      const saved = localStorage.getItem('focus_waterGoal_litros');
      if (saved) goalInput.value = saved; else goalInput.value = '';
    } else {
      goalInput.placeholder = '8';
      goalInput.step = '1';
      goalInput.max  = '20';
      const saved = localStorage.getItem('focus_waterGoal_copos');
      if (saved) goalInput.value = saved; else goalInput.value = '';
    }
  }

  if (!silent && getToken()) {
    try {
      const [hydration] = await Promise.all([
        apiFetch(`/api/hydration?unit=${encodeURIComponent(unit)}`),
        apiFetch('/api/profile', 'PUT', { waterUnit: unit }),
      ]);
      waterCount = hydration.count || 0;
    } catch (e) {
      console.error('Erro ao carregar hidratação:', e);
    }
  }

  renderWaterGlasses();
  updateWaterDisplay();
}

function getWaterGoal() {
  const unit = getWaterUnit();
  const inp  = document.getElementById('waterGoalInput');
  const key  = unit === 'litros' ? 'focus_waterGoal_litros' : 'focus_waterGoal_copos';

  if (inp && inp.value) {
    localStorage.setItem(key, inp.value);
    return parseFloat(inp.value);
  }

  const saved = localStorage.getItem(key);
  if (saved) return parseFloat(saved);

  return unit === 'litros' ? 2 : 8;
}

function getWaterStep() {
  return getWaterUnit() === 'litros' ? 0.25 : 1;
}

function getWaterCount() {
  return waterCount;
}

async function setWaterCount(n) {
  const unit    = getWaterUnit();
  const step    = getWaterStep();
  const val     = Math.max(0, Math.round(n / step) * step);
  const rounded = parseFloat(val.toFixed(2));

  try {
    const res  = await apiFetch('/api/hydration', 'POST', { count: rounded, unit });
    waterCount = res.count ?? rounded;
  } catch (e) {
    showToast('Erro ao salvar hidratação.', 'error');
    return;
  }

  renderWaterGlasses();
  updateWaterDisplay();
}

async function addWater()    { await setWaterCount(waterCount + getWaterStep()); }
async function removeWater() { await setWaterCount(waterCount - getWaterStep()); }
async function resetWater()  { await setWaterCount(0); }

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
    g.title = unit === 'litros' ? `${thisVal.toFixed(2)} L` : `Copo ${i + 1}`;
    g.onclick = () => setWaterCount(isFull ? i * step : thisVal);
    g.innerHTML = isFull ? '💧' : '🫙';
    container.appendChild(g);
  }
}

function updateWaterDisplay() {
  const unit  = getWaterUnit();
  const goal  = getWaterGoal();
  const count = getWaterCount();
  const pct   = goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0;

  const displayCount = unit === 'litros' ? count.toFixed(2) : count;
  const displayGoal  = unit === 'litros' ? goal.toFixed(2)  : goal;

  setText('waterCount',       displayCount);
  setText('waterGoalDisplay', displayGoal);

  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  setText('hydrationDate', date);

  const fill = document.getElementById('progressWater');
  if (fill) fill.style.width = pct + '%';

  const inp = document.getElementById('waterGoalInput');
  if (inp && !inp.value) inp.value = displayGoal;
}

// ==========================================
// CALENDÁRIO HEATMAP
// ==========================================

function getActivityForDate(dateStr) {
  return kmHistory.filter(h => h.date === dateStr);
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

  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  label.textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  grid.innerHTML = '';

  ['D','S','T','Q','Q','S','S'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-header';
    h.textContent = d;
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

    const cell = document.createElement('div');
    cell.className = `cal-day cal-day-${level}`;
    cell.textContent = day;

    const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    if (isToday) cell.classList.add('cal-today');

    if (entries.length > 0) {
      const types = [...new Set(entries.map(e => e.type || 'corrida'))];
      cell.title = `${entries.length} treino(s): ${types.join(', ')}`;
    }

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
  const km        = totalKm;
  const level     = getLevel(km);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];

  const nameEl = document.getElementById('athleteLevelName');
  const fillEl = document.getElementById('levelXpFill');
  const textEl = document.getElementById('levelXpText');

  if (nameEl) nameEl.textContent = level.name;

  if (nextLevel) {
    const pct = Math.min(100, Math.round(((km - level.min) / (nextLevel.min - level.min)) * 100));
    if (fillEl) fillEl.style.width = pct + '%';
    if (textEl) textEl.textContent = `${(nextLevel.min - km).toFixed(1)} km para "${nextLevel.name}"`;
  } else {
    if (fillEl) fillEl.style.width = '100%';
    if (textEl) textEl.textContent = 'Nível máximo atingido!';
  }
}

// ==========================================
// MEDALHAS / CONQUISTAS
// ==========================================

async function renderMedals() {
  const grid = document.getElementById('medalsGrid');
  if (!grid) return;

  try {
    const medals = await apiFetch('/api/medals');
    grid.innerHTML = medals.map(m => `
      <div class="medal ${m.earned ? 'medal-earned' : 'medal-locked'}" title="${m.desc}">
        <span class="medal-icon">${m.icon}</span>
        <span class="medal-title">${m.title}</span>
      </div>
    `).join('');
  } catch (e) {
    console.error('Erro ao carregar medalhas:', e);
  }
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
    profileImcResult.textContent = `${savedImc} — ${savedImcLabel}`;
  }

  renderAthleteLevel();
  renderMedals();
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

async function saveProfile() {
  const name   = document.getElementById('profileNameInput').value.trim();
  const email  = document.getElementById('profileEmailInput').value.trim();
  const height = parseFloat(document.getElementById('profileHeightInput').value) || null;
  const weight = parseFloat(document.getElementById('profileWeightInput').value) || null;

  if (!name) { showToast('Informe seu nome.', 'error'); return; }

  try {
    const profile = await apiFetch('/api/profile', 'PUT', { name, email, height, weight });
    applyProfile(profile);
    updateHeaderAvatar();
    loadProfileData();
    showToast('Perfil salvo com sucesso!', 'success');
  } catch (e) {
    showToast('Erro ao salvar perfil: ' + e.message, 'error');
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

  if (getToken()) {
    apiFetch('/api/profile', 'PUT', { lastImc: finalImc, lastImcLabel: classification })
      .catch(e => console.error('Erro ao salvar IMC:', e));
  }

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
  if (imc <= 24.9) return { classification: 'Peso ideal',        details: 'Parabéns! Seu IMC está dentro da faixa considerada saudável pela OMS.', color: '#4cca6e' };
  if (imc <= 29.9) return { classification: 'Sobrepeso',         details: 'Seu IMC indica sobrepeso. Exercícios regulares e alimentação equilibrada podem ajudar.', color: '#f5a623' };
  if (imc <= 34.9) return { classification: 'Obesidade Grau I',  details: 'Seu IMC indica obesidade grau I. Recomenda-se acompanhamento médico e nutricional.', color: '#e8191a' };
  if (imc <= 39.9) return { classification: 'Obesidade Grau II', details: 'Seu IMC indica obesidade grau II. É importante buscar orientação médica especializada.', color: '#e8191a' };
  return { classification: 'Obesidade Grau III', details: 'Seu IMC indica obesidade grau III (mórbida). Procure atendimento médico o quanto antes.', color: '#e8191a' };
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

window.addEventListener('load', () => {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeIMCModal(); });

  document.getElementById('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
  document.getElementById('loginEmail').addEventListener('keydown',    (e) => { if (e.key === 'Enter') login(); });

  const kmInp = document.getElementById('kmInput');
  if (kmInp) kmInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addKm(); });

  const waterGoalInp = document.getElementById('waterGoalInput');
  if (waterGoalInp) waterGoalInp.addEventListener('change', async () => {
    const unit = getWaterUnit();
    const key  = unit === 'litros' ? 'focus_waterGoal_litros' : 'focus_waterGoal_copos';
    const goal = parseFloat(waterGoalInp.value) || null;
    localStorage.setItem(key, waterGoalInp.value);
    renderWaterGlasses();
    updateWaterDisplay();
    if (goal && getToken()) {
      try { await apiFetch('/api/profile', 'PUT', { waterGoal: goal, waterUnit: unit }); }
      catch (e) { console.error('Erro ao salvar meta de água:', e); }
    }
  });

  // Auto-login se já houver token válido
  if (getToken()) {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    const now = new Date();
    calYear  = now.getFullYear();
    calMonth = now.getMonth();
    updateHeaderAvatar();
    showDashboardScreen();
    showTip();
    initWaterUnit();
    loadAllData();
  }
});
