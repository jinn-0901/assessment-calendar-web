import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Modal from "../common/Modal.jsx";
import Field from "../common/Field.jsx";
import { api } from "../../lib/api.js";

export default function AssessmentModal({ item, schools, classes, subjects, defaultSchoolId, defaultClassId, defaultGrade, saving, onClose, onSubmit, loadClasses, loadSubjects }) {
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
  const grades = neisGrades;

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
      setChosenClass("");
      setChosenSubject(String(item?.subject_id || ""));
      setSubjectName(item?.subject_name || "");
    }).catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setNeisLoading(false); });
    return () => { active = false; };
  }, [chosenSchool]);

  useEffect(() => {
    let active = true;
    setNeisClasses([]);
    setChosenClass("");
    if (!chosenSchool || !chosenGrade) return () => { active = false; };
    setNeisLoading(true);
    api("/api/neis/classes?schoolId=" + encodeURIComponent(chosenSchool) + "&grade=" + encodeURIComponent(chosenGrade))
      .then(data => { if (active) setNeisClasses(data.classes || []); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setNeisLoading(false); });
    return () => { active = false; };
  }, [chosenSchool, chosenGrade]);

  async function chooseClass(label) {
    const number = String(label).match(/\\d+/)?.[0] || "";
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
    <form className="modal-form" onSubmit={event => { setError(""); onSubmit(event); }}>
      <input type="hidden" name="id" value={item?.id || ""} />
      <Field label="학교"><select name="schoolId" value={chosenSchool} onChange={e => { setChosenSchool(e.target.value); setChosenGrade(""); setChosenClass(""); setError(""); }} required><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <div className="form-row">
        <Field label="학년"><select value={chosenGrade} onChange={e => { setChosenGrade(e.target.value); setChosenClass(""); }} disabled={!chosenSchool || neisLoading || !grades.length} required><option value="">{!chosenSchool ? "학교 먼저 선택" : neisLoading ? "불러오는 중…" : "학년 선택"}</option>{grades.map(g => <option key={g} value={g}>{g}학년</option>)}</select></Field>
        <Field label="반"><select value={availableClasses.find(c => String(c.id) === String(chosenClass))?.class_number || ""} onChange={e => chooseClass(e.target.value)} disabled={!chosenSchool || !chosenGrade || neisLoading || !neisClasses.length} required><option value="">{!chosenGrade ? "학년 먼저 선택" : neisLoading ? "불러오는 중…" : "반 선택"}</option>{neisClasses.map(label => <option key={label} value={label}>{/^\\d+$/.test(String(label)) ? label + "반" : label}</option>)}</select><input type="hidden" name="classId" value={chosenClass} /></Field>
      </div>
      <Field label="과목"><input name="subjectName" value={subjectName || (availableSubjects.find(s => String(s.id) === chosenSubject)?.name || "")} onChange={e => { setSubjectName(e.target.value); setChosenSubject(""); }} required maxLength="100" placeholder="예: 국어, 수학, 영어" /></Field>
      <Field label="수행평가 제목"><input name="title" defaultValue={item?.title || ""} maxLength="180" required placeholder="예: 수학 탐구 보고서" /></Field>
      <Field label="제출 또는 평가 날짜"><input name="dueDate" type="date" defaultValue={item?.due_date || ""} required /></Field>
      <Field label="세부 내용 (선택)"><textarea name="details" defaultValue={item?.details || ""} maxLength="3000" rows="3" placeholder="준비물, 범위, 제출 방법 등을 적어 주세요." /></Field>
      {error && <p className="inline-error">{error}</p>}
      <button className="button button-primary full-button" disabled={saving}>{saving ? "저장 중…" : "일정 저장하기"} <ArrowRight size={16} /></button>
    </form>
  </Modal>;
}
