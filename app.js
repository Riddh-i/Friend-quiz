
(() => {
  "use strict";

  const STORAGE_KEY = "bestieQuizData_v1";
  const app = document.getElementById("app");

  if (!app) {
    document.body.innerHTML =
      "<h2>App setup error</h2><p>index.html needs an element with id=\"app\".</p>";
    return;
  }

  const BANK =
    typeof QUESTION_BANK !== "undefined" &&
    Array.isArray(QUESTION_BANK)
      ? QUESTION_BANK
      : [];

  let currentCode = "";
  let message = "";

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.quizzes)) return saved;
    } catch (error) {
      console.error("Could not read saved quizzes:", error);
    }
    return { quizzes: [] };
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Could not save quizzes:", error);
      alert("Couldn't save. Your device storage may be full.");
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const data = loadData();
    let code;

    do {
      code = "";
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (data.quizzes.some(quiz => quiz.code === code));

    return code;
  }

  function getQuiz(code) {
    return loadData().quizzes.find(
      quiz => quiz.code === String(code).toUpperCase()
    );
  }

  function showMessage(text) {
    message = text;
    const area = document.getElementById("app-message");
    if (area) area.textContent = text;
  }

  function shell(content) {
    app.innerHTML = `
      <div style="max-width:760px;margin:0 auto;padding:20px;
                  font-family:system-ui,sans-serif;color:#30263d;">
        <header style="text-align:center;margin-bottom:24px;">
          <button type="button" data-action="home"
            style="border:0;background:none;font-size:28px;
                   font-weight:800;color:#9b65bd;cursor:pointer;">
            Bestie Quiz ♡
          </button>
          <p style="margin:4px 0;color:#76677f;">
            How well do your friends know you?
          </p>
        </header>
        ${content}
        <p id="app-message" role="status"
          style="color:#79509b;text-align:center;">${escapeHTML(message)}</p>
        <footer style="text-align:center;font-size:12px;color:#887b91;
                       margin-top:28px;">
          Local demo · Quizzes are saved on this device
        </footer>
      </div>`;

    message = "";
  }

  function card(content) {
    return `<section style="background:#fff;border:1px solid #eadcf3;
      border-radius:18px;padding:18px;margin:14px 0;
      box-shadow:0 4px 16px #6f4b8310;">${content}</section>`;
  }

  function button(label, action, extra = "") {
    return `<button type="button" data-action="${action}" ${extra}
      style="border:0;border-radius:12px;padding:12px 16px;
      margin:5px;background:#9c6bc0;color:white;font-weight:700;
      cursor:pointer;">${label}</button>`;
  }

  function home() {
    currentCode = "";
    const data = loadData();

    const quizzes = data.quizzes.map(quiz => {
      quiz.results = Array.isArray(quiz.results) ? quiz.results : [];
      return card(`
      <h3>${escapeHTML(quiz.title)}</h3>
      <p>Code: <strong>${escapeHTML(quiz.code)}</strong></p>
      <p>${quiz.results.length} response(s)</p>
      ${button("Creator dashboard", "manage", `data-code="${quiz.code}"`)}
      ${button("Copy quiz code", "share", `data-code="${quiz.code}"`)}
          `);
    }).join("");

    shell(`
      ${card(`
        <h2>Welcome, bestie! 💌</h2>
        <p>Create a friendship quiz or answer one made by a friend.</p>
        ${button("＋ Create a quiz", "create")}
        ${button("♡ Take a friend's quiz", "enter-code")}
      `)}
      ${quizzes ? `<h2>Your quizzes on this device</h2>${quizzes}` : ""}
      ${card(`
        <h3>Already have a quiz code?</h3>
        <form id="code-form">
          <label for="quiz-code">Enter the 6-character code</label>
          <input id="quiz-code" name="code" maxlength="6"
            required placeholder="ABC123"
            style="box-sizing:border-box;width:100%;padding:12px;
                   margin:10px 0;border:1px solid #d9c4e8;border-radius:10px;">
          <button type="submit"
            style="border:0;border-radius:12px;padding:12px 16px;
            background:#e8d7f5;color:#49315b;font-weight:700;">
            Find quiz
          </button>
        </form>
      `)}
    `);
  }

  function createScreen() {
    if (!BANK.length) {
      shell(card(`
        <h2>Question bank not loaded</h2>
        <p>Check that questions.js is in the same folder as index.html
        and that it loads before app.js.</p>
        ${button("Back home", "home")}
      `));
      return;
    }

    const questionCards = BANK.map((q, index) => {
      const id = String(q.id ?? index);
      const options = Array.isArray(q.options) ? q.options : [];

      return card(`
        <label style="display:flex;gap:10px;align-items:flex-start;">
          <input type="checkbox" name="question" value="${escapeHTML(id)}"
            ${index < 5 ? "checked" : ""}
            style="margin-top:5px;">
          <strong>${escapeHTML(q.text || "Question")}</strong>
        </label>
        <label style="display:block;margin-top:12px;">
          Correct answer:
          <select name="correct-${escapeHTML(id)}"
            style="width:100%;padding:10px;margin-top:6px;
                   border:1px solid #d9c4e8;border-radius:10px;">
            ${options.map((option, i) => `
              <option value="${i}">${escapeHTML(option)}</option>
            `).join("")}
          </select>
        </label>
      `);
    }).join("");

    shell(`
      ${card(`
        <h2>Create your bestie quiz ✨</h2>
        <form id="create-form">
          <label for="quiz-title">Quiz title</label>
          <input id="quiz-title" name="title" required maxlength="60"
            placeholder="How well do you know me?"
            style="box-sizing:border-box;width:100%;padding:12px;
                   margin:8px 0 16px;border:1px solid #d9c4e8;border-radius:10px;">

          <label for="creator-name">Your name or nickname</label>
          <input id="creator-name" name="creator" required maxlength="40"
            placeholder="Your nickname"
            style="box-sizing:border-box;width:100%;padding:12px;
                   margin:8px 0 16px;border:1px solid #d9c4e8;border-radius:10px;">

          <p>Choose 1–10 questions and select the correct answer for each.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${button("Select first 5", "select-five")}
            ${button("Clear selection", "clear-selection")}
          </div>

          <div id="question-list">${questionCards}</div>

          <button type="submit"
            style="width:100%;border:0;border-radius:12px;padding:14px;
            background:#9c6bc0;color:white;font-weight:800;margin-top:14px;">
            Create my quiz ♡
          </button>
        </form>
      `)}
      ${button("Cancel", "home")}
    `);
  }

  function saveQuiz(form) {
    const formData = new FormData(form);
    const chosen = formData.getAll("question").map(String);

    if (chosen.length < 1 || chosen.length > 10) {
      alert("Choose between 1 and 10 questions.");
      return;
    }

    const questions = chosen.map(id => {
      const source = BANK.find(q => String(q.id) === id);
      if (!source) return null;

      return {
        id,
        text: String(source.text || "Question"),
        options: Array.isArray(source.options)
          ? source.options.map(String)
          : [],
        correctIndex: Number(formData.get(`correct-${id}`) || 0)
      };
    }).filter(q => q && q.options.length > 1);

    if (questions.length !== chosen.length) {
      alert("One or more questions couldn't be loaded. Please try again.");
      return;
    }

    const data = loadData();
    const quiz = {
      code: makeCode(),
      title: String(formData.get("title") || "My Bestie Quiz").trim(),
      creator: String(formData.get("creator") || "Bestie").trim(),
      questions,
      results: [],
      createdAt: Date.now()
    };

    data.quizzes.push(quiz);

    if (!saveData(data)) return;

    currentCode = quiz.code;
    creatorDashboard(quiz.code);
  }

  function enterCodeScreen() {
    shell(card(`
      <h2>Enter your friend's code 💌</h2>
      <form id="code-form">
        <input name="code" required maxlength="6" placeholder="ABC123"
          aria-label="Quiz code"
          style="box-sizing:border-box;width:100%;padding:12px;
          margin:10px 0;border:1px solid #d9c4e8;border-radius:10px;">
        <button type="submit"
          style="border:0;border-radius:12px;padding:12px 16px;
          background:#9c6bc0;color:white;font-weight:700;">Continue</button>
      </form>
    `) + button("Back home", "home"));
  }

  function takeQuiz(code) {
    const quiz = getQuiz(code);

    if (!quiz) {
      home();
      showMessage("We couldn't find that quiz on this device.");
      return;
    }

    currentCode = quiz.code;

    shell(card(`
      <h2>${escapeHTML(quiz.title)}</h2>
      <p>Made by ${escapeHTML(quiz.creator)}</p>
      <form id="take-form" data-code="${quiz.code}">
        <label for="respondent">Your name or nickname</label>
        <input id="respondent" name="respondent" required maxlength="40"
          placeholder="Your nickname"
          style="box-sizing:border-box;width:100%;padding:12px;
          margin:8px 0 16px;border:1px solid #d9c4e8;border-radius:10px;">

        ${quiz.questions.map((q, index) => `
          <div style="padding:14px 0;border-top:1px solid #eee3f5;">
            <p><strong>${index + 1}. ${escapeHTML(q.text)}</strong></p>
            ${q.options.map((option, i) => `
              <label style="display:flex;gap:8px;padding:7px 0;">
                <input type="radio" name="answer-${escapeHTML(q.id)}"
                  value="${i}" required>
                <span>${escapeHTML(option)}</span>
              </label>
            `).join("")}
          </div>
        `).join("")}

        <button type="submit"
          style="width:100%;border:0;border-radius:12px;padding:14px;
          background:#9c6bc0;color:white;font-weight:800;">Submit answers ♡</button>
      </form>
    `) + button("Back home", "home"));
  }

  function submitQuiz(form) {
    const code = form.dataset.code;
    const quiz = getQuiz(code);

    if (!quiz) {
      home();
      showMessage("Quiz not found.");
      return;
    }

    const formData = new FormData(form);
    const respondent = String(formData.get("respondent") || "").trim();

    const answers = quiz.questions.map(q => {
      const selectedIndex = Number(formData.get(`answer-${q.id}`));

      return {
        questionId: q.id,
        questionText: q.text,
        selectedIndex,
        selectedText: q.options[selectedIndex],
        correctIndex: q.correctIndex,
        correctText: q.options[q.correctIndex],
        isCorrect: selectedIndex === q.correctIndex
      };
    });

    const score = answers.filter(answer => answer.isCorrect).length;
    const data = loadData();
    const storedQuiz = data.quizzes.find(item => item.code === quiz.code);

    if (!storedQuiz) {
      home();
      showMessage("Quiz not found.");
      return;
    }

    storedQuiz.results.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      respondent,
      score,
      total: quiz.questions.length,
      answers,
      submittedAt: Date.now()
    });

    if (!saveData(data)) return;

    shell(card(`
      <h2>Answers submitted! 🎉</h2>
      <p>You've finished <strong>${escapeHTML(quiz.title)}</strong>.</p>
      <p>Your score: <strong>${score} / ${quiz.questions.length}</strong></p>
      <p>Your friend can see your result in their creator dashboard on this device.</p>
    `) + button("Back home", "home"));
  }

  function creatorDashboard(code) {
    const quiz = getQuiz(code);

    if (!quiz) {
      home();
      showMessage("Quiz not found.");
      return;
    }

    currentCode = quiz.code;

    const results = [...quiz.results].reverse();

    shell(`
      ${card(`
        <h2>${escapeHTML(quiz.title)}</h2>
        <p>Creator: ${escapeHTML(quiz.creator)}</p>
        <p>Quiz code: <strong style="font-size:24px;letter-spacing:3px;">
          ${quiz.code}</strong></p>
        <p>Share this code with a friend. They can answer only if their
        device has access to this quiz data.</p>
        ${button("Copy code", "share", `data-code="${quiz.code}"`)}
        ${button("Leaderboard", "leaderboard", `data-code="${quiz.code}"`)}
      `)}

      <h3>Responses (${results.length})</h3>

      ${results.length ? results.map(result => card(`
        <strong>${escapeHTML(result.respondent)}</strong>
        <p>Score: ${result.score} / ${result.total}</p>
        <p style="font-size:12px;color:#887b91;">
          ${new Date(result.submittedAt).toLocaleString()}
        </p>
        ${button("View answers", "view-answers",
          `data-code="${quiz.code}" data-result="${result.id}"`)}
        ${button("Delete score", "delete-score",
          `data-code="${quiz.code}" data-result="${result.id}"`)}
      `)).join("") : card("<p>No one has answered this quiz yet.</p>")}

      ${button("Back home", "home")}
    `);
  }

  function viewAnswers(code, resultId) {
    const quiz = getQuiz(code);
    const result = quiz?.results.find(item => item.id === resultId);

    if (!quiz || !result) {
      home();
      showMessage("That response couldn't be found.");
      return;
    }

    const answers = Array.isArray(result.answers) ? result.answers : [];

    shell(`
      ${card(`
        <h2>${escapeHTML(result.respondent)}'s answers</h2>
        <p>Score: ${result.score} / ${result.total}</p>
        ${answers.length ? answers.map((answer, index) => card(`
          <p><strong>${index + 1}. ${escapeHTML(answer.questionText)}</strong></p>
          <p>Their answer: ${escapeHTML(answer.selectedText)}</p>
          <p>Correct answer: ${escapeHTML(answer.correctText)}</p>
          <p style="color:${answer.isCorrect ? "#28734b" : "#a24a63"};">
            ${answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
          </p>
        `)).join("") : `
          <p>This response was submitted before answer tracking was added.
          Individual answers weren't saved.</p>
        `}
      `)}
      ${button("Back to dashboard", "manage", `data-code="${quiz.code}"`)}
    `);
  }

  function leaderboard(code) {
    const quiz = getQuiz(code);

    if (!quiz) {
      home();
      return;
    }

    const results = [...quiz.results].sort((a, b) =>
      b.score - a.score || a.respondent.localeCompare(b.respondent)
    );

    shell(`
      ${card(`
        <h2>Leaderboard 🏆</h2>
        <h3>${escapeHTML(quiz.title)}</h3>
        ${results.length ? results.map((result, index) => `
          <p>${index + 1}. <strong>${escapeHTML(result.respondent)}</strong>
          — ${result.score}/${result.total}</p>
        `).join("") : "<p>No scores yet.</p>"}
      `)}
      ${button("Back to dashboard", "manage", `data-code="${quiz.code}"`)}
    `);
  }

  function deleteScore(code, resultId) {
    const data = loadData();
    const quiz = data.quizzes.find(item => item.code === code);

    if (!quiz) return;

    const result = quiz.results.find(item => item.id === resultId);
    if (!result) return;

    if (!window.confirm(`Delete ${result.respondent}'s score?`)) return;

    quiz.results = quiz.results.filter(item => item.id !== resultId);

    if (saveData(data)) {
      creatorDashboard(code);
      showMessage("Score deleted.");
    }
  }

  async function shareCode(code) {
    const text = `My Bestie Quiz code is ${code}!`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showMessage("Quiz code copied! Remember, this demo stores data locally.");
      } else {
        window.prompt("Copy this quiz code and send it to your friend:", code);
      }
    } catch (error) {
      window.prompt("Copy this quiz code:", code);
    }
  }

  app.addEventListener("click", event => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    const code = target.dataset.code || currentCode;

    if (action === "home") home();
    if (action === "create") createScreen();
    if (action === "enter-code") enterCodeScreen();
    if (action === "manage") creatorDashboard(code);
    if (action === "leaderboard") leaderboard(code);
    if (action === "view-answers") {
      viewAnswers(code, target.dataset.result);
    }
    if (action === "delete-score") {
      deleteScore(code, target.dataset.result);
    }
    if (action === "share") shareCode(code);

    if (action === "select-five") {
      const boxes = app.querySelectorAll('input[name="question"]');
      boxes.forEach((box, index) => {
        box.checked = index < 5;
      });
    }

    if (action === "clear-selection") {
      app.querySelectorAll('input[name="question"]').forEach(box => {
        box.checked = false;
      });
    }
  });

  app.addEventListener("submit", event => {
    if (event.target.id === "create-form") {
      event.preventDefault();
      saveQuiz(event.target);
    }

    if (event.target.id === "code-form") {
      event.preventDefault();
      const code = String(new FormData(event.target).get("code") || "")
        .trim().toUpperCase();
      takeQuiz(code);
    }

    if (event.target.id === "take-form") {
      event.preventDefault();
      submitQuiz(event.target);
    }
  });

  // Start the app only after the HTML is ready.
  function start() {
    try {
      home();
    } catch (error) {
  app.innerHTML = `
    <div style="padding:20px;color:#b00020;">
      <h2>Startup error</h2>
      <pre style="white-space:pre-wrap;">${String(error.stack || error.message || error)}</pre>
    </div>`;
  console.error("App startup error:", error);
  return;
  app.innerHTML = `
        <div style="padding:20px;font-family:system-ui,sans-serif;">
          <h2>Oops! The app couldn't start.</h2>
          <p>Check that questions.js and app.js are saved correctly.</p>
          <button onclick="location.reload()">Reload app</button>
        </div>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
