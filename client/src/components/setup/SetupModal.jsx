import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Field from "../common/Field.jsx";

export default function SetupModal({ schools, saving, onSubmit, initialTab }) {
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
