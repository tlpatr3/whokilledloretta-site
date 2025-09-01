const host = document.getElementById('timeline');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
fetch('clippings.json').then(r=>r.json()).then(({clippings}) => {
  const byYear = {};
  (clippings||[]).forEach(c => {
    const y = c.year || 'Undated';
    byYear[y] = byYear[y] || [];
    byYear[y].push(c);
  });
  const years = Object.keys(byYear).sort();
  host.innerHTML = '';
  years.forEach(y => {
    const h = document.createElement('h2'); h.textContent = y; host.appendChild(h);
    const list = document.createElement('div'); list.className = 'grid'; host.appendChild(list);
    byYear[y].forEach(c => {
      const card = document.createElement('article'); card.className='card';
      const thumb = document.createElement('div'); thumb.className='thumb';
      const preview = (c.crops && c.crops.length) ? c.crops[0] : null;
      if(preview){ thumb.style.backgroundImage=`url('${preview}')`; thumb.onclick=()=>{ lightboxImg.src=preview; lightbox.classList.remove('hidden'); }; }
      const meta = document.createElement('div'); meta.className='meta';
      const title = document.createElement('h3'); title.className='title'; title.textContent = `${c.source_label||c.source_file} — p.${c.source_page}`;
      const excerpt = document.createElement('p'); excerpt.className='excerpt'; excerpt.textContent = (c.excerpt||'').replace(/\s+/g,' ').slice(0,220);
      const links = document.createElement('div'); links.className='links';
      if(c.page_pdf){ const a=document.createElement('a'); a.href=c.page_pdf; a.target='_blank'; a.textContent='View page PDF'; links.appendChild(a); }
      if(preview){ const a2=document.createElement('a'); a2.href=preview; a2.target='_blank'; a2.textContent='Open first crop'; links.appendChild(a2); }
      const tags = document.createElement('div'); tags.className='tags'; (c.tags||[]).forEach(t=>{ const s=document.createElement('span'); s.className='tag'; s.textContent=t; tags.appendChild(s); });
      meta.appendChild(title); meta.appendChild(excerpt); meta.appendChild(links); meta.appendChild(tags);
      card.appendChild(thumb); card.appendChild(meta); list.appendChild(card);
    });
  });
});