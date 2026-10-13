window.TeamApp.register('report', (root, context) => {
  'use strict';
  return context.ui.starter(root, context, {"goal":"기간·상태별 보고서, 미리보기, 한글 CSV 저장","file":"modules/report/index.js"});
});
