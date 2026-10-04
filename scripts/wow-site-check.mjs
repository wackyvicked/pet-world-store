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
    const stack=[];
    const voids=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
    // Tokenize tags while respecting quoted attributes and ignoring script/style bodies.
    let i=0;
    while(i<src.length){
      const lt=src.indexOf("<",i); if(lt<0) break;
      const rest=src.slice(lt);
      if(/^<!--/.test(rest)){const end=src.indexOf("-->",lt+4);i=end<0?src.length:end+3;continue;}
      const sm=/^<script\b/i.test(rest), stm=/^<style\b/i.test(rest);
      if(sm||stm){
        const tagName=sm?"script":"style",openEnd=rest.indexOf(">");
        if(openEnd<0)break;
        const closeRe=new RegExp("</"+tagName+"\\s*>","i");
        const cm=closeRe.exec(rest.slice(openEnd+1));
        i=cm?lt+openEnd+1+cm.index+cm[0].length:src.length; continue;
      }
      let j=lt+1,quote=null;
      for(;j<src.length;j++){const c=src[j];if(quote){if(c===quote)quote=null}else if(c==="\""||c==="'")quote=c;else if(c===">")break;}
      if(j>=src.length)break;
      const raw=src.slice(lt,j+1),tm=/^<\/?([a-zA-Z][\w:-]*)/.exec(raw);
      if(!tm){i=j+1;continue;}
      const tag=tm[1].toLowerCase();
      if(voids.has(tag)||/^<\!/.test(raw)||/^<\?/.test(raw)){i=j+1;continue;}
      if(/^<\//.test(raw)){const expected=stack.pop();if(expected!==tag)throw new Error("mismatched closing tag </"+tag+"> (expected </"+(expected||"?")+">)");}
      else if(!/\/\s*>$/.test(raw))stack.push(tag);
      i=j+1;
    }
    if(stack.length) throw new Error("unclosed tag <"+stack.at(-1)+">");
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
if(!cart.includes('window.location.href="./index.html?openCheckout=1"')) errors.push("shared-cart.js: canonical checkout fallback missing");
const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
if(!home.includes('wireCheckoutValidation();if(city&&city.value)loadCheckoutAreas(city.value)')) errors.push("index.html: canonical checkout area wiring missing");

if(errors.length){
  console.error("\nWOW SITE CHECK FAILED\n- "+errors.join("\n- "));
  process.exit(1);
}
console.log("WOW SITE CHECK PASSED: "+files.length+" HTML files + JavaScript syntax + integration guards verified.");
