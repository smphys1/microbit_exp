import assert from 'node:assert/strict';
import {SignJWT} from 'jose';
import {getStudentUser,handleStudentAuth,issueStudentSession,studentFromDetails} from '../lib/student-auth.ts';

const env={APP_URL:'https://school.test',AUTH_SESSION_SECRET:'test-session-secret-at-least-32-bytes'};
const student=await studentFromDetails('10101','홍길동');
const request=(path,options={})=>new Request(env.APP_URL+path,options);
const call=(path,options={})=>handleStudentAuth(request(path,options),env);
const sessionCookie=token=>`__Host-school_session=${token}`;
const enter=(details,origin=env.APP_URL)=>call('/api/auth/enter',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(details)});
let checks=0;
function equal(actual,expected){assert.deepEqual(actual,expected);checks++;}

// No Google account, OAuth client, password or pre-existing roster is required.
const entered=await enter({studentNumber:'10101',name:'홍길동'});
equal(entered.status,200);equal((await entered.json()).user,student);
const entryCookie=entered.headers.get('set-cookie').split(';')[0];
assert(entered.headers.get('set-cookie').includes('Secure'));assert(entered.headers.get('set-cookie').includes('HttpOnly'));
equal(await getStudentUser(request('/',{headers:{cookie:entryCookie}}),env),student);
equal((await(await call('/api/auth/session',{headers:{cookie:entryCookie}})).json()).user,student);
equal((await(await call('/api/auth/session')).json()).user,null);
equal(await studentFromDetails(' １０１０１ ',' 홍길동 '),student);
equal((await(await enter({studentNumber:'10101',name:'홍길동'})).json()).user,student);
assert.notEqual((await studentFromDetails('10102','홍길동')).id,student.id);
assert.notEqual((await studentFromDetails('10101','김학생')).id,student.id);
assert.notEqual((await studentFromDetails('00101','홍길동')).id,(await studentFromDetails('101','홍길동')).id);
for(const details of [{},{studentNumber:'',name:'홍길동'},{studentNumber:'1e3',name:'홍길동'},
  {studentNumber:10101,name:'홍길동'},{studentNumber:'10101',name:''},{studentNumber:'10101',name:'<script>'},
  {studentNumber:'1'.repeat(21),name:'홍길동'},{studentNumber:'10101',name:'가'.repeat(51)}]){
  equal((await enter(details)).status,400);
}
equal((await enter({studentNumber:'10101',name:'홍길동'},'https://other.test')).status,403);
equal((await call('/api/auth/enter',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,403);
equal((await call('/api/auth/enter')).status,405);
equal((await call('/api/auth/google')).status,404);
equal((await call('/api/auth/callback?code=unused')).status,404);
equal((await call('/api/auth/enter',{method:'POST',headers:{origin:env.APP_URL,'content-type':'text/plain'},body:'data'})).status,415);
equal((await call('/api/auth/enter',{method:'POST',headers:{origin:env.APP_URL,'content-type':'application/json'},body:'not-json'})).status,400);
equal((await call('/api/auth/enter',{method:'POST',headers:{origin:env.APP_URL,'content-type':'application/json'},body:'x'.repeat(3000)})).status,413);
equal((await handleStudentAuth(request('/api/auth/enter',{method:'POST'}),{})).status,503);

const session=await issueStudentSession(env,student);
equal(await getStudentUser(request('/',{headers:{cookie:sessionCookie(session)}}),env),student);
equal(await getStudentUser(request('/',{headers:{'oai-authenticated-user-id':student.id}}),env),null);
equal(await getStudentUser(request('/',{headers:{cookie:sessionCookie(session.slice(0,-5)+'wrong')}}),env),null);
equal(await getStudentUser(new Request('https://other.test',{headers:{cookie:sessionCookie(session)}}),env),null);
equal(await getStudentUser(request('/',{headers:{cookie:sessionCookie(session)+'; '+sessionCookie(session)}}),env),null);
const sign=payload=>new SignJWT(payload).setProtectedHeader({alg:'HS256'}).setIssuer(env.APP_URL).setAudience('student-entry').setIssuedAt()
  .setExpirationTime(Math.floor(Date.now()/1000)-1).sign(new TextEncoder().encode(env.AUTH_SESSION_SECRET));
const expired=await sign({sub:student.id,studentNumber:student.studentNumber,name:student.name});
equal(await getStudentUser(request('/',{headers:{cookie:sessionCookie(expired)}}),env),null);
const inconsistent=await new SignJWT({sub:student.id,studentNumber:'10102',name:student.name}).setProtectedHeader({alg:'HS256'})
  .setIssuer(env.APP_URL).setAudience('student-entry').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(env.AUTH_SESSION_SECRET));
equal(await getStudentUser(request('/',{headers:{cookie:sessionCookie(inconsistent)}}),env),null);
const legacy=await new SignJWT({sub:'google:old',email:'student@sangmyung.sen.hs.kr',name:student.name}).setProtectedHeader({alg:'HS256'})
  .setIssuer(env.APP_URL).setAudience('school-student').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(env.AUTH_SESSION_SECRET));
equal(await getStudentUser(request('/',{headers:{cookie:sessionCookie(legacy)}}),env),null);
equal((await call('/api/auth/logout')).status,405);
equal((await call('/api/auth/logout',{method:'POST',headers:{origin:'https://other.test'}})).status,403);
const exited=await call('/api/auth/logout',{method:'POST',headers:{origin:env.APP_URL}});
equal(exited.status,303);equal(exited.headers.get('location'),'/');assert(exited.headers.get('set-cookie').includes('Max-Age=0'));
console.log(`PASS: student-number/name entry (${checks} checks), repeat access, normalization, input validation, signed sessions, isolation, tamper rejection and exit`);
