const appEl = document.getElementById("app");

const STORAGE_KEYS = {
  records: "rfp-fit-checker-records",
  draft: "rfp-fit-checker-draft",
};

const hardFilters = [
  "No clear decision-maker with authority",
  "Budget not disclosed and client refuses to share a range",
  "Scope is wildly misaligned with core capabilities",
  "Timeline is structurally unrealistic and non-negotiable",
  "RFP language is vendor/commodity-only with no strategy component",
  "Insurance/legal requirements exceed coverage without added budget",
  "Procurement-only process with no conversation before submission",
];

const scoringQuestions = [
  { key: "strategicAlignment", label: "Strategic Alignment", weight: 20 },
  { key: "budgetAlignment", label: "Budget Alignment", weight: 20 },
  { key: "capabilityMatch", label: "Capability Match", weight: 15 },
  { key: "decisionStructure", label: "Decision Structure", weight: 15 },
  { key: "timelineFeasibility", label: "Timeline Feasibility", weight: 10 },
  { key: "proposalCostVsWinProbability", label: "Proposal Cost vs Win Probability", weight: 10 },
  { key: "relationshipAccess", label: "Relationship & Access", weight: 5 },
  { key: "riskExposure", label: "Risk Exposure", weight: 5, reverse: true },
];

const scaleOptions = [
  { value: 1, label: "1 - Very poor" },
  { value: 2, label: "2 - Weak" },
  { value: 3, label: "3 - Mixed" },
  { value: 4, label: "4 - Strong" },
  { value: 5, label: "5 - Excellent" },
];

const nextActionMap = {
  budgetAlignment: "Request a budget range before proceeding.",
  decisionStructure: "Ask for a clear decision map and approval path.",
  timelineFeasibility: "Negotiate milestone timing before committing.",
  capabilityMatch: "Decline or partner where capability gaps are critical.",
  strategicAlignment: "Reconfirm strategic objectives and expected outcomes.",
  proposalCostVsWinProbability: "Reduce proposal effort or improve win access signals.",
  relationshipAccess: "Secure conversation access to decision stakeholders.",
  riskExposure: "Tighten risk controls and legal assumptions before bidding.",
};

const state = loadDraft() || {
  stepIndex: 0,
  answers: {
    clientName: "",
    projectName: "",
    hardFilters: {},
    categoryRatings: {},
    proposalEffort: "",
    strategicOverride: "none",
    frictionForecast: "",
    notes: "",
    hardFilterRecordChoice: "yes",
    hardFilterNotes: "",
  },
  hardStop: null,
  result: null,
};

const baseSteps = [
  { id: "clientName", type: "text", question: "Client or organization name" },
  { id: "projectName", type: "text", question: "Project name or RFP title" },
  ...hardFilters.map((label, index) => ({
    id: `hardFilter_${index}`,
    type: "yesno",
    question: `Hard Filter ${String.fromCharCode(65 + index)}: ${label}?`,
    help: "If yes, this is an instant decline.",
  })),
  ...scoringQuestions.map((item) => ({
    id: `score_${item.key}`,
    type: "scale",
    question: `${item.label} (${item.weight} pts max)`,
    key: item.key,
  })),
  {
    id: "proposalEffort",
    type: "options",
    question: "How expensive is this proposal to produce?",
    options: [
      { value: "Light", label: "Light (2-4 hours)" },
      { value: "Moderate", label: "Moderate (5-10 hours)" },
      { value: "Heavy", label: "Heavy (10+ hours / custom strategy / mockups)" },
    ],
  },
  {
    id: "frictionForecast",
    type: "text",
    question: "One-sentence gut check: This project will likely feel like _____.",
  },
  { id: "notes", type: "textarea", question: "Optional notes" },
];

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.draft);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(state));
}

function getRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.records);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setRecords(records) {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
}

function resetWizard() {
  localStorage.removeItem(STORAGE_KEYS.draft);
  state.stepIndex = 0;
  state.hardStop = null;
  state.result = null;
  state.answers = {
    clientName: "",
    projectName: "",
    hardFilters: {},
    categoryRatings: {},
    proposalEffort: "",
    strategicOverride: "none",
    frictionForecast: "",
    notes: "",
    hardFilterRecordChoice: "yes",
    hardFilterNotes: "",
  };
  render();
}

