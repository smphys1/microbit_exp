import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Only public configuration is written. Worker secrets are set separately.
const root=fileURLToPath(new URL('../',import.meta.url));
const required=['CF_WORKER_NAME','CF_D1_DATABASE_ID','CF_R2_BUCKET_NAME','APP_URL'];
for(const name of required)if(!process.env[name])throw Error(`Set ${name} before preparing deployment`);
const {CF_WORKER_NAME,CF_D1_DATABASE_ID,CF_R2_BUCKET_NAME,APP_URL}=process.env;
const origin=new URL(APP_URL);
if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password)
  throw Error('APP_URL must be the HTTPS origin of the public Worker');
if(!/^[a-z0-9][a-z0-9-]{0,62}$/.test(CF_WORKER_NAME))throw Error('Invalid CF_WORKER_NAME');
if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(CF_D1_DATABASE_ID)||CF_D1_DATABASE_ID==='00000000-0000-4000-8000-000000000000')
  throw Error('Set the real Cloudflare D1 database ID');
if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(CF_R2_BUCKET_NAME))throw Error('Invalid CF_R2_BUCKET_NAME');
const source=path.join(root,'dist/server/wrangler.json');
const config=JSON.parse(fs.readFileSync(source,'utf8'));
config.name=CF_WORKER_NAME;
config.workers_dev=true;
config.d1_databases=[{binding:'DB',database_name:CF_WORKER_NAME,database_id:CF_D1_DATABASE_ID}];
config.r2_buckets=[{binding:'BUCKET',bucket_name:CF_R2_BUCKET_NAME}];
config.vars={...config.vars,APP_URL:origin.origin};
// Generated source uses paths relative to dist/server; keep the new config there.
const target=path.join(root,'dist/server/wrangler.production.json');
fs.writeFileSync(target,JSON.stringify(config,null,2)+'\n');
console.log('Prepared dist/server/wrangler.production.json (no secret values included)');
