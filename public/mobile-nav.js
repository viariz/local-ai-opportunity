(function () {
  var rail = document.getElementById('rail');
  var topbar = document.getElementById('topbar');
  if (!rail || !topbar) return;

  var inner = topbar.querySelector('.inner');
  if (!inner) return;

  var style = document.createElement('style');
  style.textContent = [
    '@media (max-width:999px){',
    '  #topbar .toc-link{display:none;}',
    '  #topbar{',
    '    opacity:1!important; pointer-events:auto!important;',
    '  }',
    '  #topbar .where{transition:opacity .25s ease;}',
    '  #topbar:not(.show) .where{opacity:0; visibility:hidden;}',
    '  body.mobile-nav-open #topbar.show .where{opacity:.5; visibility:visible;}',
    '  #topbar .inner{',
    '    align-items:center; min-height:44px; padding-block:0; padding-right:0;',
    '  }',
    '  #nav-toggle{',
    '    display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px;',
    '    flex:0 0 auto; position:relative; z-index:14;',
    '    width:44px; height:44px; margin:0 0 0 8px; padding:0; margin-right:-8px;',
    '    border:none; background:transparent;',
    '    cursor:pointer; color:var(--ink); -webkit-tap-highlight-color:transparent;',
    '  }',
    '  #nav-toggle .bar{display:block; width:18px; height:1px; background:currentColor;',
    '    transition:transform .28s cubic-bezier(.33,1,.38,1), opacity .2s ease, width .28s ease; transform-origin:center;}',
    '  #nav-toggle[aria-expanded="true"] .bar:nth-child(1){transform:translateY(6px) rotate(45deg);}',
    '  #nav-toggle[aria-expanded="true"] .bar:nth-child(2){opacity:0; width:0;}',
    '  #nav-toggle[aria-expanded="true"] .bar:nth-child(3){transform:translateY(-6px) rotate(-45deg);}',
    '  #mobile-nav-panel{',
    '    position:fixed; z-index:13; left:0; right:0; top:0;',
    '    max-height:100dvh;',
    '    overflow:auto; -webkit-overflow-scrolling:touch;',
    '    background:var(--paper); border-bottom:1px solid var(--rule);',
    '    padding:0 max(18px, env(safe-area-inset-right, 0px)) 20px max(18px, env(safe-area-inset-left, 0px));',
    '    padding-top:calc(env(safe-area-inset-top, 0px) + 44px);',
    '    box-sizing:border-box;',
    '    opacity:0; visibility:hidden; pointer-events:none;',
    '    transform:translateY(-6px);',
    '    transition:opacity .28s ease, transform .32s cubic-bezier(.33,1,.38,1), visibility 0s linear .32s;',
    '  }',
    '  #mobile-nav-panel.open{opacity:1; visibility:visible; pointer-events:auto; transform:none; transition:opacity .28s ease, transform .32s cubic-bezier(.33,1,.38,1), visibility 0s;}',
    '  #mobile-nav-panel ol{list-style:none; margin:0; padding:8px 0 0; display:flex; flex-direction:column; gap:0;}',
    '  #mobile-nav-panel li{display:flex; align-items:center; min-height:44px;',
    '    font-size:14px; line-height:1.3; font-weight:300; letter-spacing:.12em; text-transform:uppercase;',
    '    color:color-mix(in srgb, var(--ink) 72%, transparent);}',
    '  #mobile-nav-panel li.here{font-weight:400; color:var(--ink);}',
    '  #mobile-nav-panel li.soon{color:color-mix(in srgb, var(--ink) 45%, transparent);}',
    '  #mobile-nav-panel .dot{display:none!important;}',
    '  #mobile-nav-panel a, #mobile-nav-panel .rail-label{color:inherit; text-decoration:none; flex:1; min-width:0;}',
    '  #mobile-nav-panel a:active{opacity:.7;}',
    '  #mobile-nav-backdrop{',
    '    position:fixed; inset:0; z-index:12; background:color-mix(in srgb, var(--ink) 12%, transparent);',
    '    opacity:0; visibility:hidden; pointer-events:none; transition:opacity .25s ease, visibility 0s linear .25s;',
    '  }',
    '  #mobile-nav-backdrop.open{opacity:1; visibility:visible; pointer-events:auto; transition:opacity .25s ease, visibility 0s;}',
    '  body.mobile-nav-open #topbar{z-index:14; background:var(--paper); border-bottom-color:transparent;}',
    '}',
    '@media (min-width:1000px){',
    '  #nav-toggle, #mobile-nav-panel, #mobile-nav-backdrop{display:none!important;}',
    '}',
    '@media (prefers-reduced-motion: reduce){',
    '  #nav-toggle .bar, #mobile-nav-panel, #mobile-nav-backdrop{transition:none!important;}',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'nav-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'mobile-nav-panel');
  toggle.setAttribute('aria-label', 'Open contents');
  for (var b = 0; b < 3; b++) {
    var bar = document.createElement('span');
    bar.className = 'bar';
    bar.setAttribute('aria-hidden', 'true');
    toggle.appendChild(bar);
  }
  inner.appendChild(toggle);

  var backdrop = document.createElement('div');
  backdrop.id = 'mobile-nav-backdrop';
  backdrop.hidden = true;

  var panel = document.createElement('nav');
  panel.id = 'mobile-nav-panel';
  panel.setAttribute('aria-label', 'Contents');
  panel.hidden = true;

  var list = document.createElement('ol');
  panel.appendChild(list);

  function stripDots(node) {
    node.querySelectorAll('.dot, .rail-tick').forEach(function (d) {
      d.parentNode.removeChild(d);
    });
  }

  var railItems = rail.querySelectorAll('ol > li');
  railItems.forEach(function (li) {
    var clone = li.cloneNode(true);
    clone.removeAttribute('data-target');
    clone.classList.remove('passed');
    stripDots(clone);
    list.appendChild(clone);
  });

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  var open = false;

  function setOpen(next) {
    open = next;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close contents' : 'Open contents');
    panel.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    panel.hidden = !open;
    backdrop.hidden = !open;
    document.body.classList.toggle('mobile-nav-open', open);
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  toggle.addEventListener('click', function () {
    setOpen(!open);
  });

  backdrop.addEventListener('click', function () {
    setOpen(false);
  });

  panel.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (link) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia('(max-width:999px)').addEventListener('change', function (mq) {
    if (!mq.matches) setOpen(false);
  });
})();
