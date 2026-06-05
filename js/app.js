// ==========================================
// FOCUS — app.js v4
// ==========================================
//
// ESTRUTURA GERAL:
//   - Autenticação (login/cadastro) via localStorage (trocar por API futuramente)
//   - Dashboard: gráfico de desempenho, histórico, streak, hidratação, calendário, metas
//   - Perfil: dados do usuário, IMC, nível de atleta, medalhas
//
// PARA O BACKEND (amigos): os pontos marcados com "// TODO: API" indicam
// onde trocar localStorage por chamadas reais ao servidor.
// ==========================================

// --- Estado global da aplicação ---
let totalKm   = Number(localStorage.getItem('focus_totalKm'))   || 0;
let activeDays = Number(localStorage.getItem('focus_activeDays')) || 0;
let chart = null;                          // instância atual do Chart.js
let currentChartType = 'line';             // 'line' ou 'bar'
let currentWorkoutType = 'corrida';        // tipo selecionado no dropdown
let calYear, calMonth;                     // mês/ano exibido no calendário
let currentTipIndex = 0;                   // índice da dica atual

// ==========================================
// DICAS DO DIA
// ==========================================
// Array de dicas exibidas rotacionalmente na tela principal.
// Para adicionar mais dicas, basta inserir strings neste array.

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
    - Considere boas práticas atuais de esporte e saúde

    ## Resposta
    Responda APENAS com o texto da dica, nada mais.

    ## Exemplos do formato esperado
    "Hidrate-se antes, durante e após os treinos. A desidratação reduz até 20% da performance."
    "Durma 7-9h por noite. O sono é o suplemento mais poderoso que existe."
  `;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
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
  } catch (err) {
    el.textContent = 'Não foi possível carregar a dica. Tente novamente.';
    console.error('Erro ao gerar dica:', err);
  }
};

const nextTip = () => {
  const el = document.getElementById('tipText');
  if (!el) return;

  setTimeout(async () => {
    await showTip();
  }, 200);
};

showTip();

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
// Alterna visualmente entre os formulários de login e cadastro.

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
// TODO: API — trocar localStorage por POST /api/register
// Salva nome, email e senha localmente por enquanto.

function register() {
  clearError('registerError');
  const name     = document.getElementById('registerName').value.trim();
  const email    = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  if (!name) { showError('registerError', 'Por favor, informe seu nome.'); return; }
  if (!isValidEmail(email)) { showError('registerError', 'Informe um email válido.'); return; }
  if (password.length < 6) { showError('registerError', 'A senha deve ter pelo menos 6 caracteres.'); return; }
  localStorage.setItem('focus_user', name);
  localStorage.setItem('focus_email', email);
  localStorage.setItem('focus_password', password);
  showToast('Conta criada! Faça login.', 'success');
  showLogin();
}

// ==========================================
// LOGIN / LOGOUT
// ==========================================
// TODO: API — trocar comparação local por POST /api/login (retorna token JWT)
// Após integração com backend, armazenar token em localStorage no lugar da senha.

function login() {
  clearError('loginError');
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const savedEmail    = localStorage.getItem('focus_email') || '';
  const savedPassword = localStorage.getItem('focus_password') || '';
  if (!email || !password) { showError('loginError', 'Preencha email e senha.'); return; }
  if (email !== savedEmail || password !== savedPassword) { showError('loginError', 'Email ou senha inválidos.'); return; }
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  initApp();
}

function logout() {
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
// Chamada logo após o login bem-sucedido.
// Carrega todos os dados do localStorage e inicializa os componentes da tela.

function initApp() {
  totalKm    = Number(localStorage.getItem('focus_totalKm'))    || 0;
  activeDays = Number(localStorage.getItem('focus_activeDays')) || 0;

  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();

  updateStats();
  loadProfileData();
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

function showDashboard(linkEl) {
  document.getElementById('dashboardScreen').style.display = 'block';
  document.getElementById('profileScreen').style.display = 'none';
  updateNavActive(linkEl);
}

function showProfile(linkEl) {
  document.getElementById('dashboardScreen').style.display = 'none';
  document.getElementById('profileScreen').style.display = 'block';
  loadProfileData();
  updateStats();
  renderAthleteLevel();
  renderMedals();
  updateNavActive(linkEl);
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
// DISTANCE_TYPES: atividades que registram distância em km.
// Atividades fora desta lista (yoga, musculação) registram duração em minutos.

const DISTANCE_TYPES = ['corrida', 'ciclismo', 'natação', 'caminhada'];

// Mostra/oculta campo de km ou duração dependendo do tipo escolhido.
function onWorkoutTypeChange(select) {
  currentWorkoutType = select.value;
  const isDistance = DISTANCE_TYPES.includes(currentWorkoutType);
  document.getElementById('kmInputGroup').style.display    = isDistance ? 'flex' : 'none';
  document.getElementById('durationInputGroup').style.display = isDistance ? 'none' : 'flex';
}

// ==========================================
// GRÁFICO DE DESEMPENHO
// ==========================================
// Usa Chart.js para exibir histórico de treinos.
// Dois modos: linha (histórico por treino) e barra (últimos 7 dias).
// O filtro 'geral' mostra todos os tipos; filtros específicos mostram só aquele tipo.

// Paleta de cores por tipo de atividade (border = linha, bg = área, bar = barra)
const TYPE_COLORS = {
  corrida:    { border: '#e8191a', bg: 'rgba(232,25,26,0.12)',  bar: 'rgba(232,25,26,0.75)' },
  ciclismo:   { border: '#f5a623', bg: 'rgba(245,166,35,0.12)', bar: 'rgba(245,166,35,0.75)' },
  natação:    { border: '#00aaff', bg: 'rgba(0,170,255,0.12)',  bar: 'rgba(0,170,255,0.75)' },
  musculação: { border: '#a855f7', bg: 'rgba(168,85,247,0.12)', bar: 'rgba(168,85,247,0.75)' },
  yoga:       { border: '#4cca6e', bg: 'rgba(76,202,110,0.12)', bar: 'rgba(76,202,110,0.75)' },
  caminhada:  { border: '#ff9060', bg: 'rgba(255,144,96,0.12)', bar: 'rgba(255,144,96,0.75)' },
  geral:      { border: '#e8191a', bg: 'rgba(232,25,26,0.12)',  bar: 'rgba(232,25,26,0.65)' },
};

// Retorna o valor atual do filtro de tipo no select do gráfico.
function getChartFilter() {
  const sel = document.getElementById('chartTypeFilter');
  return sel ? sel.value : 'geral';
}

// Monta os dados dos últimos 7 dias para o gráfico de barras.
// Para atividades com distância: soma km por dia.
// Para atividades sem distância (yoga, musculação): conta número de sessões.
function getWeeklyData(filterType) {
  const history = getKmHistory();
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const now = new Date();
  const weekData = Array(7).fill(0);
  const weekLabels = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    weekLabels.push(days[d.getDay()]);
    const dateStr = d.toLocaleDateString('pt-BR');
    history.forEach(h => {
      const hType = h.type || 'corrida';
      // Verifica se o treino bate com o filtro selecionado
      const matchType = filterType === 'geral' ? true : hType === filterType;
      if (h.date === dateStr && matchType) {
        if (DISTANCE_TYPES.includes(hType)) {
          // Atividade com distância: acumula km
          weekData[6 - i] += h.km || 0;
        } else {
          // Atividade sem distância (yoga, musculação): conta minutos
          weekData[6 - i] += h.duration || 0;
        }
      }
    });
  }
  return { labels: weekLabels, data: weekData };
}

// Cria ou recria o gráfico com base no tipo atual (linha/barra) e no filtro de atividade.
function initChart() {
  const ctx = document.getElementById('performanceChart');
  if (!ctx) return;
  // Destrói o gráfico anterior para evitar sobreposição
  if (chart) { chart.destroy(); chart = null; }

  const filterType = getChartFilter();
  const colors = TYPE_COLORS[filterType] || TYPE_COLORS['geral'];
  // Decide se a unidade do eixo Y é km ou minutos
  const isDistanceFilter = filterType === 'geral' || DISTANCE_TYPES.includes(filterType);

  if (currentChartType === 'bar') {
    // --- GRÁFICO DE BARRAS: últimos 7 dias ---
    const weekly = getWeeklyData(filterType);
    // Hoje (último elemento) aparece mais opaco; dias anteriores mais transparentes
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
    // --- GRÁFICO DE LINHA: histórico completo por treino ---
    const history = getKmHistory();
    let filtered;

    if (filterType === 'geral') {
      // Geral: todos os treinos (distância e duração)
      filtered = history;
    } else {
      // Filtro específico: apenas treinos daquele tipo
      filtered = history.filter(h => (h.type || 'corrida') === filterType);
    }

    const labels = filtered.map((_, i) => `T${i + 1}`);
    // Para atividades com distância mostra km; para as demais mostra duração em min
    const data = filtered.map(h =>
      DISTANCE_TYPES.includes(h.type || 'corrida') ? (h.km || 0) : (h.duration || 0)
    );

    // No modo geral, cada ponto recebe a cor do seu tipo de atividade
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

// Retorna o rótulo adequado para a legenda do gráfico conforme o filtro.
function getLabelForFilter(filterType) {
  if (filterType === 'geral') return 'Todos os treinos';
  if (DISTANCE_TYPES.includes(filterType)) return `KM — ${filterType}`;
  return `Minutos — ${filterType}`;
}

// Configurações visuais compartilhadas entre os gráficos de linha e barra.
// O tooltip adapta a unidade: km para atividades de distância, min para as demais.
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
          // Mostra a unidade correta no tooltip ao passar o mouse
          label: (ctx) => isDistance
            ? ` ${ctx.parsed.y} km`
            : ` ${ctx.parsed.y} min`
        }
      }
    },
    scales: {
      x: { ticks: { color: '#666', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#666', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
    }
  };
}

// Troca entre gráfico de linha e barra ao clicar nas abas.
function switchChart(type, btn) {
  currentChartType = type;
  document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  initChart();
}

// ==========================================
// KM HISTORY — HISTÓRICO DE TREINOS
// ==========================================
// TODO: API — trocar localStorage por GET /api/workouts e POST /api/workouts
// Cada entrada: { km, duration, date, type }

// Lê o histórico completo do localStorage.
function getKmHistory() {
  try { return JSON.parse(localStorage.getItem('focus_kmHistory') || '[]'); }
  catch { return []; }
}

function saveKmHistory(history) {
  localStorage.setItem('focus_kmHistory', JSON.stringify(history));
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

  const emoji = WORKOUT_EMOJI[type] || '🏃';
  const item = document.createElement('div');
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
// Registra um novo treino, atualiza totais, histórico e recarrega os componentes visuais.
// TODO: API — enviar POST /api/workouts com { type, km, duration, date }

function addKm() {
  const isDistance = DISTANCE_TYPES.includes(currentWorkoutType);
  let km = 0, duration = 0;

  if (isDistance) {
    km = parseFloat(document.getElementById('kmInput').value);
    if (!km || km <= 0 || isNaN(km)) { showToast('Digite um valor de KM válido.', 'error'); return; }
  } else {
    duration = parseInt(document.getElementById('durationInput').value);
    if (!duration || duration <= 0 || isNaN(duration)) { showToast('Digite a duração do treino.', 'error'); return; }
  }

  const today = new Date().toLocaleDateString('pt-BR');
  if (isDistance) {
    totalKm = parseFloat((totalKm + km).toFixed(2));
  }

  const lastRunDate = localStorage.getItem('focus_lastRunDate');
  if (lastRunDate !== today) {
    activeDays++;
    localStorage.setItem('focus_lastRunDate', today);
    updateStreakOnNewActivity(today);
  }

  localStorage.setItem('focus_totalKm',    totalKm);
  localStorage.setItem('focus_activeDays', activeDays);

  const history = getKmHistory();
  history.push({ km: isDistance ? km : 0, duration, date: today, type: currentWorkoutType });
  saveKmHistory(history);

  initChart();

  appendKmItem(isDistance ? km : 0, today, currentWorkoutType, duration);
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

  checkMedals();
}

// ==========================================
// STATS
// ==========================================

function updateStats() {
  const km    = document.getElementById('profileKm');
  const days  = document.getElementById('activeDays');
  const badge = document.getElementById('totalKmBadge');
  const streakEl = document.getElementById('profileStreak');

  if (km)      km.textContent    = totalKm;
  if (days)    days.textContent  = activeDays;
  if (badge)   badge.textContent = totalKm;
  if (streakEl) streakEl.textContent = getCurrentStreak();
}

// ==========================================
// STREAK — SEQUÊNCIA DE DIAS ATIVOS
// ==========================================
// A sequência aumenta 1 a cada dia consecutivo com treino.
// Se o usuário pular um dia, o streak volta a 1.
// O recorde (streakBest) nunca diminui.

function getCurrentStreak() {
  return Number(localStorage.getItem('focus_streak') || 0);
}

function updateStreakOnNewActivity(today) {
  const lastDate = localStorage.getItem('focus_streakLastDate');
  let streak = Number(localStorage.getItem('focus_streak') || 0);

  if (!lastDate) {
    streak = 1;
  } else {
    const last = parseDate(lastDate);
    const todayDate = parseDate(today);
    const diff = Math.round((todayDate - last) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      streak = 1;
    }
  }

  const best = Number(localStorage.getItem('focus_streakBest') || 0);
  if (streak > best) localStorage.setItem('focus_streakBest', streak);

  localStorage.setItem('focus_streak', streak);
  localStorage.setItem('focus_streakLastDate', today);
}

function parseDate(str) {
  const parts = str.split('/');
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

function updateStreak() {
  const streak = getCurrentStreak();
  const best   = Number(localStorage.getItem('focus_streakBest') || 0);
  const last   = localStorage.getItem('focus_streakLastDate') || '—';

  const sNum  = document.getElementById('streakNumber');
  const sBest = document.getElementById('streakBest');
  const sLast = document.getElementById('streakLastActive');
  const sBadge= document.getElementById('streakBadgeTop');
  const sMsg  = document.getElementById('streakMessage');
  const sHead = document.getElementById('headerStreakCount');

  if (sNum)   sNum.textContent  = streak;
  if (sBest)  sBest.textContent = best;
  if (sLast)  sLast.textContent = last;
  if (sBadge) sBadge.textContent= streak;
  if (sHead)  sHead.textContent = streak;

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
// Metas diária, semanal e anual em km.
// As barras de progresso são atualizadas sempre que um treino é registrado.
// TODO: API — salvar metas no banco por usuário via PUT /api/goals

function initGoalInputs() {
  const daily  = localStorage.getItem('focus_goalDaily')  || '';
  const weekly = localStorage.getItem('focus_goalWeekly') || '';
  const annual = localStorage.getItem('focus_goalAnnual') || '';

  const d = document.getElementById('goalDailyInput');
  const w = document.getElementById('goalWeeklyInput');
  const a = document.getElementById('goalAnnualInput');

  if (d && daily)  d.value = daily;
  if (w && weekly) w.value = weekly;
  if (a && annual) a.value = annual;
}

function saveGoals() {
  const daily  = document.getElementById('goalDailyInput')?.value  || '';
  const weekly = document.getElementById('goalWeeklyInput')?.value || '';
  const annual = document.getElementById('goalAnnualInput')?.value || '';

  if (daily)  localStorage.setItem('focus_goalDaily',  daily);
  if (weekly) localStorage.setItem('focus_goalWeekly', weekly);
  if (annual) localStorage.setItem('focus_goalAnnual', annual);

  updateGoalsDisplay();
  showToast('Metas salvas!', 'success');
}

function getKmForPeriod(period) {
  const history = getKmHistory();
  const now = new Date();

  return history.reduce((acc, h) => {
    if (!DISTANCE_TYPES.includes(h.type || 'corrida')) return acc;
    const d = parseDate(h.date);
    if (period === 'daily') {
      if (h.date === now.toLocaleDateString('pt-BR')) return acc + (h.km || 0);
    } else if (period === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      if (d >= startOfWeek) return acc + (h.km || 0);
    } else if (period === 'annual') {
      if (d.getFullYear() === now.getFullYear()) return acc + (h.km || 0);
    }
    return acc;
  }, 0);
}

function setProgress(fillId, pctId, current, goal) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const fill = document.getElementById(fillId);
  const pctEl = document.getElementById(pctId);
  if (fill) {
    fill.style.width = pct + '%';
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

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ==========================================
// HIDRATAÇÃO — litros / copos
// ==========================================
// Controla o consumo de água diário, com suporte a duas unidades.
// Os dados são resetados automaticamente a cada novo dia.
// TODO: API — persistir consumo diário via POST /api/hydration

function getWaterUnit() {
  return localStorage.getItem('focus_waterUnit') || 'copos';
}

function initWaterUnit() {
  const unit = getWaterUnit();
  setWaterUnit(unit, true);
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

  if (btnCopos) btnCopos.classList.toggle('active', unit === 'copos');
  if (btnLitros) btnLitros.classList.toggle('active', unit === 'litros');

  const isLitros = unit === 'litros';
  const unitTxt = isLitros ? 'L' : 'copos';

  if (unitLabel) unitLabel.textContent = unitTxt;
  if (countUnit) countUnit.textContent = unitTxt;
  if (addBtn)    addBtn.textContent    = isLitros ? '+ 0,25 L' : '+ 1 copo';
  if (remBtn)    remBtn.textContent    = isLitros ? '– 0,25 L' : '– 1 copo';

  // Ajusta placeholder e max da meta
  if (goalInput) {
    if (isLitros) {
      goalInput.placeholder = '2';
      goalInput.step = '0.25';
      goalInput.max = '10';
      // Se vinha de copos, converter valor: 8 copos → 2L
      const savedGoalRaw = localStorage.getItem('focus_waterGoal_litros');
      if (savedGoalRaw) goalInput.value = savedGoalRaw;
      else goalInput.value = '';
    } else {
      goalInput.placeholder = '8';
      goalInput.step = '1';
      goalInput.max = '20';
      const savedGoalRaw = localStorage.getItem('focus_waterGoal_copos');
      if (savedGoalRaw) goalInput.value = savedGoalRaw;
      else goalInput.value = '';
    }
  }

  renderWaterGlasses();
  updateWaterDisplay();
}

function getWaterGoal() {
  const unit = getWaterUnit();
  const inp = document.getElementById('waterGoalInput');
  const key = unit === 'litros' ? 'focus_waterGoal_litros' : 'focus_waterGoal_copos';

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
  const today = new Date().toLocaleDateString('pt-BR');
  const unit = getWaterUnit();
  const dateKey  = `focus_waterDate_${unit}`;
  const countKey = `focus_waterCount_${unit}`;

  const saved = localStorage.getItem(dateKey);
  if (saved !== today) {
    localStorage.setItem(dateKey, today);
    localStorage.setItem(countKey, 0);
    return 0;
  }
  return Number(localStorage.getItem(countKey) || 0);
}

function setWaterCount(n) {
  const unit = getWaterUnit();
  const countKey = `focus_waterCount_${unit}`;
  const step = getWaterStep();
  const val = Math.max(0, Math.round(n / step) * step);
  const rounded = parseFloat(val.toFixed(2));
  localStorage.setItem(countKey, rounded);
  renderWaterGlasses();
  updateWaterDisplay();
}

function addWater()    { setWaterCount(getWaterCount() + getWaterStep()); }
function removeWater() { setWaterCount(getWaterCount() - getWaterStep()); }
function resetWater()  { setWaterCount(0); }

function renderWaterGlasses() {
  const container = document.getElementById('waterGlasses');
  if (!container) return;
  const unit = getWaterUnit();
  const goal  = getWaterGoal();
  const count = getWaterCount();
  const step  = getWaterStep();

  container.innerHTML = '';

  const totalSteps = Math.min(Math.round(goal / step), unit === 'litros' ? 12 : 20);

  for (let i = 0; i < totalSteps; i++) {
    const thisVal = (i + 1) * step;
    const isFull = count >= thisVal - 0.001;
    const g = document.createElement('div');
    g.className = 'glass ' + (isFull ? 'glass-full' : '');
    g.title = unit === 'litros' ? `${thisVal.toFixed(2)} L` : `Copo ${i + 1}`;
    g.onclick = () => setWaterCount(isFull ? (i) * step : thisVal);
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
  const displayGoal  = unit === 'litros' ? goal.toFixed(2) : goal;

  setText('waterCount', displayCount);
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
// Exibe um calendário mensal colorindo os dias com base na intensidade do treino.
// Nível 0 = sem treino, 1 = leve, 2 = moderado, 3 = intenso.

// Retorna todos os treinos de um determinado dia (formato dd/mm/yyyy).
function getActivityForDate(dateStr) {
  const history = getKmHistory();
  return history.filter(h => h.date === dateStr);
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
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calMonthLabel');
  if (!grid || !label) return;

  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  label.textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
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
    const level = getHeatLevel(entries);

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
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11){ calMonth = 0;  calYear++; }
  renderCalendar();
}

// ==========================================
// NÍVEL DO ATLETA
// ==========================================
// O nível sobe conforme o total de km acumulados.
// A barra de XP mostra o progresso até o próximo nível.

const LEVELS = [
  { name: 'Iniciante',      min: 0,    max: 50  },
  { name: 'Corredor',       min: 50,   max: 150 },
  { name: 'Atleta',         min: 150,  max: 350 },
  { name: 'Veterano',       min: 350,  max: 700 },
  { name: 'Elite',          min: 700,  max: 1500},
  { name: 'Lenda',          min: 1500, max: Infinity },
];

function getLevel(km) {
  return LEVELS.find((l, i) => km >= l.min && (km < l.max || i === LEVELS.length - 1));
}

function renderAthleteLevel() {
  const km = totalKm;
  const level = getLevel(km);
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
// Cada medalha tem uma função `check` que recebe (totalKm, activeDays, streak).
// checkMedals() é chamada após cada treino para detectar novas conquistas.

const MEDALS = [
  { id: 'first',   icon: '🥇', title: 'Primeira Corrida',    desc: 'Registrou o primeiro treino',      check: (km, days, streak) => days >= 1 },
  { id: 'km10',    icon: '🏅', title: '10 km',               desc: 'Acumulou 10 km',                   check: (km) => km >= 10 },
  { id: 'km50',    icon: '🥈', title: '50 km',               desc: 'Acumulou 50 km',                   check: (km) => km >= 50 },
  { id: 'km100',   icon: '🏆', title: '100 km',              desc: 'Acumulou 100 km — Centurião!',      check: (km) => km >= 100 },
  { id: 'km500',   icon: '💎', title: '500 km',              desc: 'Acumulou 500 km — Lendário!',       check: (km) => km >= 500 },
  { id: 'streak7', icon: '🔥', title: '7 Dias Seguidos',     desc: 'Manteve sequência de 7 dias',       check: (km, days, streak) => streak >= 7 },
  { id: 'streak30',icon: '⚡', title: 'Mês Perfeito',        desc: 'Manteve sequência de 30 dias',      check: (km, days, streak) => streak >= 30 },
  { id: 'days20',  icon: '📅', title: '20 Dias Ativos',      desc: 'Treinou em 20 dias diferentes',     check: (km, days) => days >= 20 },
  { id: 'hydro',   icon: '💧', title: 'Hidratado',           desc: 'Completou meta de água por 1 dia',  check: () => Boolean(localStorage.getItem('focus_hydroMedal')) },
];

function checkMedals() {
  const streak = getCurrentStreak();
  const best = Number(localStorage.getItem('focus_streakBest') || 0);
  const earned = MEDALS.filter(m => m.check(totalKm, activeDays, Math.max(streak, best)));
  const prev = JSON.parse(localStorage.getItem('focus_medals') || '[]');
  const newOnes = earned.filter(m => !prev.includes(m.id));
  if (newOnes.length) {
    newOnes.forEach(m => showToast(`🏅 Nova conquista: ${m.title}!`, 'success'));
    localStorage.setItem('focus_medals', JSON.stringify(earned.map(m => m.id)));
  }
}

function renderMedals() {
  const grid = document.getElementById('medalsGrid');
  if (!grid) return;
  const streak = Math.max(getCurrentStreak(), Number(localStorage.getItem('focus_streakBest') || 0));

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
// TODO: API — carregar e salvar dados via GET/PUT /api/profile

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

  const savedImc = localStorage.getItem('focus_lastImc');
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

function saveProfile() {
  const name   = document.getElementById('profileNameInput').value.trim();
  const email  = document.getElementById('profileEmailInput').value.trim();
  const height = document.getElementById('profileHeightInput').value;
  const weight = document.getElementById('profileWeightInput').value;

  if (!name) { showToast('Informe seu nome.', 'error'); return; }

  localStorage.setItem('focus_user',   name);
  localStorage.setItem('focus_email',  email);
  localStorage.setItem('focus_height', height);
  localStorage.setItem('focus_weight', weight);

  updateHeaderAvatar();
  loadProfileData();
  showToast('Perfil salvo com sucesso!', 'success');
}

// ==========================================
// CALCULADORA DE IMC
// ==========================================
// Calcula o Índice de Massa Corporal e exibe o resultado em um modal.
// Aceita altura em cm ou metros (detecta automaticamente se > 3).

function calculateIMC() {
  const heightRaw = document.getElementById('height').value.replace(',', '.');
  const weightRaw = document.getElementById('weight').value.replace(',', '.');
  let height = parseFloat(heightRaw);
  let weight = parseFloat(weightRaw);

  if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
    showToast('Preencha altura e peso corretamente.', 'error'); return;
  }
  if (height > 3) height = height / 100;

  const imc = weight / (height * height);
  const finalImc = imc.toFixed(1);
  const { classification, details, color } = getImcInfo(imc);

  localStorage.setItem('focus_lastImc', finalImc);
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
  if (imc < 18.5) return { classification: 'Abaixo do peso',     details: 'Seu IMC indica que você está abaixo do peso ideal. Considere consultar um nutricionista.', color: '#60aaff' };
  if (imc <= 24.9) return { classification: 'Peso ideal',         details: 'Parabéns! Seu IMC está dentro da faixa considerada saudável pela OMS.', color: '#4cca6e' };
  if (imc <= 29.9) return { classification: 'Sobrepeso',          details: 'Seu IMC indica sobrepeso. Exercícios regulares e alimentação equilibrada podem ajudar.', color: '#f5a623' };
  if (imc <= 34.9) return { classification: 'Obesidade Grau I',   details: 'Seu IMC indica obesidade grau I. Recomenda-se acompanhamento médico e nutricional.', color: '#e8191a' };
  if (imc <= 39.9) return { classification: 'Obesidade Grau II',  details: 'Seu IMC indica obesidade grau II. É importante buscar orientação médica especializada.', color: '#e8191a' };
  return { classification: 'Obesidade Grau III', details: 'Seu IMC indica obesidade grau III (mórbida). Procure atendimento médico o quanto antes.', color: '#e8191a' };
}

function openImcModal(finalImc, classification, details, height, weight) {
  const modal = document.getElementById('imcModal');
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
// Configura event listeners globais ao carregar o DOM.
// Exibe a tela de login; o app só aparece após autenticação bem-sucedida.

window.addEventListener('load', () => {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeIMCModal(); });

  document.getElementById('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
  document.getElementById('loginEmail').addEventListener('keydown', (e)    => { if (e.key === 'Enter') login(); });

  const kmInp = document.getElementById('kmInput');
  if (kmInp) kmInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addKm(); });

  const waterGoalInp = document.getElementById('waterGoalInput');
  if (waterGoalInp) waterGoalInp.addEventListener('change', () => {
    const unit = getWaterUnit();
    const key = unit === 'litros' ? 'focus_waterGoal_litros' : 'focus_waterGoal_copos';
    localStorage.setItem(key, waterGoalInp.value);
    renderWaterGlasses();
    updateWaterDisplay();
  });
});
