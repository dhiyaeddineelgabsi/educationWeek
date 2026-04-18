const N8N_WEBHOOK_URL = 'https://n8n-dhiya-befeaxf9csbjdxay.germanywestcentral-01.azurewebsites.net/webhook/5c3e677f-91c9-4a97-9cfd-a2d4b44c9dbe';

function getOrCreateSessionId() {
  let id = localStorage.getItem('edu_session_id');
  if (!id) {
    id = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('edu_session_id', id);
  }
  return id;
}

let lastQuizQuestion = '';
let lastQuizAnswer = '';
let last3QuestionTypes = JSON.parse(localStorage.getItem('last3QuestionTypes') || '[]');

const BOT_AVATAR_SVG = `
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="6" width="14" height="10" rx="2.5" fill="white" opacity=".9"/>
    <rect x="7" y="2" width="6" height="4" rx="1.5" fill="white" opacity=".7"/>
    <circle cx="7.5" cy="11" r="1.5" fill="#0066A4"/>
    <circle cx="12.5" cy="11" r="1.5" fill="#0066A4"/>
    <line x1="10" y1="2" x2="10" y2="6" stroke="white" stroke-width="1.2"/>
  </svg>`;

const USER_AVATAR_SVG = `
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="7" r="4" fill="#006400"/>
    <path d="M2 18c0-4 3.6-6 8-6s8 2 8 6" stroke="#006400" stroke-width="2" fill="none"/>
  </svg>`;

const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('msg-input');
const sendBtnEl = document.getElementById('send-btn');
const roleEl = document.getElementById('ctrl-role');
const masteryEl = document.getElementById('ctrl-mastery');
const masteryValEl = document.getElementById('mastery-val');
const modeEl = document.getElementById('ctrl-mode');
const educatorModeEl = document.getElementById('ctrl-educator-mode');
const langEl = document.getElementById('ctrl-lang');
const topicEl = document.getElementById('ctrl-topic');
const contextEl = document.getElementById('ctrl-context');
const enrichRequestEl = document.getElementById('ctrl-enrich-request');
const currentPlanEl = document.getElementById('ctrl-current-plan');
const studentFieldsEl = document.getElementById('student-fields');
const educatorFieldsEl = document.getElementById('educator-fields');

