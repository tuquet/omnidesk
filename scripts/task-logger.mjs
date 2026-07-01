import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const [,, logFile, ...commandArgs] = process.argv;

if (!logFile || commandArgs.length === 0) {
  console.error('Usage: node scripts/task-logger.mjs <logfile> <command> [args...]');
  process.exit(1);
}

const logPath = path.resolve('logs', logFile);
fs.mkdirSync(path.dirname(logPath), { recursive: true });

// Overwrite file (clean before session)
const logStream = fs.createWriteStream(logPath, { flags: 'w' });

const isWindows = process.platform === 'win32';
const cmd = isWindows ? 'cmd.exe' : commandArgs[0];
const args = isWindows ? ['/c', commandArgs.join(' ')] : commandArgs.slice(1);

const child = spawn(cmd, args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '1' } // Force color output for terminal
});

const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

child.stdout.on('data', (data) => {
  process.stdout.write(data);
  logStream.write(stripAnsi(data.toString()));
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  logStream.write(stripAnsi(data.toString()));
});

child.on('close', (code) => {
  logStream.end();
  process.exit(code);
});
