window.TeamApp.register('processing', (root, context) => {
  'use strict';
  const { store, ui } = context;
  const drafts = new Map();
  let selectedId = null;
  const message = ui.el('p', '', 'notice');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  message.hidden = true;
  const storageMessage = ui.el('p', '', 'error');
  storageMessage.setAttribute('role', 'alert');
  const count = ui.el('p', '', 'muted');
  const list = ui.el('div');
  const detail = ui.el('section');
  detail.setAttribute('aria-label', '선택한 업무 상세');
  const heading = ui.el('h3');
  const metadata = ui.el('p', '', 'muted');
  const fields = ui.el('form');
  fields.noValidate = true;
  const assignee = ui.el('input');
  assignee.id = 'processing-assignee';
  assignee.type = 'text';
  assignee.maxLength = 120;
  assignee.required = true;
  assignee.autocomplete = 'off';
  const status = ui.el('select');
  status.id = 'processing-status';
  store.statuses.forEach(value => {
    const option = ui.el('option', value);
    option.value = value;
    status.append(option);
  });
  const save = ui.el('button', '담당·상태 저장');
  save.type = 'submit';
  const complete = ui.el('button', '완료 처리');
  complete.type = 'button';
  const noteForm = ui.el('form');
  noteForm.noValidate = true;
  const note = ui.el('textarea');
  note.id = 'processing-note';
  note.rows = 3;
  note.maxLength = 1000;
  note.required = true;
  note.style.width = '100%';
  const addNote = ui.el('button', '메모 추가');
  addNote.type = 'submit';
  const notes = ui.el('div');

  function field(labelText, control) {
    const row = ui.el('div');
    row.style.marginBottom = '16px';
    const label = ui.el('label', labelText);
    label.htmlFor = control.id;
    label.style.display = 'block';
    row.append(label, control);
    return row;
  }
  function announce(text, isError = false) {
    message.textContent = text;
    message.className = isError ? 'notice error' : 'notice';
    message.setAttribute('role', isError ? 'alert' : 'status');
    message.hidden = !text;
  }
  function draft() {
    if (!drafts.has(selectedId)) drafts.set(selectedId, {});
    return drafts.get(selectedId);
  }
  assignee.addEventListener('input', () => { draft().assignee = assignee.value; });
  status.addEventListener('change', () => { draft().status = status.value; });
  note.addEventListener('input', () => { draft().note = note.value; });

  function timestamp(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
  }
  function render() {
    const records = store.list();
    if (!records.some(item => item.id === selectedId)) {
      selectedId = records.length ? records[0].id : null;
    }
    count.textContent = '업무 요청 ' + records.length + '건 · 상세 보기에서 담당자와 처리 상태를 변경하세요.';
    storageMessage.textContent = store.storageError();
    storageMessage.hidden = !storageMessage.textContent;
    list.replaceChildren();
    if (!records.length) {
      list.append(ui.el('p', '처리할 업무 요청이 없습니다. 요청을 접수한 뒤 다시 확인하세요.', 'notice'));
      detail.hidden = true;
      return;
    }
    const wrap = ui.el('div', undefined, 'table-wrap');
    const table = ui.el('table');
    const caption = ui.el('caption', '업무 처리 대상 목록');
    caption.style.textAlign = 'left';
    const head = ui.el('thead');
    const header = ui.el('tr');
    ['요청번호', '업무명', '담당', '상태', '마감일', '선택'].forEach(title => {
      const cell = ui.el('th', title);
      cell.scope = 'col';
      header.append(cell);
    });
    head.append(header);
    const body = ui.el('tbody');
    records.forEach(item => {
      const row = ui.el('tr');
      [item.id, item.title, item.assignee, item.status, item.dueDate].forEach(value => {
        row.append(ui.el('td', value));
      });
      const cell = ui.el('td');
      const select = ui.el('button', item.id === selectedId ? '선택됨' : '상세 보기');
      select.type = 'button';
      select.setAttribute('aria-label', item.id + ' ' + item.title + ' 상세 보기');
      select.setAttribute('aria-pressed', String(item.id === selectedId));
      select.addEventListener('click', () => {
        selectedId = item.id;
        announce('');
        render();
        heading.focus();
      });
      cell.append(select);
      row.append(cell);
      body.append(row);
    });
    table.append(caption, head, body);
    wrap.append(table);
    list.append(wrap);

    const item = store.get(selectedId);
    detail.hidden = false;
    heading.textContent = item.id + ' · ' + item.title;
    metadata.textContent = '분류: ' + item.category + ' / 우선순위: ' + item.priority +
      ' / 마감일: ' + item.dueDate + ' / 현재 상태: ' + item.status;
    const input = drafts.get(selectedId) || {};
    assignee.value = input.assignee ?? item.assignee;
    status.value = input.status ?? item.status;
    note.value = input.note ?? '';
    save.disabled = addNote.disabled = Boolean(store.storageError());
    complete.disabled = Boolean(store.storageError()) || item.status === '완료';
    complete.textContent = item.status === '완료' ? '완료된 업무' : '완료 처리';
    notes.replaceChildren(ui.el('h4', '처리 메모 ' + item.notes.length + '건'));
    if (!item.notes.length) {
      notes.append(ui.el('p', '아직 등록된 처리 메모가 없습니다.', 'muted'));
    } else {
      const entries = ui.el('ol');
      item.notes.forEach(entry => {
        const row = ui.el('li');
        const content = ui.el('p', entry.text);
        content.style.whiteSpace = 'pre-wrap';
        row.append(content, ui.el('p', timestamp(entry.at), 'muted'));
        entries.append(row);
      });
      notes.append(entries);
    }
  }
  function update(isComplete) {
    try {
      if (!selectedId || !store.get(selectedId)) throw new Error('처리할 업무를 먼저 선택하세요.');
      const name = assignee.value.trim();
      if (!name || name.length > 120) throw new Error('담당자는 공백을 제외하고 1~120글자로 입력하세요.');
      if (isComplete && note.value.trim()) throw new Error('작성 중인 메모를 먼저 추가한 뒤 완료 처리하세요.');
      const nextStatus = isComplete ? '완료' : status.value;
      if (!store.statuses.includes(nextStatus)) throw new Error('처리 상태를 선택하세요.');
      const current = store.get(selectedId);
      if (current.assignee === name && current.status === nextStatus) {
        announce('담당자와 상태가 기존 저장 내용과 같습니다.');
        return;
      }
      store.update(selectedId, { assignee: name, status: nextStatus });
      const input = drafts.get(selectedId);
      if (input) {
        delete input.assignee;
        delete input.status;
      }
      render();
      announce(isComplete ? '업무를 완료 처리했습니다.' : '담당자와 상태를 저장했습니다.');
    } catch (error) {
      announce('저장하지 못했습니다. ' + error.message, true);
    }
  }
  fields.addEventListener('submit', event => {
    event.preventDefault();
    update(false);
  });
  complete.addEventListener('click', () => update(true));
  noteForm.addEventListener('submit', event => {
    event.preventDefault();
    try {
      if (!selectedId || !store.get(selectedId)) throw new Error('메모를 남길 업무를 먼저 선택하세요.');
      const value = note.value.trim();
      if (!value || note.value.length > 1000) throw new Error('처리 메모는 공백을 제외하고 1~1000글자로 입력하세요.');
      store.addNote(selectedId, value);
      if (drafts.has(selectedId)) delete drafts.get(selectedId).note;
      render();
      announce('처리 메모를 저장했습니다.');
    } catch (error) {
      announce('메모를 저장하지 못했습니다. ' + error.message, true);
    }
  });

  heading.tabIndex = -1;
  const actions = ui.el('div', undefined, 'toolbar');
  actions.style.justifyContent = 'flex-start';
  actions.append(save, complete);
  fields.append(field('담당자', assignee), field('처리 상태', status), actions);
  noteForm.style.marginTop = '24px';
  noteForm.append(field('처리 메모 (최대 1,000글자)', note), addNote);
  detail.append(heading, metadata, fields, noteForm, notes);
  root.replaceChildren(ui.el('p', '담당·상태 변경, 처리 메모와 완료 처리를 관리합니다.', 'lede'),
    storageMessage, count, list, message, detail);
  render();
  return store.subscribe(render);
});
