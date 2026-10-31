import {studentFromDetails} from './student-identity.ts';
import type {StudentUser} from './student-identity.ts';

type SessionStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const KEY='inquiry-v2-pages-student';

export async function readLocalStudent(storage:SessionStorage):Promise<StudentUser|null>{
  try{
    const value=storage.getItem(KEY);
    if(!value)return null;
    const data=JSON.parse(value);
    return await studentFromDetails(data.studentNumber,data.name);
  }catch{return null;}
}
export async function enterLocalStudent(storage:SessionStorage,number:unknown,name:unknown):Promise<StudentUser>{
  const user=await studentFromDetails(number,name);
  storage.setItem(KEY,JSON.stringify({studentNumber:user.studentNumber,name:user.name}));
  return user;
}
export function exitLocalStudent(storage:SessionStorage):void{storage.removeItem(KEY);}
