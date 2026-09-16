'use strict';
// Generated test history, not evidence of historical development work.
// Run from the repository root. No automatic push or history rewriting.
const { execFileSync } = require('node:child_process');
const { writeFileSync } = require('node:fs');
const path = require('node:path');
const NAME = 'zohaibdev786';
const EMAIL = 'zohaibaslam2251@gmail.com';
const REPOSITORY = 'zohaibdev786/student-portal-react-js';
const NAMESPACE = '[ZOHAIB-SYNTHETIC-V1]';
const DATA_FILE = 'zohaib-synthetic-data-2020-2026.json';
const SETTINGS = {2020:[28,55],2021:[35,70],2022:[45,85],2023:[55,100],2024:[65,115],2025:[55,95],2026:[45,85]};
const OFFSET = 5 * 60 * 60 * 1000;
const pad = n => String(n).padStart(2, '0');
function git(args, env = process.env) {
  return execFileSync('git', args, {encoding:'utf8',env,stdio:['ignore','pipe','pipe'],maxBuffer:64*1024*1024}).trim();
}
function random(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let v = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v;
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}
function planMonth(year, month) {
  const rng = random(20200629 + year * 100 + month);
  const [min,max] = SETTINGS[year];
  const target = min + Math.floor(rng() * (max-min+1));
  const days = new Date(Date.UTC(year,month,0)).getUTCDate();
  const times = new Set();
  while (times.size < target) {
    const day = 1 + Math.floor(rng()*days);
    const seconds = Math.floor(rng()*12*60*60);
    times.add(Date.parse(`${year}-${pad(month)}-${pad(day)}T09:00:00+05:00`) + seconds*1000);
  }
  return [...times].sort((a,b)=>a-b).map((time,i)=>({
    time, year, month, sequence:i+1, target,
    subject:`[SYNTHETIC-RESEARCH]${NAMESPACE}[${year}][MONTH-${pad(month)}] synthetic test ${i+1}/${target}`
  }));
}
function select(args) {
  if (args.length===1 && ['all','plan'].includes(args[0])) {
    return Object.keys(SETTINGS).flatMap(y=>Array.from({length:12},(_,i)=>[Number(y),i+1]));
  }
  const year = Number(args[0]==='year' ? args[1] : args[0]);
  if (args.length!==2 || !Object.hasOwn(SETTINGS,year)) throw new Error('Commands: plan | all | year 2020 | 2020 1');
  if (args[0]==='year') return Array.from({length:12},(_,i)=>[year,i+1]);
  const month = Number(args[1]);
  if (!Number.isInteger(month)||month<1||month>12) throw new Error('Month must be 1–12.');
  return [[year,month]];
}
function checkRepository() {
  const root = git(['rev-parse','--show-toplevel']);
  if (path.resolve(root)!==path.resolve(process.cwd())) throw new Error(`Run inside: ${root}`);
  const branch = git(['branch','--show-current']);
  if (!branch) throw new Error('Switch to a named branch first.');
  const remote = git(['remote','get-url','origin']).replace(/\.git$/,'').replace(/\/$/,'');
  if (![ `https://github.com/${REPOSITORY}`, `git@github.com:${REPOSITORY}`, `ssh://git@github.com/${REPOSITORY}` ].includes(remote)) throw new Error(`Origin must point to ${REPOSITORY}. Current: ${remote}`);
  const status = git(['status','--porcelain','--untracked-files=all']);
  // Only this generated data file may be dirty after an interrupted run.
  if (status && status.split(/\r?\n/).some(line=>line.trim().slice(2).trim()!==DATA_FILE)) throw new Error('Commit or stash other changes first. Only the generated data file may be pending.');
  return branch;
}
function history() {
  const refs = git(['show-ref','--head'], process.env);
  if (!refs) return new Set();
  return new Set(git(['log','HEAD','--format=%s','--fixed-strings',`--grep=${NAMESPACE}`]).split(/\r?\n/).filter(Boolean));
}
function main() {
  const args=process.argv.slice(2), batches=select(args), now=Date.now();
  if(args[0]==='plan') {
    console.log('Zohaib: labeled synthetic test targets (not remaining counts).');
    for(const [y,m] of batches) {
      const rows=planMonth(y,m), due=rows.filter(r=>r.time<=now).length;
      console.log(`${y}-${pad(m)}: ${due} eligible now / ${rows.length} full-month target`);
    }
    console.log('Future timestamps are skipped. Current-month counts grow as dates become eligible.');
    return;
  }
  const branch=checkRepository();
  let existing;
  try { git(['rev-parse','--verify','HEAD']); existing=history(); }
  catch(e) {
    // An empty repository is supported; other history errors are not ignored.
    if(git(['rev-list','--all','--count'])!=='0') throw e;
    existing=new Set();
  }
  git(['config','--local','user.name',NAME]);
  git(['config','--local','user.email',EMAIL]);
  let made=0, skipped=0, future=0;
  for(const [y,m] of batches) for(const row of planMonth(y,m)) {
    if(row.time>now) { future++; continue; }
    if(existing.has(row.subject)) { skipped++; continue; }
    const timestamp=new Date(row.time+OFFSET).toISOString().slice(0,19)+'+05:00';
    writeFileSync(DATA_FILE,JSON.stringify({syntheticResearch:true,description:'Generated test history; not historical software development work.',namespace:NAMESPACE,author:NAME,email:EMAIL,year:y,month:m,sequence:row.sequence,monthlyTarget:row.target,syntheticTimestamp:timestamp},null,2)+'\n');
    git(['add','--',DATA_FILE]);
    git(['commit','--only','-m',row.subject,'--',DATA_FILE],{...process.env,GIT_AUTHOR_NAME:NAME,GIT_AUTHOR_EMAIL:EMAIL,GIT_COMMITTER_NAME:NAME,GIT_COMMITTER_EMAIL:EMAIL,GIT_AUTHOR_DATE:timestamp,GIT_COMMITTER_DATE:timestamp});
    existing.add(row.subject); made++;
    if(made%25===0) console.log(`Created ${made} commits...`);
  }
  console.log(`Finished: ${made} created, ${skipped} existing, ${future} future timestamps skipped.`);
  console.log(`Branch: ${branch}. Review with: git log -5 --format=fuller`);
  console.log('Nothing pushed automatically. Upload with: git push -u origin HEAD');
}
try { main(); } catch(error) { console.error('Stopped:',error.stderr?String(error.stderr).trim():error.message); process.exitCode=1; }
