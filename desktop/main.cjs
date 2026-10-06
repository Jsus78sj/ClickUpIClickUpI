"use strict";
const {app,BrowserWindow,protocol,shell,Menu,session}=require("electron");
const path=require("path");
const fs=require("fs");

const ROOT=path.join(__dirname,"app");
const ORIGIN="app://civildraft";
const MIME={
 ".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",
 ".json":"application/json; charset=utf-8",".svg":"image/svg+xml",
 ".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",
 ".gif":"image/gif",".ico":"image/x-icon",".txt":"text/plain; charset=utf-8",
 ".woff":"font/woff",".woff2":"font/woff2",".ttf":"font/ttf"
};

protocol.registerSchemesAsPrivileged([{
 scheme:"app",
 privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}
}]);

if(!app.requestSingleInstanceLock()){app.quit()}

let win=null;

function serve(req){
 let p;
 try{p=decodeURIComponent(new URL(req.url).pathname)}
 catch(e){return new Response("bad request",{status:400})}
 if(p==="/"||p==="")p="/index.html";
 /* لا عاملَ خدمة داخل التطبيق: الملفّات محلّيةٌ أصلاً */
 if(p==="/sw.js")return new Response("",{status:404});
 const full=path.normalize(path.join(ROOT,p));
 if(full!==ROOT&&!full.startsWith(ROOT+path.sep))
  return new Response("forbidden",{status:403});
 try{
  const buf=fs.readFileSync(full);
  const type=MIME[path.extname(full).toLowerCase()]||"application/octet-stream";
  return new Response(buf,{status:200,headers:{
   "Content-Type":type,
   "Cache-Control":"no-cache",
   "X-Content-Type-Options":"nosniff"
  }});
 }catch(e){
  return new Response("not found",{status:404});
 }
}

function createWindow(){
 win=new BrowserWindow({
  width:1440,height:900,minWidth:900,minHeight:600,
  show:false,backgroundColor:"#0f172a",
  title:"CivilDraft",
  icon:path.join(__dirname,"build","icon.png"),
  autoHideMenuBar:true,
  webPreferences:{
   contextIsolation:true,nodeIntegration:false,sandbox:true,
   spellcheck:false
  }
 });
 win.once("ready-to-show",()=>{win.maximize();win.show()});
 win.loadURL(ORIGIN+"/index.html");

 /* الروابط الخارجية تُفتح في المتصفّح الافتراضي لا داخل التطبيق */
 win.webContents.setWindowOpenHandler(({url})=>{
  if(/^https?:\/\//i.test(url))shell.openExternal(url);
  return {action:"deny"};
 });
 win.webContents.on("will-navigate",(e,url)=>{
  if(!url.startsWith(ORIGIN)){
   e.preventDefault();
   if(/^https?:\/\//i.test(url))shell.openExternal(url);
  }
 });
 /* F11 ملء الشاشة · F12 أدوات المطوّر · Ctrl+0/+/- تكبير */
 win.webContents.on("before-input-event",(e,i)=>{
  if(i.type!=="keyDown")return;
  const wc=win.webContents;
  if(i.key==="F11"){win.setFullScreen(!win.isFullScreen());e.preventDefault()}
  else if(i.key==="F12"){wc.toggleDevTools();e.preventDefault()}
  else if(i.control&&i.key==="0"){wc.setZoomLevel(0);e.preventDefault()}
  else if(i.control&&(i.key==="="||i.key==="+")){wc.setZoomLevel(wc.getZoomLevel()+0.5);e.preventDefault()}
  else if(i.control&&i.key==="-"){wc.setZoomLevel(wc.getZoomLevel()-0.5);e.preventDefault()}
 });
 win.on("closed",()=>{win=null});
}

app.whenReady().then(()=>{
 protocol.handle("app",serve);
 Menu.setApplicationMenu(null);
 const ALLOW=new Set(["clipboard-sanitized-write","clipboard-read","fullscreen","fileSystem"]);
 session.defaultSession.setPermissionRequestHandler((wc,perm,cb)=>cb(ALLOW.has(perm)));
 session.defaultSession.setPermissionCheckHandler((wc,perm)=>ALLOW.has(perm));
 createWindow();
 app.on("activate",()=>{if(!BrowserWindow.getAllWindows().length)createWindow()});
});
app.on("second-instance",()=>{
 if(win){if(win.isMinimized())win.restore();win.focus()}
});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
