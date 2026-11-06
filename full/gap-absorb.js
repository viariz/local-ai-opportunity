/* Chart fades (no curve warp); grid stays. Short in/out transitions; long middle field; dots spawn on outline + fill; return lerps home; dot opacity 0 at leave/rejoin. */
(function () {
  'use strict';
  var svg = document.querySelector('svg.gap-absorb');
  if (!svg) return;
  var figure = svg.closest('figure');
  if (!figure) return;
  var replay = figure.querySelector('.gap-replay');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NS = 'http://www.w3.org/2000/svg';
  var DEMAND = [[40.0, 360.9], [55.5, 360.1], [71.0, 359.1], [86.5, 358.1], [102.0, 357.0], [117.5, 355.8], [133.0, 354.4], [148.5, 353.0], [164.0, 351.4], [179.5, 349.6], [195.0, 347.7], [210.5, 345.6], [226.0, 343.3], [241.5, 340.8], [257.0, 338.0], [272.5, 335.0], [288.0, 331.7], [303.5, 328.1], [319.0, 324.2], [334.5, 319.9], [350.0, 315.1], [365.5, 310.0], [381.0, 304.3], [396.5, 298.1], [412.0, 291.4], [427.5, 284.0], [443.0, 275.9], [458.5, 267.0], [474.0, 257.3], [489.5, 246.7], [505.0, 235.1], [520.5, 222.4], [536.0, 208.5], [551.5, 193.3], [567.0, 176.6], [582.5, 158.4], [598.0, 138.5], [613.5, 116.7], [629.0, 92.8], [644.5, 66.7], [660.0, 38.2]];
  var SUPPLY = [[40.0, 360.9], [55.5, 359.5], [71.0, 358.2], [86.5, 356.9], [102.0, 355.7], [117.5, 354.5], [133.0, 353.4], [148.5, 352.4], [164.0, 351.4], [179.5, 350.4], [195.0, 349.5], [210.5, 348.7], [226.0, 347.8], [241.5, 347.1], [257.0, 346.3], [272.5, 345.6], [288.0, 345.0], [303.5, 344.3], [319.0, 343.7], [334.5, 343.1], [350.0, 342.6], [365.5, 342.1], [381.0, 341.6], [396.5, 341.1], [412.0, 340.7], [427.5, 340.2], [443.0, 339.8], [458.5, 339.4], [474.0, 339.1], [489.5, 338.7], [505.0, 338.4], [520.5, 338.1], [536.0, 337.8], [551.5, 337.5], [567.0, 337.2], [582.5, 337.0], [598.0, 336.7], [613.5, 336.5], [629.0, 336.3], [644.5, 336.0], [660.0, 335.8]];

  var draw = function () {};
  var elapsed = 0;
  var last = null;
  var raf = 0;
  var visible = false;
  /**
   * Seconds. Dot flight duration (slower = larger FLIGHT_DUR only; path math unchanged).
   * The restored chart holds before the loop plays again.
   * Labels are fully gone before either flight, and return only after the flight home finishes.
   * The caption waits until the outbound flight has landed.
   */
  var TEXT_OUT_START = 0.45;
  var TEXT_OUT_DUR = 0.8;
  var GAP_AFTER_TEXT = 0.32;
  var FLIGHT_DUR = 2.35;
  var CHART_DUR = 1.08;
  var CAP_DELAY = 0.95;
  var CAP_FADE = 0.6;
  var FIELD_AFTER_LEAVE = 12.9;
  var CAP_OUT_DUR = 0.45;
  var GAP_BEFORE_RETURN = 0.24;
  var GAP_BEFORE_TEXT = 0.32;
  var TEXT_IN_DUR = 0.8;
  var IDLE_AFTER = 3.5;
  var textOut0 = TEXT_OUT_START;
  var textOut1 = textOut0 + TEXT_OUT_DUR;
  var leave0 = textOut1 + GAP_AFTER_TEXT;
  var leave1 = leave0 + FLIGHT_DUR;
  var chartOut0 = leave0;
  var chartOut1 = leave0 + CHART_DUR;
  var capIn0 = leave1 + CAP_DELAY;
  var capIn1 = capIn0 + CAP_FADE;
  var capOut0 = leave1 + FIELD_AFTER_LEAVE;
  var capOut1 = capOut0 + CAP_OUT_DUR;
  var ret0 = capOut1 + GAP_BEFORE_RETURN;
  var ret1 = ret0 + FLIGHT_DUR;
  var chartIn0 = ret0;
  var chartIn1 = ret0 + CHART_DUR;
  var textIn0 = ret1 + GAP_BEFORE_TEXT;
  var textIn1 = textIn0 + TEXT_IN_DUR;
  var LOOP = textIn1 + IDLE_AFTER;
  var bucketSize = 42;
  var buckets = {};
  var particlesRef = [];

  function node(tag, attrs, text) {
    var result = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { result.setAttribute(key, attrs[key]); });
    if (text) result.textContent = text;
    return result;
  }
  function clamp(t) { return Math.max(0, Math.min(1, t)); }
  function smootherstep(t) {
    t = clamp(t);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function smoothrange(u, a, b) { return smootherstep((u - a) / (b - a)); }
  function softBlend(u, a, b) { return smootherstep((clamp(u) - a) / (b - a)); }
  /** Same ease as softBlend, for clocks in seconds. softBlend clamps its input to 0–1. */
  function ramp(t, a, b) { return smootherstep((t - a) / (b - a)); }
  function structuredDisplacement(px, py, seed, tSec, fLeft, fTop, frameW, frameH, mobile, phase) {
    var ph = clamp(phase);
    var s = Math.sin;
    var c = Math.cos;
    var lx = (px - fLeft) / Math.max(frameW, 1);
    var ly = (py - fTop) / Math.max(frameH, 1);
    var nx = clamp(lx);
    var ny = clamp(ly);
    var amp = (mobile ? 0.92 : 1) * (0.35 + 0.65 * ph);
    var band1 = s(ny * 9.2 - tSec * 1.05 + seed * 0.4);
    var band2 = c(ny * 14.5 + tSec * 0.72 + seed * 1.1);
    var shear = s(nx * 6.8 + tSec * 0.55 + seed * 0.6);
    var ox = (band1 * 28 + band2 * 14 + shear * 18) * amp;
    var oy = (s(nx * 7.5 + tSec * 0.88 + seed) * 22 + c((nx + ny) * 11 + tSec * 0.65) * 16) * amp;
    var ridge = s((nx - ny) * 18 + tSec * 1.12);
    ox += ridge * (10 + 8 * ph) * amp;
    oy -= ridge * (6 + 5 * ph) * amp;
    var drift = s(tSec * 0.31 + seed * 2);
    ox += drift * 7 * ph * amp;
    oy += c(tSec * 0.27 + seed * 1.7) * 6 * ph * amp;
    return { ox: ox, oy: oy };
  }

  function repulsionShift(p, i, mobile, strength) {
    if (strength < 0.02) return { rx: 0, ry: 0 };
    var bx = Math.floor(p.px / bucketSize);
    var by = Math.floor(p.py / bucketSize);
    var rx = 0;
    var ry = 0;
    var minD2 = (mobile ? 32 : 36) * (mobile ? 32 : 36);
    for (var ddx = -1; ddx <= 1; ddx++) {
      for (var ddy = -1; ddy <= 1; ddy++) {
        var list = buckets[(bx + ddx) + ',' + (by + ddy)];
        if (!list) continue;
        for (var k = 0; k < list.length; k++) {
          var j = list[k];
          if (j === i) continue;
          var q = particlesRef[j];
          var dx = p.px - q.px;
          var dy = p.py - q.py;
          var d2 = dx * dx + dy * dy;
          if (d2 < minD2 && d2 > 0.01) {
            var inv = 1 / d2;
            rx += dx * inv;
            ry += dy * inv;
          }
        }
      }
    }
    return { rx: rx * strength * (mobile ? 1.6 : 2.1), ry: ry * strength * (mobile ? 1.6 : 2.1) };
  }

  /** Evenly sample { frac } in [0,1) along polyline length (open path). */
  function outlineFractions(pts, n) {
    if (pts.length < 2) return [];
    var segLen = [];
    var total = 0;
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i].x - pts[i - 1].x;
      var dy = pts[i].y - pts[i - 1].y;
      var L = Math.sqrt(dx * dx + dy * dy);
      segLen.push(L);
      total += L;
    }
    var fracs = [];
    if (total < 1e-6) {
      for (var z = 0; z < n; z++) fracs.push(z / Math.max(1, n));
      return fracs;
    }
    for (var k = 0; k < n; k++) {
      var dist = ((k + 0.5) / n) * total;
      var acc = 0;
      var si = 0;
      while (si < segLen.length && acc + segLen[si] < dist) {
        acc += segLen[si];
        si++;
      }
      var segFrac = si < segLen.length && segLen[si] > 1e-6 ? (dist - acc) / segLen[si] : 0;
      fracs.push((si + segFrac) / (pts.length - 1));
    }
    return fracs;
  }

  function pointOnPolyline(pts, frac) {
    if (pts.length < 2) return { x: pts[0].x, y: pts[0].y };
    var f = clamp(frac) * (pts.length - 1);
    var i0 = Math.floor(f);
    var i1 = Math.min(pts.length - 1, i0 + 1);
    var t = f - i0;
    return {
      x: pts[i0].x + (pts[i1].x - pts[i0].x) * t,
      y: pts[i0].y + (pts[i1].y - pts[i0].y) * t
    };
  }

  /** Ray-cast; poly is open ring, last != first. */
  function pointInPolygon(px, py, poly) {
    if (!poly.length) return false;
    var inside = false;
    var n = poly.length;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = poly[i].x;
      var yi = poly[i].y;
      var xj = poly[j].x;
      var yj = poly[j].y;
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi) inside = !inside;
    }
    return inside;
  }

  function polygonBounds(poly) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    for (var i = 0; i < poly.length; i++) {
      var q = poly[i];
      minX = Math.min(minX, q.x);
      minY = Math.min(minY, q.y);
      maxX = Math.max(maxX, q.x);
      maxY = Math.max(maxY, q.y);
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  function prepare() {
    var width = Math.max(250, Math.round(figure.getBoundingClientRect().width));
    var mobile = width < 500;
    var height = mobile ? 460 : 420;
    var left = mobile ? 20 : 40;
    var right = width - left;
    var top = 42;
    var base = height - 70;
    var font = mobile ? 11 : 12;
    var padX = mobile ? 10 : 14;
    var padY = mobile ? 8 : 10;
    var fLeft = left + padX;
    var fRight = right - padX;
    var fTop = top + padY;
    var fBase = base - padY;
    var frameW = fRight - fLeft;
    var frameH = fBase - fTop;

    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.replaceChildren();

    var defs = node('defs');
    var grad = node('linearGradient', {
      id: 'gap-shimmer-grad',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '0%',
      gradientUnits: 'objectBoundingBox'
    });
    grad.appendChild(node('stop', { offset: '0%', 'stop-color': 'var(--ink-soft)', 'stop-opacity': '0.55' }));
    grad.appendChild(node('stop', { offset: '45%', 'stop-color': 'var(--ink)', 'stop-opacity': '1' }));
    grad.appendChild(node('stop', { offset: '100%', 'stop-color': 'var(--ink-soft)', 'stop-opacity': '0.55' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    function xMap(x) { return left + (x - 40) / 620 * (right - left); }
    function yMap(y) { return top + (y - 25) / 345 * (base - top); }
    function linePath(points) {
      return points.map(function (p, i) { return (i ? 'L ' : 'M ') + xMap(p[0]) + ' ' + yMap(p[1]); }).join(' ');
    }
    function text(parent, x, y, content, size, attrs) {
      var result = node('text', Object.assign({ x: x, y: y, 'font-size': size }, attrs || {}), content);
      parent.appendChild(result);
      return result;
    }

    /** Static: grid + axis labels (axis labels fade with motion). */
    var staticBackdrop = node('g', { class: 'gap-chart-static' });
    svg.appendChild(staticBackdrop);
    [0, 0.5, 1].forEach(function (t) {
      staticBackdrop.appendChild(node('line', {
        x1: left,
        x2: right,
        y1: top + t * (base - top),
        y2: top + t * (base - top),
        stroke: 'var(--rule)',
        'stroke-width': 0.7,
        opacity: 0.4
      }));
    });
    var axisLabels = node('g', { class: 'gap-axis-labels' });
    staticBackdrop.appendChild(axisLabels);
    text(axisLabels, right, top - 8, 'Token demand', font, { 'text-anchor': 'end', fill: 'var(--ink-soft)' });
    text(axisLabels, right, base + 15, 'Cloud supply', font, { 'text-anchor': 'end', fill: 'var(--ink-soft)' });

    /** Animated curves only. */
    var curvesGroup = node('g', { class: 'gap-chart-curves' });
    svg.appendChild(curvesGroup);
    var wedge = DEMAND.filter(function (p) { return p[0] >= 221; }).concat(SUPPLY.filter(function (p) { return p[0] >= 221; }).slice().reverse());
    var wedgePtsOpen = wedge.map(function (p) { return { x: xMap(p[0]), y: yMap(p[1]) }; });
    var wedgeBbox = polygonBounds(wedgePtsOpen);

    var gap = node('path', {
      d: linePath(wedge) + ' Z',
      fill: 'var(--ink)',
      'fill-opacity': 0.1,
      stroke: 'none',
      class: 'gap-area'
    });
    curvesGroup.appendChild(gap);
    var demandPath = node('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.3, opacity: 0.55, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var supplyPath = node('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.1, opacity: 0.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    curvesGroup.appendChild(demandPath);
    curvesGroup.appendChild(supplyPath);
    var demandD = linePath(DEMAND);
    var supplyD = linePath(SUPPLY);
    var gapD = linePath(wedge) + ' Z';
    demandPath.setAttribute('d', demandD);
    supplyPath.setAttribute('d', supplyD);
    gap.setAttribute('d', gapD);

    /** Streaks: connect pairs of particles each frame. */
    var lineLayer = node('g', {
      class: 'gap-cosmos-lines',
      fill: 'none',
      stroke: 'var(--ink)',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      pointerEvents: 'none'
    });
    svg.appendChild(lineLayer);

    var title = node('g', { class: 'gap-source-label' });
    svg.appendChild(title);
    text(title, left + 8, top + 54, '100 GW', mobile ? 25 : 29);
    text(title, left + 8, top + 76, 'of unmet cloud demand', font, { fill: 'var(--ink-soft)' });

    var summary = node('g', { class: 'gap-destination-label' });
    svg.appendChild(summary);
    var captionSize = mobile ? 11 : 13;
    var capY = height - (mobile ? 22 : 26);
    var capEl = text(summary, width / 2, capY, 'A billion personal computers', captionSize, {
      'text-anchor': 'middle',
      class: 'gap-shimmer-label',
      fill: reduced.matches ? 'var(--ink-soft)' : 'url(#gap-shimmer-grad)'
    });

    var particleLayer = node('g', { class: 'gap-particles', fill: 'var(--ink)' });
    svg.appendChild(particleLayer);

    var seed = 17;
    function random() { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }

    var nParticles = mobile ? 360 : 500;
    var outlineFracs = outlineFractions(wedgePtsOpen, nParticles);
    var gridPoints = [];
    var cols = mobile ? 14 : 22;
    var rows = mobile ? 18 : 28;
    for (var gr = 0; gr < rows; gr++) {
      for (var gc = 0; gc < cols; gc++) {
        gridPoints.push({
          tx: fLeft + (gc + 0.5 + (random() - 0.5) * 0.12) * frameW / cols,
          ty: fTop + (gr + 0.5 + (random() - 0.5) * 0.12) * frameH / rows
        });
      }
    }

    var particles = [];
    var connectors = [];
    var nConn = mobile ? 28 : 44;

    for (var pi = 0; pi < nParticles; pi++) {
      var fromFill = pi >= Math.floor(nParticles * 0.42);
      var fracI = pi % outlineFracs.length;
      var orig;
      var homeFrac = outlineFracs[fracI];
      var onOutline = true;
      if (fromFill) {
        orig = { x: 0, y: 0 };
        var tries = 0;
        var ins = false;
        while (tries < 28 && !ins) {
          orig.x = wedgeBbox.minX + random() * (wedgeBbox.maxX - wedgeBbox.minX);
          orig.y = wedgeBbox.minY + random() * (wedgeBbox.maxY - wedgeBbox.minY);
          ins = pointInPolygon(orig.x, orig.y, wedgePtsOpen);
          tries++;
        }
        if (ins) {
          onOutline = false;
        } else {
          orig = pointOnPolyline(wedgePtsOpen, homeFrac);
        }
      } else {
        orig = pointOnPolyline(wedgePtsOpen, homeFrac);
      }
      var gIdx = Math.min(gridPoints.length - 1, Math.floor((pi + 0.5) / nParticles * gridPoints.length));
      var g = gridPoints[gIdx];
      var rScale = 0.52 + random() * 1.15;
      particles.push({
        outlineFrac: homeFrac,
        spawnOnOutline: onOutline,
        seed: random() * 6.28318,
        bendOut: 10 + random() * 18,
        r: ((mobile ? 0.95 : 1) + random() * 0.2) * rScale,
        hx0: orig.x,
        hy0: orig.y,
        tx: g.tx,
        ty: g.ty,
        sx: orig.x,
        sy: orig.y
      });
    }

    var orderAlongOutline = [];
    for (var oi0 = 0; oi0 < particles.length; oi0++) {
      if (particles[oi0].spawnOnOutline) orderAlongOutline.push(oi0);
    }
    orderAlongOutline.sort(function (a, b) {
      return particles[a].outlineFrac - particles[b].outlineFrac;
    });
    var connStride = Math.max(2, Math.floor(orderAlongOutline.length / Math.max(1, nConn + 1)));
    if (orderAlongOutline.length >= 2) {
      for (var ci = 0; ci < nConn; ci++) {
        var oi = Math.min(ci * connStride, orderAlongOutline.length - 2);
        connectors.push({
          i: orderAlongOutline[oi],
          j: orderAlongOutline[oi + 1],
          node: node('path', { d: 'M0 0', stroke: 'var(--ink)', fill: 'none', 'stroke-width': 0.35 + random() * 0.25, opacity: 0 })
        });
        lineLayer.appendChild(connectors[connectors.length - 1].node);
      }
    }

    particles.forEach(function (p) {
      p.node = node('circle', { r: p.r, cx: p.sx, cy: p.sy, opacity: 0 });
      particleLayer.appendChild(p.node);
    });
    particlesRef = particles;

    function bezier(a, b, c, d, t) {
      var q = 1 - t;
      return q * q * q * a + 3 * q * q * t * b + 3 * q * t * t * c + t * t * t * d;
    }

    draw = function (time, still) {
      var sec = still ? 0 : (time % LOOP);
      var tSec = still ? 2 : time;

      /** One eased flight out, the same eased flight home. No second clock on the return. */
      var spread = ramp(sec, leave0, leave1);
      var collapse = ramp(sec, ret0, ret1);
      var travel = clamp(spread * (1 - collapse));
      var tChartOut = ramp(sec, chartOut0, chartOut1);
      var tChartIn = ramp(sec, chartIn0, chartIn1);
      var curvesOp = (1 - 0.97 * tChartOut) * (1 - tChartIn) + tChartIn;

      var fieldPhase = ramp(sec, leave0, leave0 + 7.2);
      var cosmosPulse = ramp(sec, capIn1, capIn1 + 2.6) * (1 - ramp(sec, capIn1 + 4.2, capIn1 + 8.2));
      var fieldStrength = (0.38 + 0.42 * cosmosPulse) * fieldPhase;

      /** Shimmer: slide only (no rotate — avoids “3d” look on caption). */
      if (!still && !reduced.matches) {
        grad.setAttribute('gradientTransform', 'translate(' + (Math.sin(tSec * 1.65) * 0.42).toFixed(3) + ' 0)');
      }

      staticBackdrop.setAttribute('opacity', '1');

      curvesGroup.setAttribute('opacity', curvesOp.toFixed(4));
      gap.setAttribute('fill-opacity', (0.1 * curvesOp).toFixed(4));

      function homeOnOutline(frac) {
        return pointOnPolyline(wedgePtsOpen, frac);
      }

      /** Labels finish leaving before the flight, and come back only after the flight home. */
      var textOut = ramp(sec, textOut0, textOut1);
      var textIn = ramp(sec, textIn0, textIn1);
      var titleShow = clamp((1 - textOut) * (1 - textIn) + textIn);
      title.setAttribute('opacity', titleShow.toFixed(3));
      axisLabels.setAttribute('opacity', titleShow.toFixed(3));

      /** Caption only after the outbound flight has landed, gone again before the return. */
      var capVisible = ramp(sec, capIn0, capIn1) * (1 - ramp(sec, capOut0, capOut1));
      summary.setAttribute('opacity', capVisible.toFixed(3));
      capEl.setAttribute('fill', reduced.matches ? 'var(--ink-soft)' : 'url(#gap-shimmer-grad)');

      var linePresence = fieldStrength * travel;
      if (reduced.matches) linePresence = 0;

      var outlineBreath = 0.14 * fieldStrength * (1 - travel);

      buckets = {};
      for (var bi = 0; bi < particles.length; bi++) {
        var pb = particles[bi];
        var hp = pb.spawnOnOutline ? homeOnOutline(pb.outlineFrac) : { x: pb.hx0, y: pb.hy0 };
        var str0 = structuredDisplacement(hp.x, hp.y, pb.seed, tSec, fLeft, fTop, frameW, frameH, mobile, outlineBreath);
        pb.homeX = hp.x;
        pb.homeY = hp.y;
        var pBaseX = hp.x + str0.ox * outlineBreath;
        var pBaseY = hp.y + str0.oy * outlineBreath;
        pb.px = pBaseX;
        pb.py = pBaseY;
        var bx0 = Math.floor(pBaseX / bucketSize);
        var by0 = Math.floor(pBaseY / bucketSize);
        var key0 = bx0 + ',' + by0;
        if (!buckets[key0]) buckets[key0] = [];
        buckets[key0].push(bi);
      }

      var repStrength = travel * fieldPhase * 0.22;
      for (var rep = 0; rep < particles.length; rep++) {
        var pr = particles[rep];
        var rs = repulsionShift(pr, rep, mobile, repStrength);
        pr.repX = rs.rx;
        pr.repY = rs.ry;
      }

      var pxArr = [];
      var pyArr = [];

      for (var pidx = 0; pidx < particles.length; pidx++) {
        var p = particles[pidx];
        var hx = p.homeX;
        var hy = p.homeY;
        var strG = structuredDisplacement(hx, hy, p.seed, tSec, fLeft, fTop, frameW, frameH, mobile, outlineBreath);
        var gapX = hx + strG.ox * outlineBreath + p.repX * (1 - travel * 0.92) * 0.35;
        var gapY = hy + strG.oy * outlineBreath + p.repY * (1 - travel * 0.92) * 0.35;

        var strF = structuredDisplacement(p.tx, p.ty, p.seed + 1.1, tSec, fLeft, fTop, frameW, frameH, mobile, fieldStrength * 0.72);
        var fX = p.tx + strF.ox * fieldStrength + p.repX * travel * 0.55;
        var fY = p.ty + strF.oy * fieldStrength + p.repY * travel * 0.55;

        /**
         * Outbound keeps the original steer (the flight you already like).
         * The trip home follows that same cubic the whole way, with a smoothstep
         * settle into the field offset — no second ease and no clamped handoff,
         * which is what made the return hitch.
         */
        var s = travel;
        var mxMid = (hx + p.tx) * 0.5;
        var myMid = (hy + p.ty) * 0.5;
        var bx = bezier(hx, hx + (mxMid - hx) * 0.45 + p.bendOut * 0.25, p.tx + (mxMid - p.tx) * 0.35, p.tx, s);
        var by = bezier(hy, hy + (myMid - hy) * 0.5 - 8, p.ty + (myMid - p.ty) * 0.4 - 6, p.ty, s);
        var kField = clamp((s - 0.12) / 0.55);
        var legacyX = (1 - s) * gapX + s * ((1 - kField) * bx + kField * fX);
        var legacyY = (1 - s) * gapY + s * ((1 - kField) * by + kField * fY);
        var settle = s * s * (3 - 2 * s);
        var curveX = (1 - s) * gapX + s * bx + (fX - p.tx) * settle;
        var curveY = (1 - s) * gapY + s * by + (fY - p.ty) * settle;
        var openX = collapse > 0 ? curveX : legacyX;
        var openY = collapse > 0 ? curveY : legacyY;

        var px = openX;
        var py = openY;

        p.node.setAttribute('r', p.r.toFixed(2));
        p.node.setAttribute('cx', px.toFixed(2));
        p.node.setAttribute('cy', py.toFixed(2));
        pxArr[pidx] = px;
        pyArr[pidx] = py;

        var stagger = (p.seed * 0.4131) % 1;
        var pIn = ramp(sec, leave0 + stagger * 0.12, leave0 + 1.05 + stagger * 0.35);
        var emergeVis = Math.max(softBlend(travel, 0, 0.08), softBlend(tChartOut, 0.04, 0.2) * 0.55 * (1 - collapse));
        var twinkle = 0.88 + 0.12 * Math.sin(tSec * 2.2 + p.seed * 4);
        var bright = 0.38 + 0.38 * fieldStrength + 0.24 * travel;
        var dotVis = clamp(pIn * 1.05) * (0.55 + 0.45 * pIn) * emergeVis * twinkle * bright;
        p.node.setAttribute('opacity', clamp(dotVis).toFixed(3));
      }

      /** Connector streaks between dot pairs, with midpoint bend from field */
      for (var ci = 0; ci < connectors.length; ci++) {
        var c = connectors[ci];
        var ia = c.i % particles.length;
        var jb = c.j % particles.length;
        var ax = pxArr[ia];
        var ay = pyArr[ia];
        var bx = pxArr[jb];
        var by = pyArr[jb];
        var mx = (ax + bx) * 0.5;
        var my = (ay + by) * 0.5;
        var ld = structuredDisplacement(mx, my, ci + tSec * 0.2, tSec, fLeft, fTop, frameW, frameH, mobile, fieldStrength);
        mx += ld.ox * 0.22 * linePresence;
        my += ld.oy * 0.22 * linePresence;
        var dStr = 'M ' + ax.toFixed(2) + ' ' + ay.toFixed(2) + ' Q ' + mx.toFixed(2) + ' ' + my.toFixed(2) + ' ' + bx.toFixed(2) + ' ' + by.toFixed(2);
        c.node.setAttribute('d', dStr);
        var cVis = linePresence * (0.45 + 0.55 * Math.sin(tSec * 1.8 + ci));
        c.node.setAttribute('opacity', clamp(cVis * 0.45).toFixed(3));
      }

      var phase = 'demand';
      if (sec >= textOut0 && sec < leave0) phase = 'copy-out';
      else if (sec >= leave0 && sec < leave1) phase = 'opening';
      else if (sec >= leave1 && sec < ret0) phase = 'field';
      else if (sec >= ret0 && sec < ret1) phase = 'returning';
      else if (sec >= ret1 && sec < textIn1) phase = 'chart-in';
      svg.setAttribute('data-motion-phase', phase);
    };

    draw(reduced.matches ? 0 : elapsed, reduced.matches);
  }

  function frame(now) {
    if (!visible || document.hidden || reduced.matches) {
      raf = 0;
      last = null;
      return;
    }
    if (last !== null) elapsed = (elapsed + Math.min(0.1, (now - last) / 1000)) % LOOP;
    last = now;
    draw(elapsed, false);
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = null;
  }
  function run() {
    if (reduced.matches) {
      draw(0, true);
      return;
    }
    if (visible && !document.hidden && !raf) raf = requestAnimationFrame(frame);
  }
  if (replay) {
    replay.addEventListener('click', function () {
      elapsed = 0;
      last = null;
      draw(0, reduced.matches);
      run();
    });
  }
  new ResizeObserver(prepare).observe(figure);
  prepare();
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) run(); else stop();
  }, { threshold: 0.25 }).observe(svg);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });
  reduced.addEventListener('change', function () { stop(); prepare(); run(); });
})();
