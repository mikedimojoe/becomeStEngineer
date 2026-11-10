/* Quellen: Verzeichnis aller Texte und Videos mit Filter und „Alle Zitate kopieren“ */
(function () {
  'use strict';
  const App = window.App, h = App.h;
  App.route('quellen', async (main) => {
    const all = await (App.cache.sources || (App.cache.sources = App.get('/api/sources')));
    // Duplikate zusammenfassen (gleiche URL/ID in mehreren Modulen)
    const map = new Map();
    for (const s of all) { const k = s.kind === 'video' ? 'v:' + s.id : 't:' + s.url; if (!map.has(k)) map.set(k, Object.assign({ modules: [] }, s)); map.get(k).modules.push({ id: s.module, title: s.moduleTitle }); }
    const items = [...map.values()];
    let filter = 'alle', area = '', qtext = '';
    const list = h('div.reads');
    const count = h('span');
    const render = () => {
      const f = items.filter(s => (filter === 'alle' || (filter === 'uni' && s.kind === 'text' && s.type === 'Uni-Skript') || (filter === 'texte' && s.kind === 'text') || (filter === 'videos' && s.kind === 'video'))
        && (!area || s.area === area) && (!qtext || JSON.stringify([s.title, s.author, s.channel, s.institution]).toLowerCase().includes(qtext)));
      count.textContent = f.length + ' Einträge';
      App.clear(list);
      f.slice(0, 400).forEach(s => list.appendChild(s.kind === 'video'
        ? h('article.read', h('div.rh', App.icon('video'), h('a.rt', { href: 'https://www.youtube.com/watch?v=' + s.id, target: '_blank', rel: 'noopener' }, s.title), h('span.tag', (s.lang || '').toUpperCase())),
          h('div.rm', `${s.channel} · YouTube · ${App.area(s.area).title}`), h('div', { style: { fontSize: '13px' } }, s.why), mods(s))
        : h('article.read', h('div.rh', App.icon('book'), h('a.rt', { href: s.url, target: '_blank', rel: 'noopener' }, s.title), h('span.tag', s.type)),
          h('div.rm', [s.author, s.institution, s.work, s.year].filter(Boolean).join(' · ')), h('div', { style: { fontSize: '13px' } }, s.why), mods(s),
          h('div.apa', h('span', s.apa), h('button.iconbtn', { 'aria-label': 'Zitat kopieren', title: 'Zitat kopieren', onclick: () => App.copy(s.apa, 'Zitat kopiert') }, App.icon('copy'))))));
      list.dataset.cites = f.filter(s => s.kind === 'text').map(s => s.apa).sort().join('\n\n');
    };
    const mods = s => h('div.faint', { style: { fontSize: '12px', marginTop: '4px' } }, 'In: ', s.modules.slice(0, 4).map((m, i) => [i ? ' · ' : '', h('a', { href: '#', onclick: e => { e.preventDefault(); App.openModule(m.id); } }, m.title)]), s.modules.length > 4 ? ` · +${s.modules.length - 4}` : '');
    const seg = h('div.seg', [['alle', 'Alle'], ['uni', 'Uni-Skripte'], ['texte', 'Texte'], ['videos', 'Videos']].map(([k, t]) => h('button', { 'aria-pressed': String(k === filter), onclick: e => { filter = k; App.$$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); render(); } }, t)));
    const sel = h('select.inp', { style: { width: 'auto' }, onchange: () => { area = sel.value; render(); } }, h('option', { value: '' }, 'Alle Bereiche'), App.catalog.areas.map(a => h('option', { value: a.id }, a.title)));
    const search = h('input.inp', { placeholder: 'Suchen …', style: { width: '220px' }, oninput: App.debounce(() => { qtext = search.value.toLowerCase(); render(); }, 200) });
    main.append(h('div.page-head', h('div.grow', h('div.eyebrow', 'Quellen'), h('h1', 'Lesestoff und Videos'), h('p', 'Alle Quellen wurden beim Erstellen geprüft: Texte per HTTP-Abruf, Videos über die YouTube-oEmbed-Schnittstelle. Uni-Skripte zuerst, dann Fachbücher, Herstellerdokumentation und amtliche Quellen.'))),
      h('div.row.wrap', { style: { marginBottom: '16px' } }, seg, sel, search, h('span.grow'), count, h('button.btn', { onclick: () => App.copy(list.dataset.cites || '', 'Alle Zitate der Auswahl kopiert') }, App.icon('copy'), 'Alle Zitate kopieren')),
      list);
    render();
  });
})();
