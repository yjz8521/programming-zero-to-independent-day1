(() => {
  "use strict";

  const STORAGE_KEY = "pzi-share-day1-v1";
  const steps = ["welcome", "concepts", "practice", "quiz", "reflection"];
  const expectedOrder = ["repo", "month", "week", "day"];
  const expectedOutput = "Python\n\nZero to Independent";
  const quizAnswers = {
    q1: "folder",
    q2: "py",
    q3: "comment",
    q4: "show",
    q5: "try",
  };
  const quizOptionLabels = {
    q1: { file: "File", folder: "Folder / Directory", program: "Program" },
    q2: { day01: "`day01.md`", py: "`py hello.py`", month: "`month01`" },
    q3: { print: '`print("Hello")`', comment: '`# print("Hello")`', blank: "`print()`" },
    q4: { show: "把內容顯示在 output", save: "把內容保存成 file", move: "把資料夾移動到別處" },
    q5: { answer: "立刻要求完整答案", try: "先獨立分析與嘗試 20 分鐘", skip: "直接跳到下一週" },
  };

  const defaultState = {
    current: "welcome",
    completed: {},
    classification: { selected: "", attempts: 0, passed: false },
    order: { attempts: 0, passed: false },
    output: { attempts: 0, passed: false, answer: "", answerRevealed: false },
    quiz: { score: null, passed: false, answers: {} },
    reflection: { learned: "", confused: "", nextStep: "" },
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return clone(defaultState);
      return {
        ...clone(defaultState),
        ...saved,
        completed: { ...defaultState.completed, ...(saved.completed || {}) },
        classification: { ...defaultState.classification, ...(saved.classification || {}) },
        order: { ...defaultState.order, ...(saved.order || {}) },
        output: { ...defaultState.output, ...(saved.output || {}) },
        quiz: {
          ...defaultState.quiz,
          ...(saved.quiz || {}),
          answers: { ...defaultState.quiz.answers, ...((saved.quiz || {}).answers || {}) },
        },
        reflection: { ...defaultState.reflection, ...(saved.reflection || {}) },
      };
    } catch {
      return clone(defaultState);
    }
  }

  let state = loadState();

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  function saveState(message = "進度已保存於這台裝置") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const saveStatus = $("#saveStatus");
      if (saveStatus) saveStatus.textContent = message;
    } catch {
      const saveStatus = $("#saveStatus");
      if (saveStatus) saveStatus.textContent = "瀏覽器未允許本機保存";
    }
  }

  function markComplete(step) {
    state.completed[step] = true;
    updateProgress();
  }

  function updateProgress() {
    const completed = steps.filter((step) => state.completed[step]).length;
    const percentage = Math.round((completed / steps.length) * 100);
    $("#progressFill").style.setProperty("--progress-scale", String(percentage / 100));
    $("#progressText").textContent = `${percentage}%`;
    const messages = [
      "先完成開始頁，慢慢來。",
      "很好，你已留下第一個學習證據。",
      "名詞開始有位置了，繼續用題目驗證。",
      "你正在把想法變成可檢查的步驟。",
      "完成小測驗後，留下自己的反思。",
      "Day 1 完成；下一步是正式 Day 2。",
    ];
    $("#progressMessage").textContent = messages[Math.min(completed, messages.length - 1)];

    $$(".nav-item").forEach((item) => {
      const step = item.dataset.step;
      item.classList.toggle("is-done", Boolean(state.completed[step]));
      item.querySelector(".nav-check").textContent = state.completed[step] ? "✓" : "○";
    });
  }

  function showPanel(panelName, focus = true) {
    if (!steps.includes(panelName)) return;
    state.current = panelName;
    $$(".lesson-panel").forEach((panel) => {
      const isCurrent = panel.dataset.panel === panelName;
      panel.hidden = !isCurrent;
      panel.classList.toggle("is-visible", isCurrent);
    });
    $$(".nav-item").forEach((item) => {
      const isCurrent = item.dataset.step === panelName;
      item.classList.toggle("is-active", isCurrent);
      item.setAttribute("aria-current", isCurrent ? "step" : "false");
    });
    if (focus) $("[data-panel='" + panelName + "']")?.focus({ preventScroll: true });
    history.replaceState(null, "", `#${panelName}`);
    saveState();
  }

  function setFeedback(selector, message, kind = "info") {
    const element = $(selector);
    element.textContent = message;
    element.className = `feedback is-visible is-${kind}`;
  }

  function clearFeedback(selector) {
    const element = $(selector);
    element.textContent = "";
    element.className = "feedback";
  }

  function normalizedOutput(value) {
    return value.replace(/\r\n/g, "\n").replace(/\n+$/g, "");
  }

  function maybeCompletePractice() {
    if (state.order.passed && state.output.passed) {
      markComplete("practice");
      setFeedback("#outputFeedback", "兩個練習都通過了。你已經留下「先預測，再驗證」的證據。", "success");
    }
  }

  function restoreInputs() {
    const selected = state.classification.selected;
    $$(".choice-button").forEach((button) => {
      const isSelected = button.dataset.classification === selected;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
    $$(".step-select").forEach((select, index) => {
      select.value = state.order.values?.[index] || "";
    });
    $("#outputAnswer").value = state.output.answer || "";
    $("#showOutputAnswer").hidden = !state.output.answerRevealed;
    $("#outputAnswerReview").hidden = !state.output.answerRevealed;
    $$("#quizForm input[type='radio']").forEach((input) => {
      input.checked = state.quiz.answers?.[input.name] === input.value;
    });
    if (state.quiz.score !== null) $("#quizScore").textContent = `得分 ${state.quiz.score} / 5`;
    renderQuizReview();
    $("#learned").value = state.reflection.learned || "";
    $("#confused").value = state.reflection.confused || "";
    $("#nextStep").value = state.reflection.nextStep || "";
  }

  function checkClassification() {
    const value = state.classification.selected;
    if (!value) {
      setFeedback("#classificationFeedback", "先選一個選項，再寫下你採用的分類角度。", "info");
      return;
    }
    state.classification.attempts += 1;
    if (value === "File") {
      state.classification.passed = true;
      markComplete("concepts");
      setFeedback("#classificationFeedback", "正確。`day01.md` 是保存教材內容的檔案；`month01` 才是整理檔案的資料夾。請用自己的話再說一次。", "success");
    } else {
      setFeedback("#classificationFeedback", "還沒對上。想想看：這個名稱本身是內容、容器、程式，還是交給 Shell 的要求？先看它的副檔名與用途。", "error");
    }
    saveState();
  }

  function showClassificationHint() {
    if (state.classification.attempts < 2) {
      setFeedback("#classificationFeedback", "Level 1 方向：分類時先問「它是被保存的內容，還是用來裝其他東西的容器？」", "info");
    } else {
      setFeedback("#classificationFeedback", "Level 2 方向：`.md` 是檔名的一部分；再把檔案、資料夾、執行中的程式與 command 分開比較。", "info");
    }
  }

  function checkOrder() {
    const values = $$(".step-select").map((select) => select.value);
    state.order.values = values;
    if (values.some((value) => !value)) {
      setFeedback("#orderFeedback", "四個位置都要先選一個步驟；不確定時先寫出你的猜想。", "info");
      return;
    }
    state.order.attempts += 1;
    if (values.every((value, index) => value === expectedOrder[index])) {
      state.order.passed = true;
      setFeedback("#orderFeedback", "順序合理。你先確認起點，再逐層走進資料夾，最後才開啟檔案。", "success");
      maybeCompletePractice();
    } else {
      setFeedback("#orderFeedback", "順序還需要檢查。從一個人完全不知道資料夾位置開始想：沒有進入上一層，就不能直接找到下一層。", "error");
    }
    saveState();
  }

  function showOrderHint() {
    if (state.order.attempts < 2) {
      setFeedback("#orderFeedback", "Level 1 方向：先確認自己站在哪裡，再一次進入一層資料夾；檔案永遠是最後才開啟。", "info");
    } else {
      setFeedback("#orderFeedback", "Level 2 方向：Repository → month01 → week01 → day01.md。請自己把這個方向填入四個位置。", "info");
    }
  }

  function checkOutput() {
    const answer = $("#outputAnswer").value;
    state.output.answer = answer;
    state.output.attempts += 1;
    if (normalizedOutput(answer) === expectedOutput) {
      state.output.passed = true;
      state.output.answerRevealed = false;
      $("#showOutputAnswer").hidden = true;
      $("#outputAnswerReview").hidden = true;
      setFeedback("#outputFeedback", "正確。你保留了 `print()` 產生的空白行，也沒有把 comment 當成 output。", "success");
      maybeCompletePractice();
    } else {
      state.output.passed = false;
      $("#showOutputAnswer").hidden = false;
      setFeedback("#outputFeedback", "還不一致。你目前填入的是 output 以外的內容，請檢查：comment 不會顯示、空白 `print()` 會留下空白行，而且 output 不會包含程式碼本身。", "error");
    }
    saveState();
  }

  function showOutputHint() {
    if (state.output.attempts < 2) {
      setFeedback("#outputFeedback", "Level 1 方向：comment 不會顯示；`print()` 沒有文字時，仍然會執行一個可觀察的輸出動作。", "info");
    } else {
      setFeedback("#outputFeedback", "Level 2 方向：把 output 想成四個程式行為的結果，第二個行為不是可見文字，而是一個空白行。", "info");
    }
  }

  function showOutputAnswer() {
    state.output.answerRevealed = true;
    $("#outputAnswerReview").hidden = false;
    $("#showOutputAnswer").hidden = false;
    saveState("正確 output 已顯示");
  }

  function clearQuizReview() {
    $$(".quiz-question").forEach((question) => {
      question.classList.remove("is-correct", "is-wrong");
      question.querySelectorAll("label").forEach((label) => {
        label.classList.remove("is-correct-option", "is-wrong-option");
      });
      const feedback = $("[data-question-feedback]", question);
      if (feedback) feedback.textContent = "";
    });
  }

  function renderQuizReview() {
    clearQuizReview();
    if (state.quiz.score === null) return;
    $$(".quiz-question").forEach((question) => {
      const name = question.dataset.question;
      const expected = quizAnswers[name];
      const selected = state.quiz.answers?.[name] || "";
      const feedback = $("[data-question-feedback]", question);
      const labels = quizOptionLabels[name] || {};
      question.querySelectorAll("label").forEach((label) => {
        const input = $("input", label);
        if (!input) return;
        if (input.value === expected) label.classList.add("is-correct-option");
        if (selected && input.value === selected && selected !== expected) label.classList.add("is-wrong-option");
      });
      if (selected === expected) {
        question.classList.add("is-correct");
        feedback.textContent = "✓ 正確";
      } else if (selected) {
        question.classList.add("is-wrong");
        feedback.textContent = `✗ 你選的是：${labels[selected] || selected}；正確答案：${labels[expected] || expected}`;
      } else {
        question.classList.add("is-wrong");
        feedback.textContent = `✗ 尚未作答；正確答案：${labels[expected] || expected}`;
      }
    });
  }

  function checkQuiz(event) {
    event.preventDefault();
    let score = 0;
    state.quiz.answers = {};
    Object.entries(quizAnswers).forEach(([name, answer]) => {
      const selected = $("input[name='" + name + "']:checked");
      if (selected) state.quiz.answers[name] = selected.value;
      if (selected?.value === answer) score += 1;
    });
    state.quiz.score = score;
    state.quiz.passed = score >= 4;
    $("#quizScore").textContent = `得分 ${score} / 5`;
    renderQuizReview();
    if (state.quiz.passed) {
      markComplete("quiz");
      setFeedback("#quizFeedback", "Checkpoint 通過。錯的題目也請回頭說明原因，不要只記分數。", "success");
    } else {
      setFeedback("#quizFeedback", "先不要急著重做。回到題目，找出是哪一個名詞或規則還沒有證據，再重新回答。4 / 5 才算通過這個 checkpoint。", "error");
    }
    saveState();
  }

  function saveReflection(event) {
    event.preventDefault();
    state.reflection = {
      learned: $("#learned").value.trim(),
      confused: $("#confused").value.trim(),
      nextStep: $("#nextStep").value.trim(),
    };
    if (!state.reflection.learned || !state.reflection.confused || !state.reflection.nextStep) {
      $("#reflectionStatus").textContent = "三個欄位都先寫一點，空白也可以寫「目前沒有」。";
      saveState();
      return;
    }
    markComplete("reflection");
    $("#reflectionStatus").textContent = "反思已保存";
    if (steps.every((step) => state.completed[step])) {
      $("#completionBanner").hidden = false;
    } else {
      $("#completionBanner").hidden = true;
      $("#reflectionStatus").textContent = "反思已保存；請完成前面尚未通過的 checkpoint。";
    }
    saveState("反思與進度已保存");
  }

  function bindNavigation() {
    $$(".nav-item").forEach((button) => {
      button.addEventListener("click", () => showPanel(button.dataset.step));
    });
    $$('[data-next]').forEach((button) => {
      button.addEventListener("click", () => {
        if (state.current === "welcome") markComplete("welcome");
        showPanel(button.dataset.next);
        saveState();
      });
    });
    $$('[data-prev]').forEach((button) => {
      button.addEventListener("click", () => showPanel(button.dataset.prev));
    });
  }

  function bindInteractions() {
    $$(".choice-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.classification.selected = button.dataset.classification;
        $$(".choice-button").forEach((other) => {
          const selected = other === button;
          other.classList.toggle("is-selected", selected);
          other.setAttribute("aria-pressed", String(selected));
        });
        clearFeedback("#classificationFeedback");
        saveState();
      });
    });
    $("#checkClassification").addEventListener("click", checkClassification);
    $("#classificationHint").addEventListener("click", showClassificationHint);
    $("#checkOrder").addEventListener("click", checkOrder);
    $("#orderHint").addEventListener("click", showOrderHint);
    $("#checkOutput").addEventListener("click", checkOutput);
    $("#outputHint").addEventListener("click", showOutputHint);
    $("#showOutputAnswer").addEventListener("click", showOutputAnswer);
    $("#quizForm").addEventListener("submit", checkQuiz);
    $$("#quizForm input[type='radio']").forEach((input) => {
      input.addEventListener("change", () => {
        state.quiz.answers[input.name] = input.value;
        if (state.quiz.score !== null) {
          state.quiz.score = null;
          state.quiz.passed = false;
          delete state.completed.quiz;
          $("#quizScore").textContent = "";
          clearQuizReview();
          updateProgress();
        }
        saveState("小測驗答案已暫存");
      });
    });
    $("#reflectionForm").addEventListener("submit", saveReflection);
    $$("#reflectionForm textarea, #outputAnswer").forEach((field) => {
      field.addEventListener("input", () => {
        if (field.id === "outputAnswer") state.output.answer = field.value;
        else state.reflection[field.id] = field.value;
        saveState("輸入已暫存");
      });
    });
    $("#resetProgress").addEventListener("click", () => {
      if (!window.confirm("要清除這台裝置上的 Day 1 進度嗎？")) return;
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
  }

  function init() {
    bindNavigation();
    bindInteractions();
    restoreInputs();
    updateProgress();
    showPanel(window.location.hash.slice(1) || state.current, false);
    if (steps.every((step) => state.completed[step])) $("#completionBanner").hidden = false;
  }

  init();
})();
