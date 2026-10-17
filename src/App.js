import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, CalendarDays, Check, ChevronDown, CircleHelp,
  Clock3, GraduationCap, Plus, Search, Sparkles, X,
  BookOpen, Pencil, Trash2, SlidersHorizontal, School, Layers3, ShieldCheck
} from "lucide-react";

import { api } from "./lib/api.js";
import { todayISO, prettyDate, dateParts } from "./lib/date.js";
import Modal from "./components/common/Modal.jsx";
import Field from "./components/common/Field.jsx";
import EmptyState from "./components/common/EmptyState.jsx";
import AssessmentModal from "./components/assessments/AssessmentModal.jsx";
import SetupModal from "./components/setup/SetupModal.jsx";

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [requests, setRequests] = useState([]);
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
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolResults, setSchoolResults] = useState([]);
  const [schoolSearching, setSchoolSearching] = useState(false);
  const [schoolSearchError, setSchoolSearchError] = useState("");
  const [neisGrades, setNeisGrades] = useState([]);
  const [neisClassLabels, setNeisClassLabels] = useState([]);
  const [neisLoading, setNeisLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setNeisGrades([]);
    setNeisClassLabels([]);
    if (!schoolId) return () => { active = false; };
    setNeisLoading(true);
    api("/api/neis/classes?schoolId=" + encodeURIComponent(schoolId))
      .then(data => { if (active) setNeisGrades((data.grades || []).map(String)); })
      .catch(error => { if (active) notify(error.message, "error"); })
      .finally(() => { if (active) setNeisLoading(false); });
    return () => { active = false; };
  }, [schoolId]);

  useEffect(() => {
    let active = true;
    setNeisClassLabels([]);
    if (!schoolId || !grade) return () => { active = false; };
    setNeisLoading(true);
    api("/api/neis/classes?schoolId=" + encodeURIComponent(schoolId) + "&grade=" + encodeURIComponent(grade))
      .then(data => { if (active) setNeisClassLabels(data.classes || []); })
      .catch(error => { if (active) notify(error.message, "error"); })
      .finally(() => { if (active) setNeisLoading(false); });
    return () => { active = false; };
  }, [schoolId, grade]);

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

  async function searchSchools(queryValue = schoolSearch) {
    const q = queryValue.trim();
    if (q.length < 2) { setSchoolSearchError("학교 이름을 두 글자 이상 입력해 주세요."); setSchoolResults([]); return; }
    setSchoolSearching(true); setSchoolSearchError("");
    try {
      const data = await api("/api/neis/schools?q=" + encodeURIComponent(q));
      setSchoolResults(data.schools || []);
      if (!data.schools?.length) setSchoolSearchError("검색 결과가 없어요.");
    } catch (error) { setSchoolSearchError(error.message); setSchoolResults([]); }
    finally { setSchoolSearching(false); }
  }

  async function chooseSchool(school) {
    setSaving(true);
    try {
      const data = await api("/api/schools", { method: "POST", body: JSON.stringify({ name: school.name, region: [school.region, school.address].filter(Boolean).join(" · ").slice(0,120), officeCode: school.officeCode, schoolCode: school.schoolCode }) });
      await refreshSchools(String(data.school.id));
      setSchoolId(String(data.school.id)); setGrade(""); setClassId("");
      setSchoolSearch(school.name); setSchoolResults([]); setSchoolSearchError("");
      notify("학교를 선택했어요.");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function ensureClass(school, gradeValue, classNumber) {
    const existing = await api("/api/schools/" + school + "/classes");
    const found = existing.classes.find(x => Number(x.grade) === Number(gradeValue) && Number(x.class_number) === Number(classNumber));
    if (found) return found;
    const made = await api("/api/classes", { method: "POST", body: JSON.stringify({ schoolId: school, grade: Number(gradeValue), classNumber: Number(classNumber) }) });
    return made.class;
  }

  async function refreshSchools(preferredId) {
    const data = await api("/api/schools");
    setSchools(data.schools);
    const wanted = preferredId || schoolId;
    if (wanted && data.schools.some(s => String(s.id) === String(wanted))) setSchoolId(String(wanted));
    else if (!schoolId) { setSchoolId(""); setGrade(""); setClassId(""); }
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
        const me = await api("/api/me");
        setAdmin(me.admin);
        const data = await api("/api/schools");
        setSchools(data.schools);
        setSchoolId(""); setGrade(""); setClassId("");
      } catch (error) { notify(error.message, "error"); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!schoolId) { setClasses([]); setGrade(""); setClassId(""); setSubjects([]); setNeisGrades([]); setNeisClassLabels([]); return; }
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

  function openAssessment(item = null) {
    setModal({ type: "assessment", item });
  }

  async function adminLogin(event) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ schoolId: form.get("schoolId"), password: form.get("password") }) });
      setAdmin(data.admin); setModal(null); notify("관리자 인증이 완료됐어요.");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function openAdminQueue() {
    if (!admin) { setModal({ type: "adminLogin" }); return; }
    try { const data = await api("/api/admin/requests"); setRequests(data.requests); setModal({ type: "adminQueue" }); }
    catch (error) { notify(error.message, "error"); }
  }

  async function decideRequest(id, decision) {
    try {
      await api("/api/admin/requests/" + id + "/decision", { method: "POST", body: JSON.stringify({ decision }) });
      const data = await api("/api/admin/requests");
      setRequests(data.requests);
      if (classId) await refreshAssessments(classId);
      notify(decision === "approve" ? "승인했어요." : "반려했어요.");
    } catch (error) { notify(error.message, "error"); }
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
      const subjectName = String(form.get("subjectName") || "").trim();
      if (!payload.subjectId) {
        if (!subjectName) throw new Error("과목명을 입력해 주세요.");
        const schoolForSubject = String(form.get("schoolId") || schoolId);
        const subjectData = await api(`/api/schools/${schoolForSubject}/subjects`);
        const existingSubject = subjectData.subjects.find(s => s.name.trim().toLowerCase() === subjectName.toLowerCase());
        if (existingSubject) payload.subjectId = String(existingSubject.id);
        else {
          const created = await api("/api/subjects", { method: "POST", body: JSON.stringify({ schoolId: schoolForSubject, name: subjectName }) });
          payload.subjectId = String(created.subject.id);
        }
      }
      const data = await api(id ? `/api/assessments/${id}` : "/api/assessments", {
        method: id ? "PUT" : "POST", body: JSON.stringify(payload)
      });
      const targetClass = String(payload.classId);
      const target = classes.find(c => String(c.id) === targetClass);
      setSchoolId(String(form.get("schoolId")));
      setGrade(target ? String(target.grade) : grade);
      setClassId(targetClass);
      setModal(null);
      await refreshAssessments(targetClass);
      notify(data?.message || (id ? "수정 신청을 보냈어요. 관리자 승인 후 반영됩니다." : "등록 신청을 보냈어요. 관리자 승인 후 공개됩니다."));
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function deleteAssessment(item) { notify("일정 삭제는 학교 관리자에게 요청해 주세요.", "error"); }

  async function submitSetup(event, kind) {
    event.preventDefault(); setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      if (kind === "school") {
        const data = await api("/api/schools", { method: "POST", body: JSON.stringify({ name: form.get("name"), region: form.get("region"), officeCode: form.get("officeCode"), schoolCode: form.get("schoolCode") }) });
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
        <span className="account-name">{admin ? <><span className="avatar"><ShieldCheck size={14} /></span>{admin.schoolName} 관리자</> : "로그인 없이 일정 신청"}</span>
        {admin ? <button className="button button-light" onClick={openAdminQueue}><Check size={16} /> 승인함</button> : <button className="button button-dark" onClick={() => setModal({ type: "adminLogin" })}><ShieldCheck size={16} /> 관리자</button>}
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
          <Field label="학교"><div className="main-school-search"><div className="main-school-search-row"><input value={schoolSearch} onChange={e => { setSchoolSearch(e.target.value); setSchoolSearchError(""); setSchoolId(""); setGrade(""); setClassId(""); setNeisGrades([]); setNeisClassLabels([]); setClasses([]); setSchoolResults([]); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); searchSchools(); } }} placeholder="학교 이름 검색" /><button className="button button-dark" type="button" onClick={() => searchSchools()} disabled={schoolSearching}>{schoolSearching ? "검색 중…" : "검색"}</button></div>{schoolSearchError && <small className="main-school-error">{schoolSearchError}</small>}{schoolResults.length > 0 && <div className="main-school-results">{schoolResults.map((s,i) => <button type="button" key={s.officeCode+"-"+s.schoolCode+"-"+i} onClick={() => chooseSchool(s)} disabled={saving}><strong>{s.name}</strong><small>{s.region}{s.schoolType ? " · "+s.schoolType : ""}</small></button>)}</div>}</div></Field>
          <Field label="학년"><div className={"grade-selection-area"+(!schoolId ? " is-empty" : "")}>{!schoolId ? <div className="selection-placeholder"><GraduationCap size={19}/><span>학교를 검색해 선택하면<br/>학년을 고를 수 있어요.</span></div> : neisLoading && !neisGrades.length ? <div className="selection-placeholder compact">학년 정보 불러오는 중…</div> : neisGrades.length ? <div className="choice-card-grid grade-card-grid">{neisGrades.map(g => <button type="button" key={g} className={"choice-card"+(String(grade)===String(g)?" selected":"")} onClick={() => { setGrade(String(g)); setClassId(""); }}><span className="choice-card-number">{g}</span><strong>{g}학년</strong></button>)}</div> : <div className="selection-placeholder compact">조회된 학년이 없어요.</div>}</div></Field>
          <Field label="반"><div className="class-select-wrap"><select className="class-select" value={classId ? String(classes.find(c=>String(c.id)===String(classId))?.class_number || "") : ""} disabled={!schoolId || !grade || neisLoading || !neisClassLabels.length} onChange={async e => { const n=e.target.value; if (!n) { setClassId(""); return; } try { const cls=await ensureClass(schoolId, grade, n); const data=await api("/api/schools/"+schoolId+"/classes"); setClasses(data.classes); setClassId(String(cls.id)); } catch(error) { notify(error.message,"error"); } }}><option value="">{!schoolId ? "학교를 먼저 선택하세요" : !grade ? "학년을 먼저 선택하세요" : neisLoading ? "반 정보 불러오는 중…" : neisClassLabels.length ? "반 선택" : "조회된 반 없음"}</option>{neisClassLabels.map(label => { const n=String(label).match(/\d+/)?.[0] || ""; return n ? <option key={label} value={n}>{/^\d+$/.test(String(label)) ? label+"반" : label}</option> : null; })}</select><ChevronDown size={15} /></div></Field>
        </div>
        <button className="text-action" onClick={() => setModal({ type: "setup", tab: "school" })}>학교·학급·과목이 없나요? <span>직접 추가하기 <ArrowRight size={14} /></span></button>
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
            const own = false;
            return <article className="assessment-item" key={item.id}>
              <div className="date-tile"><span>{date.month}월</span><strong>{date.day}</strong><small>{date.weekday}</small></div>
              <div className="assessment-content"><div className="item-labels"><span className="subject-tag">{item.subject_name}</span><span className={item.due_date < todayISO() ? "past-tag" : "date-tag"}>{item.due_date < todayISO() ? "지난 일정" : prettyDate(item.due_date)}</span></div><h3>{item.title}</h3>{item.details && <p className="item-details">{item.details}</p>}<div className="item-meta"><span className="meta-avatar">{item.author?.slice(0, 1) || "?"}</span>{item.author} 등록</div></div>
              <div className="item-actions"><button className="icon-button" title="수정 신청" onClick={() => openAssessment(item)}><Pencil size={16} /></button></div>
            </article>;
          })}</div>
        }
      </section>

      <section className="bottom-tip"><div className="tip-icon"><CircleHelp size={20} /></div><div><strong>일정이 잘못 등록되어 있나요?</strong><p>누구나 일정을 신청할 수 있고, 새 일정과 수정 사항은 해당 학교 관리자가 승인한 뒤 반영돼요.</p></div></section>
      <footer><a className="footer-brand" href="#" onClick={e => e.preventDefault()}>모아<span>.</span></a><span>함께 정리하고, 미리 준비하기.</span><span>학교생활을 조금 더 가볍게 ✳</span></footer>
    </main>

    {notice && <div className={`toast ${notice.type === "error" ? "toast-error" : ""}`} role="status">{notice.type === "error" ? <CircleHelp size={17} /> : <Check size={17} />}{notice.message}<button onClick={() => setNotice(null)} aria-label="알림 닫기"><X size={15} /></button></div>}

    {modal?.type === "adminLogin" && <Modal title="학교 관리자 인증" eyebrow="SCHOOL ADMIN" onClose={() => setModal(null)}>
      <p className="modal-description">관리자로 등록된 학교를 선택하고 관리자 비밀번호를 입력해 주세요.</p>
      <form className="modal-form" onSubmit={adminLogin}>
        <Field label="학교"><select name="schoolId" required defaultValue=""><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}{s.region ? " · " + s.region : ""}</option>)}</select></Field>
        <Field label="관리자 비밀번호"><input name="password" type="password" required minLength="12" autoComplete="current-password" /></Field>
        <button className="button button-primary full-button" disabled={saving}>{saving ? "확인 중…" : "관리자 인증"} <ArrowRight size={16} /></button>
      </form>
    </Modal>}

    {modal?.type === "adminQueue" && <Modal title="일정 승인함" eyebrow={admin?.schoolName || "SCHOOL ADMIN"} onClose={() => setModal(null)} wide>
      <p className="modal-description">새 일정과 수정 신청을 확인한 뒤 승인하거나 반려해 주세요.</p>
      {!requests.length ? <EmptyState title="대기 중인 신청이 없어요" description="새 신청이 들어오면 여기에 표시돼요." /> : <div className="assessment-list">{requests.map(r => <article className="assessment-item" key={r.id}>
        <div className="assessment-content"><div className="item-labels"><span className="subject-tag">{r.action === "create" ? "새 일정" : "수정 신청"}</span><span className="date-tag">{new Date(r.created_at).toLocaleString("ko-KR")}</span></div><h3>{r.payload.title}</h3><p className="item-details">{r.payload.dueDate} · {r.payload.details || "세부 내용 없음"}</p><div className="item-actions"><button className="button button-primary" onClick={() => decideRequest(r.id,"approve")}>승인</button><button className="button button-light" onClick={() => decideRequest(r.id,"reject")}>반려</button></div></div>
      </article>)}</div>}
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
