import {normalizeFolio,restrictedDownload,validateRegistry,hashPDF} from "./registro.mjs";
const $=id=>document.getElementById(id);
const form=$("consulta"),input=$("folio"),status=$("estado"),download=$("descarga"),pick=$("pdf"),result=$("resultado"),box=$("cotejo");
let active=null,seq=0;
async function lookup(event){
 event?.preventDefault();const run=++seq;
 active=null;download.hidden=true;download.removeAttribute("href");box.hidden=true;result.textContent="";pick.value="";
 const folio=normalizeFolio(input.value);
 if(!folio){status.textContent="Escribe un folio con el formato IA-GLF-001.";return;}
 input.value=folio;status.textContent="Consultando el registro…";
 try{
  const response=await fetch("./registro.json",{cache:"no-store"});if(!response.ok)throw Error("No disponible");
  const records=validateRegistry(await response.json());if(run!==seq)return;
  const r=records.get(folio);
  if(!r){status.textContent=records.size?"No encontramos ese folio en el registro publicado.":"Aún no hay certificados firmados habilitados para consulta o descarga.";return;}
  if(r.estado!=="emitido"){status.textContent=`Folio ${folio}: ${r.estado}. No hay descarga disponible.`;return;}
  status.textContent=`Folio ${folio}: registrado como emitido.`;
  active=r;box.hidden=false;
  const url=restrictedDownload(r.descarga);
  if(url){download.href=url;download.hidden=false;}
 }catch{if(run===seq)status.textContent="El registro no se pudo consultar. Intenta más tarde.";}
}
form.addEventListener("submit",lookup);
pick.addEventListener("change",async()=>{
 const file=pick.files[0],r=active;result.textContent="";if(!r||!file)return;
 try{if(file.size>30*1024*1024)throw Error("Selecciona un PDF válido de hasta 30 MB.");const sha=await hashPDF(await file.arrayBuffer());if(active===r&&pick.files[0]===file)result.textContent=sha===r.sha256?"El archivo coincide con el PDF registrado para este folio.":"Este archivo no coincide con el PDF registrado para este folio.";}
 catch(e){if(active===r&&pick.files[0]===file)result.textContent=e.message;}
});
const supplied=new URLSearchParams(location.search).get("folio");
if(supplied){input.value=supplied;lookup();}
