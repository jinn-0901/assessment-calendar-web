import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, CalendarDays, Check, ChevronDown, CircleHelp,
  Clock3, GraduationCap, LogIn, LogOut, Plus, Search, Sparkles, X,
  BookOpen, Pencil, Trash2, SlidersHorizontal, School, Layers3
} from "lucide-react";

const API_BASE_URL = (process.env.API_BASE_URL || "").replace(/\/$/, "");

async function api(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    credentials: "include",
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했어요.");
  return data;
}

const todayISO = () => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
};
const prettyDate = (value) => {
  if (!value) return "";
  const d = new Date(value + "T12:00:00");
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(d);
};
const dateParts = (value) => {
  const d = new Date(value + "T12:00:00");
  return { month: d.getMonth() + 1, day: d.getDate(), weekday: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(d) };
};

function Modal({ title, eyebrow, onClose, children, wide = false }) {
  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`modal-card ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <button className="icon-button modal-x" onClick={onClose} aria-label="닫기"><X size={19} /></button>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children}
    </section>
  </div>;
}

function Field({ label, children, className = "" }) {
  return <label className={`field ${className}`}><span>{label}</span>{children}</label>;
}

function EmptyState({ title, description, icon: Icon = CalendarDays }) {
  return <div className="empty-state">
    <div className="empty-icon"><Icon size={24} /></div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [grade, setGrade] = useState("");
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [modal, setModal] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  const selectedSchool = schools.find(s => String(s.id) === String(schoolId));
  const selectedClass = classes.find(c => String(c.id) === String(classId));
  const grades = [...new Set(classes.map(c => c.grade))].sort((a, b) => a - b);
  const classOptions = classes.filter(c => String(c.grade) === String(grade));
  const subjectNames = [...new Set(assessments.map(a => a.subject_name))].sort();
  const filteredAssessments = useMemo(() => assessments.filter(item => {
    const matchesQuery = (item.title + " " + item.subject_name + " " + (item.details || "")).toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (subjectFilter === "all" || item.subject_name === subjectFilter);
  }), [assessments, query, subjectFilter]);
  const upcomingCount = assessments.filter(a => a.due_date >= todayISO()).length;
  const nextAssessment = [...assessments].filter(a => a.due_date >= todayISO()).sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  const notify = (message, type = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 4200);
  };

  async function refreshSchools(preferredId) {
    const data = await api("/api/schools");
    setSchools(data.schools);
    const wanted = preferredId || schoolId;
    if (wanted && data.schools.some(s => String(s.id) === String(wanted))) setSchoolId(String(wanted));
    else if (!schoolId && data.schools.length) setSchoolId(String(data.schools[0].id));
    return data.schools;
  }

  async function refreshClasses(forSchoolId = schoolId) {
    if (!forSchoolId) { setClasses([]); setGrade(""); setClassId(""); return []; }
    const data = await api(`/api/schools/${forSchoolId}/classes`);
    setClasses(data.classes);
    const validGrades = [...new Set(data.classes.map(c => c.grade))].sort((a, b) => a - b);
    const nextGrade = validGrades.some(g => String(g) === String(grade)) ? String(grade) : (validGrades.length ? String(validGrades[0]) : "");
    setGrade(nextGrade);
    const matching = data.classes.filter(c => String(c.grade) === nextGrade);
    const nextClass = matching.some(c => String(c.id) === String(classId)) ? String(classId) : (matching.length ? String(matching[0].id) : "");
    setClassId(nextClass);
    return data.classes;
  }

  async function refreshAssessments(forClassId = classId) {
    if (!forClassId) { setAssessments([]); return; }
    const data = await api("/api/assessments?classId=" + encodeURIComponent(forClassId));
    setAssessments(data.assessments);
  }

  async function refreshSubjects(forSchoolId) {
    if (!forSchoolId) { setSubjects([]); return []; }
    const data = await api(`/api/schools/${forSchoolId}/subjects`);
    setSubjects(data.subjects);
    return data.subjects;
  }

  useEffect(() => {
    (async () => {
      try {
        const [me] = await Promise.all([api("/api/me")]);
        setUser(me.user);
        const data = await api("/api/schools");
        setSchools(data.schools);
        if (data.schools.length) setSchoolId(String(data.schools[0].id));
      } catch (error) { notify(error.message, "error"); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!schoolId) { setClasses([]); setGrade(""); setClassId(""); setSubjects([]); return; }
    refreshClasses(schoolId).catch(error => notify(error.message, "error"));
    refreshSubjects(schoolId).catch(error => notify(error.message, "error"));
  }, [schoolId]);

  useEffect(() => {
    if (!classId) { setAssessments([]); return; }
    refreshAssessments(classId).catch(error => notify(error.message, "error"));
  }, [classId]);

  useEffect(() => {
    if (!classOptions.length) { setClassId(""); return; }
    if (!classOptions.some(c => String(c.id) === String(classId))) setClassId(String(classOptions[0].id));
  }, [grade, classes]);

  function openAuth(mode = "login") { setAuthMode(mode); setModal({ type: "auth" }); }
  function openAssessment(item = null) {
    if (!user) { openAuth("login"); notify("일정을 등록하려면 먼저 로그인해 주세요."); return; }
    if (!schools.length) { setModal({ type: "setup", tab: "school" }); return; }
    setModal({ type: "assessment", item });
  }

  async function handleAuth(event) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = { email: form.get("email"), password: form.get("password") };
    if (authMode === "register") payload.displayName = form.get("displayName");
    try {
      const data = await api("/api/auth/" + authMode, { method: "POST", body: JSON.stringify(payload) });
      setUser(data.user); setModal(null);
      notify(authMode === "login" ? "로그인했어요." : "회원가입이 완료됐어요.");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function logout() {
    try { await api("/api/auth/logout", { method: "POST" }); setUser(null); notify("로그아웃했어요."); }
    catch (error) { notify(error.message, "error"); }
  }

  async function saveAssessment(event) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    const id = form.get("id");
    const payload = {
      classId: form.get("classId"), subjectId: form.get("subjectId"),
      title: form.get("title"), dueDate: form.get("dueDate"), details: form.get("details")
    };
    try {
      await api(id ? `/api/assessments/${id}` : "/api/assessments", {
        method: id ? "PUT" : "POST", body: JSON.stringify(payload)
      });
      const targetClass = String(payload.classId);
      const target = classes.find(c => String(c.id) === targetClass);
      setSchoolId(String(form.get("schoolId")));
      setGrade(target ? String(target.grade) : grade);
      setClassId(targetClass);
      setModal(null);
      await refreshAssessments(targetClass);
      notify(id ? "일정을 수정했어요." : "새 일정을 등록했어요.");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function deleteAssessment(item) {
    if (!window.confirm("이 수행평가 일정을 삭제할까요?")) return;
    try {
      await api("/api/assessments/" + item.id, { method: "DELETE" });
      await refreshAssessments();
      notify("일정을 삭제했어요.");
    } catch (error) { notify(error.message, "error"); }
  }

  async function submitSetup(event, kind) {
    event.preventDefault(); setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      if (kind === "school") {
        const data = await api("/api/schools", { method: "POST", body: JSON.stringify({ name: form.get("name"), region: form.get("region") }) });
        await refreshSchools(String(data.school.id));
        setSchoolId(String(data.school.id));
        notify("학교를 등록했어요.");
      } else if (kind === "class") {
        const data = await api("/api/classes", { method: "POST", body: JSON.stringify({ schoolId: form.get("schoolId"), grade: form.get("grade"), classNumber: form.get("classNumber") }) });
        const chosenSchool = String(data.class.school_id);
        await refreshSchools(chosenSchool);
        setSchoolId(chosenSchool);
        const cls = await api(`/api/schools/${chosenSchool}/classes`);
        setClasses(cls.classes);
        setGrade(String(data.class.grade));
        setClassId(String(data.class.id));
        notify("학급을 등록했어요.");
      } else {
        await api("/api/subjects", { method: "POST", body: JSON.stringify({ schoolId: form.get("schoolId"), name: form.get("name") }) });
        await refreshSubjects(form.get("schoolId"));
        notify("과목을 등록했어요.");
      }
      formElement.reset();
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e => e.preventDefault()}>
        <span className="brand-icon"><CalendarDays size={21} strokeWidth={2.5} /></span>
        <span className="brand-name">모아<span>.</span><small>수행평가 일정</small></span>
      </a>
      <div className="top-actions">
        <span className="account-name">{user ? <><span className="avatar">{user.displayName?.slice(0, 1) || "나"}</span>{user.displayName}님</> : "함께 쓰는 학급 플래너"}</span>
        {user ? <button className="button button-light" onClick={logout}><LogOut size={16} /> 로그아웃</button> : <button className="button button-dark" onClick={() => openAuth("login")}><LogIn size={16} /> 로그인</button>}
      </div>
    </header>

    <main className="main-content">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker"><Sparkles size={14} /> LESS STRESS, MORE FOCUS</div>
          <h1>수행평가 준비,<br /><span>이제 모아</span>서 관리해요.</h1>
          <p>흩어져 있던 일정을 한곳에. 미리 확인하고 여유 있게 준비해 보세요.</p>
          <button className="button button-primary hero-button" onClick={() => openAssessment()}><Plus size={17} /> 수행평가 일정 등록 <ArrowRight size={16} /></button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
          <div className="art-card">
            <div className="art-card-top"><span className="art-dot"></span><span>MY SCHOOL PLAN</span><Layers3 size={16} /></div>
            <div className="art-date">10<span>월</span></div>
            <div className="art-line long"></div><div className="art-line medium"></div>
            <div className="art-task"><span className="task-mark"></span><div><b>수학 탐구 보고서</b><small>내일까지 준비하기</small></div><Check size={17} /></div>
          </div>
          <span className="floating-bubble bubble-a"><CalendarDays size={18} /></span>
          <span className="floating-bubble bubble-b"><Sparkles size={17} /></span>
        </div>
      </section>

      <section className="selection-panel">
        <div className="panel-title-row">
          <div><span className="section-kicker">YOUR CLASSROOM</span><h2>어느 학급의 일정인가요?</h2></div>
          <span className="private-note"><School size={14} /> 학교별 일정 공유</span>
        </div>
        <div className="select-grid">
          <Field label="학교"><span className="select-wrap"><School size={17} /><select value={schoolId} onChange={e => { setSchoolId(e.target.value); setGrade(""); setClassId(""); }}><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}{s.region ? " · " + s.region : ""}</option>)}</select><ChevronDown size={15} /></span></Field>
          <Field label="학년"><span className="select-wrap"><GraduationCap size={17} /><select value={grade} onChange={e => setGrade(e.target.value)} disabled={!grades.length}><option value="">학년 선택</option>{grades.map(g => <option key={g} value={g}>{g}학년</option>)}</select><ChevronDown size={15} /></span></Field>
          <Field label="반"><span className="select-wrap"><Layers3 size={17} /><select value={classId} onChange={e => setClassId(e.target.value)} disabled={!classOptions.length}><option value="">반 선택</option>{classOptions.map(c => <option key={c.id} value={c.id}>{c.class_number}반</option>)}</select><ChevronDown size={15} /></span></Field>
        </div>
        <button className="text-action" onClick={() => user ? setModal({ type: "setup", tab: "school" }) : openAuth("login")}>학교·학급·과목이 없나요? <span>직접 추가하기 <ArrowRight size={14} /></span></button>
      </section>

      <section className="schedule-area">
        <div className="schedule-header">
          <div><span className="section-kicker">ASSESSMENT SCHEDULE</span><h2>다가오는 수행평가 <span className="count-badge">{assessments.length}</span></h2><p>{selectedSchool && selectedClass ? `${selectedSchool.name} · ${selectedClass.grade}학년 ${selectedClass.class_number}반` : "학교와 학급을 선택해 주세요."}</p></div>
          <button className="button button-primary" onClick={() => openAssessment()}><Plus size={17} /> 일정 등록</button>
        </div>

        <div className="stats-row">
          <div className="stat-card"><div className="stat-icon purple"><CalendarDays size={18} /></div><div><span>등록된 일정</span><strong>{assessments.length}<small>개</small></strong></div></div>
          <div className="stat-card"><div className="stat-icon green"><Clock3 size={18} /></div><div><span>앞으로 남은 일정</span><strong>{upcomingCount}<small>개</small></strong></div></div>
          <div className="stat-card next-stat"><div className="stat-icon orange"><ArrowDownRight size={18} /></div><div><span>가장 가까운 수행평가</span><strong className="next-title">{nextAssessment ? nextAssessment.title : "예정된 일정 없음"}</strong><small>{nextAssessment ? prettyDate(nextAssessment.due_date) : "새 일정을 등록해 보세요"}</small></div></div>
        </div>

        <div className="list-toolbar">
          <div className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="수행평가 또는 과목 검색" /></div>
          <div className="filter-box"><SlidersHorizontal size={16} /><select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}><option value="all">모든 과목</option>{subjectNames.map(name => <option key={name} value={name}>{name}</option>)}</select><ChevronDown size={14} /></div>
        </div>

        {loading ? <div className="loading-state">일정을 불러오고 있어요…</div> : !classId ? <EmptyState icon={School} title="먼저 학교와 학급을 선택해 주세요" description="학급을 선택하면 등록된 수행평가 일정을 확인할 수 있어요." /> : filteredAssessments.length === 0 ? <EmptyState icon={BookOpen} title={query || subjectFilter !== "all" ? "검색 결과가 없어요" : "아직 등록된 일정이 없어요"} description={query || subjectFilter !== "all" ? "검색어나 과목 필터를 바꿔 보세요." : "첫 일정을 등록해 친구들과 공유해 보세요."} /> :
          <div className="assessment-list">{filteredAssessments.map(item => {
            const date = dateParts(item.due_date);
            const own = user && String(user.id) === String(item.created_by);
            return <article className="assessment-item" key={item.id}>
              <div className="date-tile"><span>{date.month}월</span><strong>{date.day}</strong><small>{date.weekday}</small></div>
              <div className="assessment-content"><div className="item-labels"><span className="subject-tag">{item.subject_name}</span><span className={item.due_date < todayISO() ? "past-tag" : "date-tag"}>{item.due_date < todayISO() ? "지난 일정" : prettyDate(item.due_date)}</span></div><h3>{item.title}</h3>{item.details && <p className="item-details">{item.details}</p>}<div className="item-meta"><span className="meta-avatar">{item.author?.slice(0, 1) || "?"}</span>{item.author} 등록</div></div>
              {own && <div className="item-actions"><button className="icon-button" title="수정" onClick={() => openAssessment(item)}><Pencil size={16} /></button><button className="icon-button delete-action" title="삭제" onClick={() => deleteAssessment(item)}><Trash2 size={16} /></button></div>}
            </article>;
          })}</div>
        }
      </section>

      <section className="bottom-tip"><div className="tip-icon"><CircleHelp size={20} /></div><div><strong>일정이 잘못 등록되어 있나요?</strong><p>일정을 등록한 학생은 직접 수정하거나 삭제할 수 있어요. 다른 사람의 일정은 등록자에게 확인해 주세요.</p></div></section>
      <footer><a className="footer-brand" href="#" onClick={e => e.preventDefault()}>모아<span>.</span></a><span>함께 정리하고, 미리 준비하기.</span><span>학교생활을 조금 더 가볍게 ✳</span></footer>
    </main>

    {notice && <div className={`toast ${notice.type === "error" ? "toast-error" : ""}`} role="status">{notice.type === "error" ? <CircleHelp size={17} /> : <Check size={17} />}{notice.message}<button onClick={() => setNotice(null)} aria-label="알림 닫기"><X size={15} /></button></div>}

    {modal?.type === "auth" && <Modal title={authMode === "login" ? "다시 만나서 반가워요!" : "모아에 가입하기"} eyebrow="WELCOME TO MOA" onClose={() => setModal(null)}>
      <p className="modal-description">{authMode === "login" ? "로그인하고 우리 반의 일정을 함께 관리해요." : "계정을 만들고 수행평가 일정을 공유해 보세요."}</p>
      <form className="modal-form" onSubmit={handleAuth}>
        {authMode === "register" && <Field label="표시 이름"><input name="displayName" maxLength="80" required placeholder="친구들에게 보일 이름" autoComplete="nickname" /></Field>}
        <Field label="이메일"><input name="email" type="email" required maxLength="254" placeholder="you@example.com" autoComplete="email" /></Field>
        <Field label="비밀번호"><input name="password" type="password" required minLength="8" maxLength="128" placeholder="8자 이상" autoComplete={authMode === "login" ? "current-password" : "new-password"} /></Field>
        <button className="button button-primary full-button" disabled={saving}>{saving ? "처리 중…" : authMode === "login" ? "로그인" : "회원가입"} <ArrowRight size={16} /></button>
      </form>
      <p className="modal-switch">{authMode === "login" ? "아직 계정이 없나요?" : "이미 계정이 있나요?"}<button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "회원가입" : "로그인"}</button></p>
    </Modal>}

    {modal?.type === "assessment" && <AssessmentModal
      item={modal.item}
      schools={schools}
      classes={classes}
      subjects={subjects}
      defaultSchoolId={schoolId}
      defaultClassId={classId}
      defaultGrade={grade}
      saving={saving}
      onClose={() => setModal(null)}
      onSubmit={saveAssessment}
      loadClasses={async id => {
        const data = await api(`/api/schools/${id}/classes`);
        return data.classes;
      }}
      loadSubjects={async id => {
        const data = await api(`/api/schools/${id}/subjects`);
        return data.subjects;
      }}
    />}

    {modal?.type === "setup" && <Modal title="기본 정보 추가하기" eyebrow="SET UP YOUR CLASS" onClose={() => setModal(null)} wide>
      <p className="modal-description">학교와 학급, 과목을 등록해 두면 일정에 선택해서 사용할 수 있어요.</p>
      <SetupModal schools={schools} saving={saving} onSubmit={submitSetup} initialTab={modal.tab} />
    </Modal>}
  </div>;
}

function AssessmentModal({ item, schools, classes, subjects, defaultSchoolId, defaultClassId, defaultGrade, saving, onClose, onSubmit, loadClasses, loadSubjects }) {
  const [chosenSchool, setChosenSchool] = useState(String(item?.school_id || defaultSchoolId || ""));
  const [availableClasses, setAvailableClasses] = useState(classes);
  const [availableSubjects, setAvailableSubjects] = useState(subjects);
  const [chosenGrade, setChosenGrade] = useState(String(item?.grade || defaultGrade || ""));
  const [chosenClass, setChosenClass] = useState(String(item?.class_id || defaultClassId || ""));
  const [chosenSubject, setChosenSubject] = useState(String(item?.subject_id || ""));
  const [error, setError] = useState("");
  const filteredClasses = availableClasses.filter(c => String(c.grade) === chosenGrade);
  const grades = [...new Set(availableClasses.map(c => c.grade))].sort((a,b) => a-b);

  useEffect(() => {
    if (!chosenSchool) { setAvailableClasses([]); setAvailableSubjects([]); return; }
    Promise.all([loadClasses(chosenSchool), loadSubjects(chosenSchool)]).then(([cs, ss]) => {
      setAvailableClasses(cs); setAvailableSubjects(ss);
      const nextGrade = String(item?.grade || chosenGrade || cs[0]?.grade || "");
      setChosenGrade(nextGrade);
      const sameGrade = cs.filter(c => String(c.grade) === nextGrade);
      const nextClass = String(item?.class_id || chosenClass || sameGrade[0]?.id || "");
      setChosenClass(sameGrade.some(c => String(c.id) === nextClass) ? nextClass : String(sameGrade[0]?.id || ""));
      setChosenSubject(String(item?.subject_id || ss[0]?.id || ""));
    }).catch(e => setError(e.message));
  }, [chosenSchool]);

  return <Modal title={item ? "수행평가 수정하기" : "새 일정 등록하기"} eyebrow="ASSESSMENT DETAILS" onClose={onClose}>
    <p className="modal-description">학급 친구들이 확인할 수 있도록 내용을 정확히 입력해 주세요.</p>
    <form className="modal-form" onSubmit={event => { setError(""); onSubmit(event); }}>
      <input type="hidden" name="id" value={item?.id || ""} />
      <Field label="학교"><select name="schoolId" value={chosenSchool} onChange={e => setChosenSchool(e.target.value)} required><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <div className="form-row">
        <Field label="학년"><select value={chosenGrade} onChange={e => { setChosenGrade(e.target.value); const next = availableClasses.find(c => String(c.grade) === e.target.value); setChosenClass(String(next?.id || "")); }} required><option value="">학년</option>{grades.map(g => <option key={g} value={g}>{g}학년</option>)}</select></Field>
        <Field label="반"><select name="classId" value={chosenClass} onChange={e => setChosenClass(e.target.value)} required><option value="">반 선택</option>{filteredClasses.map(c => <option key={c.id} value={c.id}>{c.class_number}반</option>)}</select></Field>
      </div>
      <Field label="과목"><select name="subjectId" value={chosenSubject} onChange={e => setChosenSubject(e.target.value)} required><option value="">과목 선택</option>{availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <Field label="수행평가 제목"><input name="title" defaultValue={item?.title || ""} maxLength="180" required placeholder="예: 수학 탐구 보고서" /></Field>
      <Field label="제출 또는 평가 날짜"><input name="dueDate" type="date" defaultValue={item?.due_date || ""} required /></Field>
      <Field label="세부 내용 (선택)"><textarea name="details" defaultValue={item?.details || ""} maxLength="3000" rows="3" placeholder="준비물, 범위, 제출 방법 등을 적어 주세요." /></Field>
      {error && <p className="inline-error">{error}</p>}
      <button className="button button-primary full-button" disabled={saving}>{saving ? "저장 중…" : "일정 저장하기"} <ArrowRight size={16} /></button>
    </form>
  </Modal>;
}

function SetupModal({ schools, saving, onSubmit, initialTab }) {
  const [tab, setTab] = useState(initialTab || "school");
  return <div className="setup-modal">
    <div className="tab-row">
      {[["school","학교"],["class","학급"],["subject","과목"]].map(([key,label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label} 추가</button>)}
    </div>
    {tab === "school" && <form className="modal-form" onSubmit={e => onSubmit(e, "school")}><Field label="학교명"><input name="name" maxLength="160" required placeholder="예: 한빛고등학교" /></Field><Field label="지역 (선택)"><input name="region" maxLength="120" placeholder="예: 서울시" /></Field><button className="button button-primary full-button" disabled={saving}>학교 등록하기 <ArrowRight size={16} /></button></form>}
    {tab === "class" && <form className="modal-form" onSubmit={e => onSubmit(e, "class")}><Field label="학교"><select name="schoolId" required defaultValue={schools[0]?.id || ""}><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><div className="form-row"><Field label="학년"><input name="grade" type="number" min="1" max="12" required placeholder="1" /></Field><Field label="반"><input name="classNumber" type="number" min="1" max="99" required placeholder="6" /></Field></div><button className="button button-primary full-button" disabled={saving}>학급 등록하기 <ArrowRight size={16} /></button></form>}
    {tab === "subject" && <form className="modal-form" onSubmit={e => onSubmit(e, "subject")}><Field label="학교"><select name="schoolId" required defaultValue={schools[0]?.id || ""}><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="과목명"><input name="name" maxLength="100" required placeholder="예: 통합과학" /></Field><button className="button button-primary full-button" disabled={saving}>과목 등록하기 <ArrowRight size={16} /></button></form>}
  </div>;
}
