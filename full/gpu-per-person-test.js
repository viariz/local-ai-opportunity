/* Test animation: large ring → many small nodes (Sankey-style curves) → four squares. Matches site figure styling. */
(function () {
  'use strict';
  var svg = document.querySelector('svg.gpu-per-person-test');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  var VB_W = 720;
  var VB_H = 240;
  var bigCx = 108;
  var bigCy = VB_H / 2;
  var bigR = 56;

  var micro = [
    [302, 78], [318, 92], [334, 74], [352, 100], [328, 114], [346, 128], [312, 130], [338, 146],
    [356, 118], [370, 96], [366, 134], [382, 112], [394, 130], [376, 152], [352, 160], [320, 156],
    [398, 98], [410, 118], [404, 146], [422, 134], [388, 74], [414, 88]
  ];

  var sq = { w: 22, h: 22 };
  var sqYs = [bigCy - 52, bigCy - 18, bigCy + 16, bigCy + 50];
  var sqX = VB_W - 54;

  function node(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function clamp(t, a, b) { return Math.max(a, Math.min(b, t)); }

  /** Point on circle at angle (deg), from +x axis. */
  function ringPoint(angleDeg) {
    var a = (angleDeg * Math.PI) / 180;
    return { x: bigCx + bigR * Math.cos(a), y: bigCy + bigR * Math.sin(a) };
  }

  /** Cubic path from (x0,y0) to (x1,y1), smooth horizontal flow like Fig. 7 / Sankey. */
  function sankeyPath(x0, y0, x1, y1, bend) {
    var dx = x1 - x0;
    var c1x = x0 + clamp(dx * 0.38, 28, 160) * bend;
    var c1y = y0;
    var c2x = x1 - clamp(dx * 0.22, 20, 110);
    var c2y = y1 + (y0 - y1) * 0.12;
    return 'M' + x0 + ',' + y0 + ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + x1 + ',' + y1;
  }

  function pathLen(el) {
    try {
      return el.getTotalLength();
    } catch (e) {
      return 200;
    }
  }

  function build() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var defs = node('defs', {});
    var gradRing = node('linearGradient', { id: 'gprt-ring-shine', x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
    gradRing.appendChild(node('stop', { offset: '0%', 'stop-color': '#e6e6e6' }));
    gradRing.appendChild(node('stop', { offset: '45%', 'stop-color': '#b8b8b8' }));
    gradRing.appendChild(node('stop', { offset: '100%', 'stop-color': '#8a8d8f' }));
    defs.appendChild(gradRing);
    svg.appendChild(defs);

    var gBg = node('g', { class: 'gprt-layer' });
    gBg.appendChild(node('rect', { x: 0, y: 0, width: VB_W, height: VB_H, fill: 'var(--paper)', rx: '4' }));
    svg.appendChild(gBg);

    var gRing = node('g', { class: 'gprt-big-ring' });
    gRing.appendChild(node('circle', { cx: bigCx, cy: bigCy, r: bigR + 5, fill: 'none', stroke: '#d6d6d6', 'stroke-width': '4' }));
    gRing.appendChild(node('circle', { cx: bigCx, cy: bigCy, r: bigR + 2.2, fill: 'none', stroke: 'var(--ink)', 'stroke-width': '1.2', 'stroke-opacity': '0.85' }));
    gRing.appendChild(node('circle', { cx: bigCx, cy: bigCy, r: bigR, fill: 'none', stroke: 'url(#gprt-ring-shine)', 'stroke-width': '2.4', 'stroke-opacity': '0.75' }));
    gRing.appendChild(node('circle', { cx: bigCx, cy: bigCy, r: bigR - 2.2, fill: 'none', stroke: 'rgba(31,33,34,0.35)', 'stroke-width': '1' }));
    svg.appendChild(gRing);

    var gMid = node('g', { class: 'gprt-micro' });
    var i;
    for (i = 0; i < micro.length; i++) {
      var mx = micro[i][0];
      var my = micro[i][1];
      gMid.appendChild(node('circle', { cx: mx, cy: my, r: 3.2, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': '1', 'stroke-opacity': '0.38' }));
    }
    svg.appendChild(gMid);

    var gSq = node('g', { class: 'gprt-squares' });
    for (i = 0; i < 4; i++) {
      var y = sqYs[i];
      var rx = 3;
      gSq.appendChild(node('rect', {
        x: sqX, y: y - sq.h / 2, width: sq.w, height: sq.h, rx: rx, ry: rx,
        fill: 'var(--wash)', stroke: 'color-mix(in srgb, var(--ink) 22%, transparent)', 'stroke-width': '1'
      }));
    }
    svg.appendChild(gSq);

    var gLinesA = node('g', { class: 'gprt-flow-a' });
    var gLinesB = node('g', { class: 'gprt-flow-b' });
    var pathsA = [];
    var pathsB = [];

    for (i = 0; i < micro.length; i++) {
      var p = micro[i];
      var angle = -28 + (72 * i) / Math.max(1, micro.length - 1);
      var rim = ringPoint(angle);
      var bend = 0.88 + (i % 5) * 0.024;
      var d1 = sankeyPath(rim.x, rim.y, p[0], p[1], bend);
      var pa = node('path', {
        d: d1, fill: 'none', stroke: 'var(--ink-soft)', 'stroke-width': '0.9', 'stroke-opacity': '0.42',
        'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke'
      });
      gLinesA.appendChild(pa);
      pathsA.push(pa);

      var sqIdx = i % 4;
      var tx = sqX - 2;
      var ty = sqYs[sqIdx];
      var bend2 = 0.92 + (i % 3) * 0.02;
      var d2 = sankeyPath(p[0], p[1], tx, ty, bend2);
      var pb = node('path', {
        d: d2, fill: 'none', stroke: 'var(--ink-soft)', 'stroke-width': '0.75', 'stroke-opacity': '0.35',
        'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke'
      });
      gLinesB.appendChild(pb);
      pathsB.push(pb);
    }

    svg.insertBefore(gLinesA, gMid);
    svg.insertBefore(gLinesB, gSq);

    var LOOP = 5200;
    var t0 = 0;
    var raf = 0;

    function applyStatic() {
      pathsA.concat(pathsB).forEach(function (p) {
        var L = pathLen(p);
        p.style.strokeDasharray = String(L);
        p.style.strokeDashoffset = '0';
        p.style.strokeOpacity = '';
      });
    }

    function applyStaticPaths(arr) {
      arr.forEach(function (p) {
        var L = pathLen(p);
        p.style.strokeDasharray = String(L);
        p.style.strokeDashoffset = '0';
        p.style.strokeOpacity = '';
      });
    }

    function phaseDraw(paths, u, start, dur) {
      var v = clamp((u - start) / dur, 0, 1);
      var w = v * v * (3 - 2 * v);
      paths.forEach(function (p, j) {
        var L = pathLen(p);
        var stagger = paths.length ? (j / paths.length) * 0.12 : 0;
        var denom = Math.max(1 - stagger, 0.001);
        var vv = clamp((w - stagger) / denom, 0, 1);
        p.style.strokeDasharray = String(L);
        p.style.strokeDashoffset = String(L * (1 - vv));
      });
    }

    function phaseFade(paths, u, start, dur, toOpacity) {
      var v = clamp((u - start) / dur, 0, 1);
      var w = v * v * (3 - 2 * v);
      paths.forEach(function (p) {
        var base = parseFloat(p.getAttribute('stroke-opacity') || '0.4');
        var cur = toOpacity + (base - toOpacity) * (1 - w);
        p.style.strokeOpacity = String(cur);
      });
    }

    function tick(now) {
      if (!t0) t0 = now;
      var u = ((now - t0) % LOOP) / LOOP;

      if (u < 0.78) {
        pathsA.concat(pathsB).forEach(function (p) { p.style.strokeOpacity = ''; });
      }

      if (u < 0.22) {
        phaseDraw(pathsA, u, 0, 0.22);
        pathsB.forEach(function (p) {
          var L = pathLen(p);
          p.style.strokeDasharray = String(L);
          p.style.strokeDashoffset = String(L);
        });
        gRing.setAttribute('transform', '');
      } else if (u < 0.46) {
        applyStaticPaths(pathsA);
        phaseDraw(pathsB, u, 0.22, 0.24);
        gRing.setAttribute('transform', '');
      } else if (u < 0.78) {
        applyStaticPaths(pathsA);
        applyStaticPaths(pathsB);
        var breathe = 1 + 0.028 * Math.sin((u - 0.46) * Math.PI * 4.2);
        gRing.setAttribute('transform', 'translate(' + bigCx + ' ' + bigCy + ') scale(' + breathe + ') translate(' + (-bigCx) + ' ' + (-bigCy) + ')');
      } else {
        applyStaticPaths(pathsA);
        applyStaticPaths(pathsB);
        gRing.setAttribute('transform', '');
        phaseFade(pathsA.concat(pathsB), u, 0.78, 0.15, 0.07);
      }

      raf = requestAnimationFrame(tick);
    }

    function startAnim() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      t0 = 0;
      gRing.setAttribute('transform', '');
      if (reduced.matches) {
        applyStatic();
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    startAnim();
    reduced.addEventListener('change', startAnim);
  }

  build();
})();
