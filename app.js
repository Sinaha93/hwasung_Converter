window.visibleRequests = window.requests.slice();
function renderRequests() {
  const body = document.getElementById('rows');
  body.replaceChildren();
  for (const item of window.visibleRequests) {
    const row = document.createElement('tr');
    for (const value of [item.id, item.task, item.status]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  }
  document.getElementById('count').textContent = window.visibleRequests.length + '건';
}
renderRequests();
