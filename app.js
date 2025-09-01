// Load clippings and render cards
const grid = document.getElementById('grid');
const cardTpl = document.getElementById('clip-card');
const searchInput = document.getElementById('search');
const sourceFilter = document.getElementById('sourceFilter');
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

function sourceFromTags(tags){
  return (tags||[]).join(' ');
}

function render(){
  grid.innerHTML = '';
  filtered.forEach(c => {
    const node = cardTpl.content.cloneNode(true);
    // thumb
    const thumb = node.querySelector('.thumb');
    const preview = (c.crops && c.crops.length) ? c.crops[0] : null;
    if(preview){
      thumb.style.backgroundImage = `url('${preview}')`;
      thumb.onclick = ()=>{
        lightboxImg.src = preview;
        lightbox.classList.remove('hidden');
      };
    }
    // title & meta
    node.querySelector('.title').textContent = `${c.source_file} — p.${c.source_page}`;
    node.querySelector('.excerpt').textContent = excerptize(c.excerpt);
    // links
    const links = node.querySelector('.links');
    if(c.page_pdf){
      const a = document.createElement('a');
      a.href = c.page_pdf;
      a.target = '_blank';
      a.textContent = 'View page PDF';
      links.appendChild(a);
    }
    if(c.crops && c.crops.length>1){
      const a2 = document.createElement('a');
      a2.href = c.crops[0];
      a2.target = '_blank';
      a2.textContent = 'Open first crop';
      links.appendChild(a2);
    }
    // tags
    const tagsEl = node.querySelector('.tags');
    (c.tags||[]).forEach(t=>{
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      tagsEl.appendChild(span);
    });
    grid.appendChild(node);
  });
}

function applyFilters(){
  const q = (searchInput.value||'').toLowerCase();
  const src = sourceFilter.value;
  filtered = CLIPS.filter(c => {
    const matchesQuery = !q || (`${c.source_file} ${c.excerpt}`.toLowerCase().includes(q));
    const matchesSrc = !src || c.source_file === src;
    return matchesQuery && matchesSrc;
  });
  render();
}

fetch('clippings.json').then(r=>r.json()).then(data => {
  CLIPS = data.clippings || [];
  // build source filter
  const sources = Array.from(new Set(CLIPS.map(c=>c.source_file))).sort();
  sources.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    sourceFilter.appendChild(opt);
  });
  filtered = CLIPS.slice();
  render();
});

searchInput.addEventListener('input', applyFilters);
sourceFilter.addEventListener('change', applyFilters);
clearBtn.addEventListener('click', ()=>{
  searchInput.value='';
  sourceFilter.value='';
  applyFilters();
});
