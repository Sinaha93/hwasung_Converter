window.TeamApp.register('report', (root, context) => {
  'use strict';
  const { store, ui } = context;
  const form = ui.el('form');
  form.noValidate = true;
  const toolbar = ui.el('div', undefined, 'toolbar');
  toolbar.style.justifyContent = 'flex-start';
  const start = ui.el('input');
  start.id = 'report-start';
  start.type = 'date';
  const end = ui.el('input');
  end.id = 'report-end';
  end.type = 'date';
  const status = ui.el('select');
  status.id = 'report-status';
  ['', ...store.statuses].forEach(value => {
    const option = ui.el('option', value || '전체 상태');
    option.value = value;
    status.append(option);
  });
  const apply = ui.el('button', '미리보기');
  apply.type = 'submit';
  const reset = ui.el('button', '조건 초기화');
  reset.type = 'button';
  const download = ui.el('button', '한글 CSV 저장');
  download.type = 'button';
  const notice = ui.el('p', '', 'notice');
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.hidden = true;
  const storageNotice = ui.el('p', '', 'error');
  storageNotice.setAttribute('role', 'alert');
  const summary = ui.el('p', '', 'notice');
  const preview = ui.el('div');
  const headers = ['요청번호', '업무명', '분류', '담당', '상태', '우선순위', '마감일', '등록일', '처리 메모'];
  let rows = [];
  let valid = true;

  function field(labelText, input) {
    const wrap = ui.el('div');
    const label = ui.el('label', labelText);
    label.htmlFor = input.id;
    label.style.display = 'block';
    wrap.append(label, input);
    return wrap;
  }
  function announce(message, isError = false) {
    notice.textContent = message;
    notice.className = isError ? 'notice error' : 'notice';
    notice.setAttribute('role', isError ? 'alert' : 'status');
    notice.hidden = !message;
  }
  function dateValid(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function localDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('업무의 등록 시각을 확인하세요.');
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') +
      '-' + String(date.getDate()).padStart(2, '0');
  }
  function render() {
    try {
      if (start.validity.badInput || end.validity.badInput ||
          (start.value && !dateValid(start.value)) || (end.value && !dateValid(end.value))) {
        throw new Error('등록일 기간을 실제 날짜로 입력하세요.');
      }
      if (start.value && end.value && start.value > end.value) {
        throw new Error('등록일 시작일은 종료일보다 늦을 수 없습니다.');
      }
      if (status.value && !store.statuses.includes(status.value)) throw new Error('보고서 상태를 확인하세요.');
      const selected = store.list().filter(item => {
        const createdDate = localDate(item.createdAt);
        return (!start.value || createdDate >= start.value) &&
          (!end.value || createdDate <= end.value) && (!status.value || item.status === status.value);
      });
      rows = selected.map(item => [item.id, item.title, item.category, item.assignee,
        item.status, item.priority, item.dueDate, localDate(item.createdAt),
        item.notes.map(entry => entry.text).join('\n')]);
      const counts = store.statuses.map(value => value + ' ' + selected.filter(item => item.status === value).length + '건');
      summary.textContent = '미리보기 ' + rows.length + '건 / ' + counts.join(' / ');
      preview.replaceChildren();
      if (rows.length) {
        const table = ui.table(headers, rows);
        table.querySelectorAll('td').forEach(cell => { cell.style.whiteSpace = 'pre-wrap'; });
        preview.append(table);
      } else {
        preview.append(ui.el('p', '선택한 조건에 해당하는 요청이 없습니다. 기간이나 상태를 변경해 주세요.', 'muted'));
      }
      valid = true;
      download.disabled = !rows.length;
      storageNotice.textContent = store.storageError() ?
        '저장 데이터를 읽지 못해 가상 시작 데이터를 표시하고 있습니다. 저장 오류를 확인한 뒤 보고서를 다시 확인하세요. ' + store.storageError() : '';
      storageNotice.hidden = !storageNotice.textContent;
      if (store.storageError()) download.disabled = true;
      return true;
    } catch (error) {
      rows = [];
      valid = false;
      download.disabled = true;
      summary.textContent = '보고서 조건을 확인해 주세요.';
      preview.replaceChildren();
      announce(error.message, true);
      return false;
    }
  }
  function refresh() {
    announce('');
    return render();
  }
  [start, end, status].forEach(control => control.addEventListener('change', refresh));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (refresh()) announce('선택한 조건으로 ' + rows.length + '건을 표시했습니다.');
  });
  reset.addEventListener('click', () => {
    start.value = end.value = status.value = '';
    refresh();
  });
  function csvCell(value) {
    let text = String(value ?? '');
    // Excel에서 사용자 입력을 수식으로 실행하지 않도록 텍스트로 저장합니다.
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  download.addEventListener('click', () => {
    let url;
    let anchor;
    try {
      if (!render() || !valid) return;
      if (store.storageError()) throw new Error('저장 데이터 오류를 해결한 뒤 CSV를 저장하세요.');
      if (!rows.length) throw new Error('저장할 요청이 없습니다. 보고서 조건을 변경하세요.');
      const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
      url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      anchor = ui.el('a');
      anchor.href = url;
      anchor.download = '업무보고서_' + (start.value || '전체') + '_' + (end.value || '전체') + '_' + (status.value || '전체상태') + '.csv';
      anchor.hidden = true;
      root.append(anchor);
      anchor.click();
      announce(rows.length + '건의 CSV 다운로드를 요청했습니다. 브라우저 다운로드 목록에서 파일을 확인하세요.');
    } catch (error) {
      announce('CSV를 저장하지 못했습니다. ' + error.message, true);
    } finally {
      if (anchor) anchor.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });

  toolbar.append(field('등록일 시작', start), field('등록일 종료', end), field('처리 상태', status));
  const actions = ui.el('div', undefined, 'toolbar');
  actions.style.justifyContent = 'flex-start';
  actions.style.marginTop = '16px';
  actions.append(apply, reset, download);
  form.append(toolbar, actions);
  root.replaceChildren(ui.el('p', '등록일과 상태로 요청을 모아 미리보고 한글 CSV로 저장합니다.', 'lede'),
    ui.el('p', '등록일은 이 브라우저의 현지 날짜 기준이며 시작일과 종료일을 모두 포함합니다. 기간을 비우면 전체 기간입니다.', 'muted'),
    form, notice, storageNotice, summary, preview,
    ui.el('p', 'CSV는 현재 미리보기와 같은 항목·건수를 저장합니다. 수식으로 해석될 수 있는 입력은 안전한 텍스트로 내보냅니다.', 'muted'));
  render();
  return store.subscribe(refresh);
});
