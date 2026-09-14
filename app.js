const serviceOptions = ["Kilometerzeichen Sichtfenster","Hektometerzeichen Sichtfenster","Schifffahrtszeichen Sichtfenster","Fixpunkte Sichtfenster","Reinigen Hektometer","Reinigen Kilometerzeichen","Reinigen Fixpunkte","Reinigen Schifffahrtszeichen","Streichen HM-Zeichen","Streichen Fixpunkte","Streichen Kilometerzeichen","Streichen Schifffahrtszeichen SÄULE","Reinigen + Streichen Heftpoller","Sichtfenster Hektometer","Sichtfenster Kilometerzeichen","Sichtfenster Schifffahrtszeichen","Sichtfenster Fixpunkte","Ländenböschungen 3x jährlich mulchen","Dämme 2x jährlich mulchen VHP/via 50/50 (Melk)","Dämme 2x jährlich mulchen via","Dämme 2x jährlich mulchen via / VHP Oh, Abw, Wall","Dämme 2x jährlich mähen VHP Melk / via 50/50","Dämme 2x jährlich mähen via","Dämme 2x jährlich mähen via (VHP Wall)","Ökologische Flächen 2x mähen","Mähgut von Fläche entfernen VHP Melk / via 50/50","Mähgut von Fläche entfernen via","Mähgut von Fläche entfernen via (VHP Wall)","Mähgut entsorgen VHP Melk / via 50/50","Mähgut entsorgen via","Mähgut entsorgen via (VHP Wall)","Bankettstreifen 1. Mahd","Bankettstreifen Zwischenmahd","Bankettstreifen 2. Mahd","Herstellen Lichtraumprofil"];
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
    showStatus('Maximal 200 Leistungen pro Lieferschein. Bitte einen weiteren Lieferschein anlegen.');
    return;
  }
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector('tr');

  Object.entries(values).forEach(([name, value]) => {
    const field = row.querySelector(`[name="${name}[]"]`);
    if (field) field.value = value;
  });

  row.querySelector('.delete-row').addEventListener('click', () => {
    invalidateSignatures('both');
    if (rows.children.length === 1) {
      row.querySelectorAll('input, textarea, select').forEach(field => field.value = '');
      row.querySelector('[name="service[]"]').dispatchEvent(new Event('change', { bubbles: true }));
      row.querySelector('[name="status[]"]').dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    row.remove();
  });

  const status = row.querySelector('[name="status[]"]');
  const followUp = row.querySelector('[name="followUp[]"]');
  const updateFollowUp = () => {
    const needsWork = status.value === 'Nacharbeit';
    followUp.hidden = !needsWork;
    followUp.required = needsWork;
    if (!needsWork) followUp.value = '';
  };
  status.addEventListener('change', updateFollowUp);
  updateFollowUp();

  const service = row.querySelector('[name="service[]"]');
  const quantity = row.querySelector('[name="quantity[]"]');
  const interimArea = row.querySelector('[name="interimArea[]"]');
  const updateService = () => {
    const unit = quantityUnit(service.value);
    row.querySelector('.quantity-field').hidden = !unit;
    row.querySelector('.quantity-label').textContent = unit;
    quantity.setAttribute('aria-label', unit || 'Menge');
    quantity.inputMode = unit === 'Stück' ? 'numeric' : 'decimal';
    if (!unit) quantity.value = '';
    const interim = service.value === 'Bankettstreifen Zwischenmahd';
    row.querySelector('.interim-field').hidden = !interim;
    if (!interim) interimArea.value = '';
  };
  service.addEventListener('change', () => {
    // Measurements from a different service must not be carried over.
    quantity.value = '';
    interimArea.value = '';
    updateService();
  });
  updateService();
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
  if (!window.confirm('Alle Eingaben und Unterschriften verwerfen?')) return;
  form.reset();
  rows.replaceChildren();
  signaturePads.forEach(pad => pad.clear());
  addRow();
  setDefaultDates();
  draftId = crypto.randomUUID();
  dirty = false;
  showStatus('Neuer Lieferschein angelegt.');
});

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  ['mrDate', 'vdDate'].forEach(name => {
    const input = form.elements[name];
    if (!input.value) input.value = today;
  });
}

