export interface StudentUser {id:string;studentNumber:string;name:string}

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
