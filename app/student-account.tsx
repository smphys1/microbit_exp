'use client';
import type {StudentUser} from '../lib/student-auth';

export default function StudentAccount({student}:{student:StudentUser}){
  return <div className="actions"><small>{student.studentNumber} {student.name}</small><form action="/api/auth/logout" method="post"><button className="btn secondary small" type="submit">나가기 / 학생 변경</button></form></div>;
}
