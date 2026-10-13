window.TeamApp.register('dashboard', (root, context) => {
  'use strict';

  const DEFAULT_REFERENCE_DATE = '2026-10-13';
  const { store, ui } = context;

  root.replaceChildren();

  const intro = ui.el('p', '남은 일과 지연 업무를 상태·담당별로 한눈에 확인합니다.', 'lede');
  const guide = ui.el('p', '기준일보다 마감일이 빠르고 완료되지 않은 요청을 지연 업무로 표시합니다.', 'muted');
  const storageMessage = ui.el('p');
  storageMessage.setAttribute('role', 'status');

  const toolbar = ui.el('div', undefined, 'toolbar');
  const dateGroup = ui.el('div');
  const dateLabel = ui.el('label', '지연 판단 기준일 ');
  dateLabel.htmlFor = 'dashboard-reference-date';
  const dateInput = ui.el('input');
  dateInput.id = 'dashboard-reference-date';
  dateInput.type = 'date';
  dateInput.value = DEFAULT_REFERENCE_DATE;
  dateInput.required = true;
  dateLabel.append(dateInput);
  dateGroup.append(dateLabel);

  const summary = ui.el('p', '', 'notice');
  summary.setAttribute('role', 'status');
  toolbar.append(dateGroup, summary);

  const statusSection = ui.el('section');
  statusSection.append(ui.el('h3', '상태별 현황'));
  const statusResult = ui.el('div');
  statusSection.append(statusResult);

  const assigneeSection = ui.el('section');
  assigneeSection.append(ui.el('h3', '담당별 현황'));
  const assigneeResult = ui.el('div');
  assigneeSection.append(assigneeResult);

  const overdueSection = ui.el('section');
  overdueSection.append(ui.el('h3', '미완료 지연 업무'));
  const overdueResult = ui.el('div');
  overdueSection.append(overdueResult);

  root.append(intro, guide, storageMessage, toolbar, statusSection, assigneeSection, overdueSection);

  function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function daysBetween(from, to) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / millisecondsPerDay);
  }

  function countsBy(items, key) {
    const counts = new Map();
    for (const item of items) counts.set(item[key], (counts.get(item[key]) || 0) + 1);
    return counts;
  }

  function showStorageState() {
    const error = store.storageError();
    storageMessage.textContent = error || '현황판은 이 PC·브라우저에 저장된 요청을 조회합니다.';
    storageMessage.className = error ? 'error' : 'muted';
  }

  function showDateError(message) {
    summary.textContent = message;
    summary.className = 'error';
    overdueResult.replaceChildren(ui.el('p', '기준일을 확인하면 지연 업무가 표시됩니다.', 'muted'));
  }

  function render() {
    showStorageState();

    const referenceDate = dateInput.value;
    if (!isValidDate(referenceDate)) {
      showDateError('기준일을 YYYY-MM-DD 형식의 실제 날짜로 선택하세요.');
      return;
    }

    try {
      const requests = store.list();
      const statusCounts = countsBy(requests, 'status');
      const assigneeCounts = countsBy(requests, 'assignee');
      const overdue = requests
        .filter(item => item.status !== '완료' && item.dueDate < referenceDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));

      summary.className = 'notice';
      summary.textContent = '전체 ' + requests.length + '건 · 미완료 ' + requests.filter(item => item.status !== '완료').length + '건 · 지연 ' + overdue.length + '건';

      statusResult.replaceChildren(ui.table(
        ['상태', '건수'],
        store.statuses.map(status => [status, statusCounts.get(status) || 0])
      ));

      const assigneeRows = [...assigneeCounts.entries()]
        .sort(([left], [right]) => left.localeCompare(right, 'ko'))
        .map(([assignee, count]) => [assignee, count]);
      assigneeResult.replaceChildren(
        assigneeRows.length
          ? ui.table(['담당', '건수'], assigneeRows)
          : ui.el('p', '표시할 담당별 요청이 없습니다.', 'muted')
      );

      overdueResult.replaceChildren(
        overdue.length
          ? ui.table(
              ['요청번호', '업무', '담당', '상태', '마감일', '지연'],
              overdue.map(item => [item.id, item.title, item.assignee, item.status, item.dueDate, daysBetween(item.dueDate, referenceDate) + '일'])
            )
          : ui.el('p', referenceDate + ' 기준 미완료 지연 업무가 없습니다.', 'notice')
      );
    } catch (error) {
      summary.textContent = '현황을 불러오지 못했습니다.';
      summary.className = 'error';
      statusResult.replaceChildren(ui.el('p', '상태별 현황을 표시하지 못했습니다. ' + error.message, 'error'));
      assigneeResult.replaceChildren();
      overdueResult.replaceChildren();
    }
  }

  dateInput.addEventListener('input', render);
  render();
  return store.subscribe(render);
});
