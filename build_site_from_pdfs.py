#!/usr/bin/env python3
import fitz, os, re, json, argparse
from pathlib import Path
PATS=[r"lorett?a",r"willoug?h?by",r"\bmurder\b",r"\bhomicide\b",r"\bslaying\b",r"\bvictim\b","investigat",r"\bsuspect\b",r"\bbody\b"]
REG=[re.compile(p,re.I) for p in PATS]; LITS=["Loretta","Lorette","Willougby","Willoughby","murder","homicide"]
def hit(t): return bool(t) and any(rx.search(t) for rx in REG)
def merge(rects,px=10,py=8):
    m=[];ov=lambda a,b: not(a.x1<b.x0 or b.x1<a.x0 or a.y1<b.y0 or b.y1<a.y0)
    for r in rects:
        ex=fitz.Rect(r.x0-px,r.y0-py,r.x1+px,r.y1+py)
        for i,u in enumerate(m):
            if ov(ex,u): m[i]=u|ex; break
        else: m.append(ex)
    return m
def main(site='.',out='CASE_EXTRACTS',pattern='*.SEARCHABLE.pdf'):
    site=Path(site).resolve(); out=Path(site/out); out.mkdir(parents=True, exist_ok=True)
    pdfs=sorted(site.glob(pattern))
    if not pdfs: print(f'No PDFs match {pattern}'); return 1
    clips=[]; cid=1
    for pdf in pdfs:
        try: doc=fitz.open(pdf)
        except Exception as e: print('[SKIP]',pdf.name,e); continue
        src=pdf.stem; dst=out/src; dst.mkdir(parents=True, exist_ok=True)
        for i in range(len(doc)):
            pg=doc[i]; txt=pg.get_text() or ''
            if not hit(txt): continue
            (dst/f'page_{i+1:04d}.txt').write_text(txt, encoding='utf-8')
            rects=[]; 
            for w in LITS: rects+=pg.search_for(w,hit_max=200); rects+=pg.search_for(w.lower(),hit_max=200); rects+=pg.search_for(w.upper(),hit_max=200)
            rects=merge(rects)
            one=dst/f'p{i+1:04d}.pdf'; sd=fitz.open(); sd.insert_pdf(doc, from_page=i, to_page=i); sd.save(one); sd.close()
            crops=[]
            for n,r in enumerate(rects,1):
                pix=pg.get_pixmap(matrix=fitz.Matrix(2,2), clip=r); img=dst/f'p{i+1:04d}_hit{n:02d}.png'
                pix.save(img.as_posix()); crops.append(str(img.relative_to(site)))
            lines=[ln for ln in txt.splitlines() if hit(ln)]; exc='\n'.join(lines[:10]).strip()
            clips.append({'id':cid,'source_file':src,'source_page':i+1,'excerpt':exc,'page_pdf':str(one.relative_to(site)),'crops':crops,'tags':[t for t in re.split(r'[\W_]+',src) if t]})
            cid+=1
    (site/'clippings.json').write_text(json.dumps({'clippings':clips}, indent=2), encoding='utf-8')
    print('Wrote clippings.json with', len(clips), 'entries. Assets in', out)
if __name__=='__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('--site', default='.');
    ap.add_argument('--out', default='CASE_EXTRACTS'); ap.add_argument('--pattern', default='*.SEARCHABLE.pdf')
    a=ap.parse_args(); import sys; sys.exit(main(a.site, a.out, a.pattern))
