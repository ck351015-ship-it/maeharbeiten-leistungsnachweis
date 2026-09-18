// Only explicit user clicks open a share destination; no recipient is preselected.
(() => {
  const toggle = document.querySelector('#share-draft');
  const panel = document.querySelector('#share-options');
  const nativeButton = document.querySelector('#share-native');
  const toolUrl = 'https://ck351015-ship-it.github.io/maeharbeiten-leistungsnachweis/';
  const text = 'Bitte die beigefügte Abnahmedokumentation prüfen und unterfertigen. Die Entwurfsdatei über „Entwurf öffnen“ laden: ' + toolUrl;
  nativeButton.hidden = !navigator.share || !navigator.canShare;
  toggle.onclick = () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  };
  let sharing = false;
  async function share(method) {
    if (sharing) return;
    let file;
    try { file = createDraftFile(); }
    catch (error) { showStatus('Entwurf konnte nicht geteilt werden. ' + error.message); return; }
    if (method === 'native') {
      if (!navigator.canShare?.({ files: [file] })) {
        showStatus('Dieses Gerät kann die Entwurfsdatei nicht direkt teilen. Bitte WhatsApp oder E-Mail wählen und die heruntergeladene Datei anhängen.');
        return;
      }
      sharing = true;
      nativeButton.disabled = true;
      try {
        await navigator.share({ files: [file], title: 'Abnahmedokumentation', text });
        // Sharing does not guarantee a local backup; retain the unsaved-change warning.
        showStatus('Entwurf an die Gerätefreigabe übergeben. Bitte den Versand in der gewählten App abschließen und bei Bedarf zusätzlich speichern.');
      } catch (error) {
        showStatus(error.name === 'AbortError' ? 'Teilen abgebrochen. Die Eingaben bleiben erhalten.' : 'Teilen nicht möglich. Bitte WhatsApp oder E-Mail wählen und die Entwurfsdatei als Anhang hinzufügen.');
      } finally { sharing = false; nativeButton.disabled = false; }
      return;
    }
    // mailto and WhatsApp links cannot attach local files. Download the same draft
    // and clearly ask the user to attach it, rather than sharing only the form URL.
    if (method === 'whatsapp') window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
    downloadDraftFile(file);
    if (method === 'email') window.location.href = 'mailto:?subject=' + encodeURIComponent('Abnahmedokumentation – Prüfung und Unterfertigung') + '&body=' + encodeURIComponent(text + '\n\nBitte die heruntergeladene JSON-Entwurfsdatei als Anhang hinzufügen.');
    showStatus('Entwurfsdatei heruntergeladen: ' + file.name + '. Bitte diese Datei in ' + (method === 'email' ? 'der E-Mail' : 'WhatsApp') + ' als Anhang hinzufügen; der Link allein enthält keine Eingaben.');
  }
  nativeButton.onclick = () => share('native');
  document.querySelector('#share-whatsapp').onclick = () => share('whatsapp');
  document.querySelector('#share-email').onclick = () => share('email');
})();
