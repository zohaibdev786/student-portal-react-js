// Synthetic Git date fixtures. These commits do not represent historical work.
// Usage: node commit_calendar.cjs YEAR MONTH
// Creates one labelled empty commit per day on synthetic-calendar-v1. Never pushes.
'use strict';
const { execFileSync } = require('node:child_process');

function git(args, env = process.env) {
  return execFileSync('git', args, { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function stop(message) { throw new Error(message); }

try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || !/^\d{4}$/.test(args[0]) || !/^\d{1,2}$/.test(args[1])) {
    stop('Usage: node commit_calendar.cjs YEAR MONTH (example: 2024 1)');
  }
  const year = Number(args[0]);
  const month = Number(args[1]);
  if (year < 2022 || year > 2026 || month < 1 || month > 12) {
    stop('Choose year 2022-2026 and month 1-12.');
  }
  const now = new Date();
  const monthStart = Date.UTC(year, month - 1, 1);
  if (monthStart > now.getTime()) stop('Future months are not allowed.');
  if (git(['rev-parse', '--is-inside-work-tree']) !== 'true') stop('Run inside your cloned Git repository.');
  const origin = git(['remote', 'get-url', 'origin']);
  if (!/^(?:https:\/\/github\.com\/|git@github\.com:)basitkhan045\/foundationalwebframeworks(?:\.git)?\/?$/i.test(origin)) {
    stop('Wrong origin: ' + origin + '\nExpected basitkhan045/foundationalwebframeworks. No changes made.');
  }
  if (git(['status', '--porcelain', '--untracked-files=no'])) {
    stop('Tracked changes exist. Commit or stash them first.');
  }
  git(['rev-parse', '--verify', 'HEAD']);
  const identity = git(['var', 'GIT_AUTHOR_IDENT']);
  const branch = 'synthetic-calendar-v1';
  if (git(['branch', '--show-current']) !== branch) {
    const exists = git(['branch', '--list', branch]);
    git(exists ? ['switch', branch] : ['switch', '-c', branch]);
  }
  const subjects = new Set(git(['log', '--format=%s']).split('\n'));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let created = 0;
  let skipped = 0;
  for (let day = 1; day <= days; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const timestamp = date + 'T12:00:00Z';
    if (Date.parse(timestamp) > now.getTime()) continue;
    const subject = `[SYNTHETIC-CALENDAR-V1] ${date} date fixture`;
    if (subjects.has(subject)) { skipped++; continue; }
    git(['-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-m', subject,
      '-m', 'Synthetic date fixture generated now; does not represent work performed on this date.'],
      { ...process.env, GIT_AUTHOR_DATE: timestamp, GIT_COMMITTER_DATE: timestamp });
    subjects.add(subject);
    created++;
  }
  console.log(`Created: ${created}; already present: ${skipped}.`);
  console.log(`Branch: ${branch}\nAuthor: ${identity}\nNothing pushed.`);
} catch (error) {
  console.error('Stopped: ' + (error.stderr ? String(error.stderr).trim() : error.message));
  process.exitCode = 1;
}
