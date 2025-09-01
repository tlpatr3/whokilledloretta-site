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
