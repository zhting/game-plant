import { versionedAssetUrl } from './asset-url.mjs?v=enemy-freeze-2';
/** Successful resources stay warm; retries only repeat failed work. */
export class ResourcePreloader {
  constructor(jobs, { concurrency = 4, timeout = 300000, completed = [], cache = null } = {}) {
    this.jobs = [...new Map(jobs.map(job => [job.id, job])).values()];
    this.concurrency = concurrency; this.timeout = timeout;
    const ids = new Set(this.jobs.map(job => job.id));
    this.cache = cache;
    this.done = new Set([...(cache || completed)].filter(id => ids.has(id))); this.failed = new Set(); this.status = this.ready ? 'ready' : 'idle';
    this.listeners = new Set(); this.pending = null;
  }
  get ready() { return this.done.size === this.jobs.length; }
  inspect() { return { status: this.status, ready: this.ready, loaded: this.done.size, total: this.jobs.length, failed: [...this.failed] }; }
  notify() { const state = this.inspect(); for (const listener of this.listeners) listener(state); }
  async load(listener = () => {}) {
    this.listeners.add(listener); listener(this.inspect());
    try {
      if (this.ready) return this.inspect();
      if (!this.pending) {
        this.status = 'loading'; this.notify();
        this.pending = this.run().finally(() => { this.pending = null; });
      }
      return await this.pending;
    } finally { this.listeners.delete(listener); }
  }
  async run() {
    const remaining = this.jobs.filter(job => !this.done.has(job.id));
    const queued = remaining.filter(job => !job.eager);
    const eager=remaining.filter(job=>job.eager);let eagerCursor=0;
    let cursor = 0;
    const load = async job => {
        let timer;
        try {
          await Promise.race([
            Promise.resolve().then(() => job.load({ retry: this.failed.has(job.id) })),
            new Promise((_, reject) => { timer = setTimeout(() => reject(Error('资源加载超时')), this.timeout); })
          ]);
          this.done.add(job.id); this.cache?.add(job.id); this.failed.delete(job.id);
        } catch { this.failed.add(job.id); }
        finally { clearTimeout(timer); this.notify(); }
    };
    await Promise.all([
      ...Array.from({length:Math.min(this.concurrency,eager.length)},async()=>{while(eagerCursor<eager.length)await load(eager[eagerCursor++]);}),
      ...Array.from({ length: Math.min(this.concurrency, queued.length) }, async () => {
        while (cursor < queued.length) await load(queued[cursor++]);
      })
    ]);
    this.status = this.ready ? 'ready' : 'error'; this.notify();
    if (!this.ready) throw Error('部分资源加载失败，请重试');
    return this.inspect();
  }
}

export function musicResourceJobs(music, keys) {
  return [...new Set(keys)].map(key => ({ id: 'music:' + key, load: options => music.prefetch(key, options) }));
}

export function imageResource(url, imageFactory) {
  let image, pending;
  return { id: 'image:' + url, load({ retry = false } = {}) {
    if (pending && !retry) return pending;
    if (image) { image.onload = image.onerror = null; image.src = ''; }
    image = imageFactory(); image.decoding = 'async';
    pending = new Promise((resolve, reject) => {
      image.onload = () => {
        if (image.decode) image.decode().then(resolve, reject); else resolve();
      };
      image.onerror = () => reject(Error('图片加载失败'));
      image.src = versionedAssetUrl(url);
    });
    return pending;
  } };
}

export function gameResourceJobs({ arts, imageFactory, cover, records = [], tracks = {}, music, fonts, urls = null }) {
  const images = new Map();
  for (const art of arts) for (const [key, url] of Object.entries(art.assets)) {
    if (!images.has(url)) images.set(url, []);
    images.get(url).push({ art, key });
  }
  return [
    ...[...images].filter(([url]) => !urls || urls.has(url)).map(([url, sources]) => ({ id: 'image:' + url, eager: true, load: async options => {
      const [first,...shared]=sources;
      if(shared.every(({art})=>typeof art.adoptImage==='function')){
        const image=await first.art.loadImage(first.key,options);
        for(const {art,key}of shared)art.adoptImage(key,image);
      }else await Promise.all(sources.map(({art,key})=>art.loadImage(key,options)));
    } })),
    ...[...new Set([cover, ...records].filter(Boolean))].map(url => imageResource(url, imageFactory)),
    ...musicResourceJobs(music, Object.keys(tracks)),
    { id: 'fonts', eager: true, load: () => fonts || Promise.resolve() }
  ];
}
