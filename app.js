// Clippings gallery with filters and lightbox (robust PDF thumbnail behavior)
const grid = document.getElementById('grid');
const cardTpl = document.getElementById('clip-card');
const searchInput = document.getElementById('search');
const sourceFilter = document.getElementById('sourceFilter');
const yearFilter = document.getElementById('yearFilter');
const clearBtn = document.getElementById('clearBtn');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeBtn = document.getElementById('lightboxClose');
if (closeBtn) closeBtn.onclick = () => lightbox.classList.add('hidden');
if (lightbox) lightbox.onclick = (e)=>{ if(e.target===lightbox) lightbox.classList.add('hidden'); };

let CLIPS = [];
let filtered = [];

function excerptize(text, n=220){
  if(!text) return '';
  text = text.replace(/\s+/g,' ').trim();
  return text.length>n ? text.slice(0,n)+'…' : text;
}

function tagPill(t){
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = t;
  return span;
}

// Deep linking + counts + highlight
const resultsCount = document.getElementById('resultsCount');
const hint = document.getElementById('hint');

function setParams(params){
  const url = new URL(location);
  Object.entries(params).forEach(([k,v])=>{ if(v) url.searchParams.set(k,v); else url.searchParams.delete(k); });
  history.replaceState(null, '', url);
}
function getParams(){
  const sp = new URLSearchParams(location.search);
  return { q: sp.get('q')||'', source: sp.get('source')||'', year: sp.get('year')||'' };
}
function applyParamsToControls(){
  const p = getParams();
  if (searchInput) searchInput.value = p.q;
  if (sourceFilter) sourceFilter.value = p.source;
  if (yearFilter) yearFilter.value = p.year;
}
function updateCount(){
  if (!resultsCount) return;
  const n = filtered.length;
  resultsCount.textContent = n + (n===1 ? ' result' : ' results');
  if (hint) hint.textContent = (searchInput && searchInput.value) ? 'Tip: click a card title for a clean reading view.' : '';
}
function highlight(text, q){
  if(!q) return text;
  try{ const rx = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')','ig'); return text.replace(rx, '<mark>$1</mark>'); }
  catch(e){ return text; }
}

function render(){
  grid.innerHTML = '';
  const qv = (searchInput && searchInput.value) || '';
  filtered.forEach(c => {
    const node = cardTpl.content.cloneNode(true);

    const article = node.querySelector('.card');
    const titleEl = node.querySelector('.title');
    const thumbDiv = node.querySelector('.thumb');
    const thumbLink = node.querySelector('.thumbLink');
    const excerptEl = node.querySelector('.excerpt');
    const links = node.querySelector('.links');
    const tagsEl = node.querySelector('.tags');

    // Identify card for delegated clicks
    article.dataset.id = String(c.id);

    const preview = (c.crops && c.crops.length) ? c.crops[0] : null;
    if (preview) thumbDiv.style.backgroundImage = `url('${preview}')`;

    // Title → reader view
    const baseTitle = `${c.source_label || c.source_file} — p.${c.source_page}`;
    titleEl.innerHTML = `<a href="clip.html?id=${c.id}">${highlight(baseTitle, qv)}</a>`;

    if (excerptEl) excerptEl.innerHTML = highlight(excerptize(c.excerpt), qv);

    if (links) {
      if (c.page_pdf) { const a=document.createElement('a'); a.href=c.page_pdf; a.target='_blank'; a.textContent='View page PDF'; links.appendChild(a); }
      if (preview)    { const a2=document.createElement('a'); a2.href=preview; a2.target='_blank'; a2.textContent='Open first crop'; links.appendChild(a2); }
    }

    if (tagsEl) (c.tags||[]).forEach(t => tagsEl.appendChild(tagPill(t)));

    // If template includes an <a.thumbLink>, set href to the PDF (fallback to image)
    if (thumbLink) {
      const href = c.page_pdf || preview || '#';
      thumbLink.href = href;
      if (href !== '#') thumbLink.target = '_blank'; else thumbLink.removeAttribute('target');
      thumbLink.setAttribute('aria-label', c.page_pdf ? `Open PDF for ${c.source_label||c.source_file}, page ${c.source_page}` : (preview ? `Open image crop for ${c.source_label||c.source_file}, page ${c.source_page}` : `No media available`));
      thumbLink.onclick = (e) => { if (href === '#') e.preventDefault(); };
    }

    grid.appendChild(node);
  });
  updateCount();
}

// Event delegation fallback: ANY click on a card's .thumb or .thumbLink opens its PDF (or image)
grid.addEventListener('click', (e) => {
  const tgt = e.target.closest('.thumbLink, .thumb');
  if (!tgt) return;
  const card = tgt.closest('.card');
  if (!card) return;
  const id = Number(card.dataset.id);
  const c = CLIPS.find(x => Number(x.id) === id);
  if (!c) return;
  const url = c.page_pdf || (c.crops && c.crops[0]) || null;
  if (url) { e.preventDefault(); window.open(url, '_blank'); }
});

function applyFilters(){
  const qv = (searchInput && searchInput.value || '').toLowerCase();
  const src = sourceFilter ? sourceFilter.value : '';
  const yr  = yearFilter ? yearFilter.value : '';
  filtered = CLIPS.filter(c => {
    const matchesQuery = !qv || (`${c.source_label||c.source_file} ${c.excerpt}`.toLowerCase().includes(qv));
    const matchesSrc = !src || (c.source_label||c.source_file) === src;
    const matchesYr  = !yr  || String(c.year||'') === yr;
    return matchesQuery && matchesSrc && matchesYr;
  });
  setParams({q: (searchInput && searchInput.value) || '', source: src, year: yr});
  render();
}

// Bootstrap
fetch('clippings.json').then(r=>r.json()).then(data => {
  CLIPS = data.clippings || [];
  if (sourceFilter) {
    const sources = Array.from(new Set(CLIPS.map(c=>c.source_label||c.source_file))).sort();
    sources.forEach(s => { const opt=document.createElement('option'); opt.value=s; opt.textContent=s; sourceFilter.appendChild(opt); });
  }
  if (yearFilter) {
    const years = Array.from(new Set(CLIPS.map(c=>c.year).filter(Boolean))).sort();
    years.forEach(y => { const opt=document.createElement('option'); opt.value=y; opt.textContent=y; yearFilter.appendChild(opt); });
  }
  applyParamsToControls();
  filtered = CLIPS.slice();
  applyFilters();
});

if (searchInput) searchInput.addEventListener('input', applyFilters);
if (sourceFilter) sourceFilter.addEventListener('change', applyFilters);
if (yearFilter) yearFilter.addEventListener('change', applyFilters);
if (clearBtn) clearBtn.addEventListener('click', ()=>{
  if (searchInput) searchInput.value='';
  if (sourceFilter) sourceFilter.value='';
  if (yearFilter) yearFilter.value='';
  applyFilters();
});
