import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
process.on('uncaughtException', error => { console.error(error.message, error.code ?? '', error.where ?? ''); process.exit(1); });

const modulePath = process.argv[2];
if (!modulePath) throw Error('Usage: node scripts/test-roles-database.mjs <absolute PGlite module path>');
const { PGlite } = await import(pathToFileURL(modulePath).href);
const db = new PGlite();
await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select current_user::text$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid);
 alter table storage.objects enable row level security;
 grant usage on schema auth,storage to anon,authenticated;
 grant select,insert,update,delete on storage.objects to anon,authenticated;
`);
for (const file of readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort()) {
  const sql = readFileSync(`supabase/migrations/${file}`, 'utf8').replace('create extension if not exists pgcrypto;', '');
  try { await db.exec(sql); console.log(`Migration OK: ${file}`); }
  catch (error) { console.error(`Migration FAILED: ${file}`); throw error; }
}
await db.exec(readFileSync('supabase/seed.sql','utf8'));
console.log('Seed OK');
await db.exec(readFileSync('supabase/tests/roles-authors-ratings-reads.sql','utf8'));
console.log('Ownership, rating, reading-session, analytics, user management and coin assertions passed');
const policies = await db.query(`select tablename,policyname from pg_policies where schemaname in ('public','storage') and (coalesce(qual,'')||coalesce(with_check,'')) like '%is_staff()%'`);
assert.deepEqual(policies.rows.map(p => p.policyname), ['staff insert draft stories']);
console.log('No broad staff policy remains');
await db.exec(readFileSync('supabase/tests/coin-wallets.sql','utf8'));
console.log('Existing coin-wallet regression assertions passed');
await db.close();
