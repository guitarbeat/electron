import { spawn } from 'node:child_process';
import process from 'node:process';

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const childProcesses = [];
let isShuttingDown = false;

const stopChildren = () => {
  childProcesses.forEach((child) => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });
};

const handleShutdown = (exitCode = 0) => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  stopChildren();

  setTimeout(() => {
    process.exit(exitCode);
  }, 250).unref();
};

const startProcess = (name, args) => {
  const child = spawn(pnpmCommand, args, {
    stdio: 'inherit',
    env: process.env,
  });

  childProcesses.push(child);

  child.on('exit', (code, signal) => {
    if (isShuttingDown) return;

    if (signal) {
      console.error(`${name} stopped with signal ${signal}`);
      handleShutdown(1);
      return;
    }

    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      handleShutdown(code);
      return;
    }

    console.error(`${name} exited unexpectedly`);
    handleShutdown(1);
  });

  child.on('error', (error) => {
    console.error(`Failed to start ${name}:`, error);
    handleShutdown(1);
  });
};

process.on('SIGINT', () => handleShutdown(0));
process.on('SIGTERM', () => handleShutdown(0));

startProcess('API server', ['run', 'dev:server']);
startProcess('Vite dev server', ['run', 'dev:client']);
