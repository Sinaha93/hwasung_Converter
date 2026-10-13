# 동시 개발 규칙

- 가상 자료만 사용한다. README.md, CONTRACT.md와 자기 TASK.md를 먼저 읽는다.
- 각자 기능을 맡고 codex/영역 branch에서 자기 modules/영역/index.js만 수정한다. main·core·index.html·공통 문서는 합의 없이 바꾸지 않는다.
- TeamApp.register와 context.store API를 사용한다. 직접 localStorage와 history를 쓰지 않는다.
- 다른 영역이 미완성이면 가상 데이터와 smoke.html로 단독 확인한다.
- 입력 오류와 저장 실패를 한국어로 표시하고 미확인을 완료로 쓰지 않는다. 사용자 입력은 textContent로 표시한다.
- 자기 기능 개발과 PR 작성 뒤 다음 조원 PR을 검토한다. PR에 목적·담당 파일·기대/실제 결과·미확인을 기록한다.
- 다른 사람의 변경을 되돌리지 않는다. 데이터는 각 PC에 저장하고 GitHub는 코드를 합친다.
