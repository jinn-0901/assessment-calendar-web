const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  user: null,
  schools: [],
  classes: [],
  subjects: [],
  selectedSchoolId: "",
  selectedGrade: "",
  selectedClassId: "",
  assessmentRows: [],
  authMode: "login"
};

const schoolSelect = $("#school-select");
const gradeSelect = $("#grade-select");
const classSelect = $("#class-select");
const assessmentDialog = $("#assessment-dialog");
const authDialog = $("#auth-dialog");

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data;
}

function showNotice(message, isError = false) {
  const notice = $("#notice");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.classList.remove("hidden");
  if (!isError) window.setTimeout(() => notice.classList.add("hidden"), 4000);
}

function setOptions(select, items, placeholder, getValue, getLabel) {
  select.replaceChildren(new Option(placeholder, ""));
  items.forEach(item => select.add(new Option(getLabel(item), getValue(item))));
}

function updateAccount() {
  $("#account-label").textContent = state.user ? state.user.displayName : "로그인하지 않음";
  $("#login-open").classList.toggle("hidden", Boolean(state.user));
  $("#logout-button").classList.toggle("hidden", !state.user);
}

async function loadMe() {
  const data = await api("/api/me");
  state.user = data.user;
  updateAccount();
}

async function loadSchools() {
  const data = await api("/api/schools");
  state.schools = data.schools;
  setOptions(schoolSelect, state.schools, "학교를 선택하세요", s => s.id, s => s.region ? s.name + " · " + s.region : s.name);
  $$(".school-options").forEach(select => {
    const current = select.value;
    setOptions(select, state.schools, "학교 선택", s => s.id, s => s.region ? s.name + " · " + s.region : s.name);
    if (state.schools.some(s => String(s.id) === current)) select.value = current;
  });
  if (state.selectedSchoolId && state.schools.some(s => String(s.id) === String(state.selectedSchoolId))) {
    schoolSelect.value = String(state.selectedSchoolId);
  }
}

function resetSelect(select, placeholder) {
  select.replaceChildren(new Option(placeholder, ""));
  select.disabled = true;
}

async function loadClasses() {
  resetSelect(gradeSelect, "학년 선택");
  resetSelect(classSelect, "반 선택");
  state.classes = [];
  state.selectedGrade = "";
  state.selectedClassId = "";
  if (!state.selectedSchoolId) {
    $("#selected-class-label").textContent = "학교와 학급을 선택해 주세요.";
    renderAssessments([]);
    return;
  }
  const data = await api("/api/schools/" + state.selectedSchoolId + "/classes");
  state.classes = data.classes;
  const grades = [...new Set(state.classes.map(c => c.grade))].sort((a,b) => a-b);
  setOptions(gradeSelect, grades, "학년 선택", g => g, g => g + "학년");
  gradeSelect.disabled = false;
  $("#selected-class-label").textContent = "학년과 반을 선택해 주세요.";
  renderAssessments([]);
}

async function loadSubjects(schoolId) {
  const data = await api("/api/schools/" + schoolId + "/subjects");
  state.subjects = data.subjects;
  setOptions($("#assessment-subject"), state.subjects, "과목 선택", s => s.id, s => s.name);
}

function updateClassOptions() {
  const matching = state.classes.filter(c => String(c.grade) === String(state.selectedGrade));
  setOptions(classSelect, matching, "반 선택", c => c.id, c => c.class_number + "반");
  classSelect.disabled = matching.length === 0;
}

async function loadAssessments() {
  if (!state.selectedClassId) {
    renderAssessments([]);
    return;
  }
  const data = await api("/api/assessments?classId=" + encodeURIComponent(state.selectedClassId));
  state.assessmentRows = data.assessments;
  renderAssessments(state.assessmentRows);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderAssessments(rows) {
  const list = $("#assessment-list");
  if (!state.selectedClassId) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">▤</div><h3>아직 선택한 학급이 없어요</h3><p>학교, 학년, 반을 선택하면 등록된 일정을 확인할 수 있어요.</p></div>';
    return;
  }
  if (!rows.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">✦</div><h3>등록된 일정이 없어요</h3><p>첫 번째 수행평가 일정을 등록해 보세요.</p></div>';
    return;
  }
  list.innerHTML = rows.map(row => {
    const date = new Date(row.due_date + "T12:00:00");
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const own = state.user && String(state.user.id) === String(row.created_by);
    return `<article class="assessment-card">
      <div class="date-block"><span class="month">${month}월</span><span class="day">${day}</span></div>
      <div class="assessment-info">
        <span class="subject-chip">${escapeHTML(row.subject_name)}</span>
        <h3>${escapeHTML(row.title)}</h3>
        ${row.details ? `<p>${escapeHTML(row.details)}</p>` : ""}
        <p class="card-meta">등록: ${escapeHTML(row.author)} · ${escapeHTML(row.due_date)}</p>
      </div>
      <div class="card-actions">
        ${own ? `<button class="small-button" type="button" data-edit="${row.id}">수정</button><button class="small-button delete" type="button" data-delete="${row.id}">삭제</button>` : ""}
      </div>
    </article>`;
  }).join("");
}

