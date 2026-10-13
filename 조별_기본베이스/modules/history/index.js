window.TeamApp.register('history', (root, context) => {
  'use strict';
  const { store, ui } = context;
  const el = ui.el;
  let selectedId = null;
  root.replaceChildren();
  root.append(el('p', '요청에 남은 변경 기록을 기간과 현재 상태로 찾아보세요.', 'lede'));
  const form = el('form', undefined, 'toolbar');
  const start = el('input');
  const end = el('input');
  start.type = end.type = 'date';
  const status = el('select');
  status.append(el('option', '전체 상태'));
  status.firstChild.value = '';
  store.statuses.forEach(value => {
    const option = el('option', value);
    option.value = value;
    status.append(option);
  });
  [['시작일 ', start], ['종료일 ', end], ['현재 상태 ', status]].forEach(([text, input]) => {
    const label = el('label', text);
    label.append(input);
    form.append(label);
  });
  const search = el('button', '조회');
  search.type = 'submit';
  const reset = el('button', '조건 초기화');
  reset.type = 'button';
  form.append(search, reset);
  const message = el('p');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  const results = el('div');
  const detail = el('section');
  detail.setAttribute('aria-label', '선택한 요청 상세');
  root.append(form, el('p', '기간은 변경 시각의 현지 날짜를 기준으로 양 끝 날짜를 포함합니다. 상태는 요청의 현재 상태입니다.', 'muted'), message, results, detail);

  const fieldNames = { title: '업무명', category: '분류', assignee: '담당', status: '상태', priority: '우선순위', dueDate: '마감일' };
  const timestamp = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '시각 확인 불가' : date.toLocaleString('ko-KR');
  };
  const localDate = value => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  };
  const description = event => event.action === '수정'
    ? event.detail.split(', ').map(key => fieldNames[key] || key).join(', ')
    : event.detail;

  function showDetail() {
    detail.replaceChildren();
    if (!selectedId) {
      detail.append(el('p', '목록의 요청 상세 버튼을 눌러 업무 내용과 전체 변경 이력을 확인하세요.', 'muted'));
      return;
    }
    const request = store.get(selectedId);
    detail.append(el('h3', '요청 상세'));
    if (!request) {
      detail.append(el('p', '이 기록의 요청을 찾을 수 없습니다.', 'notice'));
      return;
    }
    detail.append(ui.table(['항목', '내용'], [
      ['요청번호', request.id], ['업무명', request.title], ['분류', request.category],
      ['담당', request.assignee], ['현재 상태', request.status], ['우선순위', request.priority],
      ['마감일', request.dueDate], ['등록 시각', timestamp(request.createdAt)], ['최근 변경', timestamp(request.updatedAt)]
    ]));
    detail.append(el('h3', '처리 메모'));
    if (request.notes.length) {
      detail.append(ui.table(['시각', '메모'], request.notes.map(note => [timestamp(note.at), note.text])));
    } else {
      detail.append(el('p', '처리 메모가 없습니다.', 'muted'));
    }
    const events = store.history().filter(event => event.requestId === selectedId).sort((a, b) => b.at.localeCompare(a.at));
    detail.append(el('h3', '이 요청의 전체 변경 이력'));
    if (events.length) {
      detail.append(ui.table(['변경 시각', '작업', '변경 항목 / 내용'], events.map(event => [timestamp(event.at), event.action, description(event)])));
    } else {
      detail.append(el('p', '변경 이력이 없습니다.', 'muted'));
    }
  }

  function render() {
    results.replaceChildren();
    detail.replaceChildren();
    message.className = '';
    try {
      if (start.validity.badInput || end.validity.badInput || !start.checkValidity() || !end.checkValidity()) {
        throw new Error('조회 기간에 올바른 날짜를 입력하세요.');
      }
      if (start.value && end.value && start.value > end.value) {
        throw new Error('시작일은 종료일보다 늦을 수 없습니다.');
      }
      const records = store.history().map(event => ({ event, request: store.get(event.requestId) })).filter(({ event, request }) => {
        const day = localDate(event.at);
        return (!start.value || (day && day >= start.value)) && (!end.value || (day && day <= end.value)) &&
          (!status.value || (request && request.status === status.value));
      }).sort((a, b) => b.event.at.localeCompare(a.event.at));
      if (!records.some(({ event }) => event.requestId === selectedId)) selectedId = null;
      message.textContent = '조회 결과 ' + records.length + '건';
      const storageError = store.storageError();
      if (storageError) {
        message.textContent += ' · ' + storageError;
        message.className = 'error';
      }
      if (!records.length) {
        results.append(el('p', '조건에 맞는 업무 기록이 없습니다. 기간이나 상태를 바꾸거나 조건을 초기화하세요.', 'notice'));
      } else {
        const table = ui.table(['변경 시각', '요청번호', '업무명', '현재 상태', '작업', '변경 항목 / 내용', '상세'], records.map(({ event, request }) => [
          timestamp(event.at), event.requestId, request ? request.title : '요청 없음',
          request ? request.status : '확인 불가', event.action, description(event), ''
        ]));
        table.querySelectorAll('tbody tr').forEach((row, index) => {
          const requestId = records[index].event.requestId;
          const button = el('button', '요청 상세');
          button.type = 'button';
          button.setAttribute('aria-label', requestId + ' 요청 상세');
          button.setAttribute('aria-pressed', String(requestId === selectedId));
          button.onclick = () => { selectedId = requestId; render(); };
          row.lastElementChild.append(button);
        });
        results.append(table);
      }
      showDetail();
    } catch (error) {
      message.className = 'error';
      message.textContent = '업무 기록을 조회하지 못했습니다. ' + error.message;
    }
  }
  form.onsubmit = event => { event.preventDefault(); render(); };
  reset.onclick = () => { start.value = ''; end.value = ''; status.value = ''; selectedId = null; render(); };
  render();
  return store.subscribe(render);
});
