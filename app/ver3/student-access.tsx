'use client';
import {useEffect,useState} from 'react';
import type {FormEvent,ReactNode} from 'react';
import {studentFromDetails} from '../../lib/student-identity';
import type {StudentUser} from '../../lib/student-identity';

export const SESSION_KEY='inquiry-v3-student';
export default function StudentAccess({children}:{children:(student:StudentUser)=>ReactNode}){
  const [student,setStudent]=useState<StudentUser|null>(null),[number,setNumber]=useState(''),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;(async()=>{try{const data=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');if(data){const user=await studentFromDetails(data.studentNumber,data.name);if(active)setStudent(user);}}catch{}})();return()=>{active=false}},[]);
  async function enter(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{const user=await studentFromDetails(number,name);sessionStorage.setItem(SESSION_KEY,JSON.stringify(user));setStudent(user);}catch{setError('학번·이름을 확인하고 브라우저의 사이트 저장소를 허용해 주세요.');}finally{setBusy(false)}}
  if(student)return children(student);
  return <><header><b className="brand">탐구노트 <span className="badge">VER 3</span></b><div className="actions"><a className="btn secondary small" href="./teacher/">교사 채점</a><a className="btn secondary small" href="../">ver2 열기</a></div></header><main style={{maxWidth:620,margin:'32px auto'}}><div className="card"><h1>학번과 이름으로 시작하기</h1><p>탐구를 작성하고, 첨부 파일까지 묶어 선생님께 전달하세요. 계정과 비밀번호는 필요하지 않습니다.</p><form onSubmit={enter}><label htmlFor="entry-number">학번</label><input id="entry-number" inputMode="numeric" pattern="[0-9]{1,20}" required maxLength={20} value={number} onChange={e=>setNumber(e.target.value)} placeholder="예: 10101"/><label htmlFor="entry-name">이름</label><input id="entry-name" required maxLength={50} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 홍길동"/>{error&&<p role="alert" className="callout warn">{error}</p>}<button type="submit" className="btn" style={{marginTop:20}} disabled={busy}>{busy?'접속 중…':'탐구노트 시작하기'}</button></form><p className="hint">ver3 초안은 ver2와 별도로 이 브라우저에 저장됩니다. 파일을 저장한 뒤 선생님이 안내한 제출 경로로 전달해야 합니다.</p></div></main></>;
}
