'use client';
import type {StudentUser} from '../lib/student-identity';
import {STATIC_PAGES} from '../lib/app-mode';
import {exitLocalStudent} from '../lib/pages-session';

export default function StudentAccount({student}:{student:StudentUser}){
  if(STATIC_PAGES)return <div className="actions"><small>{student.studentNumber} {student.name}</small><button className="btn secondary small" onClick={()=>{exitLocalStudent(sessionStorage);window.location.reload();}}>나가기 / 학생 변경</button></div>;
  return <div className="actions"><small>{student.studentNumber} {student.name}</small><form action="/api/auth/logout" method="post"><button className="btn secondary small" type="submit">나가기 / 학생 변경</button></form></div>;
}
