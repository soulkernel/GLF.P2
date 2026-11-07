# Consulta de certificados

Esta página pública no almacena nombres ni originales para firma. El QR apunta a esta ruta con el parámetro `folio`. El registro permanece vacío hasta incorporar certificados efectivamente firmados.

Después de recibir los PDF firmados: verificar la firma electrónica, comprobar el folio y la identidad en el registro privado, calcular el SHA-256 del PDF final sin volver a guardarlo, y añadir únicamente `folio`, `estado: "emitido"`, `sha256` y, si corresponde, `descarga` (URL de Drive con acceso restringido al destinatario). No subir PDF nominales ni identificaciones al repositorio. Estados de baja: `revocado`, `sustituido` o `anulado`, sin datos de descarga. Un folio registrado y una huella coincidente no sustituyen la validación independiente de la firma.
