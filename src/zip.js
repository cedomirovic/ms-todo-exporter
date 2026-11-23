/**
 * Minimalni ZIP writer (metod "store", bez kompresije).
 *
 * Browseri često blokiraju više automatskih preuzimanja iz jednog klika, pa
 * kada korisnik izabere više formata sve ide u jedan .zip fajl.
 * Format: PKWARE APPNOTE, lokalni header + central directory + EOCD.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  return {
    time:
      ((date.getHours() & 0x1f) << 11) |
      ((date.getMinutes() & 0x3f) << 5) |
      (Math.floor(date.getSeconds() / 2) & 0x1f),
    day:
      (((date.getFullYear() - 1980) & 0x7f) << 9) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      (date.getDate() & 0x1f),
  };
}

/**
 * @param {Array<{name: string, data: string|Uint8Array}>} files
 * @param {Date} [date]
 * @returns {Blob}
 */
export function createZip(files, date = new Date()) {
  const encoder = new TextEncoder();
  const { time, day } = dosDateTime(date);

  const entries = files.map((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes =
      typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    return { nameBytes, dataBytes, crc: crc32(dataBytes) };
  });

  const chunks = [];
  const centralDirectory = [];
  let offset = 0;

  for (const entry of entries) {
    const local = new Uint8Array(30 + entry.nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); // lokalni header
    localView.setUint16(4, 20, true); // verzija
    localView.setUint16(6, 0x0800, true); // UTF-8 imena
    localView.setUint16(8, 0, true); // store
    localView.setUint16(10, time, true);
    localView.setUint16(12, day, true);
    localView.setUint32(14, entry.crc, true);
    localView.setUint32(18, entry.dataBytes.length, true);
    localView.setUint32(22, entry.dataBytes.length, true);
    localView.setUint16(26, entry.nameBytes.length, true);
    localView.setUint16(28, 0, true);
    local.set(entry.nameBytes, 30);

    chunks.push(local, entry.dataBytes);

    const central = new Uint8Array(46 + entry.nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, day, true);
    centralView.setUint32(16, entry.crc, true);
    centralView.setUint32(20, entry.dataBytes.length, true);
    centralView.setUint32(24, entry.dataBytes.length, true);
    centralView.setUint16(28, entry.nameBytes.length, true);
    centralView.setUint16(30, 0, true); // extra polje
    centralView.setUint16(32, 0, true); // komentar
    centralView.setUint16(34, 0, true); // disk
    centralView.setUint16(36, 0, true); // interni atributi
    centralView.setUint32(38, 0, true); // eksterni atributi
    centralView.setUint32(42, offset, true);
    central.set(entry.nameBytes, 46);
    centralDirectory.push(central);

    offset += local.length + entry.dataBytes.length;
  }

  const centralSize = centralDirectory.reduce((sum, part) => sum + part.length, 0);

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...chunks, ...centralDirectory, end], { type: 'application/zip' });
}
