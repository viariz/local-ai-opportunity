(function () {
  'use strict';
  var chart = document.querySelector('.chip-bottleneck-chart');
  var mobile = window.matchMedia('(max-width:700px)');
  function resizeChart() {
    if (chart) chart.setAttribute('viewBox', mobile.matches ? '0 0 340 535' : '0 0 700 260');
  }
  resizeChart();
  if (mobile.addEventListener) mobile.addEventListener('change', resizeChart);
  else mobile.addListener(resizeChart);
  var trigger = document.querySelector('.chip-video-trigger');
  var dialog = document.querySelector('.chip-video-dialog');
  if (!trigger || !dialog) return;
  var player = dialog.querySelector('iframe');
  trigger.addEventListener('click', function () {
    dialog.showModal();
    player.src = 'https://www.youtube-nocookie.com/embed/GVsUOuSjvcg?autoplay=1';
  });
  dialog.querySelector('.chip-video-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', function () {
    player.src = 'about:blank';
    trigger.focus({preventScroll:true});
  });
})();
