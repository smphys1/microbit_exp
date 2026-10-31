import {jwtVerify,SignJWT} from 'jose';

const SESSION_SECONDS=8*60*60;
export interface AuthEnv {APP_URL?:string; AUTH_SESSION_SECRET?:string}
export interface StudentUser {id:string;studentNumber:string;name:string}

function appOrigin(env:AuthEnv):string{
  const url=new URL(env.APP_URL||'');
  const local=url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname);
  if((!local&&url.protocol!=='https:')||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Invalid APP_URL');
  return url.origin;
}
function signingKey(env:AuthEnv):Uint8Array{
  if(!env.AUTH_SESSION_SECRET||new TextEncoder().encode(env.AUTH_SESSION_SECRET).length<32)throw Error('AUTH_SESSION_SECRET requires at least 32 bytes');
  return new TextEncoder().encode(env.AUTH_SESSION_SECRET);
}
function cookieName(env:AuthEnv):string{return appOrigin(env).startsWith('https:')?'__Host-school_session':'school_session_dev'}
function cookie(env:AuthEnv,value:string,seconds:number):string{
  return `${cookieName(env)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}`+(appOrigin(env).startsWith('https:')?'; Secure':'');
}

// These are self-reported details, not proof of a student's identity.
export async function studentFromDetails(number:unknown,name:unknown):Promise<StudentUser>{
  if(typeof number!=='string'||typeof name!=='string'||number.length>100||name.length>200)throw Error('Invalid student details');
  const studentNumber=number.normalize('NFKC').trim();
  const normalizedName=name.normalize('NFKC').trim().replace(/\s+/gu,' ');
  if(!/^\d{1,20}$/.test(studentNumber)||!normalizedName||normalizedName.length>50||
      !/^[\p{L}\p{M} .'-]+$/u.test(normalizedName))throw Error('Invalid student details');
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([studentNumber,normalizedName])));
  const id='student:'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  return {id,studentNumber,name:normalizedName};
}
export async function issueStudentSession(env:AuthEnv,user:StudentUser):Promise<string>{
  const expected=await studentFromDetails(user.studentNumber,user.name);
  if(user.id!==expected.id)throw Error('Invalid student identity');
  return new SignJWT({sub:expected.id,studentNumber:expected.studentNumber,name:expected.name})
    .setProtectedHeader({alg:'HS256',typ:'JWT'}).setIssuer(appOrigin(env)).setAudience('student-entry')
    .setIssuedAt().setExpirationTime(Math.floor(Date.now()/1000)+SESSION_SECONDS).sign(signingKey(env));
}
export async function getStudentUser(request:Request,env:AuthEnv):Promise<StudentUser|null>{
  try{
    if(new URL(request.url).origin!==appOrigin(env))return null;
    const name=cookieName(env);
    const values=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(name+'='));
    if(values.length!==1)return null;
    const {payload}=await jwtVerify(values[0].slice(name.length+1),signingKey(env),{
      issuer:appOrigin(env),audience:'student-entry',algorithms:['HS256'],requiredClaims:['exp','iat','sub','studentNumber','name'],
    });
    const user=await studentFromDetails(payload.studentNumber,payload.name);
    return payload.sub===user.id?user:null;
  }catch{return null;}
}
function json(value:unknown,status=200,headers:Record<string,string>={}):Response{
  return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
}
export async function handleStudentAuth(request:Request,env:AuthEnv):Promise<Response|null>{
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/auth/'))return null;
  if(url.pathname==='/api/auth/session'&&request.method==='GET')return json({user:await getStudentUser(request,env)});
  if(!['/api/auth/enter','/api/auth/logout'].includes(url.pathname))return json({error:'접속 경로를 찾을 수 없습니다.'},404);
  if(request.method!=='POST')return json({error:'POST 요청이 필요합니다.'},405);
  let origin:string;
  try{origin=appOrigin(env);signingKey(env);}catch{return json({error:'접속 설정이 준비되지 않았습니다. 담당 교사에게 문의하세요.'},503);}
  if(url.origin!==origin||request.headers.get('origin')!==origin)return json({error:'다른 사이트의 요청은 허용하지 않습니다.'},403);
  if(url.pathname==='/api/auth/logout')return new Response(null,{status:303,headers:{Location:'/','Cache-Control':'no-store','Set-Cookie':cookie(env,'',0)}});
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return json({error:'올바른 입력 형식이 아닙니다.'},415);
  const reader=request.body?.getReader();
  if(!reader)return json({error:'학번과 이름을 입력하세요.'},400);
  const chunks:Uint8Array[]=[];let total=0;
  for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>2048){await reader.cancel();return json({error:'입력 내용이 너무 깁니다.'},413);}chunks.push(value);}
  let user:StudentUser;
  try{
    const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const data=JSON.parse(new TextDecoder().decode(bytes));user=await studentFromDetails(data?.studentNumber,data?.name);
  }catch{return json({error:'학번은 숫자 1~20자리, 이름은 50자 이내로 입력하세요.'},400);}
  return json({user},200,{'Set-Cookie':cookie(env,await issueStudentSession(env,user),SESSION_SECONDS)});
}
