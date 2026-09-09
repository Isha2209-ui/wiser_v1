from pathlib import Path
import re
p=Path('/home/ubuntu/credwise-ai/client/src/components/DocumentReview.tsx')
t=p.read_text()
old=re.search(r'<aside className="doc-library">.*?</aside>',t,re.S)
if not old: raise SystemExit('library aside not found')
new='''<aside className="doc-library"><div className="doc-library-head"><div><p className="eyebrow">DOCUMENT LIBRARY</p><h2>My documents</h2></div><button className="doc-upload-btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Upload another</button><input ref={fileRef} hidden type="file" accept=".pdf" onChange={e => handleUpload(e.target.files?.[0])} /></div>{libraryDocs.map(item => <div className="doc-item-wrap" key={item.id}><button className={`doc-item ${item.id === selectedId ? "selected" : ""}`} onClick={() => { setSelectedId(item.id); setMessages([{ role: "assistant", content: `I’m ready to answer questions about ${item.name}.`, source: "Grounded in active PDF" }]); }}><div className="doc-file-icon"><FileText size={17} /></div><div><b>{item.name.replace(".pdf", "")}</b><span>{item.type} · {item.period}</span><small><i /> {item.status}</small></div><ChevronRight size={15} /></button><button className="doc-delete-btn" aria-label={`Delete ${item.name}`} onClick={() => handleDelete(item.id, item.name)}><X size={13} /></button></div>)}<div className="doc-library-foot"><ShieldCheck size={15} /><span>Documents are analyzed securely.<br /><b>Nothing is added to your profile without confirmation.</b></span></div></aside>'''
t=t[:old.start()]+new+t[old.end():]
p.write_text(t)
print('updated document library rows')
