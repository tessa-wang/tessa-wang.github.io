/*
  EDIT MODE — open the site with ?edit at the end of the address, e.g. https://tessa-wang.github.io/?edit
  - Click any text and type over it.
  - Click a link, then change where it goes in the "Link" box at the bottom.
  - "+ Add entry" / "×" add or remove entries in Writing, Projects, Sports and Research.
  - "Download page" saves a new index.html. Upload it to GitHub to publish your changes.
  Visitors never see any of this: it only runs when the address ends in ?edit.
*/
(function () {
  if (!/[?&]edit\b/.test(location.search)) return;

  var EDITABLE = [
    'main .tag', 'main h1', 'main h2', 'main h3', 'main p', 'main .meta span',
    'main .entry a', 'main .entry-links a', 'main .socials a', 'main .socials-label', 'main .contact a', '#links a'
  ].join(',');

  // ---------- Styles for the editing tools ----------
  var css = document.createElement('style');
  css.textContent = [
    'body.editing .f { opacity: 1 !important; }',
    'body.editing { padding-bottom: 110px; }', /* room to scroll past the toolbar */
    'body.editing [contenteditable] { outline: 1px dashed transparent; outline-offset: 3px; border-radius: 2px; cursor: text; }',
    'body.editing [contenteditable]:hover { outline-color: rgba(61, 90, 64, 0.6); }',
    'body.editing [contenteditable]:focus { outline: 2px solid #3d5a40; }',
    '.ed-bar { position: fixed; z-index: 100; left: 50%; bottom: 16px; transform: translateX(-50%); width: min(720px, calc(100% - 32px));',
    '  display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;',
    '  background: #1f2420; color: #fbf6ea; font: 500 12px "IBM Plex Mono", ui-monospace, monospace; letter-spacing: 0.06em; box-shadow: 0 12px 30px -10px rgba(0,0,0,.6); }',
    '.ed-bar b { text-transform: uppercase; color: #9fc2a3; font-weight: 500; }',
    '.ed-bar .ed-msg { opacity: 0.75; flex: 1; min-width: 140px; }',
    '.ed-bar label { display: none; align-items: center; gap: 6px; flex: 1 1 100%; }',
    '.ed-bar label.on { display: flex; }',
    '.ed-bar input { flex: 1; min-width: 0; font: inherit; padding: 6px 8px; border-radius: 6px; border: 1px solid #555; background: #2c332d; color: #fbf6ea; }',
    '.ed-bar button, .ed-btn { font: inherit; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; border-radius: 6px; padding: 7px 12px; border: 1px solid #3d5a40; }',
    '.ed-bar button { background: #3d5a40; color: #fbf6ea; }',
    '.ed-bar button.ghost { background: transparent; border-color: #555; }',
    '.ed-btn { display: inline-block; margin-top: 16px; background: transparent; color: #3d5a40; font-family: "IBM Plex Mono", monospace; font-size: 12px; }',
    '.ed-btn:hover { background: #3d5a40; color: #fbf6ea; }',
    '.entry { position: relative; }',
    '.ed-del { position: absolute; top: 12px; right: -8px; width: 26px; height: 26px; border-radius: 50%; border: 0; cursor: pointer;',
    '  background: #8a3b2e; color: #fff; font-size: 16px; line-height: 26px; padding: 0; opacity: 0; transition: opacity .15s; }',
    '.entry:hover .ed-del, .ed-del:focus { opacity: 1; }',
    '@media (max-width: 720px) { .ed-del { opacity: 1; right: 0; top: 4px; } }'
  ].join('\n');
  document.head.appendChild(css);
  document.body.classList.add('editing');

  // ---------- Make text editable ----------
  function makeEditable(root) {
    Array.prototype.forEach.call(root.querySelectorAll(EDITABLE), function (el) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'true');
    });
  }
  makeEditable(document);

  document.addEventListener('keydown', function (e) {
    // Each piece of text is one line; Enter just finishes editing it
    if (e.key === 'Enter' && e.target.isContentEditable) { e.preventDefault(); e.target.blur(); }
  });
  document.addEventListener('paste', function (e) {
    if (!e.target.isContentEditable) return;
    e.preventDefault(); // paste as plain text, without outside formatting
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s*\n\s*/g, ' '));
  });
  document.addEventListener('input', function (e) {
    // Once you type real text, it stops looking like a grey placeholder
    var el = e.target.closest && e.target.closest('.placeholder');
    if (el) el.classList.remove('placeholder');
    dirty = true; setMsg('Unsaved changes');
  });
  // Links don't navigate while editing (so you can click into them)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[contenteditable]');
    if (a) e.preventDefault();
  }, true);

  // ---------- Toolbar ----------
  var bar = document.createElement('div');
  bar.className = 'ed-bar';
  bar.setAttribute('data-edit-ui', '');
  bar.innerHTML =
    '<b>Edit mode</b><span class="ed-msg">Click any text to change it</span>' +
    '<button type="button" class="ed-save">Download page</button>' +
    '<button type="button" class="ghost ed-exit">Exit</button>' +
    '<label>Link&nbsp;→ <input type="text" placeholder="https://…  or  mailto:you@example.com"></label>';
  document.body.appendChild(bar);
  var msg = bar.querySelector('.ed-msg');
  var linkRow = bar.querySelector('label');
  var linkInput = linkRow.querySelector('input');
  var dirty = false, currentLink = null;
  function setMsg(t) { msg.textContent = t; }

  document.addEventListener('focusin', function (e) {
    if (bar.contains(e.target)) return;
    var a = e.target.closest && e.target.closest('a[contenteditable]');
    currentLink = a || null;
    linkRow.classList.toggle('on', !!a);
    if (a) linkInput.value = a.getAttribute('href') || '';
  });
  linkInput.addEventListener('input', function () {
    if (!currentLink) return;
    var v = linkInput.value.trim();
    currentLink.setAttribute('href', v || '#');
    if (v && v !== '#') currentLink.classList.remove('placeholder');
    // web links open in a new tab; email links don't need to
    if (/^https?:/.test(v)) { currentLink.target = '_blank'; currentLink.rel = 'noopener'; }
    else { currentLink.removeAttribute('target'); currentLink.removeAttribute('rel'); }
    dirty = true; setMsg('Unsaved changes');
  });

  bar.querySelector('.ed-exit').addEventListener('click', function () {
    if (dirty && !confirm('Leave edit mode? Changes you haven\'t downloaded will be lost.')) return;
    location.href = location.pathname;
  });
  addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- Add / remove entries ----------
  var BLANK = '<p class="placeholder">[A line or two.]</p><a href="#">Link ↗</a>';
  function addDelete(li) {
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'ed-del'; x.textContent = '×';
    x.title = 'Remove this entry'; x.setAttribute('data-edit-ui', '');
    x.addEventListener('click', function () {
      if (!confirm('Remove this entry?')) return;
      li.remove(); dirty = true; setMsg('Unsaved changes'); relayout();
    });
    li.appendChild(x);
  }
  function relayout() { if (window.__relayout) window.__relayout(); }
  Array.prototype.forEach.call(document.querySelectorAll('main .panel .entries, main .entries'), function (ul) {
    if (ul._ed) return; ul._ed = true;
    Array.prototype.forEach.call(ul.children, addDelete);
    var add = document.createElement('button');
    add.type = 'button'; add.className = 'ed-btn'; add.textContent = '+ Add entry';
    add.setAttribute('data-edit-ui', '');
    add.addEventListener('click', function () {
      var li = document.createElement('li');
      li.className = 'entry';
      var model = ul.querySelector('.entry');
      // copy the layout of an existing entry (including a link if it has one), but with blank text
      li.innerHTML = BLANK;
      var last = ul.lastChild; // keep the saved code neatly indented
      if (last && last.nodeType === 3) { ul.insertBefore(document.createTextNode('\n            '), last); ul.insertBefore(li, last); }
      else ul.appendChild(li);
      makeEditable(li); addDelete(li);
      li.querySelector('p').focus();
      dirty = true; setMsg('Unsaved changes'); relayout();
    });
    ul.insertAdjacentElement('afterend', add);
  });

  // ---------- Download ----------
  function clean(node) {
    var c = node.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('[data-edit-ui]'), function (n) { n.remove(); });
    Array.prototype.forEach.call(c.querySelectorAll('[contenteditable]'), function (n) {
      n.removeAttribute('contenteditable'); n.removeAttribute('spellcheck');
    });
    Array.prototype.forEach.call(c.querySelectorAll('[style]'), function (n) {
      // opacity is set by the page's scroll effect, not by you
      n.style.removeProperty('opacity');
      if (!n.getAttribute('style').trim()) n.removeAttribute('style');
    });
    Array.prototype.forEach.call(c.querySelectorAll('.missing'), function (n) { n.classList.remove('missing'); });
    Array.prototype.forEach.call(c.querySelectorAll('[class=""]'), function (n) { n.removeAttribute('class'); });
    // toggle buttons: save with the first group selected
    var tabs = c.querySelectorAll('.tab');
    Array.prototype.forEach.call(tabs, function (t, i) {
      t.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      if (i === 0) t.removeAttribute('tabindex'); else t.setAttribute('tabindex', '-1');
      var p = c.querySelector('#' + t.getAttribute('aria-controls'));
      if (p) { if (i === 0) p.removeAttribute('hidden'); else p.setAttribute('hidden', ''); }
    });
    return c.outerHTML;
  }
  function swap(src, startRe, endTag, html) {
    var m = startRe.exec(src);
    if (!m) throw new Error('missing ' + startRe);
    var end = src.indexOf(endTag, m.index);
    if (end < 0) throw new Error('missing ' + endTag);
    return src.slice(0, m.index) + html + src.slice(end + endTag.length);
  }
  bar.querySelector('.ed-save').addEventListener('click', function () {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    setMsg('Preparing…');
    // Start from the real file (so the code around your text stays exactly as it was)
    fetch(location.pathname, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (src) {
      src = swap(src, /<main[\s>]/, '</main>', clean(document.querySelector('main')));
      var links = document.getElementById('links');
      if (links) src = swap(src, /<nav id="links"/, '</nav>', clean(links));
      var blob = new Blob([src], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'index.html';
      document.body.appendChild(a); a.click(); a.remove();
      dirty = false;
      setMsg('Downloaded index.html. Upload it to GitHub to publish.');
    }).catch(function (err) {
      setMsg('Could not save (' + err.message + '). Try refreshing the page.');
    });
  });
})();
