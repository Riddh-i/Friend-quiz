
"use strict";

const STORAGE_KEY = "bestieQuizData_v1";
const app = document.getElementById("app");

let currentView = "home";
let selectedQuestions = [];
let answerKey = {};
let draftName = "";
let quizInProgress = null;
let quizAnswers = {};
let message = "";
let messageType = "error";

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      quizzes: Array.isArray(data.quizzes) ? data.quizzes : [],
      results: Array.isArray(data.results) ? data.results : []
    };
  } catch (error) {
    return { quizzes: [], results: [] };
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    showMessage("Couldn't save. Check your browser storage.", "error");
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showMessage(text, type = "error") {
  message = text;
  messageType = type;
  const old = document.getElementById("message");
  if (old) {
    old.className = type;
    old.textContent = text;
    old.hidden = false;
  }
}

function clearMessage() {
  message = "";
  const old = document.getElementById("message");
  if (old) old.hidden = true;
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const data = loadData();
  let code = "";

  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (data.quizzes.some(quiz => quiz.code === code));

  return code;
}

function getQuestion(id) {
  return QUESTION_BANK.find(question => question.id === Number(id));
}

function questionCard(question) {
  const checked = selectedQuestions.includes(question.id);
  const correct = answerKey[question.id];

  return `
    <div class="question-card">
      <div class="question-top">
        <input type="checkbox"
          id="pick-${question.id}"
          data-action="toggle-question"
          data-id="${question.id}"
          ${checked ? "checked" : ""}
          aria-label="Select question ${question.id}">
        <label for="pick-${question.id}">
          <span class="muted">Q${question.id}.</span>
          ${escapeHTML(question.text)}
        </label>
      </div>
      ${checked ? `
        <div class="answer-key">
          <label for="correct-${question.id}">Which answer is correct?</label>
          <select id="correct-${question.id}"
            data-action="set-answer"
            data-id="${question.id}">
            <option value="">Choose the correct answer</option>
            ${question.options.map((option, index) => `
              <option value="${index}"
                ${String(correct) === String(index) ? "selected" : ""}>
                ${escapeHTML(option)}
              </option>
            `).join("")}
          </select>
        </div>
      ` : ""}
    </div>
  `;
}

function renderHome() {
  currentView = "home";
  const data = loadData();

  app.innerHTML = `
    <section class="hero">
      <div class="eyebrow">✿ THE FRIENDSHIP TEST ✿</div>
      <div class="hero-art">💌 🧸 💗</div>
      <h1>How well do you<br><span>know me?</span></h1>
      <p class="muted">
        A little quiz, a lot of memories, and a tiny test
        of your bestie knowledge.
      </p>
      <div class="button-row">
        <button class="primary-button" data-action="create">
          + Create my quiz
        </button>
        <button class="secondary-button" data-action="enter-code">
          Take a quiz
        </button>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>♡ Your quizzes</h2>
        <span class="counter">${data.quizzes.length} saved</span>
      </div>
      ${data.quizzes.length ? data.quizzes.map(quiz => `
        <div class="quiz-item">
          <div>
            <h3>${escapeHTML(quiz.name)}</h3>
            <p class="muted">${quiz.questions.length} questions · Code
              <span class="code">${escapeHTML(quiz.code)}</span>
            </p>
          </div>
          <div class="quiz-actions">
            <button class="primary-button" data-action="play"
              data-code="${escapeHTML(quiz.code)}">Take quiz</button>
            <button class="secondary-button" data-action="share"
              data-code="${escapeHTML(quiz.code)}">Share</button>
          </div>
        </div>
      `).join("") : `
        <div class="empty">
          <div style="font-size:32px">🌷</div>
          No quizzes yet. Make your first one!
        </div>
      `}
    </section>

    <section class="card">
      <div class="section-head">
        <h2>🏆 Leaderboard</h2>
        <button class="secondary-button" data-action="leaderboard">View all</button>
      </div>
      <p class="muted">Your saved scores will show up here after a quiz.</p>
      ${renderTopScores(data.results)}
    </section>

    <div id="message" class="${messageType}" ${message ? "" : "hidden"}>${escapeHTML(message)}</div>
    <div class="notice">
      ✨ This version saves data only in this browser on this device.
      Online sharing comes in Day 2.
    </div>
  `;
}

function renderTopScores(results) {
  if (!results.length) {
    return `<p class="empty">No scores yet. Be the first! ♡</p>`;
  }

  return [...results]
    .sort((a, b) => b.percent - a.percent || b.date - a.date)
    .slice(0, 3)
    .map((result, index) => `
      <div class="quiz-item">
        <div>
          <strong>${index + 1}. ${escapeHTML(result.player)}</strong>
          <p class="muted">${escapeHTML(result.quizName)}</p>
        </div>
        <span class="code">${result.score}/${result.total} · ${result.percent}%</span>
      </div>
    `).join("");
}

function renderCreate() {
  currentView = "create";

  app.innerHTML = `
    <section class="card">
      <div class="section-head">
        <div>
          <div class="eyebrow">LET'S MAKE ONE ♡</div>
          <h2 style="margin-top:12px">Create your quiz</h2>
          <p class="muted">Make it personal. See who really knows you.</p>
        </div>
      </div>

      <div class="field">
        <label for="quiz-name">Quiz title</label>
        <input id="quiz-name" type="text" maxlength="60"
          placeholder="e.g. How well do you know me?"
          value="${escapeHTML(draftName)}">
      </div>

      <div class="section-head">
        <h3>Choose your questions</h3>
        <span id="question-counter" class="counter">
          ${selectedQuestions.length}/10 selected
        </span>
      </div>
      <p class="hint">
        Pick 1–10 questions. For each one, choose the correct answer.
        Uncheck a question to replace it with another.
      </p>

      <div id="question-list">
        ${QUESTION_BANK.map(questionCard).join("")}
      </div>

      <div id="message" class="${messageType}" ${message ? "" : "hidden"}>${escapeHTML(message)}</div>

      <div class="button-row" style="margin-top:22px">
        <button class="secondary-button" data-action="home">Cancel</button>
        <button class="primary-button" data-action="save-quiz">Save my quiz ♡</button>
      </div>
    </section>
  `;
}

function renderCodeEntry() {
  currentView = "code";
  app.innerHTML = `
    <section class="card">
      <div class="eyebrow">JOIN THE FUN ♡</div>
      <h2 style="margin-top:12px">Take a friend's quiz</h2>
      <p class="muted">Enter the six-character quiz code.</p>
      <form id="code-form">
        <div class="field">
          <label for="quiz-code">Quiz code</label>
          <input id="quiz-code" type="text" maxlength="6"
            placeholder="ABC123" autocomplete="off" required>
        </div>
        <div id="message" class="${messageType}" ${message ? "" : "hidden"}>${escapeHTML(message)}</div>
        <div class="button-row">
          <button type="button" class="secondary-button" data-action="home">Back</button>
          <button type="submit" class="primary-button">Find quiz</button>
        </div>
      </form>
      <div class="notice">Local demo: the code works only where the quiz is saved.</div>
    </section>
  `;
}

function startQuiz(code) {
  const data = loadData();
  const quiz = data.quizzes.find(item =>
    item.code.toUpperCase() === String(code).trim().toUpperCase()
  );

  if (!quiz) {
    currentView = "code";
    renderCodeEntry();
    showMessage("Quiz not found. Check the code and try again.");
    return;
  }

  quizInProgress = quiz;
  quizAnswers = {};
  renderTakeQuiz();
}

function renderTakeQuiz() {
  currentView = "take";

  app.innerHTML = `
    <section class="card">
      <div class="eyebrow">BESTIE QUIZ ♡</div>
      <h2 style="margin-top:12px">${escapeHTML(quizInProgress.name)}</h2>
      <p class="muted">Code: <span class="code">${escapeHTML(quizInProgress.code)}</span></p>

      <form id="take-form">
        <div class="field">
          <label for="player-name">Your name or nickname</label>
          <input id="player-name" type="text" maxlength="30"
            placeholder="What should we call you?" required>
        </div>

        ${quizInProgress.questions.map((item, index) => {
          const question = getQuestion(item.id);
          if (!question) return "";

          return `
            <div class="quiz-question">
              <h3>${index + 1}. ${escapeHTML(question.text)}</h3>
              ${question.options.map((option, optionIndex) => `
                <label class="option">
                  <input type="radio" name="q-${question.id}"
                    value="${optionIndex}"
                    ${String(quizAnswers[question.id]) === String(optionIndex) ? "checked" : ""}
                    required>
                  <span>${escapeHTML(option)}</span>
                </label>
              `).join("")}
            </div>
          `;
        }).join("")}

        <div id="message" class="${messageType}" ${message ? "" : "hidden"}>${escapeHTML(message)}</div>
        <div class="button-row" style="margin-top:20px">
          <button type="button" class="secondary-button" data-action="home">Cancel</button>
          <button type="submit" class="primary-button">See my score ✨</button>
        </div>
      </form>
    </section>
  `;
}

function submitQuiz(form) {
  const player = form.querySelector("#player-name").value.trim();

  if (!player) {
    showMessage("Enter your name first.");
    return;
  }

  let score = 0;
  const total = quizInProgress.questions.length;

  for (const item of quizInProgress.questions) {
    const chosen = form.querySelector(
      `input[name="q-${item.id}"]:checked`
    );

    if (!chosen) {
      showMessage("Answer every question before submitting.");
      return;
    }

    quizAnswers[item.id] = Number(chosen.value);

    if (Number(chosen.value) === Number(item.correct)) {
      score++;
    }
  }

  const data = loadData();
  data.results.push({
    player: player,
    quizName: quizInProgress.name,
    code: quizInProgress.code,
    score: score,
    total: total,
    percent: Math.round((score / total) * 100),
    date: Date.now()
  });

  if (!saveData(data)) return;
  renderResults(player, score, total);
}

function renderResults(player, score, total) {
  currentView = "results";
  const percent = Math.round((score / total) * 100);
  let reaction = "Keep learning about each other! ♡";

  if (percent === 100) reaction = "BESTIE EXPERT. YOU KNOW EVERYTHING! 💗";
  else if (percent >= 70) reaction = "Okayyy, you know them pretty well! ✨";
  else if (percent >= 40) reaction = "Some lore is still missing... 👀";

  app.innerHTML = `
    <section class="card score">
      <div class="hero-art">💌</div>
      <div class="eyebrow">QUIZ COMPLETE</div>
      <h2 style="margin-top:14px">${escapeHTML(player)}, your result is in!</h2>
      <div class="score-number">${score}/${total}</div>
      <h2>${percent}%</h2>
      <p>${reaction}</p>
      <p class="muted">Your score has been saved to this device's leaderboard.</p>
      <div class="button-row">
        <button class="primary-button" data-action="leaderboard">Leaderboard 🏆</button>
        <button class="secondary-button" data-action="home">Home</button>
      </div>
    </section>
  `;
}

function renderLeaderboard() {
  currentView = "leaderboard";
  const data = loadData();
  const results = [...data.results].sort(
    (a, b) => b.percent - a.percent || b.date - a.date
  );

  app.innerHTML = `
    <section class="card">
      <div class="eyebrow">THE BESTIES HALL OF FAME</div>
      <h2 style="margin-top:12px">🏆 Leaderboard</h2>
      <p class="muted">Ranked by percentage, with earlier scores winning ties.</p>
      ${results.length ? results.map((result, index) => `
        <div class="quiz-item">
          <div>
            <strong>${index + 1}. ${escapeHTML(result.player)}</strong>
            <p class="muted">${escapeHTML(result.quizName)}</p>
          </div>
          <span class="code">${result.score}/${result.total} · ${result.percent}%</span>
        </div>
      `).join("") : `<div class="empty">No scores yet. Take a quiz first! ♡</div>`}
      <div class="button-row" style="margin-top:22px">
        <button class="primary-button" data-action="home">Back home</button>
      </div>
    </section>
  `;
}

function saveQuiz() {
  clearMessage();

  const nameInput = document.getElementById("quiz-name");
  draftName = nameInput ? nameInput.value.trim() : draftName;

  if (!draftName) {
    showMessage("Give your quiz a title first.");
    return;
  }

  if (selectedQuestions.length < 1 || selectedQuestions.length > 10) {
    showMessage("Choose between 1 and 10 questions.");
    return;
  }

  for (const id of selectedQuestions) {
    if (answerKey[id] === undefined || answerKey[id] === "") {
      showMessage("Choose the correct answer for every selected question.");
      return;
    }
  }

  const data = loadData();
  const quiz = {
    name: draftName,
    code: makeCode(),
    questions: selectedQuestions.map(id => ({
      id: id,
      correct: Number(answerKey[id])
    })),
    createdAt: Date.now()
  };

  data.quizzes.push(quiz);
  if (!saveData(data)) return;

  selectedQuestions = [];
  answerKey = {};
  draftName = "";
  message = "";
  renderHome();
  showMessage(`Quiz saved! Your code is ${quiz.code}.`, "success");
}

function shareQuiz(code) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("code", code);

  const shareText = `Take my Bestie Quiz! Code: ${code}\n${url.href}\n\nNote: this demo link only works on the device where the quiz is saved.`;

  if (navigator.share) {
    navigator.share({
      title: "My Bestie Quiz",
      text: shareText
    }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareText)
      .then(() => showMessage("Share text copied! Remember, the quiz is local for now.", "success"))
      .catch(() => showMessage(shareText, "success"));
  } else {
    showMessage(shareText, "success");
  }
}

