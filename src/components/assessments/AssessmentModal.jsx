import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Modal from "../common/Modal.jsx";
import Field from "../common/Field.jsx";
import { api } from "../../lib/api.js";

export default function AssessmentModal({ item, schools, classes, subjects, defaultSchoolId, defaultClassId, defaultGrade, saving, onClose, onSubmit, onDelete, loadClasses, loadSubjects }) {
  const [chosenSchool, setChosenSchool] = useState(String(item?.school_id || defaultSchoolId || ""));
  const [availableClasses, setAvailableClasses] = useState(classes);
  const [availableSubjects, setAvailableSubjects] = useState(subjects);
  const [chosenGrade, setChosenGrade] = useState(String(item?.grade || defaultGrade || ""));
  const [chosenClass, setChosenClass] = useState(String(item?.class_id || defaultClassId || ""));
  const [chosenSubject, setChosenSubject] = useState(String(item?.subject_id || ""));
  const [subjectName, setSubjectName] = useState("");
  const [error, setError] = useState("");
  const [neisGrades, setNeisGrades] = useState([]);
  const [neisClasses, setNeisClasses] = useState([]);
  const [neisLoading, setNeisLoading] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolResults, setSchoolResults] = useState([]);
  const [schoolSearching, setSchoolSearching] = useState(false);
  const [schoolLabel, setSchoolLabel] = useState(schools.find(s => String(s.id) === String(item?.school_id || defaultSchoolId || ""))?.name || "");
  const grades = neisGrades;

  async function searchNeisSchools() {
    const q = schoolQuery.trim();
    if (q.length < 2) { setError("학교 이름을 두 글자 이상 입력해 주세요."); return; }
    setSchoolSearching(true); setError("");
    try {
      const data = await api("/api/neis/schools?q=" + encodeURIComponent(q));
      setSchoolResults(data.schools || []);
      if (!data.schools?.length) setError("검색 결과가 없어요. 학교 이름을 확인해 주세요.");
    } catch (e) { setError(e.message); setSchoolResults([]); }
    finally { setSchoolSearching(false); }
  }

  async function selectNeisSchool(school) {
    setNeisLoading(true); setError("");
    try {
      const data = await api("/api/schools", { method: "POST", body: JSON.stringify({
        name: school.name,
        region: [school.region, school.address].filter(Boolean).join(" · ").slice(0, 120),
        officeCode: school.officeCode,
        schoolCode: school.schoolCode
      }) });
      const id = String(data.school.id);
      setChosenSchool(id);
      setSchoolLabel(school.name);
      setSchoolQuery("");
      setSchoolResults([]);
      setChosenGrade("");
      setChosenClass("");
      setSubjectName("");
    } catch (e) { setError(e.message); }
    finally { setNeisLoading(false); }
  }

  useEffect(() => {
    let active = true;
    setNeisGrades([]);
    setNeisClasses([]);
    if (!chosenSchool) {
      setAvailableClasses([]);
      setAvailableSubjects([]);
      setChosenGrade("");
      setChosenClass("");
      return () => { active = false; };
    }
    setNeisLoading(true);
    Promise.all([
      loadClasses(chosenSchool),
      loadSubjects(chosenSchool),
      api("/api/neis/classes?schoolId=" + encodeURIComponent(chosenSchool))
    ]).then(([cs, ss, data]) => {
      if (!active) return;
      setAvailableClasses(cs);
      setAvailableSubjects(ss);
      const foundGrades = (data.grades || []).map(String);
      setNeisGrades(foundGrades);
      const nextGrade = String(item?.grade || chosenGrade || "");
      setChosenGrade(foundGrades.includes(nextGrade) ? nextGrade : "");
      setChosenSubject(String(item?.subject_id || ""));
      setSubjectName(item?.subject_name || "");
    }).catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setNeisLoading(false); });
    return () => { active = false; };
  }, [chosenSchool]);

  useEffect(() => {
    let active = true;
    setNeisClasses([]);
    if (!chosenSchool || !chosenGrade) return () => { active = false; };
    setNeisLoading(true);
    api("/api/neis/classes?schoolId=" + encodeURIComponent(chosenSchool) + "&grade=" + encodeURIComponent(chosenGrade))
      .then(data => { if (active) setNeisClasses(data.classes || []); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setNeisLoading(false); });
    return () => { active = false; };
  }, [chosenSchool, chosenGrade]);

  async function chooseClass(label) {
    const number = String(label).match(/\d+/)?.[0] || "";
    if (!number) return;
    try {
      setError("");
      let cls = availableClasses.find(c => String(c.grade) === chosenGrade && String(c.class_number) === number);
      if (!cls) {
        const created = await api("/api/classes", { method: "POST", body: JSON.stringify({ schoolId: chosenSchool, grade: chosenGrade, classNumber: number }) });
        cls = created.class;
        setAvailableClasses(previous => [...previous, cls]);
      }
      setChosenClass(String(cls.id));
    } catch (e) { setError(e.message); }
  }

  return <Modal title={item ? "수행평가 수정하기" : "새 일정 등록하기"} eyebrow="ASSESSMENT DETAILS" onClose={onClose}>
    <p className="modal-description">학급 친구들이 확인할 수 있도록 내용을 정확히 입력해 주세요.</p>
    <form className="modal-form" onSubmit={event => {
      setError("");
      const form = event.currentTarget;
      const startDate = form.elements.startDate.value;
      const endDate = form.elements.endDate.value;
      const startTime = form.elements.startTime.value;
      const endTime = form.elements.endTime.value;
      if (endDate < startDate) {
        event.preventDefault();
        setError("종료 날짜는 시작 날짜보다 빠를 수 없어요.");
        return;
      }
      if (startDate === endDate && startTime && endTime && endTime < startTime) {
        event.preventDefault();
        setError("종료 시간은 시작 시간보다 빠를 수 없어요.");
        return;
      }
      onSubmit(event);
    }}>
      <input type="hidden" name="id" value={item?.id || ""} />
      <Field label="학교">
        <div className="school-search-row">
          <input aria-label="학교 이름 검색" value={schoolQuery} onChange={e => setSchoolQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); searchNeisSchools(); } }} placeholder={schoolLabel || "학교 이름 검색"} />
          <button type="button" className="button button-secondary" onClick={searchNeisSchools} disabled={schoolSearching || schoolQuery.trim().length < 2}>{schoolSearching ? "검색 중…" : "검색"}</button>
        </div>
        {schoolResults.length > 0 && <div className="main-school-results" role="listbox" aria-label="학교 검색 결과">
          {schoolResults.map((school, index) => <button type="button" key={school.schoolCode || school.name + index} onClick={() => selectNeisSchool(school)}>
            <strong>{school.name}</strong><small>{[school.region, school.schoolType].filter(Boolean).join(" · ")}</small>
          </button>)}
        </div>}
        <input type="hidden" name="schoolId" value={chosenSchool} />
        {schoolLabel && <p className="field-hint">선택된 학교: {schoolLabel}</p>}
      </Field>
      <div className="form-row">
        <Field label="학년"><select value={chosenGrade} onChange={e => { setChosenGrade(e.target.value); setChosenClass(""); }} disabled={!chosenSchool || neisLoading || !grades.length} required><option value="">{!chosenSchool ? "학교 먼저 선택" : neisLoading ? "불러오는 중…" : "학년 선택"}</option>{grades.map(g => <option key={g} value={g}>{g}학년</option>)}</select></Field>
        <Field label="반"><select value={availableClasses.find(c => String(c.id) === String(chosenClass))?.class_number || ""} onChange={e => chooseClass(e.target.value)} disabled={!chosenSchool || !chosenGrade || neisLoading || !neisClasses.length} required><option value="">{!chosenGrade ? "학년 먼저 선택" : neisLoading ? "불러오는 중…" : "반 선택"}</option>{neisClasses.map(label => <option key={label} value={label}>{/^\d+$/.test(String(label)) ? label + "반" : label}</option>)}</select><input type="hidden" name="classId" value={chosenClass} /></Field>
      </div>
      <Field label="과목"><input name="subjectName" value={subjectName || (availableSubjects.find(s => String(s.id) === chosenSubject)?.name || "")} onChange={e => { setSubjectName(e.target.value); setChosenSubject(""); }} required maxLength="100" placeholder="예: 국어, 수학, 영어" /></Field>
      <Field label="수행평가 제목"><input name="title" defaultValue={item?.title || ""} maxLength="180" required placeholder="예: 수학 탐구 보고서" /></Field>
      <div className="form-row"><Field label="시작 날짜"><input name="startDate" type="date" defaultValue={item?.start_date || item?.due_date || ""} required /></Field><Field label="시작 시간"><input name="startTime" type="time" defaultValue={item?.start_time ? String(item.start_time).slice(0,5) : ""} /></Field></div><div className="form-row"><Field label="종료 날짜"><input name="endDate" type="date" defaultValue={item?.end_date || item?.due_date || ""} required /></Field><Field label="종료 시간"><input name="endTime" type="time" defaultValue={item?.end_time ? String(item.end_time).slice(0,5) : (item?.due_time ? String(item.due_time).slice(0,5) : "")} /></Field></div>
      <Field label="세부 내용 (선택)"><textarea name="details" defaultValue={item?.details || ""} maxLength="3000" rows="3" placeholder="준비물, 범위, 제출 방법 등을 적어 주세요." /></Field>
      {error && <p className="inline-error">{error}</p>}
      <button className="button button-primary full-button" disabled={saving}>{saving ? "저장 중…" : "일정 저장하기"} <ArrowRight size={16} /></button>
      {item && <button className="button button-light full-button" type="button" disabled={saving} onClick={() => onDelete(item)}>일정 삭제하기</button>}
    </form>
  </Modal>;
}
