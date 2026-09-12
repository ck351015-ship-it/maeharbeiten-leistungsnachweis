const form = document.querySelector('#delivery-form');
const rows = document.querySelector('#sections');
const template = document.querySelector('#section-row-template');

function addRow(values = {}) {
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector('tr');

  Object.entries(values).forEach(([name, value]) => {
    const field = row.querySelector(`[name="${name}[]"]`);
    if (field) field.value = value;
  });

  row.querySelector('.delete-row').addEventListener('click', () => {
    if (rows.children.length === 1) {
      row.querySelectorAll('input, textarea, select').forEach(field => field.value = '');
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

  rows.append(fragment);
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
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
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
  button.addEventListener('click', () => signaturePads.get(button.dataset.clearSignature).clear());
});

document.querySelector('#add-row').addEventListener('click', () => addRow());

document.querySelector('#reset-form').addEventListener('click', () => {
  if (!window.confirm('Alle Eingaben und Unterschriften verwerfen?')) return;
  form.reset();
  rows.replaceChildren();
  signaturePads.forEach(pad => pad.clear());
  addRow();
  setDefaultDates();
});

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  ['mrDate', 'vdDate'].forEach(name => {
    const input = form.elements[name];
    if (!input.value) input.value = today;
  });
}

function preparePrintSignatures() {
  document.querySelectorAll('.signature-pad').forEach(pad => {
    const canvas = pad.querySelector('canvas');
    const image = pad.querySelector('.signature-print');
    image.src = canvas.toDataURL('image/png');
  });
}

window.addEventListener('beforeprint', preparePrintSignatures);

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const contract = form.elements.contract.value.trim();
  document.title = `Leistungsbestaetigung_Maeharbeiten_${contract || 'Entwurf'}`.replace(/[^a-zA-Z0-9_-]+/g, '_');
  preparePrintSignatures();
  await Promise.all(Array.from(document.querySelectorAll('.signature-print'), image => image.decode()));
  window.print();
});

addRow();
addRow();
addRow();
setDefaultDates();
