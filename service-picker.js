// Batch selection produces ordinary service rows, preserving separate measurements.
(() => {
  const panel = document.querySelector('#service-picker');
  const toggle = document.querySelector('#choose-services');
  const choices = document.querySelector('#service-choices');
  const status = document.querySelector('#service-picker-status');
  const area = document.querySelector('#batch-area');
  const date = document.querySelector('#batch-date');
  function close() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    choices.querySelectorAll('input').forEach(input => { input.checked = false; });
    area.value = '';
    date.value = '';
    status.textContent = '';
  }
  template.content.querySelectorAll('optgroup').forEach(group => {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.label;
    fieldset.append(legend);
    group.querySelectorAll('option').forEach(option => {
      const label = document.createElement('label');
      label.className = 'service-choice';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = option.value;
      const text = document.createElement('span');
      text.textContent = option.textContent;
      label.append(checkbox, text);
      fieldset.append(label);
    });
    choices.append(fieldset);
  });
  toggle.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    choices.querySelector('input')?.focus();
  });
  choices.addEventListener('change', () => {
    const count = choices.querySelectorAll('input:checked').length;
    status.textContent = count ? `${count} Leistung(en) markiert – mit „Auswahl übernehmen“ hinzufügen.` : '';
  });
  document.querySelector('#cancel-services').addEventListener('click', close);
  document.querySelector('#apply-services').addEventListener('click', () => {
    const selected = Array.from(choices.querySelectorAll('input:checked'), input => input.value);
    if (!selected.length) { status.textContent = 'Bitte mindestens eine Leistung markieren.'; return; }
    const empty = rows.children.length === 1 && Array.from(rows.querySelectorAll('input, textarea, select')).every(field => !field.value);
    if (rows.children.length - Number(empty) + selected.length > 200) { status.textContent = 'Maximal 200 Leistungen pro Dokument. Bitte weniger Leistungen auswählen.'; return; }
    if (!date.checkValidity()) { status.textContent = 'Bitte ein gültiges Abschlussdatum eingeben.'; return; }
    invalidateSignatures('both');
    if (empty) rows.replaceChildren();
    const added = selected.map(service => addRow({ service, area: area.value, completed: date.value }));
    close();
    showStatus(`${selected.length} Leistungen hinzugefügt. Bereiche, Abschlussdaten und gegebenenfalls Aufmaß bitte prüfen.`);
    added[0]?.querySelector('select')?.focus();
  });
  form.addEventListener('reset', close);
  document.addEventListener('draft-opened', close);
})();
