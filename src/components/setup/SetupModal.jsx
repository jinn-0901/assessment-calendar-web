import { useState } from "react";
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
    {tab === "class" && <form className="modal-form" onSubmit={e => onSubmit(e, "class")}><Field label="학교"><select name="schoolId" required defaultValue={schools[0]?.id || ""}><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><div className="form-row"><Field label="학년"><input name="grade" type="number" min="1" max="12" required placeholder="1" /></Field><Field label="반"><input name="classNumber" type="number" min="1" max="99" required placeholder="6" /></Field></div><button className="button button-primary full-button" disabled={saving}>학급 등록하기 <ArrowRight size={16} /></button></form>}
    {tab === "subject" && <form className="modal-form" onSubmit={e => onSubmit(e, "subject")}><Field label="학교"><select name="schoolId" required defaultValue={schools[0]?.id || ""}><option value="">학교 선택</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="과목명"><input name="name" maxLength="100" required placeholder="예: 통합과학" /></Field><button className="button button-primary full-button" disabled={saving}>과목 등록하기 <ArrowRight size={16} /></button></form>}
  </div>;
}