function getDynamicSteps() {
  const steps = [...baseSteps];
  if (state.result && state.result.totalScore < 65 && !state.hardStop) {
    steps.push({
      id: "strategicOverride",
      type: "options",
      question: "Does a Strategic Override apply?",
      options: [
        { value: "none", label: "No override" },
        { value: "anchor", label: "Anchor client (opens new sector)" },
        { value: "portfolio", label: "Portfolio leap (category-defining visibility)" },
        { value: "relationship", label: "Relationship long game (access to target decision-maker)" },
      ],
    });
  }
  return steps;
}

function mapScaleToPoints(value, weight, reverse = false) {
  const ratio = [0, 0, 0.25, 0.5, 0.75, 1][value] || 0;
  const effective = reverse ? 1 - ratio : ratio;
  return Number((effective * weight).toFixed(2));
}

function computeResult() {
  const categoryScores = {};
  scoringQuestions.forEach((q) => {
    const rating = Number(state.answers.categoryRatings[q.key] || 1);
    categoryScores[q.key] = mapScaleToPoints(rating, q.weight, q.reverse);
  });

  const totalScore = Number(
    Object.values(categoryScores)
      .reduce((sum, val) => sum + val, 0)
      .toFixed(2)
  );

  let minBid = 80;
  let minConditional = 65;
  if (state.answers.proposalEffort === "Heavy") {
    minBid += 10;
    minConditional += 10;
  }

  const sortedByScore = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
  const topCategories = sortedByScore.slice(0, 3);
  const weakCategories = sortedByScore.slice(-3).reverse();
  const clearUpside =
    categoryScores.strategicAlignment >= 15 ||
    categoryScores.relationshipAccess >= 3.75 ||
    categoryScores.decisionStructure >= 11.25;

  let recommendation = "DECLINE";
  if (totalScore >= minBid) {
    recommendation = "BID";
  } else if (totalScore >= minConditional && totalScore < minBid) {
    recommendation = state.answers.proposalEffort === "Heavy" && !clearUpside ? "DECLINE" : "CONDITIONAL BID";
  } else if (totalScore >= 50 && totalScore < minConditional) {
    recommendation = "DECLINE";
  }

  const riskCategory = weakCategories.map(([key]) => key);
  const topRisks = riskCategory.map((key) => nextActionMap[key]);

  return {
    categoryScores,
    totalScore,
    recommendation,
    topCategories,
    weakCategories,
    topRisks,
    thresholds: { minBid, minConditional },
  };
}

function applyStrategicOverride() {
  if (!state.result || state.result.totalScore >= 65) return;
  if (state.answers.strategicOverride !== "none") {
    state.result.recommendation = "CONDITIONAL BID";
    state.result.overrideCondition = `Strategic override selected: ${state.answers.strategicOverride}. Require tight scope, milestone checks, and sponsor access.`;
  }
}

