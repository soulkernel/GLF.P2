import { normalizeFolio, restrictedDownload, validateRegistry, hashPDF } from "./registro.mjs";

const $ = id => document.getElementById(id);
const form = $("consulta");
const input = $("folio");
const status = $("estado");
const download = $("descarga");
const pick = $("pdf");
const result = $("resultado");
const box = $("cotejo");
const nameInput = $("nombre");
const rows = [...document.querySelectorAll("#participantes [data-folio]")];
const entries = new Map(rows.map(row => [row.dataset.folio, row.querySelector("a[download]")]));
const normalizeName = value => value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
const names = rows.map(row => [row, normalizeName(row.querySelector("strong").textContent)]);
const t = (es, en) => document.documentElement.lang === "en" ? en : es;
const statusNames = { revocado: "revoked", sustituido: "replaced", anulado: "voided" };
let active = null;
let seq = 0;
let statusText = ["Introduce el folio que figura junto al código QR.", "Enter the folio number shown next to the QR code."];
let resultText = ["", ""];

function updateStatus(...message) {
  statusText = message;
  status.textContent = t(...statusText);
}

function updateResult(...message) {
  resultText = message;
  result.textContent = t(...resultText);
}

function filterNames() {
  const terms = normalizeName(nameInput.value).trim().split(/\s+/).filter(Boolean);
  let matches = 0;
  for (const [row, name] of names) {
    const visible = terms.every(term => name.includes(term));
    row.hidden = !visible;
    if (visible) matches++;
  }
  $("conteo").textContent = matches === 0 ?
    t("No se encontraron certificados con ese nombre.", "No certificates match that name.") :
    matches === 1 ? t("1 certificado disponible", "1 certificate available") :
      t(`${matches} certificados disponibles`, `${matches} certificates available`);
}

function updateLanguage() {
  status.textContent = t(...statusText);
  result.textContent = t(...resultText);
  filterNames();
}

$("filtro-certificados").hidden = false;
nameInput.addEventListener("input", filterNames);
document.addEventListener("glf:language", updateLanguage);
updateLanguage();

async function lookup(event) {
  event?.preventDefault();
  const run = ++seq;
  active = null;
  download.hidden = true;
  download.removeAttribute("href");
  box.hidden = true;
  pick.value = "";
  updateResult("", "");
  const folio = normalizeFolio(input.value);
  if (!folio) {
    updateStatus("Escribe un folio con el formato IA-GLF-001.", "Enter a folio number in the format IA-GLF-001.");
    return;
  }
  input.value = folio;
  updateStatus("Consultando el registro…", "Checking the register…");
  try {
    const response = await fetch("./registro.json", { cache: "no-store" });
    if (!response.ok) throw Error("Unavailable");
    const records = validateRegistry(await response.json());
    if (run !== seq) return;
    const entry = records.get(folio);
    if (!entry) {
      if (records.size) updateStatus("No encontramos ese folio en el registro publicado.", "That folio number is not in the public register.");
      else updateStatus("Aún no hay certificados firmados habilitados para consulta o descarga.", "No signed certificates are available for lookup or download yet.");
      return;
    }
    if (entry.estado !== "emitido") {
      updateStatus(`Folio ${folio}: ${entry.estado}. No hay descarga disponible.`,
        `Folio ${folio}: ${statusNames[entry.estado]}. No download is available.`);
      return;
    }
    updateStatus(`Folio ${folio}: registrado como emitido.`, `Folio ${folio}: recorded as issued.`);
    active = entry;
    box.hidden = false;
    const listed = entries.get(folio);
    const url = listed?.href ?? restrictedDownload(entry.descarga);
    if (url) {
      download.href = url;
      download.toggleAttribute("download", Boolean(listed));
      download.hidden = false;
    }
  } catch {
    if (run === seq) updateStatus("El registro no se pudo consultar. Intenta más tarde.", "The register is unavailable. Try again later.");
  }
}

form.addEventListener("submit", lookup);
pick.addEventListener("change", async () => {
  const file = pick.files[0];
  const entry = active;
  updateResult("", "");
  if (!file || !entry) return;
  try {
    if (file.size > 30 * 1024 * 1024) throw Error("File too large");
    const sha = await hashPDF(await file.arrayBuffer());
    if (active !== entry || pick.files[0] !== file) return;
    if (sha === entry.sha256) updateResult("El archivo coincide con el PDF registrado para este folio.", "The file matches the PDF on record for this folio.");
    else updateResult("Este archivo no coincide con el PDF registrado para este folio.", "This file does not match the PDF on record for this folio.");
  } catch {
    if (active !== entry || pick.files[0] !== file) return;
    if (!globalThis.crypto?.subtle) updateResult("Esta comprobación requiere una conexión HTTPS o localhost.", "This check requires HTTPS or localhost.");
    else updateResult("Selecciona un PDF válido de hasta 30 MB.", "Select a valid PDF up to 30 MB.");
  }
});

const supplied = new URLSearchParams(location.search).get("folio");
if (supplied) {
  input.value = supplied;
  lookup();
}
