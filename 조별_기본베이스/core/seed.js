(() => {
  'use strict';
  window.TeamSeed = {
    schemaVersion: 1,
    requests: [
      { id: 'REQ-001', title: '교육장 준비 요청', category: '지원', assignee: '담당 A', status: '접수', priority: '보통', dueDate: '2026-10-16', createdAt: '2026-10-12T09:00:00.000Z', updatedAt: '2026-10-12T09:00:00.000Z', notes: [] },
      { id: 'REQ-002', title: '가상 안내문 확인', category: '문서', assignee: '담당 B', status: '진행중', priority: '높음', dueDate: '2026-10-12', createdAt: '2026-10-11T09:00:00.000Z', updatedAt: '2026-10-12T09:00:00.000Z', notes: [{ text: '초안 확인 중', at: '2026-10-12T09:00:00.000Z' }] },
      { id: 'REQ-003', title: '공개 샘플 목록 정리', category: '자료', assignee: '담당 C', status: '완료', priority: '보통', dueDate: '2026-10-14', createdAt: '2026-10-10T09:00:00.000Z', updatedAt: '2026-10-12T10:00:00.000Z', notes: [] },
      { id: 'REQ-004', title: '연습 장비 점검', category: '지원', assignee: '미배정', status: '보류', priority: '보통', dueDate: '2026-10-18', createdAt: '2026-10-12T09:00:00.000Z', updatedAt: '2026-10-12T09:00:00.000Z', notes: [] }
    ],
    history: [{ id: 'EVT-SEED', requestId: 'REQ-002', action: '수정', at: '2026-10-12T09:00:00.000Z', detail: '가상 시작 데이터: 진행중으로 변경' }]
  };
})();
