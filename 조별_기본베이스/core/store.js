(() => {
  'use strict';
  const KEY = 'bteam-parallel-base-v1';
  const copy = value => JSON.parse(JSON.stringify(value));
  const listeners = new Set();
  const statuses = ['접수', '진행중', '보류', '완료'];
  const priorities = ['보통', '높음'];
  const dateValid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  function validate(record) {
    if (!record || typeof record !== 'object') throw new Error('요청 데이터가 올바르지 않습니다.');
    for (const key of ['title', 'category', 'assignee']) {
      if (typeof record[key] !== 'string' || !record[key].trim() || record[key].length > 120) throw new Error(key + ': 1~120글자를 입력하세요.');
    }
    if (!statuses.includes(record.status) || !priorities.includes(record.priority)) throw new Error('상태 또는 우선순위를 확인하세요.');
    if (!dateValid(record.dueDate)) throw new Error('마감일은 실제 날짜 YYYY-MM-DD로 입력하세요.');
    if (!Array.isArray(record.notes) || record.notes.some(note => typeof note.text !== 'string' || typeof note.at !== 'string')) throw new Error('처리 메모 형식을 확인하세요.');
  }
  function validateState(value) {
    if (!value || value.schemaVersion !== 1 || !Array.isArray(value.requests) || !Array.isArray(value.history)) throw new Error('저장 데이터 형식이 다릅니다. 초기화 전에 기록을 확인하세요.');
    const ids = new Set();
    for (const record of value.requests) {
      validate(record);
      if (typeof record.id !== 'string' || !record.id || ids.has(record.id)) throw new Error('요청번호가 중복되거나 없습니다.');
      ids.add(record.id);
    }
    for (const event of value.history) {
      if (typeof event.id !== 'string' || typeof event.requestId !== 'string' || typeof event.action !== 'string' || typeof event.at !== 'string' || typeof event.detail !== 'string') throw new Error('변경 이력 형식이 다릅니다.');
    }
    return value;
  }
  let state = copy(window.TeamSeed);
  let storageError = '';
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) state = validateState(JSON.parse(saved));
  } catch (error) {
    storageError = '저장 데이터를 읽지 못했습니다. 원본은 유지되며 저장 작업은 차단됩니다. ' + error.message;
  }
  function notify() {
    for (const callback of listeners) {
      try { callback(copy(state)); } catch (error) { console.error('영역 갱신 실패', error); }
    }
  }
  function commit(next) {
    if (storageError) throw new Error(storageError);
    validateState(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); }
    catch (error) { throw new Error('저장하지 못했습니다. 변경은 적용되지 않았습니다. ' + error.message); }
    state = next;
    notify();
  }
  function eventFor(requestId, action, detail, at) {
    return { id: 'EVT-' + crypto.randomUUID(), requestId, action, detail, at };
  }
  const api = {
    statuses: Object.freeze(statuses), priorities: Object.freeze(priorities),
    list: () => copy(state.requests),
    get: id => copy(state.requests.find(item => item.id === id) || null),
    history: () => copy(state.history),
    snapshot: () => copy(state),
    storageError: () => storageError,
    subscribe(callback) { listeners.add(callback); return () => listeners.delete(callback); },
    create(input) {
      if (!input || typeof input !== 'object') throw new Error('접수 입력이 없습니다.');
      const at = new Date().toISOString();
      const item = { id: 'REQ-' + crypto.randomUUID(), title: input.title, category: input.category, assignee: input.assignee || '미배정', status: '접수', priority: input.priority || '보통', dueDate: input.dueDate, createdAt: at, updatedAt: at, notes: [] };
      validate(item);
      const next = copy(state);
      next.requests.push(item);
      next.history.push(eventFor(item.id, '등록', item.title, at));
      commit(next);
      return copy(item);
    },
    update(id, patch) {
      if (!patch || typeof patch !== 'object') throw new Error('변경 내용이 없습니다.');
      const next = copy(state);
      const item = next.requests.find(record => record.id === id);
      if (!item) throw new Error('요청을 찾지 못했습니다.');
      const allowed = ['title', 'category', 'assignee', 'status', 'priority', 'dueDate'];
      if (Object.keys(patch).some(key => !allowed.includes(key))) throw new Error('허용되지 않은 변경 항목입니다.');
      Object.assign(item, patch, { updatedAt: new Date().toISOString() });
      validate(item);
      next.history.push(eventFor(id, '수정', Object.keys(patch).join(', '), item.updatedAt));
      commit(next);
      return copy(item);
    },
    addNote(id, text) {
      if (typeof text !== 'string' || !text.trim() || text.length > 1000) throw new Error('메모는 1~1000글자입니다.');
      const next = copy(state);
      const item = next.requests.find(record => record.id === id);
      if (!item) throw new Error('요청을 찾지 못했습니다.');
      const at = new Date().toISOString();
      item.notes.push({ text: text.trim(), at });
      item.updatedAt = at;
      next.history.push(eventFor(id, '메모', text.trim(), at));
      commit(next);
      return copy(item);
    },
    reset() {
      const next = copy(window.TeamSeed);
      localStorage.setItem(KEY, JSON.stringify(next));
      storageError = '';
      state = next;
      notify();
    }
  };
  window.TeamStore = Object.freeze(api);
})();
