import {sha256} from '@noble/hashes/sha2.js';
import {studentFromDetails} from './student-identity.ts';
import type {StudentUser} from './student-identity.ts';
import {validateGrade} from './rubric.ts';
import type {Fields} from './rubric.ts';

export const MAX_PACKAGE_BYTES=30*1024*1024;
const MAX_FILE_BYTES=10*1024*1024,MAX_TOTAL_BYTES=20*1024*1024;
export const REQUIRED_FIELDS=['classroom','sensor','situation','dataKind','question','topic','independent','controls','procedure','motivation','analysis','conclusion','limits'];
const FIELD_NAMES=new Set(['student',...REQUIRED_FIELDS,'model','sheetUrl','interval','board']);
export interface Attachment {name:string;kind:'csv'|'sheet'|'graph';size:number;content:string}
export interface Submission {kind:'inquiry-submission';version:3;id:string;createdAt:string;student:StudentUser;fields:Fields;checks:Record<string,boolean>;files:Attachment[]}
export interface Grade {topic:number[];files:number[];report:number[];feedback:string;released:boolean;revision:number}
export interface TeacherRecord {submission:Submission;grade:Grade|null;updatedAt:string}
export interface Feedback {kind:'inquiry-feedback';version:3;submissionId:string;studentId:string;student:string;gradedAt:string;grade:Grade}

