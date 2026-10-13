function makeCsv(items) {
  const escapeCell = value => '"' + String(value).replaceAll('"', '""') + '"';
  const rows = [['요청번호', '업무', '상태'], ...items.map(item => [item.id, item.task, item.status])];
  return '\uFEFF' + rows.map(row => row.map(escapeCell).join(',')).join('\r\n');
}
document.getElementById('save').disabled = false;
document.getElementById('save').addEventListener('click', () => {
  const blob = new Blob([makeCsv(window.visibleRequests)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '가상요청_현재목록.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
