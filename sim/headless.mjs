// Headless runner for the shared arcade engine (魂斗罗2026 / 大闹天宫).
//
// Loads games/shared/arcade-engine.mjs into a Node `vm` context with a no-op
// canvas and a stub DOM, then exposes the engine internals (G, K, step, …) so
// tests, bots, golden replays and the AI agent can drive the real game logic
// frame by frame without a browser. Production code is never modified: the
// inspection hook is injected into the VM copy only.
import fs from 'node:fs';
import vm from 'node:vm';
import { InputBuffer } from '../games/contra2026/js/coop-core.mjs';
import * as wukongDependencies from '../games/wukong/js/engine-dependencies.mjs';

const ROOT = new URL('../', import.meta.url);
const ENGINE_URL = new URL('games/shared/arcade-engine.mjs', ROOT);
const LOOP_MARKER = '// ================= loop =================';

/** Engine source and every module it imports, resolved once per process. */
export const ENGINE_SOURCE = fs.readFileSync(ENGINE_URL, 'utf8');
export const ENGINE_IMPORTS = {};
for (const match of ENGINE_SOURCE.matchAll(/^import .* from '([^']+)';$/gm)) {
  Object.assign(ENGINE_IMPORTS, await import(new URL('.' + match[1].split('?')[0], ROOT)));
}
const BODY = ENGINE_SOURCE.replace(/^import .*$/gm, '').replace(/^export /gm, '');
if (!BODY.includes(LOOP_MARKER)) throw new Error('arcade-engine.mjs: loop marker not found; update sim/headless.mjs');

/** Engine internals exposed on the returned object (union used by Contra and Wukong tests). */
export const EXPOSED = [
  'G', 'K', 'SET', 'coop', 'reset', 'step', 'render', 'collide', 'collideBasePlayer', 'withPlayer2', 'startGame', 'startStage',
  'startAfterLoading', 'cancelLoading', 'stageResourcesReady', 'referenceMusic', 'resourceCache', 'startUWOpening', 'unlockUW',
  'stageClear', 'slotHit', 'keepTeamOnScreen', 'updateCamera', 'loadRoom', 'collidePartnerHazards', 'updateActor', 'updateEnemies',
  'updateBullets', 'collidePlayer', 'jetBox', 'damageEnemy', 'ebox', 'updateBoss', 'updateStage3', 'hitMech', 'bossParts', 'findTarget',
  'solids', 'BRIDGES', 'inWall', 'xMax', 'stageOneArt', 'stageThreeArt', 'Music', 'stageMusicSession', 'useSpecial', 'killPlayer',
  'killSoldier', 'hitTarget', 'baseBlast', 'stageFourArt', 'stageFiveArt', 'hitTank', 'hitFlyingFortress', 'hitBossPart', 'placeTank',
  'pBox', 'toTitle', 'infiniteLives', 'gameplaySettings', 'syncSettingsUI', 'updateHud',
  'killEnemy', 'wukong', 'throwGrenade', 'updateGrenades', 'updatePartner', 'hitPart', 'endCine', 'applyAudio', 'setMuted',
  'wukongHeroAudio', 'wukongBattleAudio', 'continueGame', 'setMode', 'players', 'pickItem', 'GAME_TITLE', 'MOD', 'MOD_GAME', 'spawnModEnemy',
  'STUDIO_DEBUG', 'studioControl',
];

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}

/**
 * Create a fresh engine instance.
 *
 * @param {object} [options]
 * @param {'contra2026'|'wukong'} [options.game]   Which entry to boot. Wukong passes its dependency module to startArcade.
 * @param {number|null} [options.seed]             Seed for the engine's Math.random (null = host Math.random).
 * @param {boolean} [options.coldResources]        Leave stage resources unloaded (tests loading screens). Contra only.
 * @param {string} [options.hostname]              location.hostname seen by the engine.
 * @param {string} [options.search]                location.search seen by the engine.
 * @param {boolean} [options.touch]                Report a touch screen.
 * @param {() => any[]} [options.getGamepads]      navigator.getGamepads stub.
 * @param {object|null} [options.savedSettings]    Settings preloaded into localStorage.
 * @param {boolean} [options.hideGamepadIndicator] Simulate a page without the gamepad indicator element.
 * @param {object} [options.overrides]             Extra/replacement globals injected into the VM (e.g. audio spies).
 * @param {'basic'|'rich'} [options.dom]           DOM stub flavour (defaults to the one each game's tests were written against).
 * @param {boolean} [options.primeAllStages]       Mark every open stage's resources as cached so play() starts immediately.
 * @param {object} [options.dependencies]          Module passed to startArcade (defaults to the Wukong dependencies for Wukong).
 * @param {object} [options.spec]                  GameSpec overrides (a project's game.json) passed to startArcade.
 * @param {object} [options.modules]               Project code modules { modules: [setup | namespace], assetBase } (games/shared/mod-runtime.mjs).
 */