function canonical(value:unknown):string{
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical((value as Record<string,unknown>)[key])).join(',')+'}';
  return JSON.stringify(value);
}
function contentId(data:Pick<Submission,'student'|'fields'|'checks'|'files'>):string{
  return Array.from(sha256(new TextEncoder().encode(canonical(data))),b=>b.toString(16).padStart(2,'0')).join('');
}
function encode(bytes:Uint8Array):string{let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
export function attachmentBytes(file:Attachment):Uint8Array{return Uint8Array.from(atob(file.content),char=>char.charCodeAt(0));}
export function attachmentBlob(file:Attachment):Blob{
  const bytes=attachmentBytes(file);const type=file.kind==='csv'?'text/csv;charset=utf-8':file.kind==='sheet'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':bytes[0]===0x89?'image/png':'image/jpeg';
  return new Blob([bytes as Uint8Array<ArrayBuffer>],{type});
}
function validateFiles(value:unknown):Attachment[]{
  if(!Array.isArray(value)||value.length>10)throw Error('첨부 파일 수가 올바르지 않습니다.');
  const counts={csv:0,sheet:0,graph:0};let total=0;
  const files=value.map((raw:any):Attachment=>{
    if(!raw||typeof raw.name!=='string'||!raw.name||raw.name.length>200||!['csv','sheet','graph'].includes(raw.kind)||
      !Number.isInteger(raw.size)||raw.size<1||raw.size>MAX_FILE_BYTES||typeof raw.content!=='string'||raw.content.length!==Math.ceil(raw.size/3)*4||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(raw.content))throw Error('첨부 파일 데이터가 올바르지 않습니다.');
    const file:Attachment={name:raw.name,kind:raw.kind,size:raw.size,content:raw.content};
    counts[file.kind]++;total+=file.size;
    if(total>MAX_TOTAL_BYTES||counts.csv>8||counts.sheet>1||counts.graph>1||file.kind==='graph'&&file.size>5*1024*1024)throw Error('첨부 용량 또는 개수 제한을 초과했습니다.');
    const bytes=attachmentBytes(file);if(bytes.length!==file.size)throw Error('첨부 파일 크기가 맞지 않습니다.');
    if(file.kind==='csv'&&!/\.csv$/i.test(file.name))throw Error('CSV 확장자를 확인하세요.');
    if(file.kind==='sheet'&&(!/\.xlsx$/i.test(file.name)||bytes[0]!==0x50||bytes[1]!==0x4b))throw Error('올바른 XLSX 파일이 아닙니다.');
    if(file.kind==='graph'&&(!/\.(png|jpe?g)$/i.test(file.name)||!((bytes[0]===0x89&&bytes[1]===0x50)||(bytes[0]===0xff&&bytes[1]===0xd8))))throw Error('올바른 PNG/JPG 이미지가 아닙니다.');
    return file;
  });
  if(!counts.csv||!counts.sheet)throw Error('원본 CSV와 그래프가 포함된 XLSX를 모두 첨부하세요.');
  return files;
}
function cleanFields(raw:unknown,user:StudentUser):Fields{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('작성 내용이 올바르지 않습니다.');
  const fields:Fields={};for(const [key,value] of Object.entries(raw)){
    if(!FIELD_NAMES.has(key))continue;
    if(typeof value!=='string'||value.length>12000)throw Error('작성 항목은 12,000자 이내의 텍스트여야 합니다.');fields[key]=value;
  }
  fields.student=user.studentNumber+' '+user.name;
  if(REQUIRED_FIELDS.some(key=>!fields[key]?.trim())||fields.sensor==='external'&&!fields.model?.trim())throw Error('주제·설계·보고서의 필수 내용을 모두 작성하세요.');
  return fields;
}
function cleanChecks(raw:any):Record<string,boolean>{
  if(!raw||!['control','repeat','unit'].every(key=>raw[key]===true))throw Error('변인 통제·반복·단위 점검을 모두 완료하세요.');
  return {control:true,repeat:true,unit:true};
}
export async function createSubmission(student:StudentUser,fields:Fields,checks:Record<string,boolean>,inputs:File[]):Promise<Submission>{
  const user=await studentFromDetails(student.studentNumber,student.name);
  if(inputs.length>10||inputs.some(file=>file.size>MAX_FILE_BYTES)||inputs.reduce((sum,file)=>sum+file.size,0)>MAX_TOTAL_BYTES)throw Error('파일당 10 MB, 전체 20 MB 이내로 첨부하세요.');
  const files:Attachment[]=[];
  for(const file of inputs){const kind=/\.csv$/i.test(file.name)?'csv':/\.xlsx$/i.test(file.name)?'sheet':'graph';files.push({name:file.name,kind,size:file.size,content:encode(new Uint8Array(await file.arrayBuffer()))});}
  const data={student:user,fields:cleanFields(fields,user),checks:cleanChecks(checks),files:validateFiles(files)};
  return {kind:'inquiry-submission',version:3,id:contentId(data),createdAt:new Date().toISOString(),...data};
}
export async function parseSubmission(raw:any):Promise<Submission>{
  if(raw?.kind!=='inquiry-submission'||raw.version!==3)throw Error('ver3의 ‘제출 파일 저장(JSON)’으로 만든 파일을 선택하세요. 작성 백업은 제출 파일이 아닙니다.');
  const student=await studentFromDetails(raw.student?.studentNumber,raw.student?.name);
  if(raw.student.id!==student.id||typeof raw.createdAt!=='string'||!Number.isFinite(Date.parse(raw.createdAt)))throw Error('학생 정보 또는 저장 시간이 올바르지 않습니다.');
  const data={student,fields:cleanFields(raw.fields,student),checks:cleanChecks(raw.checks),files:validateFiles(raw.files)};
  if(raw.id!==contentId(data))throw Error('제출 파일 내용이 변경되었거나 손상되었습니다. 학생에게 다시 저장한 파일을 받으세요.');
  return {kind:'inquiry-submission',version:3,id:raw.id,createdAt:raw.createdAt,...data};
}
export function emptyGrade():Grade{return {topic:Array(5).fill(-1),files:Array(10).fill(0),report:Array(5).fill(-1),feedback:'',released:false,revision:1};}
export function checkedGrade(value:unknown):Grade{
  if(!validateGrade(value))throw Error('모든 채점 항목의 점수를 선택하고 피드백 길이를 확인하세요.');
  const raw=value as Grade;return {topic:[...raw.topic],files:[...raw.files],report:[...raw.report],feedback:raw.feedback,released:raw.released,revision:raw.revision};
}
export function parseFeedback(raw:any,user:StudentUser):Feedback{
  if(raw?.kind!=='inquiry-feedback'||raw.version!==3||raw.studentId!==user.id||typeof raw.submissionId!=='string'||!/^[a-f0-9]{64}$/.test(raw.submissionId)||!Number.isFinite(Date.parse(raw.gradedAt)))throw Error('현재 학생의 ver3 평가 결과 파일이 아닙니다.');
  return {kind:'inquiry-feedback',version:3,submissionId:raw.submissionId,studentId:user.id,student:String(raw.student).slice(0,100),gradedAt:raw.gradedAt,grade:checkedGrade(raw.grade)};
}
export function gradeCsv(records:TeacherRecord[]):string{
  const quote=(value:unknown)=>{let text=String(value??'');if(/^[\s\uFEFF]*[=+@-]/u.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
  const rows:unknown[][]=[['학급','학번','이름','주제10','파일10','보고서30','총점50','상태','피드백']];
  for(const {submission:s,grade:g} of records){const sums=g?[g.topic,g.files,g.report].map(a=>a.reduce((sum,n)=>sum+n,0)):null;rows.push([s.fields.classroom,s.student.studentNumber,s.student.name,...(sums||['','','']),sums?sums.reduce((a,b)=>a+b,0):'',g?'채점 완료':'미채점',g?.feedback||'']);}
  return '\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n');
}
