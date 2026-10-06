"use strict";
/* ينسخ ملفّات الويب من جذر المشروع إلى desktop/app (بلا الاختبارات والتوثيق) */
const fs=require("fs"),path=require("path");
const SRC=path.join(__dirname,"..");
const OUT=path.join(__dirname,"app");
fs.rmSync(OUT,{recursive:true,force:true});
fs.mkdirSync(OUT,{recursive:true});
fs.mkdirSync(path.join(__dirname,"build"),{recursive:true});

const SKIP=new Set(["tests"]);
let n=0;
function copyDir(rel,exts){
 const from=path.join(SRC,rel);
 if(!fs.existsSync(from))return;
 for(const name of fs.readdirSync(from)){
  const r=rel+"/"+name,full=path.join(SRC,r);
  if(fs.statSync(full).isDirectory()){
   if(SKIP.has(name))continue;
   copyDir(r,exts);
  }else if(exts.test(name)){
   const to=path.join(OUT,r);
   fs.mkdirSync(path.dirname(to),{recursive:true});
   fs.copyFileSync(full,to);n++;
  }
 }
}
for(const f of ["index.html","manifest.json","favicon.ico","favicon.svg","apple-touch-icon.png"]){
 const s=path.join(SRC,f);
 if(fs.existsSync(s)){fs.copyFileSync(s,path.join(OUT,f));n++}
}
copyDir("css",/\.css$/);
copyDir("icons",/\.(png|svg)$/);
copyDir("js",/\.js$/);
fs.copyFileSync(path.join(SRC,"icons","icon-512.png"),path.join(__dirname,"build","icon.png"));
console.log("copied "+n+" files -> desktop/app");
