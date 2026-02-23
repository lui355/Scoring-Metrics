const appEl = document.getElementById("app");

const STORAGE_KEYS = {
  records: "rfp-fit-checker-records",
  draft: "rfp-fit-checker-draft",
};

const hardFilters = [
  {
    code: "A",
    key: "decisionMaker",
    title: "Decision Maker Clarity",
    question: "Is there a clear decision-maker with authority for approvals and final sign-off?",
    why: "Without a single accountable decision-maker, timelines slip, revisions balloon, and teams get stuck in committee politics.",
    yesLooksLike: [
      "A named person has final approval authority",
      "Feedback is consolidated (one voice, not many)",
      "Approval timelines are explicit (for example, 2–3 business days)",
    ],
    noLooksLike: [
      "'We'll decide as a group' or 'multiple stakeholders approve'",
      "Conflicting feedback with no owner to resolve it",
      "No one can commit to timeline or scope decisions",
    ],
    askIfUnsure: [
      "Org chart for the project or a decision map",
      "Who signs the contract, who approves creative, who owns budget",
    ],
  },
  {
    code: "B",
    key: "budgetReality",
    title: "Budget Reality and Transparency",
    question: "Is a budget range provided (or will the client share one after you ask)?",
    why: "If budget stays hidden, you cannot assess fit and you risk writing a blind proposal that gets squeezed later.",
    yesLooksLike: [
      "Budget range is in the RFP, or provided verbally/in email",
      "They confirm they can meet your minimum",
    ],
    noLooksLike: [
      "'Send your best price' and refusal to share a range",
      "Budget is clearly far below scope expectations",
    ],
    askIfUnsure: [
      "What range has been allocated for this scope?",
      "Is there flexibility if scope expands?",
      "What's your procurement cap or approval threshold?",
    ],
  },
  {
    code: "C",
    key: "capabilityCore",
    title: "Core Capability Match",
    question: "Does the scope align with our core capabilities AND we can deliver at an excellent level?",
    why: "Capability gaps create delivery risk, reputational risk, and margin collapse when teams must patch work with rushed outsourcing.",
    yesLooksLike: [
      "Deliverables are within your proven portfolio and process",
      "Any specialist needs are minor and coverable",
    ],
    noLooksLike: [
      "Major deliverables require expertise you do not have without budget",
      "The RFP expects things you would be guessing at",
    ],
    askIfUnsure: [
      "Clarification call to confirm deliverables and success criteria",
      "Access to examples, reference materials, and required formats",
      "Whether subcontracting is allowed and budgeted",
    ],
  },
  {
    code: "D",
    key: "timeline",
    title: "Timeline Feasibility",
    question: "Is the timeline realistically achievable with current workload AND client review cycles?",
    why: "Unreal timelines force shortcuts, increase change requests, and create burnout. Fast is fine; impossible is expensive.",
    yesLooksLike: [
      "Timeline matches scope and includes review time",
      "Client commits to response times and provides inputs on schedule",
    ],
    noLooksLike: [
      "Major scope due in days or weeks with no flexibility",
      "Client cannot commit to approvals, inputs, or access",
    ],
    askIfUnsure: [
      "Hard deadline versus preferred deadline",
      "Review or approval SLA (we respond in X days)",
      "What inputs they already have versus what must be created",
    ],
  },
  {
    code: "E",
    key: "engagementType",
    title: "Engagement Type (Strategic vs Commodity)",
    question: "Does the client value strategy + partnership (not just production/vendor execution)?",
    why: "Commodity engagements optimize for cheapest output, not outcomes, and that is a mismatch with HerreraDesigns' model.",
    yesLooksLike: [
      "RFP mentions goals, outcomes, audiences, constraints, and success metrics",
      "They want a thinking partner and are open to process",
    ],
    noLooksLike: [
      "Pure deliverables list and price-driven language",
      "'We already know what we want, just execute'",
    ],
    askIfUnsure: [
      "What does success look like in 6-12 months?",
      "What decisions are still open?",
      "How will you evaluate proposals besides price?",
    ],
  },
  {
    code: "F",
    key: "legalInsurance",
    title: "Legal / Insurance / Compliance Fit",
    question: "Are the legal, insurance, and compliance requirements reasonable for us at this budget level?",
    why: "Overreaching contract terms can create financial exposure far beyond the project fee.",
    yesLooksLike: [
      "Standard MSA terms or negotiable requirements",
      "Insurance limits are within your coverage or budgeted to upgrade",
    ],
    noLooksLike: [
      "Non-negotiable terms with high liability, indemnities, or unusual coverage demands",
      "Requirements mismatch the project value",
    ],
    askIfUnsure: [
      "A copy of the MSA or required terms upfront",
      "Required insurance limits and any special clauses",
    ],
  },
  {
    code: "G",
    key: "accessProcess",
    title: "Access and Process (Procurement Lockout)",
    question: "Do we have enough access to ask questions and clarify scope before submission?",
    why: "If you cannot clarify assumptions, you cannot price accurately or propose intelligently.",
    yesLooksLike: [
      "Q&A period exists and vendor calls are allowed",
      "Questions are answered in writing and addenda are shared",
    ],
    noLooksLike: [
      "No questions allowed or procurement-only firewall",
      "No ability to discuss or validate assumptions",
    ],
    askIfUnsure: [
      "Whether vendor calls are allowed",
      "Written Q&A process and timeline",
      "Addendum schedule and who answers",
    ],
  },
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

const state = loadDraft() || defaultState();

function defaultState() {
  return {
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
    pendingUnsureFilterCode: null,
    result: null,
  };
}

const baseSteps = [
  { id: "clientName", type: "text", question: "Client or organization name" },
  { id: "projectName", type: "text", question: "Project name or RFP title" },
  ...hardFilters.map((filter) => ({ id: `hardFilter_${filter.code}`, type: "hardFilter", filterCode: filter.code })),
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
  Object.assign(state, defaultState());
  localStorage.removeItem(STORAGE_KEYS.draft);
  render();
}

function getDynamicSteps() {
  const steps = [...baseSteps];
  if (state.pendingUnsureFilterCode) {
    steps.push({ id: "needInfoDecision", type: "needInfoDecision", filterCode: state.pendingUnsureFilterCode });
  }
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

  const totalScore = Number(Object.values(categoryScores).reduce((sum, val) => sum + val, 0).toFixed(2));

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
  }

  return {
    categoryScores,
    totalScore,
    recommendation,
    topCategories,
    weakCategories,
    topRisks: weakCategories.map(([key]) => nextActionMap[key]),
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

function getHardFilterByCode(code) {
  return hardFilters.find((item) => item.code === code);
}

function buildHardStopResult(filter, mode) {
  const isUnsure = mode === "unsure";
  return {
    recommendation: isUnsure ? "NEED INFO" : "DECLINE",
    totalScore: 0,
    categoryScores: {},
    topCategories: [],
    weakCategories: [],
    topRisks: ["Hard filter did not pass."],
    hardFilterFailure: {
      code: filter.code,
      title: filter.title,
      reasonType: isUnsure ? "unsure" : "no",
      why: filter.why,
      askIfUnsure: filter.askIfUnsure,
      recommendedDeclineReason: `Hard Filter Failed: ${filter.code} — ${filter.title}`,
    },
  };
}

function saveRecord() {
  const record = {
    timestamp: new Date().toISOString(),
    clientName: state.answers.clientName,
    projectName: state.answers.projectName,
    answers: state.answers,
    hardFilterStatus: state.result?.hardFilterFailure || null,
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

function renderHardFilterContent(filter, answerValue) {
  return `
    <h2>Hard Filter ${filter.code} — ${escapeHtml(filter.title)}</h2>
    <p>${escapeHtml(filter.question)}</p>
    <div class="helper-block">
      <h3>Why it matters</h3>
      <p>${escapeHtml(filter.why)}</p>
      <h3>What “Yes” looks like</h3>
      <ul>${filter.yesLooksLike.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <h3>What “No” looks like</h3>
      <ul>${filter.noLooksLike.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <h3>What to ask if “Unsure”</h3>
      <ul>${filter.askIfUnsure.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    <div class="choice-list">
      ${["yes", "no", "unsure"]
        .map(
          (option) => `<label class="choice"><input type="radio" name="hardfilter" value="${option}" ${
            answerValue === option ? "checked" : ""
          }/>${option.toUpperCase()}</label>`
        )
        .join("")}
    </div>
  `;
}

function renderStep(step, totalSteps) {
  const progress = `<div class="progress">Step ${state.stepIndex + 1} of ${totalSteps}</div>`;
  const answerValue = getAnswerValue(step);
  let body = "";

  if (step.type === "hardFilter") {
    body = renderHardFilterContent(getHardFilterByCode(step.filterCode), answerValue);
  } else if (step.type === "needInfoDecision") {
    const filter = getHardFilterByCode(step.filterCode);
    body = `
      <h2>Need Info: Hard Filter ${filter.code} — ${escapeHtml(filter.title)}</h2>
      <p class="warn">Default recommendation is DECLINE until missing info is confirmed.</p>
      <p><strong>Why it matters:</strong> ${escapeHtml(filter.why)}</p>
      <h3>What to ask before continuing</h3>
      <ul>${filter.askIfUnsure.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <div class="choice-list">
        <label class="choice"><input type="radio" name="needInfoAction" value="continue" ${
          answerValue === "continue" ? "checked" : ""
        }/>Collect Info & Continue</label>
        <label class="choice"><input type="radio" name="needInfoAction" value="decline" ${
          answerValue === "decline" ? "checked" : ""
        }/>Stop and Decline</label>
      </div>
    `;
  } else {
    body = `<h2>${escapeHtml(step.question)}</h2>`;

    if (step.type === "text") {
      body += `<input id="answer" value="${escapeHtml(answerValue)}" />`;
    } else if (step.type === "textarea") {
      body += `<textarea id="answer">${escapeHtml(answerValue)}</textarea>`;
    } else if (step.type === "scale") {
      body += `<div class="choice-list">${scaleOptions
        .map(
          (opt) => `<label class="choice"><input type="radio" name="scale" value="${opt.value}" ${
            String(answerValue) === String(opt.value) ? "checked" : ""
          }/>${opt.label}</label>`
        )
        .join("")}</div>`;
    } else if (step.type === "options") {
      body += `<div class="choice-list">${step.options
        .map(
          (opt) => `<label class="choice"><input type="radio" name="options" value="${opt.value}" ${
            answerValue === opt.value ? "checked" : ""
          }/>${escapeHtml(opt.label)}</label>`
        )
        .join("")}</div>`;
    }
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

    if (step.type === "hardFilter") {
      const filter = getHardFilterByCode(step.filterCode);
      if (nextValue === "no") {
        state.hardStop = filter;
        state.result = buildHardStopResult(filter, "no");
        saveRecord();
        localStorage.removeItem(STORAGE_KEYS.draft);
        renderResult();
        return;
      }
      if (nextValue === "unsure") {
        state.hardStop = filter;
        state.pendingUnsureFilterCode = filter.code;
      }
    }

    if (step.type === "needInfoDecision") {
      const filter = getHardFilterByCode(step.filterCode);
      if (nextValue === "decline") {
        state.result = buildHardStopResult(filter, "unsure");
        saveRecord();
        localStorage.removeItem(STORAGE_KEYS.draft);
        renderResult();
        return;
      }
      if (nextValue === "continue") {
        state.hardStop = null;
        state.pendingUnsureFilterCode = null;
      }
    }

    const steps = getDynamicSteps();
    if (state.stepIndex === steps.length - 1) {
      state.result = computeResult();
      if (state.result.totalScore < 65) {
        const withOverride = getDynamicSteps().find((item) => item.id === "strategicOverride");
        if (!withOverride || state.answers.strategicOverride) {
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
  if (["clientName", "projectName", "frictionForecast", "notes", "proposalEffort", "strategicOverride"].includes(step.id)) {
    return state.answers[step.id] || "";
  }
  if (step.type === "hardFilter") {
    return state.answers.hardFilters[step.filterCode] || "";
  }
  if (step.type === "needInfoDecision") {
    return state.answers.needInfoAction || "";
  }
  if (step.id.startsWith("score_")) {
    return state.answers.categoryRatings[step.key] || "";
  }
  return "";
}

function readAnswer(step) {
  if (step.type === "text" || step.type === "textarea") {
    return document.getElementById("answer").value.trim();
  }
  if (step.type === "hardFilter") {
    return document.querySelector('input[name="hardfilter"]:checked')?.value || null;
  }
  if (step.type === "needInfoDecision") {
    return document.querySelector('input[name="needInfoAction"]:checked')?.value || null;
  }
  const selector = step.type === "scale" ? 'input[name="scale"]:checked' : 'input[name="options"]:checked';
  return document.querySelector(selector)?.value || null;
}

function writeAnswer(step, value) {
  if (["clientName", "projectName", "frictionForecast", "notes", "proposalEffort", "strategicOverride"].includes(step.id)) {
    state.answers[step.id] = value;
    return;
  }
  if (step.type === "hardFilter") {
    state.answers.hardFilters[step.filterCode] = value;
    return;
  }
  if (step.type === "needInfoDecision") {
    state.answers.needInfoAction = value;
    return;
  }
  if (step.id.startsWith("score_")) {
    state.answers.categoryRatings[step.key] = Number(value);
  }
}

function buildCsv(records) {
  if (!records.length) return "";
  const headers = [
    "timestamp",
    "clientName",
    "projectName",
    "recommendation",
    "totalScore",
    "proposalEffort",
    "hardFilter",
    "hardFilterWhy",
    "frictionForecast",
    "notes",
  ];
  const rows = records.map((record) =>
    headers
      .map((key) => {
        const value =
          key === "hardFilter"
            ? record.hardFilterStatus?.recommendedDeclineReason || ""
            : key === "hardFilterWhy"
              ? record.hardFilterStatus?.why || ""
              : record[key] || "";
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
  if (!result) return render();

  const categoryLabelByKey = Object.fromEntries(scoringQuestions.map((q) => [q.key, q.label]));
  const reasonList = result.hardFilterFailure
    ? [result.hardFilterFailure.recommendedDeclineReason]
    : result.topCategories.map(([key, value]) => `${categoryLabelByKey[key]} (${value}/${scoringQuestions.find((q) => q.key === key).weight})`);
  const weakList = result.hardFilterFailure
    ? ["Hard filter did not pass"]
    : result.weakCategories.map(([key, value]) => `${categoryLabelByKey[key]} (${value})`);

  const nextAction = result.hardFilterFailure
    ? "Decline with template email or collect requested info and reassess."
    : nextActionMap[result.weakCategories[0][0]];

  appEl.innerHTML = `<div class="card">
      <h2>Recommendation: ${result.recommendation}</h2>
      <p><strong>Final Score:</strong> ${result.totalScore}</p>
      ${
        result.hardFilterFailure
          ? `<p class="warn"><strong>Hard Filter Failed: ${escapeHtml(result.hardFilterFailure.code)} — ${escapeHtml(result.hardFilterFailure.title)}</strong></p>
             <p><strong>Why it matters:</strong> ${escapeHtml(result.hardFilterFailure.why)}</p>`
          : ""
      }
      <div class="result-grid">
        <div class="result-box"><strong>Top Reasons</strong><ul>${reasonList.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul></div>
        <div class="result-box"><strong>Weakest Areas</strong><ul>${weakList.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul></div>
        <div class="result-box"><strong>Top Risks</strong><ul>${result.topRisks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul></div>
      </div>
      ${
        result.hardFilterFailure?.reasonType === "unsure"
          ? `<h3>Need Info checklist</h3><ul>${result.hardFilterFailure.askIfUnsure.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : ""
      }
      <p><strong>Friction Forecast:</strong> ${escapeHtml(state.answers.frictionForecast || "Not provided")}</p>
      ${result.overrideCondition ? `<p><strong>Override Conditions:</strong> ${escapeHtml(result.overrideCondition)}</p>` : ""}
      <p><strong>Recommended Next Action:</strong> ${escapeHtml(nextAction)}</p>
      ${
        result.hardFilterFailure
          ? `
      <label>Record this decline reason?</label>
      <div class="choice-list">
        <label class="choice"><input type="radio" name="recordChoice" value="yes" ${state.answers.hardFilterRecordChoice === "yes" ? "checked" : ""}/> Yes</label>
        <label class="choice"><input type="radio" name="recordChoice" value="no" ${state.answers.hardFilterRecordChoice === "no" ? "checked" : ""}/> No</label>
      </div>
      <label>Optional decline notes</label>
      <textarea id="hardFilterNotes">${escapeHtml(state.answers.hardFilterNotes || "")}</textarea>`
          : ""
      }
      <h3>Saved Records (${records.length})</h3>
      <div class="actions">
        <button class="secondary" id="exportJsonBtn">Export JSON</button>
        <button class="secondary" id="exportCsvBtn">Export CSV</button>
        <button class="ghost" id="newEvalBtn">Start New Evaluation</button>
      </div>
    </div>`;

  const latestMatchIndex = records.findIndex(
    (record) => record.clientName === state.answers.clientName && record.projectName === state.answers.projectName
  );

  if (latestMatchIndex >= 0 && result.hardFilterFailure) {
    document.querySelectorAll('input[name="recordChoice"]').forEach((radio) => {
      radio.onchange = (event) => {
        state.answers.hardFilterRecordChoice = event.target.value;
        records[latestMatchIndex].answers.hardFilterRecordChoice = event.target.value;
        setRecords(records);
      };
    });

    const noteEl = document.getElementById("hardFilterNotes");
    noteEl.onchange = (event) => {
      state.answers.hardFilterNotes = event.target.value.trim();
      records[latestMatchIndex].answers.hardFilterNotes = state.answers.hardFilterNotes;
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
  if (state.result) return renderResult();
  const steps = getDynamicSteps();
  if (state.stepIndex >= steps.length) state.stepIndex = steps.length - 1;
  renderStep(steps[state.stepIndex], steps.length);
}

render();
