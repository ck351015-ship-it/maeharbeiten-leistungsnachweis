const serviceOptions = ["Kilometerzeichen Ausmähen","Hektometerzeichen Ausmähen","Schifffahrtszeichen Ausmähen","Fixpunkte Ausmähen","Reinigen Hektometer","Reinigen Kilometerzeichen","Reinigen Fixpunkte","Reinigen Schifffahrtszeichen","Streichen HM-Zeichen","Streichen Fixpunkte","Streichen Kilometerzeichen","Streichen Schifffahrtszeichen SÄULE","Reinigen + Streichen Heftpoller","Sichtfenster Hektometer","Sichtfenster Kilometerzeichen","Sichtfenster Schifffahrtszeichen","Sichtfenster Fixpunkte","Ländenböschungen 3x jährlich mulchen","Dämme 2x jährlich mulchen VHP/via 50/50 (Melk)","Dämme 2x jährlich mulchen via","Dämme 2x jährlich mulchen via / VHP Oh, Abw, Wall","Dämme 2x jährlich mähen VHP Melk / via 50/50","Dämme 2x jährlich mähen via","Dämme 2x jährlich mähen via (VHP Wall)","Ökologische Flächen 2x mähen","Mähgut von Fläche entfernen VHP Melk / via 50/50","Mähgut von Fläche entfernen via","Mähgut von Fläche entfernen via (VHP Wall)","Mähgut entsorgen VHP Melk / via 50/50","Mähgut entsorgen via","Mähgut entsorgen via (VHP Wall)","Bankettstreifen 1. Mahd","Bankettstreifen Zwischenmahd","Bankettstreifen 2. Mahd","Herstellen Lichtraumprofil"];
// Retain historical wording when reopening signed drafts.
const legacyServiceOptions = ["Kilometerzeichen Sichtfenster","Hektometerzeichen Sichtfenster","Schifffahrtszeichen Sichtfenster","Fixpunkte Sichtfenster"];
function quantityUnit(service) {
  if (service === 'Streichen Schifffahrtszeichen SÄULE') return 'Stück';
  if (service.startsWith('Mähgut entsorgen ')) return 'Tonnen';
  return '';
}
const form = document.querySelector('#delivery-form');
const rows = document.querySelector('#sections');
const template = document.querySelector('#section-row-template');

function addRow(values = {}) {
  if (rows.children.length >= 200) {
    showStatus('Maximal 200 Zeilen pro Abnahmedokumentation.');
    return;
  }
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector('tr');
  const selections = values.services || (values.service ? [values.service] : []);
  for (const service of selections) {
    if (legacyServiceOptions.includes(service)) {
      const option = new Option(service, service);
      row.querySelector('[name="service[]"]').append(option);
    }
  }
  for (const name of ['area', 'completed', 'interimArea']) {
    row.querySelector(`[name="${name}[]"]`).value = values[name] || '';
  }
  row.serviceDropdown = setupServiceDropdown(row, values);
  row.querySelector('.delete-row').addEventListener('click', () => {
    invalidateSignatures('both');
    row.remove();
    if (!rows.children.length) addRow();
  });
  rows.append(fragment);
  return row;
}

function setupSignature(canvas) {
  const wrapper = canvas.closest('.signature-pad');
  const context = canvas.getContext('2d');
  let drawing = false;
  let ink = false;

  // A fixed drawing coordinate system prevents print/viewport changes
  // from resampling or stretching an existing signature.
  canvas.width = 1000;
  canvas.height = 250;
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#17333a';

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  }

  canvas.addEventListener('pointerdown', event => {
    dirty = true;
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
    context.lineTo(p.x + 0.1, p.y);
    context.stroke();
    ink = true;
    wrapper.classList.add('has-ink');
  });

  canvas.addEventListener('pointermove', event => {
    if (!drawing) return;
    const p = point(event);
    context.lineTo(p.x, p.y);
    context.stroke();
    ink = true;
    wrapper.classList.add('has-ink');
  });

  canvas.addEventListener('pointerup', () => {
    drawing = false;
    wrapper.querySelector('.signature-print').src = canvas.toDataURL('image/png');
  });
  canvas.addEventListener('pointercancel', () => { drawing = false; });


  return {
    export() { return ink ? canvas.toDataURL('image/png') : null; },
    restore(image) {
      this.clear();
      if (!image) return;
      context.drawImage(image, 0, 0);
      ink = true;
      wrapper.classList.add('has-ink');
      wrapper.querySelector('.signature-print').src = canvas.toDataURL('image/png');
    },
    clear() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      ink = false;
      wrapper.classList.remove('has-ink');
      wrapper.querySelector('.signature-print').src = canvas.toDataURL('image/png');
    }
  };
}