export function createHeadlessEngine({
  game = 'contra2026', seed = null, coldResources = false, hostname = 'localhost', search = '', touch = false,
  getGamepads = () => [], savedSettings = null, hideGamepadIndicator = false, overrides = {},
  dom = game === 'wukong' ? 'rich' : 'basic', primeAllStages = game !== 'wukong',
  dependencies = game === 'wukong' ? wukongDependencies : undefined, spec = undefined, modules = undefined,
} = {}) {
  const rich = dom === 'rich';
  let fullscreenRequests = 0;
  const elements = new Map(), storage = new Map(), documentEvents = new Map();
  if (savedSettings) storage.set(game === 'wukong' ? 'wukong-settings' : 'chiyan-settings', JSON.stringify(savedSettings));
  const gradient = { addColorStop() {} };
  const context = new Proxy({
    measureText: text => ({ width: String(text).length * (rich ? 5 : 6) }),
    createLinearGradient: () => gradient, createRadialGradient: () => gradient,
  }, { get: (o, key) => key in o ? o[key] : () => {}, set: (o, key, value) => (o[key] = value, true) });
  let document;
  function element() {
    const classes = new Set();
    const node = {
      hidden: true, value: '1', style: { setProperty() {} }, clientWidth: 768, clientHeight: 432,
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle(c, enabled) { if (enabled) classes.add(c); else classes.delete(c); } },
      getContext() { if (rich) context.canvas = this; return context; }, addEventListener() {}, setAttribute() {}, getAttribute() { return null; },
      querySelector: () => rich ? element() : null, querySelectorAll: () => [],
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 768, height: 432 }),
      focus() { document.activeElement = this; }, blur() {},
    };
    if (rich) Object.assign(node, { width: 768, height: 432, closest: () => element(), appendChild() {} });
    return node;
  }
  document = {
    getElementById(id) {
      if (hideGamepadIndicator && id === 'gamepad-indicator') return null;
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    createElement: element, head: element(), body: element(), activeElement: null, hidden: false,
    addEventListener(type, handler) { if (!documentEvents.has(type)) documentEvents.set(type, []); documentEvents.get(type).push(handler); },
    documentElement: { requestFullscreen() { fullscreenRequests++; return Promise.resolve(); } },
  };
  if (rich || game === 'wukong') document.body.dataset = { game };
  class Network {
    playing = false; role = 'host'; room = ''; remote = new InputBuffer();
    constructor(callbacks) { this.callbacks = callbacks; }
    leave() { this.playing = false; this.room = ''; }
  }
  let math = Math;
  if (seed !== null) { math = Object.create(Math); math.random = seededRandom(seed); }
  const sandbox = {
    ...ENGINE_IMPORTS,
    __dependencies: dependencies, __gameSpec: spec, __modules: modules,
    document, navigator: { maxTouchPoints: touch ? 5 : 0, getGamepads },
    location: { href: `http://localhost/games/${game}/`, origin: 'http://localhost', hostname, search },
    matchMedia: () => ({ matches: false }), addEventListener() {}, requestAnimationFrame() {},
    innerWidth: 768, innerHeight: 432, performance: { now: () => 0 },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    Image: rich ? class { complete = false; naturalWidth = 0; } : class {
      complete = false; naturalWidth = 0;
      set src(url) { this.url = url; if (url) queueMicrotask(() => { this.naturalWidth = this.naturalHeight = 64; this.onload?.(); }); }
      get src() { return this.url; }
      decode() { return Promise.resolve(); }
    },
    URL, URLSearchParams, Math: math, Date, Set, Map, console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, coldResources,
    __primeAllStages: primeAllStages,
    CoopClient: Network,
    ...overrides,
  };
  sandbox.window = sandbox;
  const expose = EXPOSED.map(name => `${name}: typeof ${name} === 'undefined' ? undefined : ${name}`).join(',\n      ');
  const source = BODY.replace(LOOP_MARKER, `
    if (__primeAllStages && !coldResources) for (const stage of OPEN_STAGES) for (const job of stageJobs(stage)) resourceCache.add(job.id);
    window.engine = {
      ${expose},
      element: id => document.getElementById(id),
      inspect: () => window[WUKONG ? 'WukongGame' : 'Contra2026'].inspect(),
      resizeWindow(width, height, dpr = 1) { $('wrap').clientWidth = width; $('wrap').clientHeight = height; window.devicePixelRatio = dpr; resize(); },
      resolution: () => ({ canvas: [cv.width, cv.height], backgrounds: backgroundResolution, sky: SKY && [SKY.width, SKY.height] }),
      play(stage = 1, online = false) { coop.playing = online; reset(stage); setMode('play'); },
      primeResources(stage = G.stage) { for (const job of stageJobs(stage)) { gameResources.done.add(job.id); resourceCache.add(job.id); } },
      siegeRoom(id, x = 48) { WukongSiege.enterRoom(G, id, players(), siegeHooks(), x); },
      hurtPartner(force, hit) { withPlayer2(() => killPlayer(force, hit)); },
    };
    ${LOOP_MARKER}`);
  vm.runInNewContext(source + `\nstartArcade(__dependencies, __gameSpec, __modules);`, sandbox, { filename: `${game}-engine.js` });
  const engine = sandbox.engine;
  engine.dispatchDocument = (type, event) => { for (const handler of documentEvents.get(type) || []) handler({ preventDefault() {}, cancelable: true, ...event }); };
  engine.fullscreenRequests = () => fullscreenRequests;
  /** Hold exactly the given keys (KeyboardEvent.code → true) and advance n fixed 1/60 s frames. */
  engine.frames = (n, keys = {}) => {
    for (const key of Object.keys(engine.K)) engine.K[key] = false;
    Object.assign(engine.K, keys);
    for (let i = 0; i < n; i++) engine.step();
  };
  return engine;
}
