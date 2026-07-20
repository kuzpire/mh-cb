import { inflateRawSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const DEFAULT_TEXTURES_DIR = "assets/minecraft/textures/entity/banner/";
const MANIFEST = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const BANNER_PATH = "assets/minecraft/textures/entity/banner";

interface Manifest {
  latest: { release: string; snapshot: string };
  versions: { id: string; url: string }[];
}
interface VersionMeta {
  downloads: { client: { url: string; sha1: string; size: number } };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

function extractBannerPngs(zip: Buffer): Map<string, Buffer> {
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP inválido: no se encontró el EOCD.");

  const total = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);

  const out = new Map<string, Buffer>();
  for (let n = 0; n < total; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error("ZIP inválido: cabecera central.");
    const method = zip.readUInt16LE(p + 10);
    const compSize = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const localOff = zip.readUInt32LE(p + 42);
    const name = zip.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;

    if (!name.startsWith(BANNER_PATH + "/") || !name.endsWith(".png")) continue;

    if (zip.readUInt32LE(localOff) !== 0x04034b50) throw new Error("ZIP inválido: cabecera local.");
    const lNameLen = zip.readUInt16LE(localOff + 26);
    const lExtraLen = zip.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const raw = zip.subarray(dataStart, dataStart + compSize);

    const data = method === 0 ? Buffer.from(raw) : inflateRawSync(raw);
    out.set(path.basename(name), data);
  }
  return out;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      version: { type: "string", short: "v" },
      out: { type: "string", short: "o" },
    },
  });

  const manifest = await getJson<Manifest>(MANIFEST);
  const versionId = values.version ?? manifest.latest.release;
  const entry = manifest.versions.find((v) => v.id === versionId);
  if (!entry) throw new Error(`Versión desconocida: ${versionId}`);

  const meta = await getJson<VersionMeta>(entry.url);
  const client = meta.downloads.client;
  console.error(`Versión ${versionId}: descargando client.jar (${(client.size / 1e6).toFixed(1)} MB)…`);

  const res = await fetch(client.url);
  if (!res.ok) throw new Error(`GET client.jar -> ${res.status}`);
  const jar = Buffer.from(await res.arrayBuffer());

  const pngs = extractBannerPngs(jar);
  if (pngs.size === 0) {
    throw new Error(`No se encontraron texturas bajo ${BANNER_PATH} en ${versionId}.`);
  }

  const out = values.out ?? DEFAULT_TEXTURES_DIR;
  await mkdir(out, { recursive: true });
  for (const [name, data] of pngs) {
    await writeFile(path.join(out, name), data);
  }
  console.error(`✔ ${pngs.size} texturas escritas en ${out}`);
}

main().catch((err: unknown) => {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
