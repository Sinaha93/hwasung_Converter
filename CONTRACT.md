# 공통 연결 약속 · v1

index.html을 직접 엽니다. 모듈 등록은 window.TeamApp.register('영역ID',(root,context)=>{...})입니다. ID는 intake/processing/dashboard/history/report. root 밖 DOM은 수정하지 않습니다. context.store는 저장소, context.ui는 화면 도우미입니다. mount는 한 번 호출되고 subscribe로 변경을 받아 다시 표시합니다.

## 요청 데이터

id, title(업무명), category(분류), assignee(담당), status(접수/진행중/보류/완료), priority(보통/높음), dueDate(YYYY-MM-DD), createdAt/updatedAt(ISO 시각), notes([{text,at}]). title/category/assignee는 1~120글자, 메모는 1~1000글자. 조회값은 복사본이라 직접 바꿔도 저장되지 않습니다.

## 동기 API

- store.list(): 요청 배열 복사본
- store.get(id): 요청 또는 null
- store.create({title,category,assignee?,priority?,dueDate}): 접수 상태 등록, 새 요청 반환
- store.update(id,{status?,assignee?,title?,category?,priority?,dueDate?}): 허용 항목만 갱신
- store.addNote(id,text): 메모 추가
- store.history(): {id,requestId,action,at,detail} 이력 복사본
- store.subscribe(callback): 변경 시 callback(snapshot), 구독 해제 함수 반환
- store.snapshot(): {schemaVersion,requests,history}
- store.statuses / store.priorities: 허용 값
- store.storageError(): 저장 오류 문장 또는 빈 문자열
- store.reset(): 초기화, 공통 버튼만 사용

잘못된 입력과 저장 실패는 Error입니다. 화면은 try/catch로 한국어 오류를 표시하고 입력을 유지합니다. 성공 시 저장 후 모든 구독에 알립니다. 등록·수정·메모 이력은 API가 자동 기록하며 모듈이 직접 쓰지 않습니다.

## UI 도우미

ui.el(tag,text,className), ui.table(headers,rows), ui.starter(root,context,{goal,file}). 사용자 값은 textContent로 표시하고 innerHTML에 넣지 않습니다. 공통 CSS는 core/styles.css입니다.

## 저장 범위

각 PC·브라우저 localStorage에 저장합니다. 여러 PC의 실시간 공동 서버가 아닙니다. GitHub에서 코드를 합친 뒤 각 PC에서 통합 기능을 확인합니다. 파일 직접 열기 저장 정책은 브라우저마다 달라 차단 시 오류를 표시합니다. 필요하면 로컬 서버로 실행합니다. 손상 데이터를 자동 덮어쓰지 않으며 확인 후 초기화로 복구합니다. 같은 브라우저 여러 탭에서 동시에 쓰는 기능은 범위 밖입니다.
