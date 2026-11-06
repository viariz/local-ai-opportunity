(function () {
  'use strict';
  var mobile = window.matchMedia('(max-width:700px)');
  var charts = document.querySelectorAll('.capability-chart');
  var commerce = document.querySelector('.agentic-commerce');
  function resize() {
    if (commerce) commerce.setAttribute('viewBox', mobile.matches ? '0 0 320 470' : '0 0 640 260');
    charts.forEach(function (chart) {
      chart.setAttribute('viewBox', mobile.matches ? '0 0 320 520' : '0 0 640 250');
    });
  }
  resize();
  if (mobile.addEventListener) mobile.addEventListener('change', resize);
  else mobile.addListener(resize);
})();