let conversationHistory = [];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatText(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function createMessageRow(content, isUser, isHtml = false) {
  const row = document.createElement('div');
  row.className = 'msg-row' + (isUser ? ' user' : '');

  const avatar = document.createElement('div');
  avatar.className = 'avatar ' + (isUser ? 'user-avatar' : 'bot-avatar');
  avatar.innerHTML = isUser ? USER_AVATAR_SVG : BOT_AVATAR_SVG;

  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + (isUser ? 'user-bubble' : 'bot-bubble');
  bubble.innerHTML = isHtml ? content : formatText(content);

  row.appendChild(avatar);
  row.appendChild(bubble);
  return row;
}

function addMessage(text, isUser, isHtml = false) {
  const row = createMessageRow(text, isUser, isHtml);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'msg-row';
  row.id = 'typing-row';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot-avatar';
  avatar.innerHTML = BOT_AVATAR_SVG;

  const typing = document.createElement('div');
  typing.className = 'bubble bot-bubble typing';
  typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

  row.appendChild(avatar);
  row.appendChild(typing);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  const typingRow = document.getElementById('typing-row');
  if (typingRow) typingRow.remove();
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setUiDisabled(disabled) {
  inputEl.disabled = disabled;
  sendBtnEl.disabled = disabled;
  roleEl.disabled = disabled;
  if (masteryEl) masteryEl.disabled = disabled;
  modeEl.disabled = disabled;
  educatorModeEl.disabled = disabled;
  langEl.disabled = disabled;
  topicEl.disabled = disabled;
  contextEl.disabled = disabled;
  enrichRequestEl.disabled = disabled;
  currentPlanEl.disabled = disabled;
}

if (masteryEl && masteryValEl) {
  masteryEl.addEventListener('input', () => {
    masteryValEl.textContent = parseFloat(masteryEl.value).toFixed(1);
  });
}

function getControls() {
  const grade = 9;
  const mastery = masteryEl ? parseFloat(masteryEl.value) : 5.0;

  return {
    role: roleEl.value,
    grade,
    mastery,
    mode: modeEl.value,
    educatorMode: educatorModeEl.value,
    language: langEl.value,
    topic: topicEl.value.trim(),
    curriculumContext: contextEl.value.trim(),
    enrichRequest: enrichRequestEl.value.trim(),
    currentPlan: currentPlanEl.value.trim()
  };
}

function toPromptLanguage(uiLang) {
  if (uiLang === 'arabic') return 'arabic';
  if (uiLang === 'darija') return 'darija';
  return 'french';
}

function buildHistoryBlock() {
  if (!conversationHistory.length) return 'Aucun historique - première interaction';
  return conversationHistory
    .slice(-10)
    .map((turn) => `${turn.role === 'user' ? 'User' : 'Nour'}: ${turn.content}`)
    .join('\n');
}

function buildStructuredMessage(userText, activeMode) {
  const controls = getControls();
  const role = controls.role;

  let structured = `---\n`;
  structured += `ROLE: ${role}\n\n`;
  structured += `CURRICULUM CONTEXT:\n`;
  structured += `${controls.curriculumContext || '[No curriculum context provided in this turn]'}\n\n`;
  structured += `TOPIC: ${controls.topic || 'Non spécifié'}\n`;
  structured += `LANGUAGE: ${toPromptLanguage(controls.language)}\n`;

  if (role === 'student') {
    structured += `GRADE: ${controls.grade}\n\n`;
    structured += `--- STUDENT FIELDS (present only when ROLE: student) ---\n`;
    structured += `MODE: ${controls.mode}\n`;
    structured += `MASTERY SCORE: ${controls.mastery.toFixed(1)}\n`;
    structured += `LAST 3 QUESTION TYPES: ${last3QuestionTypes.join(', ') || 'none'}\n`;
    structured += `STUDENT QUESTION: ${userText}\n`;
    structured += `CONVERSATION HISTORY: ${buildHistoryBlock()}\n`;

    if (activeMode === 'check') {
      structured += `QUESTION ASKED: ${lastQuizQuestion || '[No quiz question recorded]'}\n`;
      structured += `STUDENT ANSWER: ${userText}\n`;
    }

    structured += `\n--- EDUCATOR FIELDS (present only when ROLE: educator) ---\n`;
  } else {
    structured += `\n--- STUDENT FIELDS (present only when ROLE: student) ---\n`;
    structured += `\n--- EDUCATOR FIELDS (present only when ROLE: educator) ---\n`;
    structured += `EDUCATOR MODE: ${controls.educatorMode}\n`;
    structured += `EDUCATOR QUESTION: ${userText}\n`;
    structured += `CURRENT PLAN: ${controls.currentPlan || '[Not provided]'}\n`;
    structured += `ENRICH REQUEST: ${controls.enrichRequest || '[Not provided]'}\n`;
  }

  structured += `---`;
  return structured;
}

function syncRoleUi() {
  const isEducator = roleEl.value === 'educator';
  studentFieldsEl.classList.toggle('hidden', isEducator);
  educatorFieldsEl.classList.toggle('hidden', !isEducator);
}

function extractBotText(payload) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';

  const keys = ['output', 'reply', 'response', 'text', 'answer', 'message'];

  for (const key of keys) {
    if (typeof payload[key] === 'string' && payload[key].trim()) {
      return payload[key];
    }
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = extractBotText(item);
      if (nested) return nested;
    }
    return '';
  }

  for (const value of Object.values(payload)) {
    if (value && typeof value === 'object') {
      const nested = extractBotText(value);
      if (nested) return nested;
    }
  }

  return '';
}

async function callN8N(userText, mode) {
  const controls = getControls();
  const activeMode = controls.role === 'student' ? controls.mode : controls.educatorMode;
  const structuredMessage = buildStructuredMessage(userText, activeMode);

  const body = {
    chatInput: userText,
    message: userText,
    sessionId: getOrCreateSessionId(),
    role: controls.role,
    topic: controls.topic,
    curriculumContext: controls.curriculumContext,
    language: toPromptLanguage(controls.language),
    mode: activeMode,
    studentMode: controls.mode,
    educatorMode: controls.educatorMode,
    grade: controls.grade,
    masteryScore: controls.mastery,
    last3QuestionTypes: last3QuestionTypes.join(', '),
    questionAsked: lastQuizQuestion,
    studentAnswer: mode === 'check' ? userText : '',
    currentPlan: controls.currentPlan,
    enrichRequest: controls.enrichRequest,
    conversationHistory: buildHistoryBlock(),
    structuredMessage
  };

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Webhook HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  let payload;

  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (typeof payload === 'string') return payload;

  const extracted = extractBotText(payload);
  if (extracted) return extracted;

  return JSON.stringify(payload);
}

