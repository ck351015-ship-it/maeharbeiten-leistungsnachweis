// Each row holds multiple services and one shared area/completion date.
function setupServiceDropdown(row, values = {}) {
  const source = row.querySelector('[name="service[]"]');
  const sourceLabel = source.closest('label');
  sourceLabel.hidden = true;
  row.querySelector('.quantity-field').remove();
  const details = document.createElement('details');
  details.className = 'service-dropdown no-print';
  const summary = document.createElement('summary');
  const options = document.createElement('div');
  options.className = 'service-dropdown-options';
  const print = document.createElement('div');
  print.className = 'service-print';
  const measurements = document.createElement('div');
  measurements.className = 'service-measurements';
  const selected = new Set(values.services || (values.service ? [values.service] : []));
  const quantities = { ...(values.quantities || (values.service && values.quantity ? { [values.service]: values.quantity } : {})) };
  const labels = new Map(Array.from(source.options, option => [option.value, option.textContent]));
  const groups = Array.from(source.querySelectorAll('optgroup'), group => ({label: group.label, options: Array.from(group.querySelectorAll('option'))}));
  const historical = Array.from(source.children).filter(option => option.tagName === 'OPTION' && option.value);
  if (historical.length) groups.push({label: 'Bisherige Bezeichnung', options: historical});
  function update() {
    const names = [...selected].map(service => labels.get(service) || service);
    summary.textContent = names.length ? names.join(' · ') : 'Leistungen auswählen';
    summary.setAttribute('aria-label', names.length ? 'Ausgewählte Leistungen: ' + names.join(', ') : 'Leistungen auswählen');
    print.textContent = names.length ? names.map(name => '☑ ' + name).join('\n') : '________________';
    source.value = [...selected][0] || '';
    measurements.replaceChildren();
    for (const service of selected) {
      const unit = quantityUnit(service);
      if (!unit) continue;
      const label = document.createElement('label');
      label.className = 'row-detail measurement-label';
      const title = document.createElement('span');
      title.textContent = `${labels.get(service) || service} · ${unit}`;
      const input = document.createElement('input');
      input.name = 'measurement[]';
      input.value = quantities[service] || '';
      input.inputMode = unit === 'Stück' ? 'numeric' : 'decimal';
      input.placeholder = unit;
      input.setAttribute('aria-label', title.textContent);
      input.addEventListener('input', () => { quantities[service] = input.value; });
      label.append(title, input);
      measurements.append(label);
    }
    const interim = selected.has('Bankettstreifen Zwischenmahd');
    row.querySelector('.interim-field').hidden = !interim;
    if (!interim) row.querySelector('[name="interimArea[]"]').value = '';
  }
  groups.forEach(group => {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.label;
    fieldset.append(legend);
    group.options.forEach(option => {
      const label = document.createElement('label');
      label.className = 'service-choice';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = option.value;
      checkbox.checked = selected.has(option.value);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selected.add(option.value);
        else { selected.delete(option.value); delete quantities[option.value]; }
        invalidateSignatures('both');
        update();
      });
      const text = document.createElement('span');
      text.textContent = option.textContent;
      label.append(checkbox, text);
      fieldset.append(label);
    });
    options.append(fieldset);
  });
  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'button button-secondary';
  done.textContent = 'Auswahl schließen';
  done.onclick = () => { details.open = false; summary.focus(); };
  options.append(done);
  details.append(summary, options);
  details.addEventListener('keydown', event => { if (event.key === 'Escape') { details.open = false; summary.focus(); } });
  details.addEventListener('toggle', () => {
    if (details.open) document.querySelectorAll('.service-dropdown[open]').forEach(other => { if (other !== details) other.open = false; });
  });
  sourceLabel.before(details, print);
  row.querySelector('.interim-field').before(measurements);
  update();
  return {
    export() {
      const services = [...selected];
      const amounts = Object.fromEntries(services.filter(service => quantityUnit(service)).map(service => [service, quantities[service] || '']));
      return {services, quantities: amounts, service: services[0] || '', quantity: amounts[services[0]] || ''};
    }
  };
}
document.addEventListener('click', event => {
  document.querySelectorAll('.service-dropdown[open]').forEach(details => { if (!details.contains(event.target)) details.open = false; });
});
