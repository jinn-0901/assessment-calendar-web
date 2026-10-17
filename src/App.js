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
  const [registrationCodes, setRegistrationCodes] = useState([]);
  const [issuedCode, setIssuedCode] = useState("");
  const [regSchoolQuery, setRegSchoolQuery] = useState("");
  const [regSchoolResults, setRegSchoolResults] = useState([]);
  const [regSchool, setRegSchool] = useState(null);
  const [regSchoolLoading, setRegSchoolLoading] = useState(false);
  const [regSchoolError, setRegSchoolError] = useState("");
  const [loginSchoolQuery, setLoginSchoolQuery] = useState("");
  const [loginSchoolResults, setLoginSchoolResults] = useState([]);
  const [loginSchool, setLoginSchool] = useState(null);
  const [loginSchoolLoading, setLoginSchoolLoading] = useState(false);
  const [loginSchoolError, setLoginSchoolError] = useState("");
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
  const [viewMode, setViewMode] = useState("cards");
  const [showAcademicCards, setShowAcademicCards] = useState(true);
  const [mainView, setMainView] = useState("assessments");
  const [academicEvents, setAcademicEvents] = useState([]);
  const [academicLoading, setAcademicLoading] = useState(false);
  const visibleAcademicEvents = useMemo(() => academicEvents.filter(event => {
    const hasGradeFlags = event.grade1 || event.grade2 || event.grade3;
    if (!hasGradeFlags) return true;
    if (String(grade) === "1") return event.grade1;
    if (String(grade) === "2") return event.grade2;
    if (String(grade) === "3") return event.grade3;
    return true;
  }), [academicEvents, grade]);
  const [timetableDate, setTimetableDate] = useState(() => todayISO());
  const [timetableRows, setTimetableRows] = useState([]);
  const [mealMonth, setMealMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [mealRows, setMealRows] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealViewMode, setMealViewMode] = useState("calendar");
  const [mealLoading, setMealLoading] = useState(false);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
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
  }).sort((a, b) => (a.start_date || a.due_date || "").localeCompare(b.start_date || b.due_date || "") || (a.start_time || "99:99").localeCompare(b.start_time || "99:99") || String(a.title || "").localeCompare(String(b.title || ""), "ko")), [assessments, query, subjectFilter]);
  const assessmentStartDate = item => item.start_date || item.due_date || "";
  const assessmentStartTime = item => item.start_time || item.end_time || "99:99";
  const compareAssessmentStart = (a, b) => assessmentStartDate(a).localeCompare(assessmentStartDate(b)) || assessmentStartTime(a).localeCompare(assessmentStartTime(b)) || String(a.title || "").localeCompare(String(b.title || ""), "ko");
  const upcomingAssessments = assessments.filter(a => (a.end_date || a.due_date || "") >= todayISO()).sort(compareAssessmentStart);
  const upcomingCount = upcomingAssessments.length;
  const nextAssessment = upcomingAssessments[0];
  const mealCalendarCells = useMemo(() => {
    const first = new Date(mealMonth.getFullYear(), mealMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const iso = [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
      const neisDate = iso.replace(/-/g, "");
      return { date, iso, inMonth: date.getMonth() === mealMonth.getMonth(), meals: mealRows.filter(meal => meal.date === neisDate).sort((a,b) => ["조식","중식","석식"].indexOf(a.mealType)-["조식","중식","석식"].indexOf(b.mealType)) };
    });
  }, [mealMonth, mealRows]);

  const calendarCells = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
      return { date, iso, inMonth: date.getMonth() === calendarMonth.getMonth(), items: filteredAssessments.filter(item => {
        const from = item.start_date || item.due_date || "";
        const to = item.end_date || item.due_date || from;
        return from && from <= iso && iso <= to;
      }).sort(compareAssessmentStart) };
    });
  }, [calendarMonth, filteredAssessments]);

  const notify = (message, type = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 4200);
  };


  useEffect(() => {
    if (!["academic", "assessments"].includes(mainView) || !schoolId) return;
    let active = true;
    const from = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const to = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    setAcademicLoading(true);
    api("/api/neis/academic-calendar?schoolId=" + encodeURIComponent(schoolId) + "&from=" + fmt(from) + "&to=" + fmt(to))
      .then(data => { if (active) setAcademicEvents(data.events || []); })
      .catch(error => { if (active) { setAcademicEvents([]); notify(error.message, "error"); } })
      .finally(() => { if (active) setAcademicLoading(false); });
    return () => { active = false; };
  }, [mainView, schoolId, calendarMonth]);

  useEffect(() => {
    if (mainView !== "timetable" || !schoolId || !grade || !selectedClass) { setTimetableRows([]); return; }
    let active = true;
    setTimetableLoading(true);
    const now = new Date(timetableDate + "T12:00:00");
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const className = String(selectedClass.class_number);
    api("/api/neis/timetable?schoolId=" + encodeURIComponent(schoolId) + "&grade=" + encodeURIComponent(grade) + "&className=" + encodeURIComponent(className) + "&from=" + encodeURIComponent(fmt(monday)))
      .then(data => { if (active) setTimetableRows(data.timetable || []); })
      .catch(error => { if (active) { setTimetableRows([]); notify(error.message, "error"); } })
      .finally(() => { if (active) setTimetableLoading(false); });
    return () => { active = false; };
  }, [mainView, schoolId, grade, selectedClass?.class_number, timetableDate]);

  useEffect(() => {
    if (mainView !== "meals" || !schoolId) return;
    let active = true;
    const from = new Date(mealMonth.getFullYear(), mealMonth.getMonth(), 1);
    const to = new Date(mealMonth.getFullYear(), mealMonth.getMonth()+1, 0);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    setMealLoading(true);
    api("/api/neis/meals?schoolId=" + encodeURIComponent(schoolId) + "&from=" + fmt(from) + "&to=" + fmt(to))
      .then(data => { if (active) setMealRows(data.meals || []); })
      .catch(error => { if (active) { setMealRows([]); notify(error.message, "error"); } })
      .finally(() => { if (active) setMealLoading(false); });
    return () => { active = false; };
  }, [mainView, schoolId, mealMonth]);


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
    if (item && !admin) {
      setModal({ type: "assessmentDetail", item });
      return;
    }
    setModal({ type: "assessment", item, isNew: !item });
  }

  async function adminLogout() {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } catch (error) {
      // A stale session should not prevent the local admin token from being cleared.
    }
    window.localStorage.removeItem("school_admin_token");
    setAdmin(null);
    setRequests([]);
    setRegistrationCodes([]);
    setIssuedCode("");
    setModal(null);
    notify("관리자 로그아웃했어요.");
  }

  async function searchLoginSchools() {
    const q = loginSchoolQuery.trim();
    if (q.length < 2) { setLoginSchoolError("학교 이름을 두 글자 이상 입력해 주세요."); setLoginSchoolResults([]); return; }
    setLoginSchoolLoading(true); setLoginSchoolError("");
    try {
      const data = await api("/api/neis/schools?q=" + encodeURIComponent(q));
      setLoginSchoolResults(data.schools || []);
      if (!data.schools?.length) setLoginSchoolError("검색 결과가 없어요.");
    } catch (error) { setLoginSchoolError(error.message); setLoginSchoolResults([]); }
    finally { setLoginSchoolLoading(false); }
  }

  async function chooseLoginSchool(school) {
    setSaving(true);
    try {
      const data = await api("/api/schools", { method: "POST", body: JSON.stringify({ name: school.name, region: [school.region, school.address].filter(Boolean).join(" · ").slice(0,120), officeCode: school.officeCode, schoolCode: school.schoolCode }) });
      setLoginSchool({ ...school, id: String(data.school.id) });
      setLoginSchoolQuery(school.name);
      setLoginSchoolResults([]);
      setLoginSchoolError("");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function adminLogin(event) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ schoolId: loginSchool?.id, password: form.get("password") }) });
      setAdmin(data.admin); setModal(null); notify("관리자 인증이 완료됐어요.");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function issueRegistrationCode() {
    try {
      const data = await api("/api/admin/registration-codes", { method: "POST", body: JSON.stringify({}) });
      setIssuedCode(data.registrationCode);
      const list = await api("/api/admin/registration-codes");
      setRegistrationCodes(list.codes || []);
      notify("새 등록 코드를 발급했어요. 코드는 지금 복사해 안전하게 전달해 주세요.");
    } catch (error) { notify(error.message, "error"); }
  }

  async function openRegistrationCodes() {
    if (!admin) return;
    try {
      const data = await api("/api/admin/registration-codes");
      setRegistrationCodes(data.codes || []);
      setIssuedCode("");
      setModal({ type: "registrationCodes" });
    } catch (error) { notify(error.message, "error"); }
  }

  async function revokeRegistrationCode(id) {
    try {
      await api("/api/admin/registration-codes/" + id + "/revoke", { method: "POST", body: JSON.stringify({}) });
      const data = await api("/api/admin/registration-codes");
      setRegistrationCodes(data.codes || []);
      notify("등록 코드를 폐기했어요.");
    } catch (error) { notify(error.message, "error"); }
  }

  async function searchRegistrationSchools() {
    const q = regSchoolQuery.trim();
    if (q.length < 2) { setRegSchoolError("학교 이름을 두 글자 이상 입력해 주세요."); return; }
    setRegSchoolLoading(true); setRegSchoolError("");
    try {
      const data = await api("/api/neis/schools?q=" + encodeURIComponent(q));
      setRegSchoolResults(data.schools || []);
      if (!data.schools?.length) setRegSchoolError("검색 결과가 없어요.");
    } catch (error) { setRegSchoolError(error.message); setRegSchoolResults([]); }
    finally { setRegSchoolLoading(false); }
  }

  async function chooseRegistrationSchool(school) {
    setSaving(true);
    try {
      const data = await api("/api/schools", { method: "POST", body: JSON.stringify({ name: school.name, region: [school.region, school.address].filter(Boolean).join(" · ").slice(0,120), officeCode: school.officeCode, schoolCode: school.schoolCode }) });
      setRegSchool({ ...school, id: String(data.school.id) });
      setRegSchoolQuery(school.name);
      setRegSchoolResults([]);
      setRegSchoolError("");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function bootstrapRegistrationCode(event) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("/api/admin/registration-codes/bootstrap", { method: "POST", body: JSON.stringify({ setupKey: form.get("setupKey"), schoolId: regSchool?.id }) });
      setIssuedCode(data.registrationCode);
      setModal({ type: "bootstrapCode" });
      notify("최초 등록 코드를 발급했어요. 안전하게 전달해 주세요.");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function registerAdmin(event) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      notify("새 비밀번호가 서로 일치하지 않아요.", "error"); setSaving(false); return;
    }
    try {
      await api("/api/admin/register", { method: "POST", body: JSON.stringify({ schoolId: form.get("schoolId"), registrationCode: form.get("registrationCode"), password: form.get("password") }) });
      setModal({ type: "adminLogin" });
      notify("관리자 등록이 완료됐어요. 설정한 비밀번호로 로그인해 주세요.");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function changeAdminPassword(event) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      notify("새 비밀번호가 서로 일치하지 않아요.", "error"); setSaving(false); return;
    }
    try {
      await api("/api/admin/password", { method: "POST", body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }) });
      setModal(null);
      notify("관리자 비밀번호를 변경했어요.");
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

  async function deleteAssessment(item) {
    if (!admin) { notify("일정 삭제는 학교 관리자만 할 수 있어요.", "error"); return; }
    if (!window.confirm(`"${item.title}" 일정을 삭제할까요? 삭제하면 복구할 수 없어요.`)) return;
    try {
      await api("/api/assessments/" + item.id, { method: "DELETE" });
      if (classId) await refreshAssessments(classId);
      notify("일정을 삭제했어요.");
    } catch (error) { notify(error.message, "error"); }
  }

  async function saveAssessment(event) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    const id = form.get("id");
    const payload = {
      classId: form.get("classId"), subjectId: form.get("subjectId"),
      title: form.get("title"), startDate: form.get("startDate"), endDate: form.get("endDate"), startTime: form.get("startTime") || null, endTime: form.get("endTime") || null, details: form.get("details")
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
      notify(data?.message || (id ? (admin ? "일정을 수정했어요." : "수정 신청을 보냈어요. 관리자 승인 후 반영됩니다.") : (admin ? "일정을 등록했어요. 바로 공개됩니다." : "등록 신청을 보냈어요. 관리자 승인 후 공개됩니다.")));
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }


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
    <style>{`.main-view-tabs{display:flex;gap:8px;margin:22px 0 8px;padding:5px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}.main-view-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;flex:1;border:0;border-radius:10px;padding:12px;background:transparent;color:#667085;font:inherit;cursor:pointer}.main-view-tabs button.selected{background:#f0edff;color:#5b43c2;font-weight:700}.academic-event-list{display:grid;gap:0;padding:6px 18px}.academic-event{display:grid;grid-template-columns:90px minmax(0,1fr);gap:14px;padding:14px 4px;border-bottom:1px solid #edf0f4}.academic-event:last-child{border-bottom:0}.academic-event-date{font-size:13px;color:#5b43c2;font-weight:700}.academic-event strong{font-size:15px}.academic-event p{margin:5px 0 0;color:#667085;font-size:13px;line-height:1.5}.weekly-timetable{display:grid;gap:14px}.meal-horizontal{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%}.meal-horizontal>div{min-width:0;padding:10px;border:1px solid #edf0f4;border-radius:10px;background:#fbfbfd}.meal-horizontal b{display:block;color:#5b43c2;margin-bottom:6px}.meal-horizontal p{white-space:pre-line;margin:0 0 5px;color:#475467;line-height:1.5;font-size:13px}.meal-calendar-event{cursor:pointer}.timetable-school-grid{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;overflow:hidden;border:1px solid #e5e7eb;border-radius:12px}.timetable-school-grid th,.timetable-school-grid td{border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:9px 6px;text-align:center;overflow-wrap:anywhere}.timetable-school-grid th{background:#f8fafc;font-size:13px;color:#475467}.timetable-school-grid td{height:64px;background:white}.timetable-school-grid tr:last-child td{border-bottom:0}.timetable-school-grid th:last-child,.timetable-school-grid td:last-child{border-right:0}.timetable-school-grid .period-label{width:54px;background:#f8fafc;font-weight:700;color:#6848d6}.timetable-school-grid td strong{display:block;font-size:13px}.timetable-school-grid td small{display:block;color:#667085;font-size:11px;margin-top:4px}@media(max-width:600px){.meal-horizontal{gap:6px}.meal-horizontal>div{padding:7px 5px}.meal-horizontal p{font-size:11px}.timetable-school-grid th,.timetable-school-grid td{padding:6px 2px;font-size:11px}.timetable-school-grid td{height:54px}.timetable-school-grid .period-label{width:36px}}.weekly-timetable-day{padding:14px;border:1px solid #e6e8ec;border-radius:14px}.weekly-timetable-day h3{margin:0 0 12px;font-size:15px}.meal-calendar-list{display:grid;padding:8px 18px}.meal-calendar-item{display:grid;grid-template-columns:90px minmax(0,1fr);gap:14px;padding:14px 4px;border-bottom:1px solid #edf0f4}.meal-calendar-item p{white-space:pre-line;margin:6px 0;color:#475467;line-height:1.6;font-size:13px}.meal-calendar-item small{color:#667085}.timetable-panel{padding:18px;border:1px solid #e5e7eb;border-radius:16px;background:#fff}.timetable-panel>.field{max-width:260px;margin-bottom:18px}.timetable-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.timetable-period{display:flex;flex-direction:column;gap:7px;padding:16px;border:1px solid #e6e8ec;border-radius:12px;background:#fafaff;min-width:0}.timetable-period span{font-size:12px;color:#6848d6;font-weight:700}.timetable-period strong{overflow-wrap:anywhere}.timetable-period small{color:#667085}@media(max-width:600px){.main-view-tabs button{font-size:13px;padding:10px 5px}.main-view-tabs button svg{display:none}.timetable-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.academic-event{grid-template-columns:76px minmax(0,1fr);gap:8px}}.view-switch{display:flex;gap:4px;padding:4px;border:1px solid #e4e7ec;border-radius:12px;background:#fff}.view-switch button{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:8px;background:transparent;padding:9px 12px;color:#667085;font:inherit;cursor:pointer}.view-switch button.selected{background:#f0edff;color:#5b43c2;font-weight:700}.calendar-view{border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#fff}.calendar-heading{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px;border-bottom:1px solid #e5e7eb}.calendar-heading h3{margin:0;font-size:18px;min-width:145px;text-align:center}.calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.calendar-weekday{text-align:center;padding:10px 2px;background:#f8fafc;color:#667085;font-size:12px;font-weight:700;border-bottom:1px solid #e5e7eb}.calendar-day{min-height:105px;min-width:0;padding:6px;border-right:1px solid #edf0f4;border-bottom:1px solid #edf0f4}.calendar-day:nth-child(7n){border-right:0}.calendar-day.outside-month{background:#fafafa;color:#b8bec8}.calendar-day.today{background:#f6f3ff}.calendar-day-number{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;font-size:12px;border-radius:50%}.calendar-day.today .calendar-day-number{background:#6848d6;color:white;font-weight:700}.calendar-day-items{display:grid;gap:4px;margin-top:4px}.calendar-event{display:block;width:100%;min-width:0;border:0;border-radius:5px;background:#f0edff;color:#4934a3;text-align:left;padding:4px 5px;font-size:11px;cursor:pointer;overflow:hidden}.calendar-event b,.calendar-event span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.calendar-event span{margin-top:2px}.calendar-event.event-continues-before{margin-left:-6px;width:calc(100% + 6px);border-top-left-radius:5px;border-bottom-left-radius:5px;border-bottom-right-radius:0;border-top-right-radius:0;border-left:3px solid #8b78e6}.calendar-event.event-continues-after{margin-right:-6px;width:calc(100% + 6px);border-top-right-radius:5px;border-bottom-right-radius:5px;border-top-left-radius:0;border-bottom-left-radius:0;border-right:3px solid #8b78e6}.approval-meta{margin:7px 0;color:#475467;font-size:14px;line-height:1.6} .approval-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;align-items:stretch}.approval-card{min-width:0;box-sizing:border-box;width:100%;border:1px solid #e6e8ec;border-radius:16px;padding:14px 16px;display:grid;grid-template-columns:minmax(150px,1.05fr) minmax(0,1.7fr) auto;grid-template-areas:"head info actions" "details details details";align-items:center;gap:10px 18px;background:#fff}.approval-card-head{grid-area:head;min-width:0}.approval-card-head .item-labels{display:flex;flex-wrap:wrap;gap:6px}.approval-card-head h3{margin:7px 0 0;font-size:16px;line-height:1.35;overflow-wrap:anywhere;word-break:normal}.approval-card-info{grid-area:info;display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,.8fr) minmax(0,1.6fr);gap:6px 12px;min-width:0;align-items:start}.approval-card-info p{margin:0;min-width:0;font-size:13px;line-height:1.45;overflow-wrap:anywhere;word-break:normal}.approval-card-info p b,.approval-card-info p span{display:block}.approval-card-info p b{font-size:11px;color:#667085;margin-bottom:3px}.approval-card-info p span{font-weight:600;color:#344054}.approval-card .approval-details{grid-area:details;min-width:0;max-width:100%;box-sizing:border-box;margin:0;padding:9px 11px;font-size:13px;line-height:1.45;white-space:normal;overflow-wrap:anywhere;word-break:normal;background:#f8fafc;border-radius:9px}.approval-card .item-actions{grid-area:actions;min-width:0;display:flex;flex-wrap:nowrap;gap:6px;margin-top:0;justify-content:flex-end;align-self:center;white-space:normal}.approval-card .item-actions .button{min-width:64px;flex:0 0 auto;white-space:nowrap;padding-left:10px;padding-right:10px}.meta-avatar.admin-author{background:#e0e7ff;color:#3730a3}.meta-avatar.student-author{background:#d1fae5;color:#065f46}.item-time{font-weight:600;color:#344054}.delete-action{color:#b42318}.approval-details{margin:12px 0;padding:12px 14px;background:#f8fafc;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6;color:#344054}@media(max-width:900px){.approval-card{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"head actions" "info info" "details details";gap:10px 14px;padding:14px}.approval-card-info{grid-template-columns:minmax(0,.8fr) minmax(0,.8fr) minmax(0,1.5fr)}.approval-card .item-actions{justify-content:flex-end}}@media(max-width:520px){.approval-card{grid-template-columns:minmax(0,1fr);grid-template-areas:"head" "info" "details" "actions"}.approval-card-info{grid-template-columns:repeat(2,minmax(0,1fr))}.approval-card-info p:last-child{grid-column:1/-1}.approval-card .item-actions{justify-content:flex-end}}.modal-wide .assessment-item{width:100%;box-sizing:border-box;align-items:flex-start;padding:20px;gap:18px}.modal-wide .assessment-content{min-width:0;flex:1}.modal-wide .assessment-content h3{font-size:19px;margin:10px 0}.modal-wide .item-actions{display:flex;gap:8px;flex-wrap:wrap}.modal-wide .item-actions .button{white-space:nowrap}@media(max-width:700px){.list-toolbar{flex-wrap:wrap}.view-switch{width:100%;justify-content:stretch}.view-switch button{flex:1;justify-content:center}.calendar-day{min-height:76px;padding:3px}.calendar-event{font-size:10px;padding:3px}.calendar-heading{gap:6px;flex-wrap:wrap}.calendar-heading h3{min-width:120px;font-size:16px}.modal-wide .assessment-item{padding:13px;gap:10px}.modal-wide .item-actions{width:100%;justify-content:flex-end}}`}</style>
    <header className="topbar">
      <a className="brand" href="#" onClick={e => e.preventDefault()}>
        <span className="brand-icon"><CalendarDays size={21} strokeWidth={2.5} /></span>
        <span className="brand-name">모아<span>.</span><small>수행평가 일정</small></span>
      </a>
      <div className="top-actions">
        <span className="account-name">{admin ? <><span className="avatar"><ShieldCheck size={14} /></span>{admin.schoolName} 관리자</> : "로그인 없이 일정 신청"}</span>
        {admin ? <><button className="button button-light" onClick={() => setModal({ type: "changeAdminPassword" })}>비밀번호 변경</button><button className="button button-light" onClick={openRegistrationCodes}><ShieldCheck size={16} /> 등록 코드</button><button className="button button-light" onClick={openAdminQueue}><Check size={16} /> 승인함</button><button className="button button-light" onClick={adminLogout}>로그아웃</button></> : <button className="button button-dark" onClick={() => setModal({ type: "adminLogin" })}><ShieldCheck size={16} /> 관리자</button>}
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
      </section>

      <nav className="main-view-tabs" aria-label="학교 일정 메뉴">
        <button type="button" className={mainView === "assessments" ? "selected" : ""} onClick={() => setMainView("assessments")}><CalendarDays size={16}/> 일정 달력</button>
        <button type="button" className={mainView === "timetable" ? "selected" : ""} onClick={() => setMainView("timetable")}><BookOpen size={16}/> 주간 시간표</button>
        <button type="button" className={mainView === "meals" ? "selected" : ""} onClick={() => setMainView("meals")}><GraduationCap size={16}/> 급식 달력</button>
      </nav>

      {mainView === "timetable" && <section className="schedule-area">
        <div className="schedule-header"><div><span className="section-kicker">NEIS CLASS TIMETABLE</span><h2>반별 시간표</h2><p>{selectedSchool && selectedClass ? `${selectedSchool.name} · ${grade}학년 ${selectedClass.class_number}반` : "학교, 학년, 반을 선택해 주세요."}</p></div></div>
        <div className="timetable-panel"><Field label="날짜"><input type="date" value={timetableDate} onChange={e => setTimetableDate(e.target.value)} /></Field>
          {timetableLoading ? (
            <div className="loading-state">나이스 주간 시간표를 불러오고 있어요…</div>
          ) : !schoolId || !grade || !selectedClass ? (
            <EmptyState icon={School} title="학급을 선택해 주세요" description="위에서 학교와 학년, 반을 선택하면 시간표를 볼 수 있어요." />
          ) : timetableRows.length ? (
            <div style={{overflowX:"auto"}}>
              <table className="timetable-school-grid">
                <thead><tr><th className="period-label">교시</th>{timetableRows.map(day => <th key={day.date}>{["일","월","화","수","목","금","토"][new Date(day.date.slice(0,4)+"-"+day.date.slice(4,6)+"-"+day.date.slice(6,8)+"T12:00:00").getDay()]}<br/>{Number(day.date.slice(4,6))}/{Number(day.date.slice(6,8))}</th>)}</tr></thead>
                <tbody>{Array.from({length:Math.max(0,...timetableRows.map(day=>day.lessons.length ? Math.max(...day.lessons.map(row=>row.period)) : 0))},(_,i)=>i+1).map(period=><tr key={period}><td className="period-label">{period}교시</td>{timetableRows.map(day=>{const row=day.lessons.find(item=>item.period===period);return <td key={day.date+"-"+period}>{row?<><strong>{row.subject||"과목 미등록"}</strong></>:<span style={{color:"#c0c5ce"}}>—</span>}</td>})}</tr>)}</tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="시간표가 없어요" description="선택한 주의 시간표가 나이스에 등록되어 있는지 확인해 주세요." />
          )}
        </div>
      </section>}


      {mainView === "meals" && <section className="schedule-area">
        <div className="schedule-header"><div><span className="section-kicker">NEIS SCHOOL MEALS</span><h2>급식 달력</h2><p>{selectedSchool ? selectedSchool.name : "학교를 먼저 선택해 주세요."}</p></div></div>
        <div className="calendar-view">
          <div className="calendar-heading"><button className="button button-light" onClick={() => setMealMonth(new Date(mealMonth.getFullYear(),mealMonth.getMonth()-1,1))}>‹</button><h3>{mealMonth.getFullYear()}년 {mealMonth.getMonth()+1}월</h3><button className="button button-light" onClick={() => setMealMonth(new Date(mealMonth.getFullYear(),mealMonth.getMonth()+1,1))}>›</button><button className="button button-light" onClick={() => setMealMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1))}>이번 달</button></div>
          <div className="view-switch" role="group" aria-label="급식 보기 방식">
            <button type="button" className={mealViewMode === "cards" ? "selected" : ""} onClick={() => setMealViewMode("cards")}><Layers3 size={15}/> 카드형</button>
            <button type="button" className={mealViewMode === "calendar" ? "selected" : ""} onClick={() => setMealViewMode("calendar")}><CalendarDays size={15}/> 달력형</button>
          </div>
          {mealLoading ? <div className="loading-state">나이스 급식 정보를 불러오고 있어요…</div> : !schoolId ? <EmptyState icon={School} title="학교를 선택해 주세요" description="학교를 선택하면 날짜별 급식 메뉴를 확인할 수 있어요."/> : !mealRows.length ? <EmptyState icon={CalendarDays} title="등록된 급식이 없어요" description="해당 월에 나이스 급식 정보가 없을 수 있어요."/> : mealViewMode === "cards" ? (
            <div className="meal-calendar-list">{mealCalendarCells.filter(cell => cell.inMonth && cell.meals.length).map(cell => <article className="meal-calendar-item" key={cell.iso}><strong>{cell.date.getMonth()+1}월 {cell.date.getDate()}일 · {["일","월","화","수","목","금","토"][cell.date.getDay()]}</strong><div className="meal-horizontal">{["조식","중식","석식"].map(type => { const meal=cell.meals.find(item => item.mealType.includes(type)); return <div key={type}><b>{type}</b><p>{meal ? meal.menu : "정보 없음"}</p>{meal && meal.calories && <small>{meal.calories}</small>}</div>; })}</div></article>)}</div>
          ) : (
            <div className="calendar-grid meal-calendar-grid">
              {["일","월","화","수","목","금","토"].map(day => <div className="calendar-weekday" key={day}>{day}</div>)}
              {mealCalendarCells.map(cell => <div key={cell.iso} className={"calendar-day"+(!cell.inMonth ? " outside-month" : "")+(cell.iso === todayISO() ? " today" : "")}>
                <span className="calendar-day-number">{cell.date.getDate()}</span>
                <div className="calendar-day-items">{["조식","중식","석식"].map(type => { const meal=cell.meals.find(item => item.mealType.includes(type)); return <button type="button" className="calendar-event meal-calendar-event" key={type} disabled={!meal} onClick={() => meal && setSelectedMeal({ ...meal, dateLabel: `${cell.date.getMonth()+1}월 ${cell.date.getDate()}일` })}><b>{type}</b><span>{meal ? meal.menu : (cell.inMonth ? "정보 없음" : "")}</span></button>; })}</div>
              </div>)}
            </div>
          )}
        </div>
      </section>}

      {selectedMeal && <div role="dialog" aria-modal="true" aria-label="급식 전체 메뉴" onClick={() => setSelectedMeal(null)} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(16,24,40,.48)",display:"grid",placeItems:"center",padding:18}}><section onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:18,padding:22,width:"min(520px,100%)",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><span className="section-kicker">{selectedMeal.mealType}</span><h2 style={{margin:"6px 0"}}>{selectedMeal.dateLabel} 급식 메뉴</h2></div><button className="button button-light" onClick={() => setSelectedMeal(null)} aria-label="닫기"><X size={18}/></button></div><p style={{whiteSpace:"pre-line",lineHeight:1.8,color:"#344054"}}>{selectedMeal.menu || "등록된 메뉴가 없어요."}</p>{selectedMeal.calories && <small style={{color:"#667085"}}>열량: {selectedMeal.calories}</small>}</section></div>}

      {mainView === "assessments" && <section className="schedule-area">
        <div className="schedule-header">
          <div><span className="section-kicker">ASSESSMENT SCHEDULE</span><h2>다가오는 수행평가 <span className="count-badge">{assessments.length}</span></h2><p>{selectedSchool && selectedClass ? `${selectedSchool.name} · ${selectedClass.grade}학년 ${selectedClass.class_number}반` : "학교와 학급을 선택해 주세요."}</p></div>
          <button className="button button-primary" onClick={() => openAssessment()}><Plus size={17} /> 일정 등록</button>
        </div>

        <div className="stats-row">
          <div className="stat-card"><div className="stat-icon purple"><CalendarDays size={18} /></div><div><span>등록된 일정</span><strong>{assessments.length}<small>개</small></strong></div></div>
          <div className="stat-card"><div className="stat-icon green"><Clock3 size={18} /></div><div><span>앞으로 남은 일정</span><strong>{upcomingCount}<small>개</small></strong></div></div>
          <div className="stat-card next-stat"><div className="stat-icon orange"><ArrowDownRight size={18} /></div><div><span>가장 가까운 수행평가</span><strong className="next-title">{nextAssessment ? nextAssessment.title : "예정된 일정 없음"}</strong><small>{nextAssessment ? prettyDate(assessmentStartDate(nextAssessment)) + (nextAssessment.start_time ? " · " + String(nextAssessment.start_time).slice(0,5) : " · 시간 미정") : "새 일정을 등록해 보세요"}</small></div></div>
        </div>

        <div className="list-toolbar">
          <div className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="수행평가 또는 과목 검색" /></div>
          <div className="filter-box"><SlidersHorizontal size={16} /><select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}><option value="all">모든 과목</option>{subjectNames.map(name => <option key={name} value={name}>{name}</option>)}</select><ChevronDown size={14} /></div>
          <div className="view-switch" role="group" aria-label="일정 보기 방식">
            <button type="button" className={viewMode === "cards" ? "selected" : ""} onClick={() => setViewMode("cards")}><Layers3 size={15} /> 카드형</button>
            <button type="button" className={viewMode === "calendar" ? "selected" : ""} onClick={() => setViewMode("calendar")}><CalendarDays size={15} /> 달력형</button>
          </div>
        </div>

        {viewMode === "cards" && <label style={{display:"inline-flex",alignItems:"center",gap:8,margin:"10px 0 4px",fontSize:14,color:"#475467",cursor:"pointer"}}><input type="checkbox" checked={showAcademicCards} onChange={e => setShowAcademicCards(e.target.checked)} /> 학사일정 표시</label>}

        {loading ? <div className="loading-state">일정을 불러오고 있어요…</div> : !schoolId ? <EmptyState icon={School} title="먼저 학교를 선택해 주세요" description="학교를 선택하면 학사일정을 확인할 수 있어요." /> : filteredAssessments.length === 0 && visibleAcademicEvents.length === 0 ? <EmptyState icon={BookOpen} title={query || subjectFilter !== "all" ? "검색 결과가 없어요" : "표시할 일정이 없어요"} description={query || subjectFilter !== "all" ? "검색어나 과목 필터를 바꿔 보세요." : "해당 월에 등록된 수행평가나 학사일정이 없어요."} /> :
          viewMode === "calendar" ? <div className="calendar-view">
            <div className="calendar-heading">
              <button className="button button-light" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()-1, 1))} aria-label="이전 달">‹</button>
              <h3>{calendarMonth.getFullYear()}년 {calendarMonth.getMonth()+1}월</h3>
              <button className="button button-light" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()+1, 1))} aria-label="다음 달">›</button>
              <button className="button button-light" onClick={() => setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>이번 달</button>
            </div>
            <div className="calendar-grid">
              {["일","월","화","수","목","금","토"].map(day => <div className="calendar-weekday" key={day}>{day}</div>)}
              {calendarCells.map(cell => <div key={cell.iso} className={"calendar-day" + (!cell.inMonth ? " outside-month" : "") + (cell.iso === todayISO() ? " today" : "")}>
                <span className="calendar-day-number">{cell.date.getDate()}</span>
                <div className="calendar-day-items">{cell.items.map(item => { const from = item.start_date || item.due_date || ""; const to = item.end_date || item.due_date || from; const continuesBefore = from < cell.iso; const continuesAfter = to > cell.iso; return <button type="button" className={"calendar-event"+(continuesBefore ? " event-continues-before" : "")+(continuesAfter ? " event-continues-after" : "")} key={"assessment-"+item.id} title={item.title + " · " + item.subject_name + " · " + prettyDate(from) + (to !== from ? " ~ " + prettyDate(to) : "")} onClick={() => openAssessment(item)}><b>{item.subject_name}</b><span>{continuesBefore ? "↳ " : ""}{item.title}{continuesAfter ? " →" : ""}</span></button>; })}{visibleAcademicEvents.filter(event => event.date === cell.iso.replace(/-/g, "")).map((event,index) => <div className="calendar-event" key={"academic-"+event.date+"-"+event.name+"-"+index} style={{background:"#e8f7ee",color:"#17663a",cursor:"default"}} title={event.details || event.name}><b>학사일정</b><span>{event.name}</span></div>)}</div>
              </div>)}
            </div>
          </div> : <div className="assessment-list">{(showAcademicCards ? visibleAcademicEvents : []).map((event,index) => <article className="assessment-item academic-card" key={"academic-card-"+event.date+"-"+event.name+"-"+index}><div className="date-tile"><span>{Number(event.date.slice(4,6))}월</span><strong>{Number(event.date.slice(6,8))}</strong><small>학사</small></div><div className="assessment-content"><div className="item-labels"><span className="subject-tag" style={{background:"#e8f7ee",color:"#17663a"}}>학사일정</span></div><h3>{event.name}</h3>{event.details && <p className="item-details">{event.details}</p>}</div></article>)}{filteredAssessments.map(item => {
            const date = dateParts(item.due_date);
            return <article className="assessment-item" key={item.id}>
              <div className="date-tile"><span>{date.month}월</span><strong>{date.day}</strong><small>{date.weekday}</small></div>
              <div className="assessment-content"><div className="item-labels"><span className="subject-tag">{item.subject_name}</span><span className={item.due_date < todayISO() ? "past-tag" : "date-tag"}>{item.due_date < todayISO() ? "지난 일정" : prettyDate(item.due_date)}</span><span className="date-tag">{item.author === "학교 관리자" ? "관리자 등록" : "학생 등록"}</span></div><h3>{item.title}</h3>{item.details && <p className="item-details">{item.details}</p>}<div className="item-meta"><span className={"meta-avatar " + (item.author === "학교 관리자" ? "admin-author" : "student-author")}>{item.author === "학교 관리자" ? "관" : "학"}</span>{item.author === "학교 관리자" ? "학교 관리자 등록" : "학생 등록"}{(item.start_date && item.end_date && item.start_date !== item.end_date) ? <span className="item-time"> · {prettyDate(item.start_date)}{item.start_time ? " " + String(item.start_time).slice(0,5) : ""} 시작 ~ {prettyDate(item.end_date)}{item.end_time ? " " + String(item.end_time).slice(0,5) : ""} 종료</span> : (item.start_time || item.end_time) ? <span className="item-time"> · {item.start_time ? String(item.start_time).slice(0,5) : "시간 미정"}{item.end_time ? " ~ " + String(item.end_time).slice(0,5) : ""}</span> : null}</div></div>
              <div className="item-actions"><button className="icon-button" title={admin ? "일정 수정" : "상세 내역"} onClick={() => openAssessment(item)}>{admin ? <Pencil size={16} /> : <BookOpen size={16} />}</button>{admin && <button className="icon-button delete-action" title="일정 삭제" onClick={() => deleteAssessment(item)}><Trash2 size={16} /></button>}</div>
            </article>;
          })}</div>
        }
      </section>}

      <section className="bottom-tip"><div className="tip-icon"><CircleHelp size={20} /></div><div><strong>일정이 잘못 등록되어 있나요?</strong><p>학생이 신청한 일정은 관리자 승인 후 공개되고, 학교 관리자가 직접 등록한 일정은 즉시 공개돼요.</p></div></section>
      <footer><a className="footer-brand" href="#" onClick={e => e.preventDefault()}>모아<span>.</span></a><span>함께 정리하고, 미리 준비하기.</span><span>학교생활을 조금 더 가볍게 ✳</span></footer>
    </main>

    {notice && <div className={`toast ${notice.type === "error" ? "toast-error" : ""}`} role="status">{notice.type === "error" ? <CircleHelp size={17} /> : <Check size={17} />}{notice.message}<button onClick={() => setNotice(null)} aria-label="알림 닫기"><X size={15} /></button></div>}

    {modal?.type === "adminLogin" && <Modal title="학교 관리자 인증" eyebrow="SCHOOL ADMIN" onClose={() => setModal(null)}>
      <p className="modal-description">나이스에서 학교를 검색해 선택한 뒤 관리자 비밀번호를 입력해 주세요.</p>
      <form className="modal-form" onSubmit={adminLogin}>
        <Field label="학교"><div className="main-school-search"><div className="main-school-search-row"><input value={loginSchoolQuery} onChange={e => { setLoginSchoolQuery(e.target.value); setLoginSchool(null); setLoginSchoolResults([]); setLoginSchoolError(""); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); searchLoginSchools(); } }} placeholder="학교 이름 검색" /><button className="button button-dark" type="button" onClick={searchLoginSchools} disabled={loginSchoolLoading}>{loginSchoolLoading ? "검색 중…" : "검색"}</button></div>{loginSchoolError && <small className="main-school-error">{loginSchoolError}</small>}{loginSchoolResults.length > 0 && <div className="main-school-results">{loginSchoolResults.map((s,i) => <button type="button" key={s.officeCode+"-"+s.schoolCode+"-"+i} onClick={() => chooseLoginSchool(s)} disabled={saving}><strong>{s.name}</strong><small>{s.region}{s.schoolType ? " · "+s.schoolType : ""}</small></button>)}</div>}{loginSchool && <small>선택한 학교: {loginSchool.name} · {loginSchool.region}</small>}</div><input type="hidden" name="schoolId" value={loginSchool?.id || ""} /></Field>
        <Field label="관리자 비밀번호"><input name="password" type="password" required minLength="12" autoComplete="current-password" /></Field>
        <button className="button button-primary full-button" disabled={saving || !loginSchool}>{saving ? "확인 중…" : "관리자 인증"} <ArrowRight size={16} /></button>
      </form>
      <button className="button button-light full-button" type="button" onClick={() => { setRegSchool(null); setRegSchoolQuery(""); setRegSchoolResults([]); setRegSchoolError(""); setModal({ type: "adminRegister" }); }}>등록 코드로 관리자 계정 만들기</button>
      <button className="button button-light full-button" type="button" onClick={() => { setRegSchool(null); setRegSchoolQuery(""); setRegSchoolResults([]); setRegSchoolError(""); setIssuedCode(""); setModal({ type: "bootstrapCode" }); }}>사이트 운영자용 · 최초 일회용 코드 발급</button>
    </Modal>}

    {modal?.type === "adminRegister" && <Modal title="학교 관리자 등록" eyebrow="SCHOOL ADMIN SETUP" onClose={() => setModal(null)}>
      <p className="modal-description">학교 담당자에게 받은 일회용 등록 코드를 입력해 관리자 계정을 만들어요. 코드는 24시간 후 만료되며 한 번만 사용할 수 있어요.</p>
      <form className="modal-form" onSubmit={registerAdmin}>
        <Field label="학교"><div className="main-school-search"><div className="main-school-search-row"><input value={regSchoolQuery} onChange={e => { setRegSchoolQuery(e.target.value); setRegSchool(null); setRegSchoolResults([]); setRegSchoolError(""); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); searchRegistrationSchools(); } }} placeholder="학교 이름 검색" /><button className="button button-dark" type="button" onClick={searchRegistrationSchools} disabled={regSchoolLoading}>{regSchoolLoading ? "검색 중…" : "검색"}</button></div>{regSchoolError && <small className="main-school-error">{regSchoolError}</small>}{regSchoolResults.length > 0 && <div className="main-school-results">{regSchoolResults.map((s,i) => <button type="button" key={s.officeCode+"-"+s.schoolCode+"-"+i} onClick={() => chooseRegistrationSchool(s)} disabled={saving}><strong>{s.name}</strong><small>{s.region}{s.schoolType ? " · "+s.schoolType : ""}</small></button>)}</div>}{regSchool && <small>선택한 학교: {regSchool.name} · {regSchool.region}</small>}</div><input type="hidden" name="schoolId" value={regSchool?.id || ""} /></Field>
        <Field label="일회용 등록 코드"><input name="registrationCode" required autoComplete="one-time-code" minLength="20" maxLength="24" /></Field>
        <Field label="새 관리자 비밀번호"><input name="password" type="password" required minLength="12" maxLength="128" autoComplete="new-password" /><small>12자 이상으로 설정해 주세요.</small></Field>
        <Field label="비밀번호 확인"><input name="confirmPassword" type="password" required minLength="12" maxLength="128" autoComplete="new-password" /></Field>
        <button className="button button-primary full-button" disabled={saving || !regSchool}>{saving ? "등록 중…" : "관리자 등록"} <ArrowRight size={16} /></button>
      </form>
      <button className="button button-light full-button" type="button" onClick={() => { setRegSchool(null); setRegSchoolQuery(""); setRegSchoolResults([]); setRegSchoolError(""); setIssuedCode(""); setModal({ type: "bootstrapCode" }); }}>운영자용 최초 등록 코드 발급</button>
    </Modal>}

    {modal?.type === "bootstrapCode" && <Modal title="최초 등록 코드 발급" eyebrow="OPERATOR ONLY" onClose={() => setModal(null)}>
      <p className="modal-description">학교 담당자 확인 후에만 발급하세요. 운영자 인증 키는 저장하지 않으며, 발급 코드는 24시간 후 만료됩니다.</p>
      <form className="modal-form" onSubmit={bootstrapRegistrationCode}>
        <Field label="운영자 인증 키"><input name="setupKey" type="password" required autoComplete="off" /></Field>
        <Field label="학교"><div className="main-school-search"><div className="main-school-search-row"><input value={regSchoolQuery} onChange={e => { setRegSchoolQuery(e.target.value); setRegSchool(null); setRegSchoolResults([]); setRegSchoolError(""); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); searchRegistrationSchools(); } }} placeholder="학교 이름 검색" /><button className="button button-dark" type="button" onClick={searchRegistrationSchools} disabled={regSchoolLoading}>{regSchoolLoading ? "검색 중…" : "검색"}</button></div>{regSchoolError && <small className="main-school-error">{regSchoolError}</small>}{regSchoolResults.length > 0 && <div className="main-school-results">{regSchoolResults.map((s,i) => <button type="button" key={s.officeCode+"-"+s.schoolCode+"-"+i} onClick={() => chooseRegistrationSchool(s)} disabled={saving}><strong>{s.name}</strong><small>{s.region}{s.schoolType ? " · "+s.schoolType : ""}</small></button>)}</div>}{regSchool && <small>선택한 학교: {regSchool.name} · {regSchool.region}</small>}</div></Field>
        <button className="button button-primary full-button" disabled={saving || !regSchool}>{saving ? "발급 중…" : "최초 등록 코드 발급"} <ArrowRight size={16} /></button>
      </form>
      {issuedCode && <div className="registration-code-display"><strong>최초 등록 코드</strong><code>{issuedCode}</code><button className="button button-light" type="button" onClick={() => { navigator.clipboard?.writeText(issuedCode); notify("코드를 복사했어요."); }}>코드 복사</button></div>}
    </Modal>}

    {modal?.type === "changeAdminPassword" && <Modal title="관리자 비밀번호 변경" eyebrow={admin?.schoolName || "SCHOOL ADMIN"} onClose={() => setModal(null)}>
      <p className="modal-description">현재 비밀번호를 확인한 뒤 새 비밀번호를 설정해 주세요. 비밀번호는 12자 이상이어야 해요.</p>
      <form className="modal-form" onSubmit={changeAdminPassword}>
        <Field label="현재 비밀번호"><input name="currentPassword" type="password" required autoComplete="current-password" /></Field>
        <Field label="새 비밀번호"><input name="newPassword" type="password" required minLength="12" maxLength="128" autoComplete="new-password" /></Field>
        <Field label="새 비밀번호 확인"><input name="confirmPassword" type="password" required minLength="12" maxLength="128" autoComplete="new-password" /></Field>
        <button className="button button-primary full-button" disabled={saving}>{saving ? "변경 중…" : "비밀번호 변경"} <ArrowRight size={16} /></button>
      </form>
    </Modal>}

    {modal?.type === "registrationCodes" && <Modal title="학교 등록 코드 관리" eyebrow={admin?.schoolName || "SCHOOL ADMIN"} onClose={() => setModal(null)}>
      <p className="modal-description">학교 담당자의 권한을 확인한 뒤 코드를 전달해 주세요. 코드는 발급 직후에만 표시되며 24시간 동안 유효해요.</p>
      <button className="button button-primary full-button" onClick={issueRegistrationCode}>새 일회용 코드 발급</button>
      {issuedCode && <div className="registration-code-display"><strong>새 등록 코드</strong><code>{issuedCode}</code><button className="button button-light" type="button" onClick={() => { navigator.clipboard?.writeText(issuedCode); notify("코드를 복사했어요."); }}>코드 복사</button><small>이 화면을 닫기 전에 안전하게 전달해 주세요. 다시 표시할 수 없어요.</small></div>}
      <div className="registration-code-list">{registrationCodes.map(code => <div className="registration-code-row" key={code.id}><div><strong>코드 #{code.id}</strong><small>{code.used_at ? "사용 완료" : code.revoked_at ? "폐기됨" : new Date(code.expires_at).getTime() < Date.now() ? "만료됨" : "사용 가능"} · 만료 {new Date(code.expires_at).toLocaleString("ko-KR")}</small></div>{!code.used_at && !code.revoked_at && new Date(code.expires_at).getTime() > Date.now() && <button className="button button-light" onClick={() => revokeRegistrationCode(code.id)}>폐기</button>}</div>)}</div>
    </Modal>}

    {modal?.type === "adminQueue" && <Modal title="일정 승인함" eyebrow={admin?.schoolName || "SCHOOL ADMIN"} onClose={() => setModal(null)} wide>
      <p className="modal-description">새 일정과 수정 신청을 확인한 뒤 승인하거나 반려해 주세요.</p>
      {!requests.length ? <EmptyState title="대기 중인 신청이 없어요" description="새 신청이 들어오면 여기에 표시돼요." /> : <div className="approval-grid">{requests.map(r => <article className="approval-card" key={r.id}>
        <div className="approval-card-head"><div className="item-labels"><span className="subject-tag">{r.action === "create" ? "학생 일정 등록" : "학생 수정 신청"}</span><span className="date-tag">신청 {new Date(r.created_at).toLocaleString("ko-KR")}</span></div><h3>{r.payload.title}</h3></div>
        <div className="approval-card-info"><p><b>과목</b><span>{r.subject_name || "과목 정보 없음"}</span></p><p><b>학급</b><span>{r.grade ? `${r.grade}학년 ${r.class_number}반` : "학급 정보 없음"}</span></p><p><b>평가 일정</b><span>{r.payload.startDate || r.payload.dueDate || "날짜 없음"}{r.payload.startTime ? " " + r.payload.startTime : ""} ~ {r.payload.endDate || r.payload.dueDate || "날짜 없음"}{r.payload.endTime || r.payload.dueTime ? " " + (r.payload.endTime || r.payload.dueTime) : ""}</span></p></div>
        <p className="approval-details"><b>세부 내용</b>　{r.payload.details || "세부 내용이 입력되지 않았어요."}</p><div className="item-actions"><button className="button button-primary" onClick={() => decideRequest(r.id,"approve")}>승인</button><button className="button button-light" onClick={() => decideRequest(r.id,"reject")}>반려</button></div>
      </article>)}</div>}
    </Modal>}

    {modal?.type === "assessmentDetail" && <Modal title="수행평가 상세 내역" eyebrow={modal.item.subject_name || "수행평가"} onClose={() => setModal(null)}>
      <div className="assessment-detail-view">
        <h2>{modal.item.title}</h2>
        <p><strong>과목</strong>　{modal.item.subject_name || "과목 정보 없음"}</p>
        <p><strong>평가 날짜</strong>　{prettyDate(modal.item.start_date || modal.item.due_date)}{modal.item.start_date && modal.item.end_date && modal.item.start_date !== modal.item.end_date ? " " + (modal.item.start_time ? String(modal.item.start_time).slice(0,5) + " 시작" : "시작") + " ~ " + prettyDate(modal.item.end_date) + " " + (modal.item.end_time ? String(modal.item.end_time).slice(0,5) + " 종료" : "종료") : modal.item.start_time ? " " + String(modal.item.start_time).slice(0,5) + (modal.item.end_time ? " ~ " + String(modal.item.end_time).slice(0,5) : "") : modal.item.end_time ? " ~ " + String(modal.item.end_time).slice(0,5) : ""}</p>
        <p><strong>등록자</strong>　{modal.item.author || "정보 없음"}</p>
        <div className="approval-details">{modal.item.details || "추가 상세 내용이 등록되지 않았어요."}</div>
        <button className="button button-light full-button" type="button" onClick={() => setModal(null)}>닫기</button>
      </div>
    </Modal>}
    {modal?.type === "assessment" && <AssessmentModal
      item={modal.item}
      schools={schools}
      classes={classes}
      subjects={subjects}
      defaultSchoolId={modal.isNew ? "" : schoolId}
      defaultClassId={modal.isNew ? "" : classId}
      defaultGrade={modal.isNew ? "" : grade}
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
