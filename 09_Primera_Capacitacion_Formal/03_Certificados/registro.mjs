const folioRE=/^IA-GLF-\d{3,6}$/;
const hashRE=/^[a-f0-9]{64}$/;
const statuses=new Set(["emitido","revocado","sustituido","anulado"]);
export function normalizeFolio(value){const x=String(value??"").trim().toUpperCase();return folioRE.test(x)?x:null;}
export function restrictedDownload(value){
 if(typeof value!=="string")return null;
 try{const u=new URL(value);if(u.origin!=="https://drive.google.com"||u.username||u.password||u.search||u.hash||!/^\/file\/d\/[a-zA-Z0-9_-]{10,}\/view$/.test(u.pathname))return null;return u.href;}
 catch{return null;}
}
export function validateRegistry(data){
 if(!data||data.version!==1||!Array.isArray(data.certificados)||Object.keys(data).some(k=>!["version","certificados"].includes(k)))throw Error("Registro no válido");
 const result=new Map();
 for(const r of data.certificados){
  if(!r||normalizeFolio(r.folio)!==r.folio||!statuses.has(r.estado)||result.has(r.folio)||Object.keys(r).some(k=>!["folio","estado","sha256","descarga"].includes(k)))throw Error("Registro no válido");
  if(r.estado==="emitido"&&(!hashRE.test(r.sha256??"")||("descarga" in r&&!restrictedDownload(r.descarga))))throw Error("Registro emitido no válido");
  if(r.estado!=="emitido"&&("descarga" in r||"sha256" in r))throw Error("Un registro no vigente no debe ofrecer archivo");
  result.set(r.folio,r);
 }
 return result;
}
export async function hashPDF(buffer,crypto=globalThis.crypto){
 const bytes=new Uint8Array(buffer);
 if(bytes.length>30*1024*1024||bytes.length<5||String.fromCharCode(...bytes.slice(0,5))!=="%PDF-")throw Error("Selecciona un PDF válido de hasta 30 MB.");
 if(!crypto?.subtle)throw Error("Esta comprobación requiere una conexión HTTPS o localhost.");
 return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buffer)),x=>x.toString(16).padStart(2,"0")).join("");
}
