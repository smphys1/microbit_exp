'use client';
import {useEffect,useState} from 'react';
import type {FormEvent,ReactNode} from 'react';
import type {StudentUser} from '../lib/student-identity';
import Teacher from './teacher';
import {STATIC_PAGES} from '../lib/app-mode';
import {enterLocalStudent,readLocalStudent} from '../lib/pages-session';

export default function StudentAccess({children}:{children:(student:StudentUser)=>ReactNode}){
  const [user,setUser]=useState<StudentUser|null>(null),[checking,setChecking]=useState(true);
  const [studentNumber,setStudentNumber]=useState(''),[name,setName]=useState(''),[error,setError]=useState('');
  const [busy,setBusy]=useState(false),[teacher,setTeacher]=useState(false),[notice,setNotice]=useState('');
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        if(STATIC_PAGES){const student=await readLocalStudent(sessionStorage);if(active)setUser(student);}
        else{const response=await fetch('/api/auth/session',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json() as {user:StudentUser|null};if(active)setUser(data.user);}
      }catch{if(active)setError('접속 상태를 확인하지 못했습니다. 학번과 이름을 입력해 다시 접속하세요.');}
      finally{if(active)setChecking(false);}
    })();
    return()=>{active=false};
  },[]);
  async function enter(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError('');
    try{
      if(STATIC_PAGES){setUser(await enterLocalStudent(sessionStorage,studentNumber,name));return;}
      const response=await fetch('/api/auth/enter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentNumber,name})});
      const data=await response.json() as {user?:StudentUser,error?:string};
      if(!response.ok||!data.user)throw Error(data.error||'접속하지 못했습니다.');
      setUser(data.user);
    }catch(e){setError(STATIC_PAGES?'학번·이름을 확인하고 브라우저의 사이트 저장소를 허용해 주세요.':e instanceof Error?e.message:'접속하지 못했습니다. 잠시 후 다시 시도하세요.');}
    finally{setBusy(false);}
  }
  if(user)return children(user);
  if(!STATIC_PAGES&&teacher)return <><header><b className="brand">탐구노트 ver2</b><button className="btn secondary small" onClick={()=>{setTeacher(false);setNotice('')}}>학생 접속 화면</button></header><Teacher notify={setNotice}/>{notice&&<p className="notice" role="status">{notice}</p>}</>;
  return <><header><b className="brand">탐구노트 <span className="badge">VER 2</span></b>{!STATIC_PAGES&&<button className="btn secondary small" onClick={()=>setTeacher(true)}>교사 채점</button>}</header><main style={{maxWidth:600,margin:'32px auto'}}><div className="card"><div className="eyebrow">MY INQUIRY</div><h1>학번과 이름으로 시작하기</h1><p>계정이나 비밀번호 없이 탐구노트를 이용할 수 있습니다.</p><form onSubmit={enter}><label htmlFor="entry-number">학번</label><input id="entry-number" inputMode="numeric" autoComplete="off" required pattern="[0-9]{1,20}" maxLength={20} placeholder="예: 10101" value={studentNumber} onChange={e=>setStudentNumber(e.target.value)}/><label htmlFor="entry-name">이름</label><input id="entry-name" autoComplete="name" required maxLength={50} placeholder="예: 홍길동" value={name} onChange={e=>setName(e.target.value)}/>{error&&<p role="alert" className="callout warn">{error}</p>}<button className="btn" style={{marginTop:22}} disabled={checking||busy} type="submit">{checking?'접속 확인 중…':busy?'접속 중…':'탐구노트 시작하기'}</button></form><p className="hint" style={{marginTop:18}}>{STATIC_PAGES?'이 기기의 같은 브라우저에서 같은 학번과 이름을 입력하면 작성 중인 초안을 이어갈 수 있습니다.':'다음에도 같은 학번과 이름을 입력하면 이전 제출을 불러올 수 있습니다.'}</p><p className="callout warn">{STATIC_PAGES?'작성 내용은 이 브라우저에 저장됩니다. 공용 기기에서는 사용 후 나가기를 누르고, 기기를 바꾸기 전 작성 백업을 저장하세요.':'학번과 이름은 본인 확인 수단이 아닙니다. 같은 정보를 입력한 사람은 제출물과 공개된 평가를 볼 수 있으므로 반드시 본인 정보만 입력하세요.'}</p></div></main></>;
}
