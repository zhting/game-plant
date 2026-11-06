// Project store: every creator project is a directory holding game.json (GameSpec
// overrides), modules/*.mjs (code modules, games/shared/mod-runtime.mjs) and
// assets/ (images and audio used by modules). Each project directory is its own
// git repository, so every AI or manual change is a commit and "undo" is a revert.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';
import { validateGameSpec, patchGameSpec, resolveGameSpec } from '../games/shared/game-spec.mjs';
import { PROJECT_ID_PATTERN } from '../games/shared/project-spec.mjs';

const run = promisify(execFile);
const GIT_IDENTITY = ['-c', 'user.name=Game Plant Studio', '-c', 'user.email=studio@game-plant.local', '-c', 'commit.gpgsign=false'];
const REV_PATTERN = /^[0-9a-f]{4,40}$/;
/** Files a project may contain besides game.json. One directory level, safe names only. */
export const PROJECT_FILE_RULES = Object.freeze({
  modules: { pattern: /^[a-z][a-z0-9-]{0,39}\.mjs$/, maxBytes: 200_000, text: true, desc: '代码模块（.mjs）' },
  assets: { pattern: /^[a-z0-9][a-z0-9_-]{0,59}\.(png|webp|jpg|ogg|mp3|wav)$/, maxBytes: 8 << 20, text: false, desc: '图片和音频' },
});
export const ASSET_TYPES = Object.freeze({ png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', ogg: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav', mjs: 'text/javascript; charset=utf-8' });

export class ProjectError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

