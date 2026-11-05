// Run AI-written project modules in a separate Node process (sim/worker.mjs):
// an infinite loop or crash in module code only kills the child, which is
// stopped after a timeout. The child gets a minimal environment (no API keys)
// and, where supported, Node's permission model limited to reading the repo.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const WORKER = path.join(ROOT, 'sim', 'worker.mjs');
const IMPORT_PATTERN = /^\s*import\s[^(]|^\s*export\s+[^;]*\sfrom\s|\brequire\s*\(|\bimport\s*\(/m;

/** Static checks shared by the Studio tools before any code is run. */
export function checkModuleSource(source) {
  const errors = [];
  if (typeof source !== 'string' || !source.trim()) errors.push('文件内容为空');
  else {
    if (source.length > 200_000) errors.push('单个模块不能超过 200 KB');
    if (IMPORT_PATTERN.test(source)) errors.push('模块必须是单个自包含文件：不能使用 import / require，需要的工具函数都通过 setup(api) 和 game 参数获得');
    if (!/export\s+default\s/.test(source)) errors.push('缺少 export default function setup(api) { ... }');
  }
  return errors;
}

/**
 * @param {object} job see sim/worker.mjs
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<object>} the worker's JSON result ({ ok: false, error } on crash/timeout)
 */
export function runIsolated(job, { timeoutMs = 30000 } = {}) {
  const args = ['--permission', `--allow-fs-read=${ROOT}`, WORKER];
  return new Promise(resolve => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'],
      env: { PATH: process.env.PATH || '', NODE_ENV: 'production', NODE_NO_WARNINGS: '1' },
    });
    let stdout = '', stderr = '', done = false;
    const finish = value => { if (!done) { done = true; clearTimeout(timer); resolve(value); } };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish({ ok: false, error: `运行超过 ${Math.round(timeoutMs / 1000)} 秒被终止：模块代码可能有死循环或太慢`, timeout: true });
    }, timeoutMs);
    child.stdout.on('data', chunk => { stdout += chunk; if (stdout.length > 4 << 20) child.kill('SIGKILL'); });
    child.stderr.on('data', chunk => { if (stderr.length < 8000) stderr += chunk; });
    child.on('error', error => finish({ ok: false, error: `无法启动检查进程：${error.message}` }));
    child.on('close', code => {
      try { finish(JSON.parse(stdout)); }
      catch { finish({ ok: false, error: `检查进程异常退出（${code}）：${stderr.trim().split('\n').slice(-6).join('\n') || '无输出'}` }); }
    });
    child.stdin.end(JSON.stringify(job));
  });
}
