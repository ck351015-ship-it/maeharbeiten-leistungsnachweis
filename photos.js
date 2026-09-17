// Photos remain local and travel inside the existing JSON draft file.
const photoManager = (() => {
  const MAX_PHOTOS = 12;
  const MAX_DATA_LENGTH = 1000000;
  const grid = document.querySelector('#photo-grid');
  const include = document.querySelector('#include-photos');
  const status = document.querySelector('#photo-status');
  let photos = [];
  let busy = false;
  const message = text => { status.textContent = text; };
  function lock(value) {
    busy = value;
    document.querySelectorAll('#photo-camera, #photo-select, #save-draft, #open-draft, #reset-form, [type="submit"]').forEach(button => { button.disabled = value; });
    grid.querySelectorAll('button, input').forEach(control => { control.disabled = value; });
    include.disabled = value;
  }
  function render() {
    grid.replaceChildren();
    photos.forEach((photo, index) => {
      const card = document.createElement('article');
      card.className = 'photo-card';
      const image = document.createElement('img');
      image.src = photo.data;
      image.alt = photo.caption || `Foto ${index + 1}`;
      const details = document.createElement('div');
      details.className = 'photo-details';
      const label = document.createElement('label');
      label.htmlFor = `photo-caption-${index}`;
      label.textContent = `Bild ${index + 1} · Beschreibung (optional)`;
      const caption = document.createElement('input');
      caption.id = label.htmlFor;
      caption.type = 'text';
      caption.maxLength = 500;
      caption.value = photo.caption;
      caption.placeholder = 'z. B. Kilometerzeichen – ausgemäht';
      caption.addEventListener('input', () => {
        photo.caption = caption.value;
        image.alt = caption.value || `Foto ${index + 1}`;
        invalidateSignatures('both');
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'text-button';
      remove.textContent = 'Foto entfernen';
      remove.setAttribute('aria-label', `Foto ${index + 1} entfernen`);
      remove.addEventListener('click', () => {
        photos.splice(index, 1);
        invalidateSignatures('both');
        render();
      });
      details.append(label, caption, remove);
      card.append(image, details);
      grid.append(card);
    });
    document.querySelector('#photo-count').textContent = `${photos.length} / ${MAX_PHOTOS} Fotos`;
    document.querySelector('#photo-empty').hidden = photos.length > 0;
  }
  async function compress(file) {
    if (file.size > 25000000) throw new Error('Datei größer als 25 MB.');
    if (file.type === 'image/svg+xml' || (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))) {
      throw new Error('Bitte eine Bilddatei auswählen.');
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      try { await image.decode(); } catch { throw new Error('Bildformat nicht lesbar. Bitte als JPG, PNG oder WebP auswählen.'); }
      const factor = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * factor));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * factor));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let data;
      for (const quality of [0.82, 0.7, 0.55, 0.4]) {
        data = canvas.toDataURL('image/jpeg', quality);
        if (data.length <= MAX_DATA_LENGTH) break;
      }
      if (data.length > MAX_DATA_LENGTH) throw new Error('Bild zu groß. Bitte einen kleineren Ausschnitt wählen.');
      return { data, caption: '' };
    } finally { URL.revokeObjectURL(url); }
  }
  async function addFiles(event) {
    if (busy) return;
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    lock(true);
    message('Fotos werden verkleinert …');
    let added = 0;
    const errors = [];
    try {
      for (const file of files) {
        if (photos.length >= MAX_PHOTOS) { errors.push(`Maximal ${MAX_PHOTOS} Fotos pro Dokument.`); break; }
        try {
          const photo = await compress(file);
          photos.push(photo);
          added++;
          invalidateSignatures('both');
        } catch (error) { errors.push(`${file.name}: ${error.message}`); }
      }
    } finally {
      event.target.value = '';
      render();
      lock(false);
      message([added ? `${added} Foto(s) hinzugefügt. Bitte den Entwurf speichern, damit die Fotos erhalten bleiben.` : '', ...errors].filter(Boolean).join(' '));
    }
  }
  document.querySelector('#photo-camera').onclick = () => document.querySelector('#photo-camera-file').click();
  document.querySelector('#photo-select').onclick = () => document.querySelector('#photo-files').click();
  document.querySelector('#photo-camera-file').onchange = addFiles;
  document.querySelector('#photo-files').onchange = addFiles;
  include.onchange = () => invalidateSignatures('both');
  render();
  return {
    isBusy: () => busy,
    export: () => ({ photos: photos.map(photo => ({ ...photo })), includePhotos: include.checked }),
    restore(data) {
      photos = (data.version === 6 ? data.photos : []).map(photo => ({ data: photo.data, caption: photo.caption }));
      include.checked = data.version === 6 ? data.includePhotos : true;
      message('');
      render();
    },
    validate(data) {
      if (data.version < 6) return;
      if (!Array.isArray(data.photos) || data.photos.length > MAX_PHOTOS || typeof data.includePhotos !== 'boolean') throw new Error('Ungültiger Fotoanhang.');
      for (const photo of data.photos) {
        if (!photo || typeof photo.caption !== 'string' || photo.caption.length > 500 || typeof photo.data !== 'string' || photo.data.length > MAX_DATA_LENGTH || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data)) throw new Error('Ungültiges Foto oder zu lange Bildbeschreibung.');
      }
    },
    async decode(data) {
      if (data.version < 6) return;
      for (const photo of data.photos || []) {
        const image = new Image();
        image.src = photo.data;
        await image.decode();
        if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 1600 || image.naturalHeight > 1600) throw new Error('Unzulässige Fotoabmessungen (maximal 1600 Pixel).');
      }
    },
    preparePrint(fields, id) {
      const appendix = document.querySelector('#photo-appendix');
      const reference = document.querySelector('#photo-print-reference');
      appendix.replaceChildren();
      const visible = include.checked && photos.length > 0;
      appendix.hidden = !visible;
      reference.hidden = !visible;
      reference.textContent = visible ? `Fotoanhang: ${photos.length} Foto(s) · Dokument ${id}` : '';
      if (!visible) return;
      // Two full-width images per portrait page; each page repeats its document reference.
      for (let start = 0; start < photos.length; start += 2) {
        const page = document.createElement('section');
        page.className = 'photo-print-page';
        const heading = document.createElement('h2');
        heading.textContent = `Fotoanhang · ${Math.floor(start / 2) + 1} / ${Math.ceil(photos.length / 2)}`;
        const meta = document.createElement('p');
        meta.className = 'photo-print-meta';
        meta.textContent = [fields.contractor.value, fields.contract.value, fields.year.value, fields.cycle.value, `Dokument ${id}`].filter(Boolean).join(' · ');
        page.append(heading, meta);
        photos.slice(start, start + 2).forEach((photo, offset) => {
          const figure = document.createElement('figure');
          const image = document.createElement('img');
          image.src = photo.data;
          image.alt = photo.caption || `Bild ${start + offset + 1}`;
          const caption = document.createElement('figcaption');
          caption.textContent = `Bild ${start + offset + 1}${photo.caption ? ' – ' + photo.caption : ''}`;
          figure.append(image, caption);
          page.append(figure);
        });
        appendix.append(page);
      }
    }
  };
})();
