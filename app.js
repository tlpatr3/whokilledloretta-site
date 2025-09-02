// Clippings gallery with filters and lightbox
const grid = document.getElementById('grid');
const cardTpl = document.getElementById('clip-card');
const searchInput = document.getElementById('search');
const sourceFilter = document.getElementById('sourceFilter');
const yearFilter = document.getElementById('yearFilter');
const clearBtn = document.getElementById('clearBtn');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
if (document.getElementById('lightboxClose')) {
  document.getElementById('lightboxClose').onclick = () => lightbox.classList.add('hidden');
}
if (lightbox) {
  lightbox.onclick = (e)=>{ if(e.target===lightbox) lightbox.classList.add('hidden'); };
}

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

// === Enhancements: deep-linking, counts, highlighting, reader links ===
const resultsCount = document.getElementById('resultsCount');
const hint = document.getElementById('hint');

function setParams(params){
  const url = new URL(location);
  Object.entries(params).forEach(([k,v])=>{
    if(v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  });
  history.replaceState(null, '', url);
}

function getParams(){
  const sp = new URLSearchParams(location.search);
  return {
    q: sp.get('q') || '',
    source: sp.get('source') || '',
    year: sp.get('year') || '',
    id: sp.get('id') || ''
  };
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
  if (hint) hint.textContent = searchInput && searchInput.value ? 'Tip: click a card title for a clean reading view.' : '';
}

function highlight(text, q){
  if(!q) return text;
  try{
    const rx = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')','ig');
    return text.replace(rx, '<mark>$1</mark>');
  }catch(e){ return text; }
}

function render(){
  grid.innerHTML = '';
  filtered.forEach(c => {
    const node = cardTpl.content.cloneNode(true);

    const titleEl   = node.querySelector('.title');
    const thumbDiv  = node.querySelector('.thumb');
    const thumbLink = node.querySelector('.thumbLink'); // may be null if template doesn't wrap the thumb
    const excerptEl = node.querySelector('.excerpt');
    const links     = node.querySelector('.links');
    const tagsEl    = node.querySelector('.tags');

    const preview = (c.crops && c.crops.length) ? c.crops[0] : null;
    if (preview) {
      thumbDiv.style.backgroundImage = `url('${preview}')`;
    }

    // Thumbnail → open the single-page PDF (fallback to image if missing)
    const targetHref = c.page_pdf || preview || '#';
    const ariaLabel  = c.page_pdf
      ? `Open PDF for ${c.source_label||c.source_file}, page ${c.source_page}`
      : (preview
          ? `Open image crop for ${c.source_label||c.source_file}, page ${c.source_page}`
          : `No media available for ${c.source_label||c.source_file}, page ${c.source_page}`);

    if (thumbLink) {
      thumbLink.href = targetHref;
      if (targetHref !== '#') thumbLink.target = '_blank'; else thumbLink.removeAttribute('target');
      thumbLink.setAttribute('aria-label', ariaLabel);
      thumbLink.onclick = (e) => { if (targetHref === '#') e.preventDefault(); };
    } else {
      if (targetHref !== '#') {
        thumbDiv.style.cursor = 'pointer';
        thumbDiv.onclick = () => window.open(targetHref, '_blank');
        thumbDiv.setAttribute('role','link');
        thumbDiv.setAttribute('aria-label', ariaLabel);
      } else {
        thumbDiv.removeAttribute('onclick');
      }
    }

    // Title → reader view
    const baseTitle = `${c.source_label || c.source_file} — p.${c.source_page}`;
    const qv = (searchInput && searchInput.value) || '';
    titleEl.innerHTML = `<a href="clip.html?id=${c.id}">${highlight(baseTitle, qv)}</a>`;

    if (excerptEl) excerptEl.innerHTML = highlight(excerptize(c.excerpt), qv);

    if (links) {
      if(c.page_pdf) {
        const a = document.createElement('a');
        a.href = c.page_pdf; a.target = '_blank'; a.textContent = 'View page PDF';
        links.appendChild(a);
      }
      if(preview) {
        const a2 = document.createElement('a');
        a2.href = preview; a2.target = '_blank'; a2.textContent = 'Open first crop';
        links.appendChild(a2);
      }
    }

    if (tagsEl) {
      (c.tags||[]).forEach(t=> tagsEl.appendChild(tagPill(t)));
    }

    grid.appendChild(node);
  });
  updateCount();
}

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
