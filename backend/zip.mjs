// Minimal zero-dependency PKZIP packer & unpacker built on Node's native node:zlib.
// Supports standard Store (0) and Deflate (8) entries with UTF-8 filenames and CRC-32
// verification, plus strict zip-slip and zip-bomb bounds for safe project imports.
import zlib from 'node:zlib';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

export function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Pack an array of `{ name, data }` into a standard `.zip` Buffer.
 * @param {Array<{ name: string, data: Buffer | string }>} entries
 * @returns {Buffer}
 */
export function packZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const cleanName = String(entry.name || '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!cleanName || cleanName.includes('..')) throw new Error(`非法的归档文件名: ${entry.name}`);
    const nameBuf = Buffer.from(cleanName, 'utf8');
    const raw = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data ?? ''), 'utf8');
    const crc = crc32(raw);
    const deflated = raw.length > 0 ? zlib.deflateRawSync(raw) : raw;
    const useDeflate = raw.length > 0 && deflated.length < raw.length;
    const comp = useDeflate ? deflated : raw;
    const method = useDeflate ? 8 : 0;

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 flag
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x0021, 12); // 1980-01-01
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x0021, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comp.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    localParts.push(local, comp);
    centralParts.push(central);
    offset += local.length + comp.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

/**
 * Unpack a `.zip` Buffer safely with entry count, size, path-traversal, and CRC32 checks.
 * @param {Buffer} buf
 * @param {{ maxEntries?: number, maxTotalBytes?: number }} [options]
 * @returns {Array<{ name: string, data: Buffer }>}
 */
export function unpackZip(buf, { maxEntries = 60, maxTotalBytes = 20 << 20 } = {}) {
  if (!Buffer.isBuffer(buf) || buf.length < 22) throw new Error('不是有效的 ZIP 压缩包');

  let eocdOffset = -1;
  const minSearch = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minSearch; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset < 0) throw new Error('ZIP 文件损坏：找不到目录结尾标识');

  const count = buf.readUInt16LE(eocdOffset + 10);
  const centralSize = buf.readUInt32LE(eocdOffset + 12);
  const centralOffset = buf.readUInt32LE(eocdOffset + 16);
  if (count > maxEntries) throw new Error(`ZIP 内文件数过多（最多允许 ${maxEntries} 个文件）`);
  if (centralOffset + centralSize > eocdOffset) throw new Error('ZIP 中央目录越界');

  const out = [];
  let ptr = centralOffset;
  let totalBytes = 0;

  for (let i = 0; i < count; i++) {
    if (ptr + 46 > buf.length || buf.readUInt32LE(ptr) !== 0x02014b50) {
      throw new Error('ZIP 中央目录项格式错误');
    }
    const method = buf.readUInt16LE(ptr + 10);
    const expectedCrc = buf.readUInt32LE(ptr + 16);
    const compSize = buf.readUInt32LE(ptr + 20);
    const uncompSize = buf.readUInt32LE(ptr + 24);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);

    const rawName = buf.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8').replace(/\\/g, '/');
    ptr += 46 + nameLen + extraLen + commentLen;

    // Skip directory entries or macOS metadata files
    if (rawName.endsWith('/') || rawName.startsWith('__MACOSX/') || rawName.split('/').some(seg => seg === '.DS_Store')) {
      continue;
    }
    if (rawName.startsWith('/') || rawName.split('/').includes('..') || /[\x00-\x1f]/.test(rawName)) {
      throw new Error(`ZIP 包含不安全的路径: ${rawName}`);
    }
    totalBytes += uncompSize;
    if (totalBytes > maxTotalBytes) throw new Error(`ZIP 解压总大小超过限制（${Math.round(maxTotalBytes / (1 << 20))} MB）`);

    if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`ZIP 本地文件头损坏: ${rawName}`);
    }
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + lNameLen + lExtraLen;
    const dataEnd = dataStart + compSize;
    if (dataEnd > buf.length) throw new Error(`ZIP 文件数据越界: ${rawName}`);

    const compBuf = buf.subarray(dataStart, dataEnd);
    let data;
    if (method === 0) {
      data = Buffer.from(compBuf);
    } else if (method === 8) {
      data = zlib.inflateRawSync(compBuf, { maxOutputLength: maxTotalBytes });
    } else {
      throw new Error(`不支持的 ZIP 压缩算法 (${method}): ${rawName}`);
    }

    if (data.length !== uncompSize) throw new Error(`ZIP 文件长度不匹配: ${rawName}`);
    if (crc32(data) !== expectedCrc) throw new Error(`ZIP 文件 CRC32 校验失败: ${rawName}`);
    out.push({ name: rawName, data });
  }

  return out;
}
