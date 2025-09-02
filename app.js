// Clippings gallery with filters and lightbox
const grid = document.getElementById('grid');
const cardTpl = document.getElementById('clip-card');
const searchInput = document.getElementById('search');
const sourceFilter = document.getElementById('sourceFilter');
const yearFilter = document.getElementById('yearFilter');
const clearBtn = document.getElementById('clearBtn');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
document.getElementById('lightboxClose').onclick = () => lightbox.classList.add('hidden');
lightbox.onclick = (e)=>{ if(e.target===lightbox) lightbox.classList.add('hidden'); };

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

function render(){
  grid.innerHTML = '';
  filtered.forEach(c => {
    const node = cardTpl.content.cloneNode(true);
    const thumb = node.querySelector('.thumb');
    const preview = (c.crops && c.crops.length) ? c.crops[0] : null;
    if(preview){
      thumb.style.backgroundImage = `url('${preview}')`;
      thumb.onclick = ()=>{ lightboxImg.src = preview; lightbox.classList.remove('hidden'); };
    }
    const title = node.querySelector('.title');
    title.textContent = `${c.source_label || c.source_file} — p.${c.source_page}`;
    node.querySelector('.excerpt').textContent = excerptize(c.excerpt);
    const links = node.querySelector('.links');
    if(c.page_pdf){ const a = document.createElement('a'); a.href = c.page_pdf; a.target = '_blank'; a.textContent = 'View page PDF'; links.appendChild(a); }
    if(preview){ const a2 = document.createElement('a'); a2.href = preview; a2.target = '_blank'; a2.textContent = 'Open first crop'; links.appendChild(a2); }
    const tagsEl = node.querySelector('.tags');
    (c.tags||[]).forEach(t=> tagsEl.appendChild(tagPill(t)));
    grid.appendChild(node);
  });
}

function applyFilters(){
  const q = (searchInput.value||'').toLowerCase();
  const src = sourceFilter.value;
  const yr  = yearFilter.value;
  filtered = CLIPS.filter(c => {
    const matchesQuery = !q || (`${c.source_label||c.source_file} ${c.excerpt}`.toLowerCase().includes(q));
    const matchesSrc = !src || (c.source_label||c.source_file) === src;
    const matchesYr  = !yr  || String(c.year||'') === yr;
    return matchesQuery && matchesSrc && matchesYr;
  });
  render();
}

fetch('clippings.json').then(r=>r.json()).then(data => {
  CLIPS = data.clippings || [];
  const sources = Array.from(new Set(CLIPS.map(c=>c.source_label||c.source_file))).sort();
  sources.forEach(s => { const opt=document.createElement('option'); opt.value=s; opt.textContent=s; sourceFilter.appendChild(opt); });
  const years = Array.from(new Set(CLIPS.map(c=>c.year).filter(Boolean))).sort();
  years.forEach(y => { const opt=document.createElement('option'); opt.value=y; opt.textContent=y; yearFilter.appendChild(opt); });
  filtered = CLIPS.slice();
  render();
});

searchInput.addEventListener('input', applyFilters);
sourceFilter.addEventListener('change', applyFilters);
yearFilter.addEventListener('change', applyFilters);
clearBtn.addEventListener('click', ()=>{
  searchInput.value=''; sourceFilter.value=''; yearFilter.value=''; applyFilters();
});

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
  searchInput.value = p.q;
  sourceFilter.value = p.source;
  yearFilter.value = p.year;
}

function updateCount(){
  const n = filtered.length;
  resultsCount.textContent = n + (n===1 ? ' result' : ' results');
  hint.textContent = searchInput.value ? 'Tip: click a card title to open a clean reading view.' : '';
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
    const titleEl = node.querySelector('.title');
    const thumb = node.querySelector('.thumb');
    const thumbLink = node.querySelector('.thumbLink');
    const preview = (c.crops && c.crops.length) ? c.crops[0] : null;
    iif (preview){
  thumb.style.backgroundImage = `url('${preview}')`;
  // Send thumbnails to the reading view, not the raw image
  thumbLink.href = `clip.html?id=${c.id}`;
  thumbLink.removeAttribute('target'); // open in same tab
  thumbLink.setAttribute('aria-label', `Open reader view for ${c.source_label||c.source_file}, page ${c.source_page}`);
}

    }
    const baseTitle = `${c.source_label || c.source_file} — p.${c.source_page}`;
    titleEl.innerHTML = `<a href="clip.html?id=${c.id}">${highlight(baseTitle, searchInput.value)}</a>`;
    const excerptEl = node.querySelector('.excerpt');
    excerptEl.innerHTML = highlight(excerptize(c.excerpt), searchInput.value);
    const links = node.querySelector('.links');
    if(c.page_pdf){ const a = document.createElement('a'); a.href = c.page_pdf; a.target = '_blank'; a.textContent = 'View page PDF'; links.appendChild(a); }
    if(preview){ const a2 = document.createElement('a'); a2.href = preview; a2.target = '_blank'; a2.textContent = 'Open first crop'; links.appendChild(a2); }
    const tagsEl = node.querySelector('.tags');
    (c.tags||[]).forEach(t=>{ const s=document.createElement('span'); s.className='tag'; s.textContent=t; tagsEl.appendChild(s); });
    grid.appendChild(node);
  });
  updateCount();
}

function applyFilters(){
  const qv = (searchInput.value||'').toLowerCase();
  const src = sourceFilter.value;
  const yr  = yearFilter.value;
  filtered = CLIPS.filter(c => {
    const matchesQuery = !qv || (`${c.source_label||c.source_file} ${c.excerpt}`.toLowerCase().includes(qv));
    const matchesSrc = !src || (c.source_label||c.source_file) === src;
    const matchesYr  = !yr  || String(c.year||'') === yr;
    return matchesQuery && matchesSrc && matchesYr;
  });
  setParams({q: searchInput.value, source: src, year: yr});
  render();
}

// Initialize from URL params
applyParamsToControls();
applyFilters();
