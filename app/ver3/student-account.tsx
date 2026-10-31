'use client';
import type {StudentUser} from '../../lib/student-identity';
import {SESSION_KEY} from './student-access';
export default function StudentAccount({student}:{student:StudentUser}){return <div className="actions"><small>{student.studentNumber} {student.name}</small><button className="btn secondary small" onClick={()=>{sessionStorage.removeItem(SESSION_KEY);window.location.reload()}}>나가기 / 학생 변경</button></div>}