function preparePrintSignatures() {
  document.querySelectorAll('.print-value').forEach(node => node.remove());
  document.querySelectorAll('.sheet input, .sheet select, .sheet textarea').forEach(field => {
    if (field.name === 'additionalNotes' || field.hidden || field.closest('[hidden]')) return;
    const value = document.createElement('span');
    value.className = 'print-value';
    let text = field.value;
    if (field.type === 'date' && text) text = text.split('-').reverse().join('.');
    value.textContent = text || '________________';
    field.after(value);
  });
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
  const contract = [form.elements.contract.value, form.elements.year.value].filter(Boolean).join('_');
  document.title = `Leistungsbestaetigung_Streckenpflegearbeiten_${contract || 'Entwurf'}`.replace(/[^a-zA-Z0-9_-]+/g, '_');
  preparePrintSignatures();
  await Promise.allSettled(Array.from(document.querySelectorAll('.signature-print, .document-logos img'), image => image.decode()));
  window.print();
});

addRow();
setDefaultDates();

// Draft files are local handoffs, not a shared database or verified signatures.
let draftId = crypto.randomUUID();
let dirty = false;
const masterNames = ['contractor', 'contract', 'year', 'additionalNotes', 'cycle', 'periodFrom', 'periodTo', 'mrName', 'mrDate', 'vdName', 'vdDate'];
const legacySectionNames = ['area', 'completed', 'status', 'note', 'followUp'];
const sectionNames = [...legacySectionNames, 'service', 'quantity', 'interimArea'];
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
  const controls = ['status[]', 'note[]', 'followUp[]', 'vdName', 'vdDate'];
  invalidateSignatures(controls.includes(name) ? 'vd' : 'both');
}
form.addEventListener('input', fieldChanged);
form.addEventListener('change', fieldChanged);
window.addEventListener('beforeunload', event => {
  if (dirty) { event.preventDefault(); event.returnValue = ''; }
});
function collectDraft() {
  return {
    format: 'viadonau-maeharbeiten', version: 4, id: draftId,
    savedAt: new Date().toISOString(),
    fields: Object.fromEntries(masterNames.map(name => [name, form.elements[name].value])),
    sections: Array.from(rows.children, row => Object.fromEntries(sectionNames.map(name => [name, row.querySelector(`[name="${name}[]"]`).value]))),
    signatures: Object.fromEntries(signatureIds.map(id => [id, signaturePads.get(id).export()]))
  };
}
function validateDraft(data) {
  const fail = () => { throw new Error('Die Datei ist kein gültiger Lieferschein-Entwurf (Version 1 bis 4).'); };
  if (!data || data.format !== 'viadonau-maeharbeiten' || ![1, 2, 3, 4].includes(data.version) ||
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
  fields(data.fields, data.version === 1 ? masterNames.filter(name => !['year', 'additionalNotes'].includes(name)) : masterNames);
  if (data.version >= 2 && (
    !['', 'Maschinenring Donauland', 'Maschinenring OÖ Zentralraum', 'Maschinenring Ried', 'Maschinenring Granitland'].includes(data.fields.contractor) ||
    !['', '1. Leistungsabruf', '2. Leistungsabruf', '3. Leistungsabruf'].includes(data.fields.contract) ||
    !['', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033'].includes(data.fields.year))) fail();
  if (!(data.version < 4 ? ['', '1. Mähdurchgang', '2. Mähdurchgang', '3. Mähdurchgang', 'Sonderdurchgang'] : ["","Frühjahrsmahd","Herbstmahd","Zwischenmahd","Pflegearbeiten Allgemein (z.B. Holzen, Streichen)"]).includes(data.fields.cycle)) fail();
  for (const row of data.sections) {
    fields(row, data.version < 3 ? legacySectionNames : sectionNames);
    if (data.version >= 3) {
      if (row.service !== '' && !serviceOptions.includes(row.service)) fail();
      const unit = quantityUnit(row.service);
      if (!unit && row.quantity) fail();
      if (row.quantity && !(unit === 'Stück' ? /^\d+$/ : /^\d+(?:[.,]\d+)?$/).test(row.quantity)) fail();
      if (row.service !== 'Bankettstreifen Zwischenmahd' && row.interimArea) fail();
    }
    if (!['', 'i. O.', 'Nacharbeit'].includes(row.status) ||
        (row.status !== 'Nacharbeit' && row.followUp)) fail();
  }
  for (const id of signatureIds) {
    const image = data.signatures[id];
    if (image !== null && (typeof image !== 'string' || image.length > 2000000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image))) fail();
  }
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
  let data;
  try { data = validateDraft(collectDraft()); } catch {
    showStatus('Entwurf konnte nicht gespeichert werden. Bitte Datum und Mengen prüfen (Stück: ganze Zahl; Tonnen: Zahl mit Komma oder Punkt). Texte dürfen höchstens 10.000 Zeichen pro Feld enthalten.');
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  if (blob.size > 6000000) { showStatus('Entwurf zu groß. Bitte auf mehrere Lieferscheine aufteilen.'); return; }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const name = ([data.fields.contract || 'Entwurf', data.fields.year].filter(Boolean).join('_')).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  link.href = url;
  link.download = `Lieferschein_${name}_${data.savedAt.slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  dirty = false;
  showStatus('Download gestartet. Die gespeicherte Lieferschein-Datei per E-Mail oder Teams weitergeben. Der Empfänger öffnet sie hier über „Entwurf öffnen“.');
}
document.querySelector('#save-draft').addEventListener('click', saveDraft);
document.querySelector('#open-draft').addEventListener('click', () => document.querySelector('#draft-file').click());
document.querySelector('#draft-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 6000000) throw new Error('Die Datei ist zu groß (maximal 6 MB).');
    let data = validateDraft(JSON.parse(await file.text()));
    const migrated = data.version === 1;
    if (migrated) data = migrateLegacyDraft(data);
    if (data.version === 2) data = validateDraft({
      ...data, version: 3,
      sections: data.sections.map(row => ({ ...row, service: '', quantity: '', interimArea: '' }))
    });
    const legacyCycle = data.version < 4 && !!data.fields.cycle;
    if (data.version < 4) data = upgradeWorkCategory(data);
    const images = await decodeSignatures(data);
    if (dirty && !window.confirm('Ungesicherte Eingaben durch den gespeicherten Entwurf ersetzen?')) return;
    masterNames.forEach(name => { form.elements[name].value = data.fields[name]; });
    rows.replaceChildren();
    data.sections.forEach(addRow);
    signatureIds.forEach((id, i) => signaturePads.get(id).restore(images[i]));
    draftId = data.id;
    dirty = false;
    showStatus(legacyCycle
      ? 'Entwurf übernommen. Bitte die Art der Arbeiten neu auswählen und erneut unterschreiben. Der bisherige Mähdurchgang steht in den Anmerkungen.'
      : migrated
      ? 'Älterer Entwurf übernommen. Bitte Standort, Leistungsabruf und Jahr prüfen und erneut unterschreiben. Frühere freie Auftragsangaben stehen in den Anmerkungen.'
      : 'Entwurf geöffnet – einschließlich gespeicherter Unterschriften. Nach der Bearbeitung erneut speichern und die neue Datei weitergeben.');
  } catch (error) {
    showStatus('Entwurf konnte nicht geöffnet werden. ' + (error instanceof SyntaxError ? 'Die Datei enthält kein gültiges JSON.' : error.message) + ' Bestehende Eingaben bleiben erhalten.');
  } finally {
    event.target.value = '';
  }
});

function migrateLegacyDraft(data) {
  const old = data.fields;
  const contractors = ['', 'Maschinenring Donauland', 'Maschinenring OÖ Zentralraum', 'Maschinenring Ried', 'Maschinenring Granitland'];
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
