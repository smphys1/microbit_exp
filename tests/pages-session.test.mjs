import assert from 'node:assert/strict';
import {enterLocalStudent,readLocalStudent,exitLocalStudent} from '../lib/pages-session.ts';

const values=new Map();
const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
assert.equal(await readLocalStudent(storage),null);
const a=await enterLocalStudent(storage,'10101','홍길동');
assert.deepEqual(await readLocalStudent(storage),a);
assert.deepEqual(await enterLocalStudent(storage,' １０１０１ ',' 홍길동 '),a);
const b=await enterLocalStudent(storage,'10102','김학생');assert.notEqual(a.id,b.id);
assert.deepEqual(await readLocalStudent(storage),b);
await assert.rejects(enterLocalStudent(storage,'','홍길동'));
await assert.rejects(enterLocalStudent(storage,'10101',''));
exitLocalStudent(storage);assert.equal(await readLocalStudent(storage),null);
values.set('inquiry-v2-pages-student','broken-json');assert.equal(await readLocalStudent(storage),null);
const otherTab={getItem:()=>null,setItem(){},removeItem(){}};assert.equal(await readLocalStudent(otherTab),null);
console.log('PASS: Pages local entry, refresh persistence, normalized identity, student switching, validation and exit without server');
