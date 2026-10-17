import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Modal from "../common/Modal.jsx";
import Field from "../common/Field.jsx";

export default function AssessmentModal({ item, schools, classes, subjects, defaultSchoolId, defaultClassId, defaultGrade, saving, onClose, onSubmit, loadClasses, loadSubjects }) {
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
