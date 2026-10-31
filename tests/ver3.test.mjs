import assert from 'node:assert/strict';
import {studentFromDetails} from '../lib/student-identity.ts';
import {createSubmission,parseSubmission,attachmentBytes,checkedGrade,emptyGrade,gradeCsv,parseFeedback,REQUIRED_FIELDS} from '../lib/ver3-submission.ts';
import {totals} from '../lib/rubric.ts';

const user=await studentFromDetails('10101','홍길동');
const fields=Object.fromEntries(REQUIRED_FIELDS.map(key=>[key,'TEST '+key]));fields.sensor='light';fields.classroom='1학년 1반';
const checks={control:true,repeat:true,unit:true};
const bytes=new TextEncoder().encode('sep=,\ntime_s,light\n0,40\n1,42');
const files=[new File([bytes],'original.csv'),new File([new Uint8Array([0x50,0x4b,3,4])],'chart.xlsx')];
const created=await createSubmission(user,fields,checks,files);
const parsed=await parseSubmission(JSON.parse(JSON.stringify(created)));
assert.deepEqual(parsed,created);assert.equal(parsed.fields.student,'10101 홍길동');assert.deepEqual(attachmentBytes(parsed.files[0]),bytes);
assert.equal((await createSubmission(user,fields,checks,files)).id,created.id);
assert.notEqual((await createSubmission(user,{...fields,analysis:'New result'},checks,files)).id,created.id);
for(const change of [value=>value.fields.analysis='tampered',value=>value.student.id='other',value=>value.files[0].size++,value=>value.files[0].content='broken',value=>value.version=2]){
 const invalid=structuredClone(created);change(invalid);await assert.rejects(parseSubmission(invalid));
}
await assert.rejects(createSubmission(user,fields,{...checks,control:false},files));
await assert.rejects(createSubmission(user,{...fields,conclusion:''},checks,files));
await assert.rejects(createSubmission(user,fields,checks,files.slice(0,1)));
await assert.rejects(createSubmission(user,fields,checks,[files[0],new File(['not-a-zip'],'fake.xlsx')]));
assert.throws(()=>checkedGrade(emptyGrade()));
const grade=checkedGrade({topic:[2,2,2,2,2],files:Array(10).fill(1),report:[4,6,8,8,4],feedback:'근거가 명확합니다.',released:false,revision:1});
assert.equal(Object.values(totals(grade)).reduce((a,b)=>a+b,0),50);
assert.throws(()=>checkedGrade({...grade,report:[99,6,8,8,4]}));
const record={submission:created,grade,updatedAt:new Date().toISOString()};
const csv=gradeCsv([record]);assert(csv.includes('"50"'));assert(csv.includes('"홍길동"'));
const injection=gradeCsv([{...record,grade:{...grade,feedback:' \t=IMPORTXML("evil")'}}]);assert(injection.includes('"\' \t=IMPORTXML'));
const feedback={kind:'inquiry-feedback',version:3,submissionId:created.id,studentId:user.id,student:created.fields.student,gradedAt:record.updatedAt,grade:{...grade,released:true}};
assert.deepEqual(parseFeedback(feedback,user),feedback);
assert.throws(()=>parseFeedback({...feedback,studentId:'other'},user));
assert.throws(()=>parseFeedback({...feedback,grade:{...grade,files:[99]}},user));
console.log('PASS: ver3 submission bundle roundtrip, byte-preserving attachments, completeness checks, tamper detection, grading validation, 50-point totals, CSV escaping and student feedback');
