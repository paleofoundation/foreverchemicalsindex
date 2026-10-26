// TEST ONLY. Render labeled fixtures outside public/ without changing eligibility.
import fs from "node:fs"
import http from "node:http"
import esbuild from "esbuild"
import { spawnSync } from "node:child_process"
import handler from "serve-handler"
const outfile = ".quartz-cache/reading-fixtures.mjs"
if (!fs.existsSync("public/static/contentIndex.json")) throw new Error("Run npm run build first")
await esbuild.build({entryPoints:["tests/reading-fixture.tsx"],outfile,bundle:true,platform:"node",format:"esm",external:["lightningcss","esbuild","sass","@napi-rs/*","@myriaddreamin/*","sharp"],jsx:"automatic",jsxImportSource:"preact",banner:{js:'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);'},loader:{".scss":"text"},plugins:[{name:"fixture-inline-text",setup(build){build.onLoad({filter:/\.inline\.ts$/},args=>({contents:fs.readFileSync(args.path,"utf8"),loader:"text"}))}}]})
const rendered = spawnSync(process.execPath,[outfile],{stdio:"inherit"})
if (rendered.status !== 0) process.exit(rendered.status ?? 1)
console.log("TEST ONLY fixtures: .quartz-cache/reading-fixtures (excluded from public build)")
if (process.argv.includes("--serve")) http.createServer((req,res)=>{
  const path = new URL(req.url,"http://localhost").pathname
  if (/^\/test-only-(?:detail|source)$/.test(path)) { res.writeHead(200,{"content-type":"text/html","x-robots-tag":"noindex"});res.end(fs.readFileSync(`.quartz-cache/reading-fixtures${path}.html`)) }
  else handler(req,res,{public:"public",cleanUrls:true})
}).listen(8081,"127.0.0.1",()=>console.log("TEST ONLY preview: http://127.0.0.1:8081/test-only-detail"))
