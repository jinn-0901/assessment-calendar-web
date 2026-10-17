import { useEffect, useState } from "react";
import { ArrowRight, Search, Check, MapPin } from "lucide-react";
import Field from "../common/Field.jsx";
import { api } from "../../lib/api.js";

export default function SetupModal({ schools, saving, onSubmit, initialTab }) {
  const [tab, setTab] = useState(initialTab || "school");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [classSchoolId, setClassSchoolId] = useState(String(schools[0]?.id || ""));
  const [classGrade, setClassGrade] = useState("");
  const [classNumber, setClassNumber] = useState("");

  useEffect(() => {
    if (!classSchoolId && schools.length) setClassSchoolId(String(schools[0].id));
  }, [schools, classSchoolId]);

  async function searchSchools() {
    const query = schoolQuery.trim();
    if (query.length < 2) {
      setSearchError("학교 이름을 두 글자 이상 입력해 주세요.");
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchError("");
    setSelectedSchool(null);
    try {
      const data = await api("/api/neis/schools?q=" + encodeURIComponent(query));
      setResults(data.schools || []);
      if (!data.schools?.length) setSearchError("검색 결과가 없어요. 학교 이름을 확인해 주세요.");
    } catch (error) {
      setSearchError(error.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return <div className="setup-modal">
    <div className="tab-row">
      {[["school","학교"],["class","학급"],["subject","과목"]].map(([key,label]) => <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label} 추가</button>)}
    </div>
    {tab === "school" && <form className="modal-form" onSubmit={e => {
      if (!selectedSchool) {
        e.preventDefault();
        setSearchError("나이스 검색 결과에서 학교를 먼저 선택해 주세요.");
        return;
      }
      onSubmit(e, "school");
    }}>
      <p className="school-search-hint">나이스 교육정보에서 학교를 검색해 선택해 주세요.</p>
      <Field label="학교 이름 검색">
        <div className="school-search-row">
          <input value={schoolQuery} onChange={e => { setSchoolQuery(e.target.value); setSelectedSchool(null); }} maxLength="80" placeholder="예: 서울고등학교" />
          <button className="button button-dark school-search-button" type="button" onClick={searchSchools} disabled={searching}><Search size={15} />{searching ? "검색 중…" : "검색"}</button>
        </div>
      </Field>
      {searchError && <p className="inline-error" role="status">{searchError}</p>}
      {!!results.length && <div className="school-results" aria-label="학교 검색 결과">
        {results.map((school, index) => <button type="button" key={school.officeCode + "-" + school.schoolCode} className={"school-result" + (selectedSchool?.schoolCode === school.schoolCode && selectedSchool?.officeCode === school.officeCode ? " selected" : "")} onClick={() => { setSelectedSchool(school); setSearchError(""); }}>
          <span className="school-result-icon"><MapPin size={16} /></span>
          <span className="school-result-copy"><strong>{school.name}</strong><small>{[school.region, school.schoolType, school.address].filter(Boolean).join(" · ")}</small></span>
          {selectedSchool?.schoolCode === school.schoolCode && selectedSchool?.officeCode === school.officeCode && <Check size={17} />}
        </button>)}
      </div>}
      {selectedSchool && <div className="selected-school-note"><Check size={15} /> 선택됨: <strong>{selectedSchool.name}</strong></div>}
      <input type="hidden" name="name" value={selectedSchool?.name || ""} />
      <input type="hidden" name="region" value={selectedSchool ? [selectedSchool.region, selectedSchool.address].filter(Boolean).join(" · ").slice(0, 120) : ""} />
      <input type="hidden" name="officeCode" value={selectedSchool?.officeCode || ""} />
      <input type="hidden" name="schoolCode" value={selectedSchool?.schoolCode || ""} />
      <button className="button button-primary full-button" disabled={saving || !selectedSchool}>{saving ? "등록 중…" : "선택한 학교 등록하기"} <ArrowRight size={16} /></button>
    </form>}
    {tab === "class" && <form className="modal-form" onSubmit={e => { if (!classSchoolId || !classGrade || !classNumber) { e.preventDefault(); setSearchError("학교, 학년, 반을 모두 선택해 주세요."); return; } onSubmit(e, "class"); }}><Field label="학교"><select required value={classSchoolId} onChange={e => { setClassSchoolId(e.target.value); setClassGrade(""); setClassNumber(""); setSearchError(""); }}><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}{s.region ? " · " + s.region : ""}</option>)}</select></Field><Field label="학년"><div className="choice-card-grid grade-card-grid">{[1, 2, 3].map(g => <button type="button" key={g} className={"choice-card" + (classGrade === String(g) ? " selected" : "")} disabled={!classSchoolId} onClick={() => { setClassGrade(String(g)); setClassNumber(""); setSearchError(""); }}><span className="choice-card-number">{g}</span><strong>{g}학년</strong></button>)}</div></Field><Field label="반"><div className="choice-card-grid class-card-grid">{Array.from({ length: 20 }, (_, i) => i + 1).map(n => <button type="button" key={n} className={"choice-card" + (classNumber === String(n) ? " selected" : "")} disabled={!classSchoolId || !classGrade} onClick={() => { setClassNumber(String(n)); setSearchError(""); }}><strong>{n}반</strong></button>)}</div></Field><input type="hidden" name="schoolId" value={classSchoolId} /><input type="hidden" name="grade" value={classGrade} /><input type="hidden" name="classNumber" value={classNumber} />{searchError && <p className="inline-error" role="status">{searchError}</p>}<button className="button button-primary full-button" disabled={saving || !classSchoolId || !classGrade || !classNumber}>{saving ? "등록 중…" : "선택한 학급 등록하기"} <ArrowRight size={16} /></button></form>}
    {tab === "subject" && <form className="modal-form" onSubmit={e => onSubmit(e, "subject")}><Field label="학교"><select name="schoolId" required defaultValue={schools[0]?.id || ""}><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="과목명"><input name="name" maxLength="100" required placeholder="예: 통합과학" /></Field><button className="button button-primary full-button" disabled={saving}>과목 등록하기 <ArrowRight size={16} /></button></form>}
  </div>;
}
