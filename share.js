// Build a complete MIME email locally. No draft content is uploaded or sent.
function emailBase64(bytes) {
  // Chunks divisible by three avoid intermediate base64 padding and large spreads.
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 24576) {
    chunks.push(btoa(String.fromCharCode(...bytes.subarray(offset, offset + 24576))));
  }
  return chunks.join('').match(/.{1,76}/g)?.join('\r\n') || '';
}
async function buildDraftEmail(file) {
  const boundary = 'viadonau-' + crypto.randomUUID();
  const alternativeBoundary = boundary + '-body';
  const filename = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const body = 'Anbei übersende ich Ihnen eine Abnahmedokumentation zur Streckenpflege mit der Bitte um finale Unterfertigung und um Übermittlung des unterfertigten PDF.\r\n\r\nDie Entwurfsdatei über „Entwurf öffnen“ laden: https://ck351015-ship-it.github.io/maeharbeiten-leistungsnachweis/';
  const htmlBody = '<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#000"><p>Anbei übersende ich Ihnen eine Abnahmedokumentation zur Streckenpflege mit der Bitte um finale Unterfertigung und um Übermittlung des unterfertigten PDF.</p><p>Die Entwurfsdatei über „Entwurf öffnen“ laden: <a href="https://ck351015-ship-it.github.io/maeharbeiten-leistungsnachweis/">https://ck351015-ship-it.github.io/maeharbeiten-leistungsnachweis/</a></p></body></html>';
  const attachment = emailBase64(new Uint8Array(await file.arrayBuffer()));
  const content = [
    'X-Unsent: 1',
    'To: ',
    'Subject: Abnahmedokumentation Streckenpflege - Unterfertigung',
    'Date: ' + new Date().toUTCString(),
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: multipart/alternative; boundary="' + alternativeBoundary + '"',
    '',
    '--' + alternativeBoundary,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    emailBase64(new TextEncoder().encode(body)),
    '--' + alternativeBoundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    emailBase64(new TextEncoder().encode(htmlBody)),
    '--' + alternativeBoundary + '--',
    '--' + boundary,
    'Content-Type: application/json; name="' + filename + '"',
    'Content-Transfer-Encoding: base64',
    'Content-Disposition: attachment; filename="' + filename + '"',
    '',
    attachment,
    '--' + boundary + '--',
    ''
  ].join('\r\n');
  return new File([content], filename.replace(/\.json$/i, '') + '.eml', { type: 'message/rfc822' });
}
(() => {
  const button = document.querySelector('#share-draft');
  let busy = false;
  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    button.disabled = true;
    try {
      const file = createDraftFile();
      const email = await buildDraftEmail(file);
      const url = URL.createObjectURL(email);
      const link = document.createElement('a');
      link.href = url;
      link.download = email.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showStatus('E-Mail-Datei (.eml) mit JSON-Anhang heruntergeladen. Im Mailprogramm öffnen, Empfänger ergänzen und senden. Falls sie nur als Nachricht angezeigt wird, dort „Weiterleiten“ wählen; der Anhang bleibt enthalten.');
    } catch (error) {
      showStatus('E-Mail-Datei konnte nicht erstellt werden. ' + error.message + ' Die Eingaben bleiben erhalten.');
    } finally { busy = false; button.disabled = false; }
  });
})();