app.addEventListener("change", event => {
  const target = event.target;

  if (target.dataset.action === "toggle-question") {
    const id = Number(target.dataset.id);

    if (target.checked) {
      if (selectedQuestions.length >= 10) {
        target.checked = false;
        showMessage("Maximum 10 questions! Unselect one to replace it.");
        return;
      }
      selectedQuestions.push(id);
    } else {
      selectedQuestions = selectedQuestions.filter(item => item !== id);
      delete answerKey[id];
    }

    clearMessage();
    renderCreate();
  }

  if (target.dataset.action === "set-answer") {
    answerKey[Number(target.dataset.id)] = target.value;
    clearMessage();
  }
});

app.addEventListener("input", event => {
  if (event.target.id === "quiz-name") {
    draftName = event.target.value;
  }
});

app.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "home") {
    message = "";
    renderHome();
  } else if (action === "create") {
    selectedQuestions = [];
    answerKey = {};
    draftName = "";
    message = "";
    renderCreate();
  } else if (action === "enter-code") {
    message = "";
    renderCodeEntry();
  } else if (action === "save-quiz") {
    saveQuiz();
  } else if (action === "play") {
    startQuiz(button.dataset.code);
  } else if (action === "share") {
    shareQuiz(button.dataset.code);
  } else if (action === "leaderboard") {
    renderLeaderboard();
  }
});

app.addEventListener("submit", event => {
  event.preventDefault();

  if (event.target.id === "code-form") {
    const code = document.getElementById("quiz-code").value;
    startQuiz(code);
  }

  if (event.target.id === "take-form") {
    submitQuiz(event.target);
  }
});

function boot() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    renderCodeEntry();
    document.getElementById("quiz-code").value = code.toUpperCase();
    showMessage("This code works only if the quiz exists in this browser.", "success");
  } else {
    renderHome();
  }
}

boot();
