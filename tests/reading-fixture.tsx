// TEST ONLY: offline rendering; never copied to wiki/ or public/.
import fs from 'node:fs'
import { renderPage } from '../quartz/components/renderPage'
import Head from '../quartz/components/Head'
import TopNav from '../quartz/components/TopNav'
import Footer from '../quartz/components/Footer'
import SectionNavigation from '../quartz/components/SectionNavigation'
import ReadingRail from '../quartz/components/ReadingRail'
import Content from '../quartz/components/pages/Content'
import { fromHtml } from 'hast-util-from-html'
const cfg = {locale:'en-US',pageTitle:'Forever Chemicals Index',baseUrl:'foreverchemicalsindex.com',theme:{fontOrigin:'googleFonts',typography:{header:{name:'Lora',weights:[400,500,600,700],includeItalic:false},body:{name:'Inter',weights:[300,400,500,600,700]},code:{name:'IBM Plex Mono',weights:[400,500,600]}}}}
const css = fs.readdirSync('public').find(f=>/^index\..*\.css$/.test(f))
const resources = {css:[{content:`/${css}`}],js:[{src:'/postscript.js',loadTime:'afterDOMReady',contentType:'external',moduleType:'module'}],additionalHead:[]}
for (const kind of ['detail','source']) {
 const title=`TEST ONLY: ${kind==='detail'?'Synthetic product reading layout':'Synthetic source record'}`
 const body=`<aside class="fci-limitations"><strong>TEST ONLY</strong><p>Synthetic visual fixture. No scientific evidence, measured value, source identity, or approval is represented.</p></aside><h2 id="scope">Scope and methods</h2><p>This fixture tests the shared reading columns and source-linked presentation. It is excluded from the public build and search.</p><h2 id="evidence">Evidence table layout</h2><table><caption>TEST ONLY synthetic table</caption><thead><tr><th>Source</th><th>Material and design</th><th>Analyte</th><th>Reported result</th><th>Basis</th><th>Limitation</th></tr></thead><tbody><tr><td><a href="#references">[1]</a></td><td>TEST ONLY synthetic material</td><td>TEST ONLY</td><td>No measured result</td><td>Not applicable</td><td>Layout testing only</td></tr></tbody></table><h2 id="uncertainty">What remains uncertain</h2><blockquote><p>This is a layout fixture. It establishes no scientific finding.</p></blockquote><h2 id="references">References</h2><ol><li>TEST ONLY. Synthetic reference placeholder, not a paper, DOI, author, or accepted source.</li></ol>`
 const fileData={slug:`test-only-${kind}`,filePath:'tests/fixtures/test-only.md',frontmatter:{title,type:kind==='source'?'source':'product-category',qa_fixture:true,draft:true},toc:[{text:'Scope and methods',slug:'scope',depth:1},{text:'Evidence table layout',slug:'evidence',depth:1},{text:'What remains uncertain',slug:'uncertainty',depth:1},{text:'References',slug:'references',depth:1}]}
 const props={cfg,fileData,externalResources:resources,tree:fromHtml(body,{fragment:true}),allFiles:[],children:[],ctx:{cfg:{configuration:cfg}}}
 const components={head:Head(),header:[TopNav()],beforeBody:[],pageBody:Content(),afterBody:[],left:[SectionNavigation()],right:[ReadingRail()],footer:Footer()}
 fs.mkdirSync('.quartz-cache/reading-fixtures',{recursive:true})
 fs.writeFileSync(`.quartz-cache/reading-fixtures/test-only-${kind}.html`,renderPage(cfg as any,fileData.slug as any,props as any,components,resources as any))
}