function saveRecord() {
  const record = {
    timestamp: new Date().toISOString(),
    clientName: state.answers.clientName,
    projectName: state.answers.projectName,
    answers: state.answers,
    hardFilterStatus: state.hardStop,
    categoryScores: state.result?.categoryScores || {},
    totalScore: state.result?.totalScore || 0,
    proposalEffort: state.answers.proposalEffort,
    recommendation: state.result?.recommendation || "DECLINE",
    frictionForecast: state.answers.frictionForecast,
    notes: state.answers.notes,
  };
  const records = getRecords();
  records.unshift(record);
  setRecords(records);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderStep(step, totalSteps) {
  const progress = `<div class="progress">Step ${state.stepIndex + 1} of ${totalSteps}</div>`;
  let body = `<h2>${escapeHtml(step.question)}</h2>`;
  if (step.help) body += `<small>${escapeHtml(step.help)}</small>`;

  const answerValue = getAnswerValue(step);

  if (step.type === "text") {
    body += `<input id="answer" value="${escapeHtml(answerValue)}" />`;
  }

  if (step.type === "textarea") {
    body += `<textarea id="answer">${escapeHtml(answerValue)}</textarea>`;
  }

  if (step.type === "yesno") {
    body += `<div class="choice-list">
      ${["yes", "no"]
        .map(
          (option) => `<label class="choice"><input type="radio" name="yn" value="${option}" ${
            answerValue === option ? "checked" : ""
          } />${option.toUpperCase()}</label>`
        )
        .join("")}
    </div>`;
  }

  if (step.type === "scale") {
    body += `<div class="choice-list">
      ${scaleOptions
        .map(
          (opt) => `<label class="choice"><input type="radio" name="scale" value="${opt.value}" ${
            String(answerValue) === String(opt.value) ? "checked" : ""
          } />${opt.label}</label>`
        )
        .join("")}
    </div>`;
  }

  if (step.type === "options") {
    body += `<div class="choice-list">
      ${step.options
        .map(
          (opt) => `<label class="choice"><input type="radio" name="options" value="${opt.value}" ${
            answerValue === opt.value ? "checked" : ""
          } />${escapeHtml(opt.label)}</label>`
        )
        .join("")}
    </div>`;
  }

  appEl.innerHTML = `<div class="card">${progress}${body}
    <div class="actions">
      <button class="secondary" id="backBtn" ${state.stepIndex === 0 ? "disabled" : ""}>Back</button>
      <button class="ghost" id="saveExitBtn">Save & Exit</button>
      <button class="primary" id="nextBtn">Next</button>
    </div>
  </div>`;

  document.getElementById("backBtn").onclick = () => {
    if (state.stepIndex > 0) {
      state.stepIndex -= 1;
      saveDraft();
      render();
    }
  };

  document.getElementById("saveExitBtn").onclick = () => {
    saveDraft();
    appEl.innerHTML = `<div class="card"><h2>Saved</h2><p>Your progress has been saved locally. Reopen this page to continue.</p><button class="primary" id="resumeBtn">Resume now</button></div>`;
    document.getElementById("resumeBtn").onclick = render;
  };

  document.getElementById("nextBtn").onclick = () => {
    const nextValue = readAnswer(step);
    if (nextValue === null || nextValue === "") return;
    writeAnswer(step, nextValue);

    if (step.type === "yesno" && step.id.startsWith("hardFilter_") && nextValue === "yes") {
      const index = Number(step.id.split("_")[1]);
      state.hardStop = hardFilters[index];
      state.result = {
        recommendation: "DECLINE",
        totalScore: 0,
        categoryScores: {},
        topCategories: [],
        weakCategories: [],
        topRisks: ["Triggered hard filter."],
      };
      saveDraft();
      renderResult();
      return;
    }

    const steps = getDynamicSteps();
    if (state.stepIndex === steps.length - 1) {
      state.result = computeResult();
      if (state.result.totalScore < 65) {
        const overrideSteps = getDynamicSteps();
        if (!overrideSteps.find((s) => s.id === "strategicOverride") || state.answers.strategicOverride) {
          applyStrategicOverride();
          saveRecord();
          localStorage.removeItem(STORAGE_KEYS.draft);
          renderResult();
          return;
        }
      } else {
        saveRecord();
        localStorage.removeItem(STORAGE_KEYS.draft);
        renderResult();
        return;
      }
    }

    state.stepIndex += 1;
    saveDraft();
    render();
  };
}

function getAnswerValue(step) {
  if (step.id === "clientName" || step.id === "projectName" || step.id === "frictionForecast" || step.id === "notes") {
    return state.answers[step.id] || "";
  }
  if (step.id.startsWith("hardFilter_")) {
    return state.answers.hardFilters[step.id] || "";
  }
  if (step.id.startsWith("score_")) {
    return state.answers.categoryRatings[step.key] || "";
  }
  if (step.id === "proposalEffort" || step.id === "strategicOverride") {
    return state.answers[step.id] || "";
  }
  return "";
}

function readAnswer(step) {
  if (step.type === "text" || step.type === "textarea") {
    return document.getElementById("answer").value.trim();
  }
  const selector = step.type === "yesno" ? 'input[name="yn"]:checked' : step.type === "scale" ? 'input[name="scale"]:checked' : 'input[name="options"]:checked';
  const checked = document.querySelector(selector);
  return checked ? checked.value : null;
}

function writeAnswer(step, value) {
  if (["clientName", "projectName", "frictionForecast", "notes", "proposalEffort", "strategicOverride"].includes(step.id)) {
    state.answers[step.id] = value;
    return;
  }
  if (step.id.startsWith("hardFilter_")) {
    state.answers.hardFilters[step.id] = value;
    return;
  }
  if (step.id.startsWith("score_")) {
    state.answers.categoryRatings[step.key] = Number(value);
  }
}

function buildCsv(records) {
  if (!records.length) return "";
  const headers = ["timestamp", "clientName", "projectName", "recommendation", "totalScore", "proposalEffort", "hardFilter", "frictionForecast", "notes"];
  const rows = records.map((record) =>
    headers
      .map((key) => {
        const value = key === "hardFilter" ? record.hardFilterStatus || "" : record[key] || "";
        return `"${String(value).replaceAll('"', '""')}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function renderResult() {
  const records = getRecords();
  const result = state.result;

  if (!result) {
    render();
    return;
  }

  const categoryLabelByKey = Object.fromEntries(scoringQuestions.map((q) => [q.key, q.label]));
  const reasonList = state.hardStop
    ? [state.hardStop]
    : result.topCategories.map(([key, value]) => `${categoryLabelByKey[key]} (${value}/${scoringQuestions.find((q) => q.key === key).weight})`);

  const weakList = state.hardStop
    ? ["Hard filter triggered"]
    : result.weakCategories.map(([key, value]) => `${categoryLabelByKey[key]} (${value})`);

  const nextAction = state.hardStop
    ? "Decline with template email and log reason for future qualification speed."
    : nextActionMap[result.weakCategories[0][0]];

  appEl.innerHTML = `<div class="card">
      <h2>Recommendation: ${result.recommendation}</h2>
      <p><strong>Final Score:</strong> ${result.totalScore}</p>
      ${state.hardStop ? `<p class="warn"><strong>Hard Filter Triggered:</strong> ${escapeHtml(state.hardStop)}</p>` : ""}
      <div class="result-grid">
        <div class="result-box"><strong>Top Reasons</strong><ul>${reasonList.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul></div>
        <div class="result-box"><strong>Weakest Areas</strong><ul>${weakList.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul></div>
        <div class="result-box"><strong>Top Risks</strong><ul>${result.topRisks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul></div>
      </div>
      <p><strong>Friction Forecast:</strong> ${escapeHtml(state.answers.frictionForecast || "Not provided")}</p>
      ${result.overrideCondition ? `<p><strong>Override Conditions:</strong> ${escapeHtml(result.overrideCondition)}</p>` : ""}
      <p><strong>Recommended Next Action:</strong> ${escapeHtml(nextAction)}</p>
      ${state.hardStop ? `
      <label>Record this decline reason?</label>
      <div class="choice-list">
        <label class="choice"><input type="radio" name="recordChoice" value="yes" ${state.answers.hardFilterRecordChoice === "yes" ? "checked" : ""}/> Yes</label>
        <label class="choice"><input type="radio" name="recordChoice" value="no" ${state.answers.hardFilterRecordChoice === "no" ? "checked" : ""}/> No</label>
      </div>
      <label>Optional decline notes</label>
      <textarea id="hardFilterNotes">${escapeHtml(state.answers.hardFilterNotes || "")}</textarea>
      ` : ""}
      <h3>Saved Records (${records.length})</h3>
      <div class="actions">
        <button class="secondary" id="exportJsonBtn">Export JSON</button>
        <button class="secondary" id="exportCsvBtn">Export CSV</button>
        <button class="ghost" id="newEvalBtn">Start New Evaluation</button>
      </div>
    </div>`;

  const existingIndex = records.findIndex(
    (record) => record.timestamp === records[0]?.timestamp && record.clientName === state.answers.clientName && record.projectName === state.answers.projectName
  );
  if (existingIndex >= 0 && state.hardStop) {
    const radios = document.querySelectorAll('input[name="recordChoice"]');
    radios.forEach((radio) => {
      radio.onchange = (event) => {
        state.answers.hardFilterRecordChoice = event.target.value;
        records[existingIndex].answers.hardFilterRecordChoice = event.target.value;
        setRecords(records);
      };
    });

    const noteEl = document.getElementById("hardFilterNotes");
    noteEl.onchange = (event) => {
      state.answers.hardFilterNotes = event.target.value.trim();
      records[existingIndex].answers.hardFilterNotes = state.answers.hardFilterNotes;
      setRecords(records);
    };
  }

  document.getElementById("exportJsonBtn").onclick = () => {
    downloadFile("rfp-fit-checker-records.json", JSON.stringify(records, null, 2), "application/json");
  };
  document.getElementById("exportCsvBtn").onclick = () => {
    downloadFile("rfp-fit-checker-records.csv", buildCsv(records), "text/csv;charset=utf-8");
  };
  document.getElementById("newEvalBtn").onclick = resetWizard;
}

function render() {
  if (state.result) {
    renderResult();
    return;
  }
  const steps = getDynamicSteps();
  if (state.stepIndex >= steps.length) {
    state.stepIndex = steps.length - 1;
  }
  renderStep(steps[state.stepIndex], steps.length);
}

render();
