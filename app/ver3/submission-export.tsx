'use client';
import {useEffect,useState} from 'react';
import type {Fields} from '../../lib/rubric';
import {totals} from '../../lib/rubric';
import type {StudentUser} from '../../lib/student-identity';
import {createSubmission,parseFeedback} from '../../lib/ver3-submission';
import type {Feedback} from '../../lib/ver3-submission';

export function download(name:string,blob:Blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
export default function SubmissionExport({student,fields,checks,files}:{student:StudentUser;fields:Fields;checks:Record<string,boolean>;files:File[]}){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[feedback,setFeedback]=useState<Feedback|null>(null);
  useEffect(()=>{try{const raw=localStorage.getItem('inquiry-v3-feedback:'+student.id);if(raw)setFeedback(parseFeedback(JSON.parse(raw),student));}catch{}},[student.id]);
  async function exportSubmission(){setBusy(true);setMessage('');try{const bundle=await createSubmission(student,fields,checks,files);download(`${student.studentNumber}_${student.name}_탐구노트_ver3_제출.json`,new Blob([JSON.stringify(bundle)],{type:'application/json'}));setMessage('제출 파일을 저장했습니다. 이 파일을 선생님이 안내한 경로로 전달해야 접수됩니다.');}catch(e){setMessage(e instanceof Error?e.message:'제출 파일을 저장하지 못했습니다.');}finally{setBusy(false)}}
  return <section className="card noprint" style={{marginTop:20}}><h2>교사 채점용 제출 파일</h2><p>작성 내용·원본 CSV·구글시트 XLSX·선택한 그래프 이미지를 하나의 JSON 파일로 저장합니다. 주제·설계·보고서 입력, 변인 점검 3개와 필수 파일을 모두 준비하세요.</p><button className="btn" disabled={busy} onClick={exportSubmission}>{busy?'파일을 묶는 중…':'제출 파일 저장(JSON)'}</button>{message&&<p className="callout" role="status">{message}</p>}<p className="hint">서버에 자동 전송되지 않습니다. 저장한 제출 파일을 선생님께 직접 전달하세요. 상단 ‘작성 백업’은 첨부 파일을 포함하지 않아 교사 채점용 제출 파일과 다릅니다.</p><details><summary>교사가 보내 준 평가 결과 확인</summary><label htmlFor="grade-file">평가 결과 JSON</label><input id="grade-file" type="file" accept=".json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>100000)throw Error('평가 결과 파일이 너무 큽니다.');const result=parseFeedback(JSON.parse(await file.text()),student);localStorage.setItem('inquiry-v3-feedback:'+student.id,JSON.stringify(result));setFeedback(result);setMessage('평가 결과를 불러왔습니다.');}catch(error){setMessage(error instanceof Error?error.message:'평가 결과를 불러오지 못했습니다.');}finally{e.target.value='';}}}/>{feedback&&<div className="callout"><b>전달받은 제출 평가 · {Object.values(totals(feedback.grade)).reduce((a,b)=>a+b,0)} / 50점</b><p style={{whiteSpace:'pre-wrap'}}>{feedback.grade.feedback||'피드백 없음'}</p><small>채점일: {new Date(feedback.gradedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} · 제출 식별자 {feedback.submissionId.slice(0,12)}. 현재 작성 중인 내용과 다를 수 있습니다.</small></div>}</details></section>;
}
