window.TeamApp.register('intake', (root, context) => {
  'use strict';
  const { store, ui } = context;
  const form = ui.el('form');
  form.noValidate = true;
  const fields = {};
  for (const [name, labelText, type, required] of [
    ['title', '업무명 (필수)', 'text', true],
    ['category', '분류 (필수)', 'text', true],
    ['assignee', '담당자 (선택 · 비워두면 미배정)', 'text', false],
    ['dueDate', '마감일 (필수)', 'date', true]
  ]) {
    const row = ui.el('p'), label = ui.el('label', labelText), input = ui.el('input');
    input.id = 'intake-' + name;
    input.name = name;
    input.type = type;
    input.required = required;
    if (type === 'text') input.maxLength = 120;
    input.style.width = '100%';
    label.htmlFor = input.id;
    row.append(label, input);
    form.append(row);
    fields[name] = input;
  }
  const priorityRow = ui.el('p'), priorityLabel = ui.el('label', '우선순위'), priority = ui.el('select');
  priority.id = 'intake-priority';
  priority.name = 'priority';
  priorityLabel.htmlFor = priority.id;
  store.priorities.forEach(value => {
    const option = ui.el('option', value);
    option.value = value;
    priority.append(option);
  });
  priority.value = '보통';
  fields.priority = priority;
  priorityRow.append(priorityLabel, priority);
  form.append(priorityRow);
  const submit = ui.el('button', '요청 등록');
  submit.type = 'submit';
  form.append(submit);
  const message = ui.el('p', '', 'notice');
  message.setAttribute('aria-live', 'polite');
  message.setAttribute('role', 'status');
  message.hidden = true;
  const count = ui.el('p', '', 'muted'), results = ui.el('div');
  function render() {
    const requests = store.list();
    count.textContent = '등록된 요청 ' + requests.length + '건';
    results.replaceChildren(requests.length
      ? ui.table(['요청번호', '업무명', '분류', '담당', '상태', '우선순위', '마감일'],
        requests.map(item => [item.id, item.title, item.category, item.assignee, item.status, item.priority, item.dueDate]))
      : ui.el('p', '등록된 요청이 없습니다. 위 입력 폼에서 첫 요청을 등록하세요.', 'notice'));
  }
  function announce(text, error) {
    message.hidden = false;
    message.className = error ? 'notice error' : 'notice';
    message.setAttribute('role', error ? 'alert' : 'status');
    message.textContent = text;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    Object.values(fields).forEach(input => input.removeAttribute('aria-invalid'));
    function invalid(name, text) {
      fields[name].setAttribute('aria-invalid', 'true');
      fields[name].focus();
      throw new Error(text);
    }
    try {
      const input = {};
      for (const [name, label] of [['title', '업무명'], ['category', '분류'], ['assignee', '담당자']]) {
        input[name] = fields[name].value.trim();
        if ((name !== 'assignee' && !input[name]) || input[name].length > 120) invalid(name, label + '은 1~120글자로 입력하세요.');
      }
      input.dueDate = fields.dueDate.value;
      const date = new Date(input.dueDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.dueDate) {
        invalid('dueDate', '마감일은 실제 날짜 YYYY-MM-DD로 입력하세요.');
      }
      input.priority = priority.value;
      if (!store.priorities.includes(input.priority)) invalid('priority', '우선순위를 선택하세요.');
      submit.disabled = true;
      const created = store.create(input);
      form.reset();
      announce('등록되었습니다. 요청번호: ' + created.id + ' · 업무명: ' + created.title + ' · 상태: ' + created.status, false);
      fields.title.focus();
    } catch (error) {
      announce(error.message || '등록하지 못했습니다. 입력 내용을 유지했습니다. 다시 시도하세요.', true);
    } finally {
      submit.disabled = false;
    }
  });
  root.replaceChildren(ui.el('p', '업무 요청을 등록하면 접수 상태로 저장됩니다.', 'lede'), form, message,
    ui.el('h3', '등록된 요청'), count, results);
  render();
  if (store.storageError()) announce(store.storageError(), true);
  return store.subscribe(render);
});