export function createProjectStore({ dir, templatesDir }) {
  const locks = new Map();
  /** Serialize writes per project so concurrent requests never interleave git commands. */
  function locked(id, task) {
    const prev = locks.get(id) || Promise.resolve();
    const next = prev.catch(() => {}).then(task);
    locks.set(id, next);
    next.finally(() => { if (locks.get(id) === next) locks.delete(id); }).catch(() => {});
    return next;
  }
  const projectDir = id => {
    if (!PROJECT_ID_PATTERN.test(id || '')) throw new ProjectError(400, '项目 id 只能包含小写字母、数字和连字符，最长 40 个字符');
    return path.join(dir, id);
  };
  const git = async (id, args) => (await run('git', [...GIT_IDENTITY, '-C', projectDir(id), ...args], { maxBuffer: 16 << 20 })).stdout;
  const gitBuffer = async (id, args) => (await run('git', [...GIT_IDENTITY, '-C', projectDir(id), ...args], { maxBuffer: 32 << 20, encoding: 'buffer' })).stdout;
  function checkRev(rev) { if (!REV_PATTERN.test(rev || '')) throw new ProjectError(400, '版本号格式不对'); }
  /** Validate a project-relative path such as modules/bird.mjs; returns the matching rule. */
  function fileRule(rel) {
    const parts = String(rel || '').replace(/\\/g, '/').split('/');
    const rule = PROJECT_FILE_RULES[parts[0]];
    if (!rule || parts.length !== 2 || !rule.pattern.test(parts[1])) {
      throw new ProjectError(400, `文件路径 "${rel}" 不允许：只能是 modules/<小写名>.mjs 或 assets/<小写名>.(png|webp|jpg|ogg|mp3|wav)`);
    }
    return rule;
  }
  async function hasStaged(id) {
    try { await git(id, ['diff', '--cached', '--quiet']); return false; } catch { return true; }
  }
  async function commitStaged(id, message) {
    if (!await hasStaged(id)) return { commit: (await git(id, ['rev-parse', 'HEAD'])).trim(), changed: false };
    await git(id, ['commit', '-q', '-m', message]);
    return { commit: (await git(id, ['rev-parse', 'HEAD'])).trim(), changed: true };
  }
  async function requireProject(id) {
    try { await fs.access(path.join(projectDir(id), 'game.json')); }
    catch { throw new ProjectError(404, `项目 ${id} 不存在`); }
  }
  function checkSpec(spec) {
    const errors = validateGameSpec(spec);
    if (errors.length) throw new ProjectError(422, 'game.json 校验失败', errors);
  }
  async function writeAndCommit(id, spec, message) {
    checkSpec(spec);
    const file = path.join(projectDir(id), 'game.json');
    const text = JSON.stringify(spec, null, 2) + '\n';
    const before = await fs.readFile(file, 'utf8').catch(() => null);
    if (before === text) return { commit: (await git(id, ['rev-parse', 'HEAD'])).trim(), changed: false, spec };
    await fs.writeFile(file, text);
    await git(id, ['add', 'game.json']);
    await git(id, ['commit', '-q', '-m', message || '更新 game.json']);
    return { commit: (await git(id, ['rev-parse', 'HEAD'])).trim(), changed: true, spec };
  }

  return {
    dir,
    async list() {
      await fs.mkdir(dir, { recursive: true });
      const out = [];
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || !PROJECT_ID_PATTERN.test(entry.name)) continue;
        try {
          const spec = JSON.parse(await fs.readFile(path.join(dir, entry.name, 'game.json'), 'utf8'));
          const updatedAt = (await git(entry.name, ['log', '-1', '--format=%cI'])).trim();
          out.push({ id: entry.name, title: spec.meta?.title || entry.name, template: spec.template, updatedAt });
        } catch { /* not a project */ }
      }
      return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async create({ id, title, template = 'contra' } = {}) {
      if (!/^[a-z]+$/.test(template)) throw new ProjectError(400, '未知模板');
      const base = await fs.readFile(path.join(templatesDir, template, 'game.json'), 'utf8').catch(() => null);
      if (!base) throw new ProjectError(400, `模板 ${template} 不存在`);
      id ||= 'p-' + crypto.randomBytes(3).toString('hex');
      const target = projectDir(id);
      await fs.mkdir(dir, { recursive: true });
      try { await fs.mkdir(target); } catch { throw new ProjectError(409, `项目 ${id} 已存在`); }
      const spec = JSON.parse(base);
      if (title) spec.meta = { ...spec.meta, title: String(title).slice(0, 40) };
      try {
        try { await run('git', ['init', '-q', '-b', 'main', target]); }
        catch { await run('git', ['init', '-q', target]); }
        // .studio/ holds Studio-side state (chat log) that must not pollute version history.
        await fs.writeFile(path.join(target, '.gitignore'), '.studio/\n');
        await git(id, ['add', '.gitignore']);
        await writeAndCommit(id, spec, `创建项目（模板：${template}）`);
      } catch (error) { await fs.rm(target, { recursive: true, force: true }); throw error; }
      return { id, spec };
    },

    async readSpec(id, rev) {
      await requireProject(id);
      if (rev) {
        if (!REV_PATTERN.test(rev)) throw new ProjectError(400, '版本号格式不对');
        try { return JSON.parse(await git(id, ['show', `${rev}:game.json`])); }
        catch { throw new ProjectError(404, `找不到版本 ${rev}`); }
      }
      return JSON.parse(await fs.readFile(path.join(projectDir(id), 'game.json'), 'utf8'));
    },

    /** Overrides merged over the template: what the engine actually runs. */
    async resolvedSpec(id, rev) { return resolveGameSpec(await this.readSpec(id, rev)); },

    writeSpec(id, spec, message) {
      return locked(id, async () => { await requireProject(id); return writeAndCommit(id, spec, message); });
    },

    /** RFC 7386 merge patch over the current overrides (null removes a key = back to template default). */
    patchSpec(id, patch, message) {
      return locked(id, async () => {
        await requireProject(id);
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new ProjectError(400, 'patch 需要是对象');
        const current = JSON.parse(await fs.readFile(path.join(projectDir(id), 'game.json'), 'utf8'));
        return writeAndCommit(id, patchGameSpec(current, patch), message);
      });
    },

    async history(id, limit = 50) {
      await requireProject(id);
      const text = await git(id, ['log', `-${Math.min(200, Math.max(1, limit | 0))}`, '--format=%H%x1f%cI%x1f%s']);
      return text.trim().split('\n').filter(Boolean).map(line => {
        const [commit, date, message] = line.split('\x1f');
        return { commit, date, message };
      });
    },

    async diff(id, rev) {
      await requireProject(id);
      checkRev(rev);
      return git(id, ['show', '--format=%s', '--stat', '--patch', rev, '--', 'game.json', 'modules', 'assets']);
    },

    /** Files under modules/ or assets/ (at a revision if given): [{ path, size }]. */
    async listFiles(id, folder, rev) {
      await requireProject(id);
      if (!PROJECT_FILE_RULES[folder]) throw new ProjectError(400, `未知目录 ${folder}`);
      if (rev) {
        checkRev(rev);
        const text = await git(id, ['ls-tree', '-r', '-l', rev, '--', folder + '/']).catch(() => '');
        return text.trim().split('\n').filter(Boolean).map(line => {
          const [meta, file] = line.split('\t'); return { path: file, size: Number(meta.trim().split(/\s+/)[3]) };
        }).filter(f => PROJECT_FILE_RULES[folder].pattern.test(f.path.slice(folder.length + 1)));
      }
      const entries = await fs.readdir(path.join(projectDir(id), folder), { withFileTypes: true }).catch(() => []);
      const out = [];
      for (const entry of entries) {
        if (!entry.isFile() || !PROJECT_FILE_RULES[folder].pattern.test(entry.name)) continue;
        out.push({ path: `${folder}/${entry.name}`, size: (await fs.stat(path.join(projectDir(id), folder, entry.name))).size });
      }
      return out.sort((a, b) => a.path.localeCompare(b.path));
    },

    /** Read a project file as a Buffer (at a revision if given). */
    async readFile(id, rel, rev) {
      await requireProject(id);
      fileRule(rel);
      if (rev) {
        checkRev(rev);
        try { return await gitBuffer(id, ['show', `${rev}:${rel}`]); }
        catch { throw new ProjectError(404, `版本 ${rev} 里没有 ${rel}`); }
      }
      try { return await fs.readFile(path.join(projectDir(id), rel)); }
      catch { throw new ProjectError(404, `文件 ${rel} 不存在`); }
    },

    /** Code modules as [{ path, source }] (what the engine loads), at a revision if given. */
    async moduleSources(id, rev) {
      const files = await this.listFiles(id, 'modules', rev);
      return Promise.all(files.map(async f => ({ path: f.path, source: (await this.readFile(id, f.path, rev)).toString('utf8') })));
    },

    /**
     * Write files and commit them together. files: [{ path, content: string|Buffer }].
     * @returns {{ commit, changed }}
     */
    writeFiles(id, files, message) {
      return locked(id, async () => {
        await requireProject(id);
        if (!Array.isArray(files) || !files.length || files.length > 20) throw new ProjectError(400, '一次写入 1~20 个文件');
        for (const file of files) {
          const rule = fileRule(file.path);
          const data = Buffer.isBuffer(file.content) ? file.content : typeof file.content === 'string' ? Buffer.from(file.content, 'utf8') : null;
          if (!data) throw new ProjectError(400, `${file.path}: 内容需要是字符串或二进制`);
          if (data.length > rule.maxBytes) throw new ProjectError(413, `${file.path}: 超过 ${Math.round(rule.maxBytes / 1024)} KB`);
          file.data = data;
        }
        for (const file of files) {
          const target = path.join(projectDir(id), file.path);
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, file.data);
          await git(id, ['add', '--', file.path]);
        }
        return commitStaged(id, message || `更新 ${files.map(f => f.path).join('、')}`);
      });
    },

    deleteFiles(id, paths, message) {
      return locked(id, async () => {
        await requireProject(id);
        for (const rel of paths) {
          fileRule(rel);
          try { await fs.access(path.join(projectDir(id), rel)); } catch { throw new ProjectError(404, `文件 ${rel} 不存在`); }
        }
        await git(id, ['rm', '-q', '--', ...paths]);
        return commitStaged(id, message || `删除 ${paths.join('、')}`);
      });
    },

    /** Undo the latest change by reverting HEAD (the creation commit cannot be undone). */
    undo(id) {
      return locked(id, async () => {
        await requireProject(id);
        const count = Number((await git(id, ['rev-list', '--count', 'HEAD'])).trim());
        if (count < 2) throw new ProjectError(409, '已经是最初版本，没有可以撤销的修改');
        const subject = (await git(id, ['log', '-1', '--format=%s'])).trim();
        await git(id, ['revert', '--no-commit', 'HEAD']);
        await git(id, ['commit', '-q', '-m', `撤销：${subject}`]);
        return { commit: (await git(id, ['rev-parse', 'HEAD'])).trim(), spec: await this.readSpec(id) };
      });
    },

    async readChat(id) {
      await requireProject(id);
      try { return JSON.parse(await fs.readFile(path.join(projectDir(id), '.studio', 'chat.json'), 'utf8')); }
      catch { return []; }
    },

    /** Append chat entries ({role:'user'|'model', text, changes?, at}); keeps the latest 200. */
    async appendChat(id, entries) {
      await requireProject(id);
      const dirPath = path.join(projectDir(id), '.studio');
      await fs.mkdir(dirPath, { recursive: true });
      const log = [...await this.readChat(id), ...entries].slice(-200);
      await fs.writeFile(path.join(dirPath, 'chat.json'), JSON.stringify(log, null, 1));
      return log;
    },

    /** Restore the whole project (game.json, modules, assets) to an earlier version, as a new commit. */
    restore(id, rev) {
      return locked(id, async () => {
        const spec = await this.readSpec(id, rev);
        checkSpec(spec);
        await git(id, ['restore', `--source=${rev}`, '--staged', '--worktree', '--', '.']);
        const result = await commitStaged(id, `回到版本 ${rev.slice(0, 7)}`);
        return { ...result, spec };
      });
    },
  };
}