function escapeJsSingleQuote(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderQuiz(data) {
  const safeQuestion = escapeHtml(data.question || 'Question indisponible.');
  let html = '<div class="quiz-block">';
  html += `<p class="quiz-question">${safeQuestion}</p>`;

  if (data.type === 'multiple_choice' && Array.isArray(data.options)) {
    html += '<div class="quiz-options">';
    for (const option of data.options) {
      const label = escapeHtml(option);
      const value = escapeJsSingleQuote(option);
      html += `<button class="quiz-opt" onclick="submitAnswer('${value}')">${label}</button>`;
    }
    html += '</div>';
  } else {
    html += '<div class="quiz-input-row">';
    html += '<input id="quiz-free-input" type="text" placeholder="Ta réponse..." />';
    html += '<button class="quiz-submit-btn" onclick="submitFreeAnswer()">Envoyer</button>';
    html += '</div>';
  }

  if (data.source) {
    const chapter = escapeHtml(data.source.chapter || '?');
    const page = escapeHtml(data.source.page != null ? String(data.source.page) : '?');
    html += `<p class="quiz-source">📖 Chapitre ${chapter}, Page ${page}</p>`;
  }

  html += '</div>';

  lastQuizQuestion = data.question || '';
  lastQuizAnswer = data.correct_answer || '';
  if (data.type) {
    last3QuestionTypes.push(data.type);
    if (last3QuestionTypes.length > 3) {
      last3QuestionTypes = last3QuestionTypes.slice(-3);
    }
    localStorage.setItem('last3QuestionTypes', JSON.stringify(last3QuestionTypes));
  }

  return html;
}

function stripCodeFence(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function handleBotReply(rawText, mode) {
  const { role } = getControls();

  if (role === 'student' && mode === 'quiz') {
    const cleaned = stripCodeFence(rawText);

    try {
      const data = JSON.parse(cleaned);
      addMessage(renderQuiz(data), false, true);
      return;
    } catch (error) {
      addMessage(rawText, false);
      return;
    }
  }

  addMessage(rawText, false);
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  const controls = getControls();
  const activeMode = controls.role === 'student' ? controls.mode : controls.educatorMode;

  addMessage(text, true);
  conversationHistory.push({ role: 'user', content: text });
  inputEl.value = '';
  setUiDisabled(true);
  showTyping();

  try {
    const rawReply = await callN8N(text, activeMode);
    removeTyping();
    handleBotReply(rawReply, activeMode);
    conversationHistory.push({ role: 'assistant', content: rawReply });
  } catch (error) {
    console.error('Erreur n8n:', error);
    removeTyping();
    addMessage("Erreur: impossible de joindre le workflow n8n pour le moment. Verifie le webhook et reessaie.", false);
  } finally {
    setUiDisabled(false);
    inputEl.focus();
  }
}

async function submitAnswer(answer) {
  const controls = getControls();
  if (controls.role !== 'student') return;

  const optionButtons = document.querySelectorAll('.quiz-opt');
  optionButtons.forEach((btn) => {
    btn.disabled = true;
  });

  addMessage(answer, true);
  conversationHistory.push({ role: 'user', content: answer });
  showTyping();

  try {
    const rawReply = await callN8N(answer, 'check');
    removeTyping();
    addMessage(rawReply, false);
    conversationHistory.push({ role: 'assistant', content: rawReply });
  } catch (error) {
    console.error('Erreur check n8n:', error);
    removeTyping();
    addMessage("Erreur: impossible d'obtenir la correction maintenant.", false);
  }
}

async function submitFreeAnswer() {
  const freeInput = document.getElementById('quiz-free-input');
  const submitBtn = document.querySelector('.quiz-submit-btn');

  if (!freeInput) return;
  const value = freeInput.value.trim();
  if (!value) return;

  freeInput.disabled = true;
  if (submitBtn) submitBtn.disabled = true;

  await submitAnswer(value);
}

window.sendMessage = sendMessage;
window.submitAnswer = submitAnswer;
window.submitFreeAnswer = submitFreeAnswer;

roleEl.addEventListener('change', syncRoleUi);
syncRoleUi();

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