const signaturePads = new Map();
document.querySelectorAll('canvas').forEach(canvas => signaturePads.set(canvas.id, setupSignature(canvas)));

document.querySelectorAll('[data-clear-signature]').forEach(button => {
  button.addEventListener('click', () => { signaturePads.get(button.dataset.clearSignature).clear(); dirty = true; });
});

document.querySelector('#add-row').addEventListener('click', () => { invalidateSignatures('both'); addRow(); });

document.querySelector('#reset-form').addEventListener('click', () => {
  if (!window.confirm('Alle Eingaben, Fotos und Unterschriften verwerfen?')) return;
  form.reset();
  photoManager.restore({});
  rows.replaceChildren();
  signaturePads.forEach(pad => pad.clear());
  addRow();
  setDefaultDates();
  draftId = crypto.randomUUID();
  dirty = false;
  showStatus('Neue Abnahmedokumentation angelegt.');
});

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  ['mrDate', 'vdDate'].forEach(name => {
    const input = form.elements[name];
    if (!input.value) input.value = today;
  });
}

function preparePrintSignatures() {
  photoManager.preparePrint(form.elements, draftId);
  document.querySelectorAll('.print-value').forEach(node => node.remove());
  document.querySelectorAll('.sheet input, .sheet select, .sheet textarea').forEach(field => {
    if (['additionalNotes', 'vdComment'].includes(field.name) || field.hidden || field.closest('[hidden], .no-print')) return;
    const value = document.createElement('span');
    value.className = 'print-value';
    if (field.name === 'service[]') value.classList.add('print-service');
    if (field.name === 'area[]') value.classList.add('print-area');
    if (field.name === 'completed[]') value.classList.add('print-completed');
    let text = field.tagName === 'SELECT' && field.value
      ? field.selectedOptions[0].textContent
      : field.value;
    if (field.type === 'date' && text) text = text.split('-').reverse().join('.');
    value.textContent = text || '________________';
    field.after(value);
  });
  document.querySelector('#vd-comment-print').textContent = form.elements.vdComment.value || '–';
  document.querySelector('#additional-notes-print').textContent = form.elements.additionalNotes.value || '–';
  document.querySelectorAll('.signature-pad').forEach(pad => {
    const canvas = pad.querySelector('canvas');
    const image = pad.querySelector('.signature-print');
    image.src = canvas.toDataURL('image/png');
  });
}

window.addEventListener('beforeprint', preparePrintSignatures);

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (photoManager.isBusy()) { showStatus('Bitte warten, bis die Fotos verarbeitet sind.'); return; }
  const contract = [form.elements.contract.value, form.elements.year.value].filter(Boolean).join('_');
  document.title = `Leistungsbestaetigung_Streckenpflegearbeiten_${contract || 'Entwurf'}`.replace(/[^a-zA-Z0-9_-]+/g, '_');
  preparePrintSignatures();
  await Promise.allSettled(Array.from(document.querySelectorAll('.signature-print, .document-logos img, #photo-appendix img'), image => image.decode()));
  window.print();
});

addRow();
setDefaultDates();

