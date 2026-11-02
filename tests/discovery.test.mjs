import { test } from "node:test"
import assert from "node:assert/strict"
import { evaluateCandidate, findingIssue, sourceReviewIssue } from "../tools/lib/discovery.mjs"
import { publicationContext } from "../tools/lib/wiki.mjs"
import { isPublicWikiRecord } from "../tools/lib/source-publication.mjs"
// All records and approvals below are SYNTHETIC TEST FIXTURES, not real evidence.
const policy = {version:"SYNTHETIC-TEST-POLICY",review_state:"approved",profile_publication_enabled:true,minimum_families:{ingredient:3,product:2,analyte:2}}
const candidate = () => ({type:"product-category",type_verified:true,overlap_status:"clear",identity_verified:true,scope_id:"synthetic-tub",review_state:"approved_for_public",question_coverage:"reviewed",review_record:{id:"SYNTHETIC-TEST",policy_version:policy.version}})
const row = () => ({scope_id:"synthetic-tub",destination_type:"product",analyte:"synthetic-pfas",value:"synthetic-result",unit:"synthetic-unit",basis:"synthetic-basis",source_location:"synthetic-table",statistic:"reported",method:"synthetic-method",matrix_fit:"exact",format_fit:"exact",measurement_kind:"targeted-pfas",evidence_kind:"occurrence",result_status:"quantified"})
const source = family => ({type:"source",evidence_tier:"A",source_type:"primary_measurement",evidence_family:family,title:"Synthetic source",authors:["Synthetic author"],year:2000,publication:"Synthetic fixture",access_url:"https://example.invalid/source",no_doi_assigned:true,identity_verified:true,provenance_verified:true,sha256:"a".repeat(64),review_state:"approved_for_public",review_record:{id:"SYNTHETIC-TEST",disposition:"approved_for_public",source_sha256:"a".repeat(64)},findings:[row()]})

test("default proposed policy prevents READY even with synthetic matching evidence",()=>{
 const r=evaluateCandidate(candidate(),[source("a"),source("b")]); assert.equal(r.status,"NEEDS-EVIDENCE"); assert.match(r.reason,/policy/)
})
test("synthetic accepted policy exercises product and ingredient family boundaries",()=>{
 assert.equal(evaluateCandidate(candidate(),[source("a")],policy).status,"NEEDS-EVIDENCE")
 assert.equal(evaluateCandidate(candidate(),[source("a"),source("b")],policy).status,"READY")
 const c={...candidate(),type:"ingredient"}, ss=["a","b","c"].map(f=>{const s=source(f);s.findings[0].destination_type="ingredient";return s})
 assert.equal(evaluateCandidate(c,ss.slice(0,2),policy).status,"NEEDS-EVIDENCE");assert.equal(evaluateCandidate(c,ss,policy).status,"READY")
})
test("duplicate-cohort papers count once and citation/review/context records count zero",()=>{
 assert.equal(evaluateCandidate(candidate(),[source("cohort"),source("cohort")],policy).families.length,1)
 for(const kind of ["review","method_context","citation_only"]){const s=source("b");s.source_type=kind;assert.equal(evaluateCandidate(candidate(),[source("a"),s],policy).status,"NEEDS-EVIDENCE")}
})
test("different food, format, ingredient or method result cannot satisfy a product gate",()=>{
 for(const mutation of [{scope_id:"synthetic-milk"},{destination_type:"ingredient"},{format_fit:"partial"},{matrix_fit:"unknown"},{evidence_kind:"migration"},{measurement_kind:"total-fluorine"},{result_status:"reporting-limit"}]){
  const s=source("b");Object.assign(s.findings[0],mutation);assert.equal(evaluateCandidate(candidate(),[source("a"),s],policy).status,"NEEDS-EVIDENCE",JSON.stringify(mutation))
 }
})
test("HOLD, draft, pending, unreviewed and wrong-hash records stay private independently",()=>{
 for(const change of [{confidence:"HOLD"},{draft:true},{draft:"true"},{evidence_tier:"pending"},{status:"tier1-stub"},{review_state:"machine_extracted"},{identity_verified:false},{provenance_verified:false},{review_record:{id:"SYNTHETIC",disposition:"approved_for_public",source_sha256:"b".repeat(64)}}]){
  const s={...source("b"),...change};assert.ok(sourceReviewIssue(s));assert.equal(isPublicWikiRecord(s,"sources/synthetic"),false);assert.equal(evaluateCandidate(candidate(),[source("a"),s],policy).status,"NEEDS-EVIDENCE")
 }
})
test("a metadata label does not clear profile type, overlap, review or identity checks",()=>{
 for(const change of [{type_verified:false},{overlap_status:"unknown"},{alias_of:"another"},{identity_verified:false},{question_coverage:"pending"},{review_state:"machine_extracted"},{review_record:{id:"SYNTHETIC",policy_version:"wrong"}}]) assert.notEqual(evaluateCandidate({...candidate(),...change},[source("a"),source("b")],policy).status,"READY")
})
test("aggregate definition and non-detect semantics stay explicit",()=>{
 assert.ok(findingIssue({...row(),measurement_kind:"defined-organic-fluorine"}));assert.equal(findingIssue({...row(),measurement_kind:"defined-organic-fluorine",analyte:"total-organic-fluorine",aggregate_definition:"synthetic explicit target definition"}),null)
 assert.ok(findingIssue({...row(),result_status:"quantified",value:"<LOQ"}));assert.ok(findingIssue({...row(),measurement_kind:"targeted-pfas",analyte:"total-organic-fluorine"}));assert.ok(findingIssue({...row(),result_status:"non-detect",value:"0.00",censoring:"below LOQ"}));assert.ok(findingIssue({...row(),result_status:"non-detect"}));assert.equal(findingIssue({...row(),result_status:"non-detect",value:"<LOQ",censoring:"source-reported below LOQ"}),null)
})
test("private path cannot be published by copied approved metadata",()=>{
 const s=source("a");assert.equal(isPublicWikiRecord(s,"sources/synthetic"),true)
 for(const slug of ["drafts/sources/synthetic","private/synthetic","raw/synthetic","workbench/synthetic"]) assert.equal(isPublicWikiRecord(s,slug),false)
 assert.equal(isPublicWikiRecord({type:"reference"},"invented-public-route"),false)
 assert.equal(isPublicWikiRecord({type:"section-index"},"products/index"),true)
})

test("private source metadata cannot contribute a production family",()=>{
 const s=source("a"),context=publicationContext([{slug:"drafts/source",data:s},{slug:"sources/pending",data:{...s,confidence:"HOLD"}},{slug:"sources/reviewed",data:source("b")}]);assert.deepEqual(context.sources.map(s=>s.evidence_family),["b"])
})
test("a held profile cannot become READY under synthetic accepted policy",()=>{
 for(const change of [{confidence:"HOLD"},{draft:true},{status:"scaffold"},{evidence_tier:"pending"}])assert.equal(evaluateCandidate({...candidate(),...change},[source("a"),source("b")],policy).status,"NEEDS-EVIDENCE")
})
