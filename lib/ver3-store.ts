import type {TeacherRecord} from './ver3-submission.ts';

const DB_NAME='inquiry-ver3-teacher';
function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore('records',{keyPath:'submission.student.id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('채점 저장소를 열지 못했습니다. 브라우저의 사이트 저장소를 허용하세요.'));request.onblocked=()=>reject(Error('다른 교사 채점 탭을 닫고 다시 시도하세요.'));});}
async function operation<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
  const db=await open();return new Promise<T>((resolve,reject)=>{const tx=db.transaction('records',mode);const request=run(tx.objectStore('records'));let value:T;request.onsuccess=()=>{value=request.result};tx.oncomplete=()=>{db.close();resolve(value)};tx.onabort=()=>{db.close();reject(Error('저장하지 못했습니다. 남은 기기 용량과 브라우저 설정을 확인하세요.'))};tx.onerror=()=>{db.close();reject(Error('채점 저장소 작업에 실패했습니다.'))};});
}
export async function listRecords():Promise<TeacherRecord[]>{const rows=await operation('readonly',store=>store.getAll());return (rows as TeacherRecord[]).sort((a,b)=>a.submission.student.studentNumber.localeCompare(b.submission.student.studentNumber,undefined,{numeric:true}));}
export async function saveRecord(record:TeacherRecord,expected?:TeacherRecord):Promise<void>{
  if(!expected){await operation('readwrite',store=>store.put(record));return;}
  const db=await open();return new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('records','readwrite'),store=tx.objectStore('records');let conflict=false;
    const request=store.get(record.submission.student.id);
    request.onsuccess=()=>{const current=request.result as TeacherRecord|undefined;
      if(!current||current.submission.id!==expected.submission.id||current.updatedAt!==expected.updatedAt){conflict=true;tx.abort();return;}
      store.put(record);
    };
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onabort=()=>{db.close();reject(Error(conflict?'다른 탭에서 제출 또는 채점이 변경되었습니다. 새로고침 후 해당 학생을 다시 열어 확인하세요.':'저장하지 못했습니다. 기기 용량과 브라우저 설정을 확인하세요.'));};
    tx.onerror=()=>{db.close();reject(Error('채점 저장소 작업에 실패했습니다.'));};
  });
}