// Draft files are local handoffs, not a shared database or verified signatures.
let draftId = crypto.randomUUID();
let dirty = false;
const masterNames = ['contractor', 'contract', 'year', 'additionalNotes', 'vdComment', 'cycle', 'periodFrom', 'periodTo', 'mrName', 'mrDate', 'vdName', 'vdDate'];
const legacySectionNames = ['area', 'completed', 'status', 'note', 'followUp'];
const versionThreeSectionNames = [...legacySectionNames, 'service', 'quantity', 'interimArea'];
const sectionNames = ['area', 'completed', 'service', 'quantity', 'interimArea'];
const signatureIds = ['mr-signature', 'vd-signature'];
function showStatus(message) { document.querySelector('#draft-status').textContent = message; }
function invalidateSignatures(who) {
  dirty = true;
  const ids = who === 'both' ? signatureIds : [who + '-signature'];
  let removed = false;
  ids.forEach(id => {
    const pad = signaturePads.get(id);
    if (pad.export()) { pad.clear(); removed = true; }
  });
  if (removed) showStatus('Bestätigte Angaben geändert: Die betroffenen Unterschriften wurden gelöscht. Bitte erneut bestätigen.');
}
function fieldChanged(event) {
  const name = event.target.name;
  if (!name) return;
  const controls = ['vdComment', 'vdName', 'vdDate'];
  invalidateSignatures(controls.includes(name) ? 'vd' : 'both');
}
form.addEventListener('input', fieldChanged);
form.addEventListener('change', fieldChanged);
window.addEventListener('beforeunload', event => {
  if (dirty) { event.preventDefault(); event.returnValue = ''; }
});
function collectDraft() {
  return {
    format: 'viadonau-maeharbeiten', version: 8, id: draftId,
    ...photoManager.export(),
    savedAt: new Date().toISOString(),
    fields: Object.fromEntries(masterNames.map(name => [name, form.elements[name].value])),
    sections: Array.from(rows.children, row => ({
      ...Object.fromEntries(['area', 'completed', 'interimArea'].map(name => [name, row.querySelector(`[name="${name}[]"]`).value])),
      ...row.serviceDropdown.export()
    })),
    signatures: Object.fromEntries(signatureIds.map(id => [id, signaturePads.get(id).export()]))
  };
}
function validateDraft(data) {
  const fail = () => { throw new Error('Die Datei ist kein gültiger Abnahmedokumentation-Entwurf (Version 1 bis 8).'); };
  if (!data || data.format !== 'viadonau-maeharbeiten' || ![1, 2, 3, 4, 5, 6, 7, 8].includes(data.version) ||
      typeof data.id !== 'string' || data.id.length > 100 || !data.fields || !data.signatures ||
      !Array.isArray(data.sections) || data.sections.length < 1 || data.sections.length > 200) fail();
  function fields(value, names) {
    if (!value || typeof value !== 'object') fail();
    for (const name of names) {
      if (typeof value[name] !== 'string' || value[name].length > 10000) fail();
      if ((['periodFrom', 'periodTo', 'mrDate', 'vdDate', 'completed', 'followUp'].includes(name)) &&
          value[name] && (!/^\d{4}-\d{2}-\d{2}$/.test(value[name]) ||
          !Number.isFinite(Date.parse(value[name])) || new Date(value[name]).toISOString().slice(0, 10) !== value[name])) fail();
    }
  }
  fields(data.fields, masterNames.filter(name => !(data.version < 5 && name === 'vdComment') && !(data.version === 1 && ['year', 'additionalNotes'].includes(name))));
  if (data.version >= 2 && (
    !['', 'Maschinenring Donauland', 'Maschinenring OÖ Zentralraum', 'Maschinenring Ried', 'Maschinenring Granitland', 'Maschinenring Linz', 'Maschinenring Service'].includes(data.fields.contractor) ||
    !['', '1. Leistungsabruf', '2. Leistungsabruf', '3. Leistungsabruf'].includes(data.fields.contract) ||
    !['', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033'].includes(data.fields.year))) fail();
  if (!(data.version < 4 ? ['', '1. Mähdurchgang', '2. Mähdurchgang', '3. Mähdurchgang', 'Sonderdurchgang'] : ["","Frühjahrsmahd","Herbstmahd","Zwischenmahd","Pflegearbeiten Allgemein (z.B. Holzen, Streichen)"]).includes(data.fields.cycle)) fail();
  for (const row of data.sections) {
    fields(row, data.version < 3 ? legacySectionNames : data.version < 5 ? versionThreeSectionNames : sectionNames);
    if (data.version >= 8) {
      if (!Array.isArray(row.services) || row.services.length > serviceOptions.length + legacyServiceOptions.length ||
          new Set(row.services).size !== row.services.length ||
          row.services.some(service => !serviceOptions.includes(service) && !legacyServiceOptions.includes(service)) ||
          !row.quantities || typeof row.quantities !== 'object' || Array.isArray(row.quantities)) fail();
      if (row.service !== (row.services[0] || '') || row.quantity !== (row.quantities[row.services[0]] || '')) fail();
      for (const [service, amount] of Object.entries(row.quantities)) {
        const unit = quantityUnit(service);
        if (!row.services.includes(service) || !unit || typeof amount !== 'string' || amount.length > 10000 ||
            (amount && !(unit === 'Stück' ? /^\d+$/ : /^\d+(?:[.,]\d+)?$/).test(amount))) fail();
      }
      if (!row.services.includes('Bankettstreifen Zwischenmahd') && row.interimArea) fail();
    } else if (data.version >= 3) {
      if (row.service !== '' && !serviceOptions.includes(row.service) && !legacyServiceOptions.includes(row.service)) fail();
      const unit = quantityUnit(row.service);
      if (!unit && row.quantity) fail();
      if (row.quantity && !(unit === 'Stück' ? /^\d+$/ : /^\d+(?:[.,]\d+)?$/).test(row.quantity)) fail();
      if (row.service !== 'Bankettstreifen Zwischenmahd' && row.interimArea) fail();
    }
    if (data.version < 5 && (!['', 'i. O.', 'Nacharbeit'].includes(row.status) ||
        (row.status !== 'Nacharbeit' && row.followUp))) fail();
  }
  for (const id of signatureIds) {
    const image = data.signatures[id];
    if (image !== null && (typeof image !== 'string' || image.length > 2000000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image))) fail();
  }
  photoManager.validate(data);
  return data;
}
async function decodeSignatures(data) {
  return Promise.all(signatureIds.map(async id => {
    if (!data.signatures[id]) return null;
    const image = new Image();
    image.src = data.signatures[id];
    await image.decode();
    if (image.naturalWidth !== 1000 || image.naturalHeight !== 250) throw new Error('Unzulässiges Unterschriftenformat.');
    return image;
  }));
}
function saveDraft() {
  if (photoManager.isBusy()) { showStatus('Bitte warten, bis die Fotos verarbeitet sind.'); return; }
  let data;
  try { data = validateDraft(collectDraft()); } catch {
    showStatus('Entwurf konnte nicht gespeichert werden. Bitte Datum und Mengen prüfen (Stück: ganze Zahl; Tonnen: Zahl mit Komma oder Punkt). Texte dürfen höchstens 10.000 Zeichen pro Feld enthalten.');
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  if (blob.size > 20000000) { showStatus('Entwurf zu groß. Bitte auf mehrere Abnahmedokumentationen aufteilen.'); return; }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const name = ([data.fields.contract || 'Entwurf', data.fields.year].filter(Boolean).join('_')).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  link.href = url;
  link.download = `Abnahmedokumentation_${name}_${data.savedAt.slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  dirty = false;
  showStatus('Download gestartet. Die gespeicherte Abnahmedokumentation-Datei per E-Mail oder Teams weitergeben. Der Empfänger öffnet sie hier über „Entwurf öffnen“.');
}
document.querySelector('#save-draft').addEventListener('click', saveDraft);
document.querySelector('#open-draft').addEventListener('click', () => document.querySelector('#draft-file').click());
document.querySelector('#draft-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 20000000) throw new Error('Die Datei ist zu groß (maximal 20 MB).');
    let data = validateDraft(JSON.parse(await file.text()));
    const migrated = data.version === 1;
    if (migrated) data = migrateLegacyDraft(data);
    if (data.version === 2) data = validateDraft({
      ...data, version: 3,
      sections: data.sections.map(row => ({ ...row, service: '', quantity: '', interimArea: '' }))
    });
    const legacyCycle = data.version < 4 && !!data.fields.cycle;
    if (data.version < 4) data = upgradeWorkCategory(data);
    if (data.version < 5) data = upgradeComments(data);
    await photoManager.decode(data);
    const changedDeclaration = data.version < 7;
    if (changedDeclaration) data = { ...data, signatures: { 'mr-signature': null, 'vd-signature': null } };
    const images = await decodeSignatures(data);
    if (dirty && !window.confirm('Ungesicherte Eingaben durch den gespeicherten Entwurf ersetzen?')) return;
    const contractorSelect = form.elements.contractor;
    contractorSelect.querySelectorAll('[data-historical]').forEach(option => option.remove());
    if (data.fields.contractor && !Array.from(contractorSelect.options).some(option => option.value === data.fields.contractor)) {
      const option = new Option(data.fields.contractor + ' (bisheriger Entwurf)', data.fields.contractor);
      option.dataset.historical = 'true';
      contractorSelect.add(option);
    }
    masterNames.forEach(name => { form.elements[name].value = data.fields[name]; });
    document.dispatchEvent(new Event('draft-opened'));
    rows.replaceChildren();
    data.sections.forEach(addRow);
    signatureIds.forEach((id, i) => signaturePads.get(id).restore(images[i]));
    photoManager.restore(data);
    draftId = data.id;
    dirty = changedDeclaration;
    showStatus(legacyCycle
      ? 'Entwurf übernommen. Bitte die Art der Arbeiten neu auswählen und erneut unterschreiben. Der bisherige Mähdurchgang steht in den Anmerkungen.'
      : migrated
      ? 'Älterer Entwurf übernommen. Bitte Standort, Leistungsabruf und Jahr prüfen und erneut unterschreiben. Frühere freie Auftragsangaben stehen in den Anmerkungen.'
      : changedDeclaration
      ? 'Entwurf samt Fotos übernommen. Der Bestätigungstext wurde aktualisiert; bitte prüfen und erneut unterschreiben.'
      : 'Entwurf geöffnet – einschließlich gespeicherter Unterschriften und Fotos. Nach der Bearbeitung erneut speichern und die neue Datei weitergeben.');
  } catch (error) {
    showStatus('Entwurf konnte nicht geöffnet werden. ' + (error instanceof SyntaxError ? 'Die Datei enthält kein gültiges JSON.' : error.message) + ' Bestehende Eingaben bleiben erhalten.');
  } finally {
    event.target.value = '';
  }
});

function migrateLegacyDraft(data) {
  const old = data.fields;
  const contractors = ['', 'Maschinenring Donauland', 'Maschinenring OÖ Zentralraum', 'Maschinenring Ried', 'Maschinenring Granitland', 'Maschinenring Linz', 'Maschinenring Service'];
  const contracts = ['', '1. Leistungsabruf', '2. Leistungsabruf', '3. Leistungsabruf'];
  const contractor = contractors.includes(old.contractor) ? old.contractor : '';
  const contract = contracts.includes(old.contract) ? old.contract : '';
  const notes = [];
  if (old.contractor && !contractor) notes.push('Auftragnehmer im bisherigen Entwurf: ' + old.contractor);
  if (old.contract && !contract) notes.push('Auftrag im bisherigen Entwurf: ' + old.contract);
  const year = (old.periodFrom || '').slice(0, 4);
  return validateDraft({ ...data, version: 2,
    fields: { ...old, contractor, contract, year: /^(202[6-9]|203[0-3])$/.test(year) ? year : '', additionalNotes: notes.join('\n') },
    sections: data.sections.map(row => Object.fromEntries(legacySectionNames.map(name => [name, row[name]]))),
    signatures: { 'mr-signature': null, 'vd-signature': null }
  });
}

function upgradeWorkCategory(data) {
  const previous = data.fields.cycle;
  return validateDraft({
    ...data, version: 4,
    fields: {
      ...data.fields, cycle: '',
      additionalNotes: [data.fields.additionalNotes, previous ? 'Bisheriger Mähdurchgang: ' + previous : ''].filter(Boolean).join('\n')
    },
    signatures: previous ? { 'mr-signature': null, 'vd-signature': null } : data.signatures
  });
}

function upgradeComments(data) {
  const comments = data.sections.map((row, index) => {
    const details = [
      row.status ? 'Kontrollstatus: ' + row.status : '',
      row.note || '',
      row.followUp ? 'Nacharbeit bis: ' + row.followUp.split('-').reverse().join('.') : ''
    ].filter(Boolean);
    if (!details.length) return '';
    const reference = [row.service, row.area].filter(Boolean).join(' – ');
    return 'Leistung ' + (index + 1) + (reference ? ' (' + reference + ')' : '') + ':\n' + details.join('\n');
  }).filter(Boolean).join('\n\n');
  return validateDraft({
    ...data, version: 5,
    fields: { ...data.fields, vdComment: comments },
    sections: data.sections.map(row => Object.fromEntries(sectionNames.map(name => [name, row[name]])))
  });
}
