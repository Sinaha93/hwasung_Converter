# Codex에서 Branch 확인하기

1. 프로젝트의 작업 폴더를 확인합니다.
2. Codex에 현재 branch와 미기록 변경을 읽어 달라고 요청합니다.
3. README 작업 branch를 만들거나 가져와 전환한 뒤 이름을 확인합니다.
4. commit·push 후 GitHub의 같은 branch에서 변경을 확인합니다.
5. PR 병합 후 내 PC의 main도 갱신하고 재실행합니다.

대화 제목·GitHub 웹의 branch 선택·내 PC의 실제 작업 branch는 서로 다른 정보입니다. 같은 폴더의 새 대화가 자동으로 별도 branch를 만들지는 않습니다.

## Worktree 연결

공식 안내에서 Worktree 생성 시 시작 branch를 고릅니다. 실제 Worktree는 기본적으로 특정 commit의 분리 상태(detached HEAD)로 시작할 수 있습니다. PR을 이어갈 때 Create branch here로 작업 branch를 만들고 commit·push합니다. Handoff는 Local과 Worktree 사이에서 작업 위치를 옮기는 기능이며 PR 병합과 다릅니다. 버튼 위치·지원 여부는 교육 PC에서 확인합니다.

출처·확인일: 2026-10-07

- [OpenAI 공식 Worktree 안내](https://learn.chatgpt.com/docs/environments/git-worktrees)
- 현재 branch는 교육 PC의 실제 저장소 상태를 Codex가 확인한 결과로 판단합니다. 이 자료의 카드 도식은 개념 예시이며 앱 화면 캡처가 아닙니다.
