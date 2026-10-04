#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const root=process.cwd();
const files=fs.readdirSync(root).filter(f=>f.endsWith(".html"));
const errors=[];
const check=(label,fn)=>{try{fn()}catch(e){errors.push(label+": "+e.message)}};

for(const file of files){
  const src=fs.readFileSync(path.join(root,file),"utf8");
  // Basic HTML integrity checks that catch common broken-page edits.
  check(file+" HTML",()=>{
    if(!/^<!doctype html>/i.test(src.trimStart())) throw new Error("missing <!doctype html>");
    // Keep HTML validation conservative: browsers repair malformed nesting, while
    // the deployment-critical checks below validate JavaScript and duplicate IDs.
    const ids=[...src.matchAll(/\bid=["']([^"']+)["']/gi)].map(x=>x[1]);
    const dup=ids.filter((id,i)=>ids.indexOf(id)!==i);
    if(dup.length) throw new Error("duplicate id(s): "+[...new Set(dup)].join(", "));
  });

  // Parse every inline JavaScript block with Node before deployment.
  let n=0;
  for(const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    const attrs=m[1]||"", code=m[2]||"";
    if(/\bsrc\s*=/.test(attrs)||!code.trim()) continue;
    n++;
    const tmp=path.join(root,".wow-inline-"+process.pid+"-"+n+".mjs");
    fs.writeFileSync(tmp,code);
    try{execFileSync(process.execPath,["--check",tmp],{stdio:"pipe"})}
    catch(e){errors.push(file+" inline JS #"+n+": "+(e.stderr?.toString()||e.message).trim())}
    finally{try{fs.unlinkSync(tmp)}catch{}}
  }
}

for(const file of fs.readdirSync(root).filter(f=>f.endsWith(".js"))){
  check(file+" JavaScript",()=>execFileSync(process.execPath,["--check",file],{stdio:"pipe"}));
}

// Targeted integration guards for the bugs we have already found.
const category=fs.readFileSync(path.join(root,"category.html"),"utf8");
const cart=fs.readFileSync(path.join(root,"shared-cart.js"),"utf8");
if(!category.includes('id="shopTitle"')) errors.push("category.html: missing dynamic shop title");
if(!category.includes('titleEl.textContent')) errors.push("category.html: selected category title update missing");
if(!category.includes('applyProductFilters()')) errors.push("category.html: catalog load/filter integration guard missing");
if(!cart.includes('window.location.href="./index.html?openCheckout=1"')) errors.push("shared-cart.js: canonical checkout redirect missing");
if(!cart.includes('Number.isInteger(Number(x.i))&&ps[Number(x.i)]')) errors.push("shared-cart.js: legacy index cart migration missing");
if(!cart.includes('function checkout(){const a=available()')) errors.push("shared-cart.js: unified checkout handler missing");
const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
if(!home.includes('wireCheckoutValidation();if(city&&city.value)loadCheckoutAreas(city.value)')) errors.push("index.html: canonical checkout area wiring missing");

if(errors.length){
  console.error("\nWOW SITE CHECK FAILED\n- "+errors.join("\n- "));
  process.exit(1);
}
console.log("WOW SITE CHECK PASSED: "+files.length+" HTML files + JavaScript syntax + integration guards verified.");
