/* Unmet cloud demand dissolves into particles and flows into personal computers. */
(function () {
  'use strict';
  var svg = document.querySelector('svg.gap-absorb');
  if (!svg) return;
  var figure = svg.closest('figure');
  var replay = figure.querySelector('.gap-replay');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NS = 'http://www.w3.org/2000/svg';
  var DEMAND = [[40.0, 360.9], [55.5, 360.1], [71.0, 359.1], [86.5, 358.1], [102.0, 357.0], [117.5, 355.8], [133.0, 354.4], [148.5, 353.0], [164.0, 351.4], [179.5, 349.6], [195.0, 347.7], [210.5, 345.6], [226.0, 343.3], [241.5, 340.8], [257.0, 338.0], [272.5, 335.0], [288.0, 331.7], [303.5, 328.1], [319.0, 324.2], [334.5, 319.9], [350.0, 315.1], [365.5, 310.0], [381.0, 304.3], [396.5, 298.1], [412.0, 291.4], [427.5, 284.0], [443.0, 275.9], [458.5, 267.0], [474.0, 257.3], [489.5, 246.7], [505.0, 235.1], [520.5, 222.4], [536.0, 208.5], [551.5, 193.3], [567.0, 176.6], [582.5, 158.4], [598.0, 138.5], [613.5, 116.7], [629.0, 92.8], [644.5, 66.7], [660.0, 38.2]];
  var SUPPLY = [[40.0, 360.9], [55.5, 359.5], [71.0, 358.2], [86.5, 356.9], [102.0, 355.7], [117.5, 354.5], [133.0, 353.4], [148.5, 352.4], [164.0, 351.4], [179.5, 350.4], [195.0, 349.5], [210.5, 348.7], [226.0, 347.8], [241.5, 347.1], [257.0, 346.3], [272.5, 345.6], [288.0, 345.0], [303.5, 344.3], [319.0, 343.7], [334.5, 343.1], [350.0, 342.6], [365.5, 342.1], [381.0, 341.6], [396.5, 341.1], [412.0, 340.7], [427.5, 340.2], [443.0, 339.8], [458.5, 339.4], [474.0, 339.1], [489.5, 338.7], [505.0, 338.4], [520.5, 338.1], [536.0, 337.8], [551.5, 337.5], [567.0, 337.2], [582.5, 337.0], [598.0, 336.7], [613.5, 336.5], [629.0, 336.3], [644.5, 336.0], [660.0, 335.8]];
  var SHELL = "M29.9733 0.000381872C37.2159 0.0188329 42.4027 0.518861 48.322 2.77829C56.9007 6.05566 61.3379 13.928 59.6433 22.7564C58.1427 30.5812 52.8422 34.6482 45.0715 33.9157C42.1649 33.6891 39.286 33.1762 36.4743 32.384C32.1887 31.0618 27.623 31.0469 23.3292 32.3412C20.5929 33.1022 17.7935 33.5975 14.9675 33.8205C6.34265 34.6672 0.414228 29.3968 0.0217687 20.478C-0.366073 11.74 4.44501 5.03298 13.1391 2.24555C18.6012 0.52362 23.3444 -0.0165062 29.9733 0.000381872Z";
  var draw = function () {};
  var elapsed = 0, last = null, raf = 0;
  var visible = false;
  var LOOP = 14;

  function node(tag, attrs, text) {
    var result = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { result.setAttribute(key, attrs[key]); });
    if (text) result.textContent = text;
    return result;
  }
  function clamp(t) { return Math.max(0, Math.min(1, t)); }
  function ease(t) { t = clamp(t); return t * t * (3 - 2 * t); }
  function yAt(line, x) {
    for (var i = 1; i < line.length; i++) {
      if (x <= line[i][0]) {
        var a = line[i - 1], b = line[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      }
    }
    return line[line.length - 1][1];
  }

  function prepare() {
    var width = Math.max(250, Math.round(figure.getBoundingClientRect().width));
    var mobile = width < 500;
    var height = mobile ? 460 : 420;
    var left = mobile ? 20 : 40, right = width - left;
    var top = 42, base = height - 70;
    var font = mobile ? 11 : 12;
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.replaceChildren();
    function xMap(x) { return left + (x - 40) / 620 * (right - left); }
    function yMap(y) { return top + (y - 25) / 345 * (base - top); }
    function linePath(points) { return points.map(function (p, i) { return (i ? 'L ' : 'M ') + xMap(p[0]) + ' ' + yMap(p[1]); }).join(' '); }
    function text(parent, x, y, content, size, attrs) {
      var result = node('text', Object.assign({ x: x, y: y, 'font-size': size }, attrs || {}), content);
      parent.appendChild(result);
      return result;
    }
    var chart = node('g', { class: 'gap-chart-backdrop' });
    svg.appendChild(chart);
    // The entire chart is one fading layer: no axes or gridlines survive the transition.
    [0, .5, 1].forEach(function (t) {
      chart.appendChild(node('line', { x1: left, x2: right, y1: top + t * (base - top), y2: top + t * (base - top), stroke: 'var(--rule)', 'stroke-width': .7, opacity: .4 }));
    });
    var wedge = DEMAND.filter(function (p) { return p[0] >= 221; }).concat(SUPPLY.filter(function (p) { return p[0] >= 221; }).slice().reverse());
    var gap = node('path', { d: linePath(wedge) + ' Z', fill: 'var(--ink)', 'fill-opacity': .1, stroke: 'none', class: 'gap-area' });
    chart.appendChild(gap);
    chart.appendChild(node('path', { d: linePath(DEMAND), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.3, opacity: .55 }));
    chart.appendChild(node('path', { d: linePath(SUPPLY), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.1, opacity: .4 }));
    text(chart, right, top - 8, 'Token demand', font, { 'text-anchor': 'end', fill: 'var(--ink-soft)' });
    text(chart, right, base + 15, 'Cloud supply', font, { 'text-anchor': 'end', fill: 'var(--ink-soft)' });
    var title = node('g', { class: 'gap-source-label' });
    svg.appendChild(title);
    text(title, left + 8, top + 54, '100 GW', mobile ? 25 : 29);
    text(title, left + 8, top + 76, 'of unmet cloud demand', font, { fill: 'var(--ink-soft)' });

    var destination = node('g', { class: 'gap-computers' });
    svg.appendChild(destination);
    var devices = [];
    var cols = mobile ? 8 : 16, rows = mobile ? 10 : 7;
    var xStart = mobile ? 30 : 42;
    var xEnd = width - xStart;
    var yStart = mobile ? 66 : 72;
    var yEnd = height - 102;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var x = xStart + col * (xEnd - xStart) / (cols - 1);
        var y = yStart + row * (yEnd - yStart) / (rows - 1);
        var shellScale = mobile ? .28 : .4;
        var g = node('g', { class: 'gap-computer' });
        g.appendChild(node('path', { d: SHELL, transform: 'translate(' + (-30 * shellScale) + ' ' + (-17 * shellScale) + ') scale(' + shellScale + ')', fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': .8 / shellScale, 'stroke-opacity': .6, 'stroke-linejoin': 'round' }));
        destination.appendChild(g);
        devices.push({ x: x, y: y, node: g, delay: (1 - col / (cols - 1)) * .8 + row * .025, phase: row * .45 + col * .24 });
      }
    }
    var summary = node('g', { class: 'gap-destination-label' });
    svg.appendChild(summary);
    text(summary, width / 2, height - 32, 'A billion personal computers', mobile ? 18 : 22, { 'text-anchor': 'middle' });

    var particleLayer = node('g', { class: 'gap-particles', fill: 'var(--ink)' });
    svg.insertBefore(particleLayer, destination);
    var seed = 17;
    function random() { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }
    var particles = [];
    var count = mobile ? 320 : 480;
    while (particles.length < count) {
      var px = 226 + random() * 434;
      var py = 25 + random() * 330;
      if (py < yAt(DEMAND, px) || py > yAt(SUPPLY, px)) continue;
      particles.push({ sx: xMap(px), sy: yMap(py) });
    }
    particles.sort(function (a, b) { return a.sx - b.sx; });
    particles.forEach(function (p, i) {
      var device = devices[Math.floor(i * devices.length / count)];
      p.tx = device.x + (random() - .5) * 10;
      p.ty = device.y + (random() - .5) * 5;
      p.delay = 2.35 + device.delay + random() * .4;
      p.duration = 2.2 + random() * .65;
      p.bend = 25 + random() * 45;
      p.node = node('circle', { r: mobile ? 1.25 : 1.35, cx: p.sx, cy: p.sy, opacity: 0 });
      particleLayer.appendChild(p.node);
    });
    function bezier(a, b, c, d, t) {
      var q = 1 - t;
      return q * q * q * a + 3 * q * q * t * b + 3 * q * t * t * c + t * t * t * d;
    }

    draw = function (time, still) {
      var t = still ? 8 : time;
      var ending = still ? 1 : 1 - ease((t - 12.8) / 1.2);
      var appear = still ? 1 : ease(t / .65);
      var dissolve = ease((t - 1.65) / .9);
      chart.setAttribute('opacity', (1 - ease((t - 2.1) / 1.35)) * appear);
      gap.setAttribute('fill-opacity', .1 * (1 - dissolve));
      title.setAttribute('opacity', appear * (1 - ease((t - 2) / .8)));
      particles.forEach(function (p) {
        var u = clamp((t - p.delay) / p.duration);
        var travel = ease(u);
        var px = bezier(p.sx, p.sx - p.bend, p.tx + p.bend, p.tx, travel);
        var py = bezier(p.sy, p.sy - 25, p.ty - 45, p.ty, travel);
        p.node.setAttribute('cx', px);
        p.node.setAttribute('cy', py);
        p.node.setAttribute('opacity', dissolve * (1 - ease((u - .82) / .18)) * .65 * ending);
      });
      devices.forEach(function (d) {
        var arrive = ease((t - 3.9 - d.delay) / 1.9);
        var floatY = still ? 0 : Math.sin(t * .65 + d.phase) * .8 * arrive;
        var scale = .86 + .14 * arrive;
        d.node.setAttribute('transform', 'translate(' + d.x + ' ' + (d.y + floatY) + ') scale(' + scale + ')');
        d.node.setAttribute('opacity', arrive * ending);
      });
      summary.setAttribute('opacity', ease((t - 5.9) / .8) * ending);
      svg.setAttribute('data-motion-phase', t < 2.1 ? 'demand' : t < 6.7 ? 'distributing' : 'distributed');
    };
    draw(reduced.matches ? 8 : elapsed, reduced.matches);
  }

  function frame(now) {
    if (!visible || document.hidden || reduced.matches) { raf = 0; last = null; return; }
    if (last !== null) elapsed = (elapsed + Math.min(.1, (now - last) / 1000)) % LOOP;
    last = now;
    draw(elapsed, false);
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = null; }
  function run() {
    if (reduced.matches) { draw(8, true); return; }
    if (visible && !document.hidden && !raf) raf = requestAnimationFrame(frame);
  }
  replay.addEventListener('click', function () {
    elapsed = 0;
    last = null;
    draw(reduced.matches ? 8 : 0, reduced.matches);
    run();
  });
  new ResizeObserver(prepare).observe(figure);
  prepare();
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) run(); else stop();
  }, { threshold: .25 }).observe(svg);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });
  reduced.addEventListener('change', function () { stop(); draw(reduced.matches ? 8 : elapsed, reduced.matches); run(); });
})();