function openAuth(mode = "login") {
  state.authMode = mode;
  $("#auth-title").textContent = mode === "login" ? "로그인" : "회원가입";
  $("#auth-description").textContent = mode === "login" ? "일정을 등록하거나 수정하려면 로그인해 주세요." : "계정을 만들고 학급 일정에 참여하세요.";
  $("#display-name-field").classList.toggle("hidden", mode !== "register");
  $("#auth-submit").textContent = mode === "login" ? "로그인" : "회원가입";
  $("#auth-toggle").textContent = mode === "login" ? "처음이신가요? 회원가입" : "이미 계정이 있나요? 로그인";
  $("#auth-error").classList.add("hidden");
  $("#auth-form").elements.password.autocomplete = mode === "login" ? "current-password" : "new-password";
  authDialog.showModal();
}

function openAssessment(row = null) {
  if (!state.user) {
    openAuth();
    showNotice("일정을 등록하려면 먼저 로그인해 주세요.");
    return;
  }
  if (!state.schools.length) {
    showNotice("먼저 학교를 등록해 주세요.", true);
    $("#setup-panel").open = true;
    return;
  }
  $("#assessment-form").reset();
  $("#assessment-error").classList.add("hidden");
  $("#assessment-title").textContent = row ? "수행평가 일정 수정" : "수행평가 일정 등록";
  $("#assessment-form").elements.assessmentId.value = row ? row.id : "";
  setOptions($("#assessment-school"), state.schools, "학교 선택", s => s.id, s => s.region ? s.name + " · " + s.region : s.name);
  const chosenSchool = row ? String(row.school_id || state.selectedSchoolId) : String(state.selectedSchoolId || "");
  $("#assessment-school").value = chosenSchool;
  refreshAssessmentClasses().then(async () => {
    if (row) {
      $("#assessment-grade").value = String(row.grade);
      refreshAssessmentClassOptions();
      $("#assessment-class").value = String(row.class_id);
      await loadSubjects(chosenSchool);
      $("#assessment-subject").value = String(row.subject_id);
      $("#assessment-form").elements.title.value = row.title;
      $("#assessment-form").elements.dueDate.value = row.due_date;
      $("#assessment-form").elements.details.value = row.details || "";
    }
  }).catch(error => showNotice(error.message, true));
  assessmentDialog.showModal();
}

async function refreshAssessmentClasses() {
  const schoolId = $("#assessment-school").value;
  resetSelect($("#assessment-grade"), "학년 선택");
  resetSelect($("#assessment-class"), "반 선택");
  setOptions($("#assessment-subject"), [], "과목 선택", s => s.id, s => s.name);
  if (!schoolId) return;
  const [classesData] = await Promise.all([
    api("/api/schools/" + schoolId + "/classes"),
    loadSubjects(schoolId)
  ]);
  const classes = classesData.classes;
  $("#assessment-grade").dataset.classes = JSON.stringify(classes);
  const grades = [...new Set(classes.map(c => c.grade))].sort((a,b) => a-b);
  setOptions($("#assessment-grade"), grades, "학년 선택", g => g, g => g + "학년");
  $("#assessment-grade").disabled = false;
}

function refreshAssessmentClassOptions() {
  const classes = JSON.parse($("#assessment-grade").dataset.classes || "[]");
  const matching = classes.filter(c => String(c.grade) === $("#assessment-grade").value);
  setOptions($("#assessment-class"), matching, "반 선택", c => c.id, c => c.class_number + "반");
  $("#assessment-class").disabled = matching.length === 0;
}

schoolSelect.addEventListener("change", async () => {
  state.selectedSchoolId = schoolSelect.value;
  try { await loadClasses(); } catch (error) { showNotice(error.message, true); }
});
gradeSelect.addEventListener("change", () => {
  state.selectedGrade = gradeSelect.value;
  state.selectedClassId = "";
  updateClassOptions();
  $("#selected-class-label").textContent = "반을 선택해 주세요.";
  renderAssessments([]);
});
classSelect.addEventListener("change", async () => {
  state.selectedClassId = classSelect.value;
  const school = state.schools.find(s => String(s.id) === String(state.selectedSchoolId));
  const cls = state.classes.find(c => String(c.id) === String(state.selectedClassId));
  $("#selected-class-label").textContent = school && cls ? `${school.name} · ${cls.grade}학년 ${cls.class_number}반` : "학급을 선택해 주세요.";
  try { await loadAssessments(); } catch (error) { showNotice(error.message, true); }
});

$("#login-open").addEventListener("click", () => openAuth());
$("#auth-toggle").addEventListener("click", () => openAuth(state.authMode === "login" ? "register" : "login"));
$("#add-assessment-open").addEventListener("click", () => openAssessment());
$("#logout-button").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
    state.user = null;
    updateAccount();
    renderAssessments(state.assessmentRows);
    showNotice("로그아웃했어요.");
  } catch (error) { showNotice(error.message, true); }
});

