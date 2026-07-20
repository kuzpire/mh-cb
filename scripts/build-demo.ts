import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const ASSETS = "assets/minecraft/textures/entity/banner";
const DEFAULT = "BLACK;flower:YELLOW,flower:WHITE,skull:BLACK,circle:RED,triangle_top:BLACK";

async function main(): Promise<void> {
  const files = (await readdir(ASSETS)).filter((f) => f.endsWith(".png"));
  const tex: Record<string, string> = {};
  for (const f of files) {
    const buf = await readFile(path.join(ASSETS, f));
    tex[f.replace(/\.png$/, "")] = `data:image/png;base64,${buf.toString("base64")}`;
  }

  const renderer = await readFile("web/clan-banner.js", "utf8");
  const hero = `data:image/jpeg;base64,${(await readFile("web/hero.jpg")).toString("base64")}`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Clan Banner</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Figtree:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    color-scheme: dark;
    --bg0:#0b0d13; --bg2:#0d111a; --card:#1a2136; --card2:#202944;
    --line2:rgba(255,255,255,.12);
    --ink:#f5f7fc; --mut:#a4adc4; --dim:#78829e;
    --gold:#ffe08a; --gold-sh:#cfa94e; --blue:#3e8dff;
    --amber:#ffb347;
    --r:20px;
    --font-d:"Archivo Black", sans-serif;
    --font-b:"Figtree", system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh;
    display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
    padding: 48px clamp(48px, 9vw, 150px);
    font-family: var(--font-b); color: var(--ink);
    background-color: var(--bg0);
    -webkit-font-smoothing: antialiased;
  }
  body::before {
    content: ""; position: fixed; top: 0; left: 0; right: 0;
    height: 46vw; z-index: -1;
    background:
      linear-gradient(180deg,
        rgba(11,13,19,.10) 0%,
        rgba(11,13,19,.10) 26%,
        rgba(11,13,19,.22) 44%,
        rgba(11,13,19,.44) 60%,
        rgba(11,13,19,.68) 72%,
        rgba(11,13,19,.88) 84%,
        var(--bg0) 97%),
      linear-gradient(90deg,
        var(--bg0) 0%,
        var(--bg0) 18%,
        rgba(11,13,19,.92) 28%,
        rgba(11,13,19,.72) 38%,
        rgba(11,13,19,.48) 48%,
        rgba(11,13,19,.26) 58%,
        rgba(11,13,19,.10) 67%,
        transparent 76%),
      linear-gradient(#16264c1a, #16264c1a),
      url("${hero}") calc(100% + 5vw) 34% / auto 53vw no-repeat,
      var(--bg0);
  }
  .content {
    display: flex; flex-direction: column; align-items: center; gap: 26px;
    max-width: 440px; text-align: center;
    transform: translateY(-6vh);
  }
  h1 {
    margin: 0; text-align: center;
    font-family: var(--font-d); font-style: italic; text-transform: uppercase;
    font-size: clamp(28px,4.5vw,44px); letter-spacing: .01em; line-height: 1.12;
  }
  h1 .hl { color: var(--gold); text-shadow: 0 3px 0 rgba(0,0,0,.35); }
  .stage {
    background: linear-gradient(0deg, rgba(255,179,71,.13), transparent 52%), rgba(15,17,25,.66);
    border: 1px solid rgba(255,179,71,.30);
    border-radius: 18px;
    padding: 30px 46px;
    box-shadow: 0 14px 36px rgba(0,0,0,.42);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
  }
  .banner {
    width: 150px; height: 300px;
    filter: drop-shadow(0 8px 18px rgba(0,0,0,.55));
  }
  .banner svg { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
  .field { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  input {
    width: min(460px, 90vw);
    padding: 13px 22px; text-align: center;
    border-radius: 999px; border: 1.5px solid var(--amber);
    background: var(--bg2); color: var(--ink);
    font-family: ui-monospace, "SF Mono", monospace; font-size: 14px;
    box-shadow: 0 0 0 4px rgba(255,179,71,.10), 0 6px 18px rgba(0,0,0,.35);
    transition: border-color .15s, box-shadow .15s;
  }
  input:focus {
    outline: none; border-color: #ffc978;
    box-shadow: 0 0 0 4px rgba(255,179,71,.24), 0 6px 18px rgba(0,0,0,.35);
  }
  .hint { color: var(--dim); font-size: 13px; }
  .hint code { color: var(--mut); }
</style>
</head>
<body>
  <main class="content">
    <h1>Clan <span class="hl">Banner</span></h1>
    <div class="stage"><div class="banner" id="banner"></div></div>
    <div class="field">
      <input id="inp" value="${DEFAULT}" spellcheck="false" autocomplete="off">
      <span class="hint"><code>BASE;patrón:COLOR,patrón:COLOR</code></span>
    </div>
  </main>

  <script>
  const TEX = ${JSON.stringify(tex)};
  </script>
  <script>
  ${renderer}
  </script>
  <script>
    const resolve = (name) => TEX[name] || TEX.base;
    const banner = document.getElementById('banner');
    const inp = document.getElementById('inp');
    function render() { banner.innerHTML = ClanBanner.bannerSvg(inp.value.trim(), { resolve }); }
    inp.addEventListener('input', render);
    render();
  </script>
</body>
</html>`;

  await writeFile("web/index.html", html);
  console.error(`✔ web/index.html (${(html.length / 1024).toFixed(0)} KB, ${files.length} texturas)`);
}

main().catch((err: unknown) => {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