$$("[data-close]").forEach(button => button.addEventListener("click", () => $("#" + button.dataset.close).close()));

$("#auth-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const errorBox = $("#auth-error");
  errorBox.classList.add("hidden");
  const payload = {
    email: form.elements.email.value,
    password: form.elements.password.value
  };
  if (state.authMode === "register") payload.displayName = form.elements.displayName.value;
  try {
    const data = await api("/api/auth/" + state.authMode, { method: "POST", body: JSON.stringify(payload) });
    state.user = data.user;
    updateAccount();
    authDialog.close();
    form.reset();
    showNotice(state.authMode === "login" ? "로그인했어요." : "회원가입이 완료됐어요.");
    if (state.selectedClassId) await loadAssessments();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove("hidden");
  }
});

$("#assessment-school").addEventListener("change", () => refreshAssessmentClasses().catch(error => showNotice(error.message, true)));
$("#assessment-grade").addEventListener("change", refreshAssessmentClassOptions);

$("#assessment-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const errorBox = $("#assessment-error");
  errorBox.classList.add("hidden");
  const id = form.elements.assessmentId.value;
  const payload = {
    classId: $("#assessment-class").value,
    subjectId: form.elements.subjectId.value,
    title: form.elements.title.value,
    dueDate: form.elements.dueDate.value,
    details: form.elements.details.value
  };
  try {
    await api(id ? "/api/assessments/" + id : "/api/assessments", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    assessmentDialog.close();
    const chosenClass = $("#assessment-class").value;
    state.selectedSchoolId = $("#assessment-school").value;
    await loadSchools();
    await loadClasses();
    const chosenGrade = $("#assessment-grade").value;
    state.selectedGrade = chosenGrade;
    gradeSelect.value = chosenGrade;
    updateClassOptions();
    classSelect.value = chosenClass;
    state.selectedClassId = chosenClass;
    const selected = state.classes.find(c => String(c.id) === String(chosenClass));
    $("#selected-class-label").textContent = selected ? `${state.schools.find(s => String(s.id) === String(state.selectedSchoolId))?.name || ""} · ${selected.grade}학년 ${selected.class_number}반` : "학급을 선택해 주세요.";
    await loadAssessments();
    showNotice(id ? "일정을 수정했어요." : "일정을 등록했어요.");
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove("hidden");
  }
});

$("#assessment-list").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const row = state.assessmentRows.find(item => String(item.id) === editButton.dataset.edit);
    if (row) openAssessment({ ...row, school_id: state.selectedSchoolId });
  }
  if (deleteButton) {
    const row = state.assessmentRows.find(item => String(item.id) === deleteButton.dataset.delete);
    if (!row || !window.confirm("이 수행평가 일정을 삭제할까요?")) return;
    try {
      await api("/api/assessments/" + row.id, { method: "DELETE" });
      await loadAssessments();
      showNotice("일정을 삭제했어요.");
    } catch (error) { showNotice(error.message, true); }
  }
});

$("#school-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const data = await api("/api/schools", { method: "POST", body: JSON.stringify({ name: form.elements.name.value, region: form.elements.region.value }) });
    state.selectedSchoolId = String(data.school.id);
    await loadSchools();
    schoolSelect.value = state.selectedSchoolId;
    await loadClasses();
    form.reset();
    showNotice("학교를 등록했어요.");
  } catch (error) { showNotice(error.message, true); }
});

$("#class-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const data = await api("/api/classes", { method: "POST", body: JSON.stringify({ schoolId: form.elements.schoolId.value, grade: form.elements.grade.value, classNumber: form.elements.classNumber.value }) });
    state.selectedSchoolId = String(data.class.school_id);
    await loadSchools();
    schoolSelect.value = state.selectedSchoolId;
    await loadClasses();
    gradeSelect.value = String(data.class.grade);
    state.selectedGrade = String(data.class.grade);
    updateClassOptions();
    classSelect.value = String(data.class.id);
    state.selectedClassId = String(data.class.id);
    $("#selected-class-label").textContent = "학급을 선택했어요. 일정을 불러오는 중입니다.";
    await loadAssessments();
    form.reset();
    showNotice("학급을 등록했어요.");
  } catch (error) { showNotice(error.message, true); }
});

$("#subject-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await api("/api/subjects", { method: "POST", body: JSON.stringify({ schoolId: form.elements.schoolId.value, name: form.elements.name.value }) });
    form.reset();
    showNotice("과목을 등록했어요.");
  } catch (error) { showNotice(error.message, true); }
});

async function init() {
  try {
    await loadMe();
    await loadSchools();
    if (state.schools.length) {
      state.selectedSchoolId = String(state.schools[0].id);
      schoolSelect.value = state.selectedSchoolId;
      await loadClasses();
    }
  } catch (error) {
    showNotice("초기 데이터를 불러오지 못했어요. 데이터베이스 설정을 확인해 주세요. " + error.message, true);
  }
}

init();
