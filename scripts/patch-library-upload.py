from pathlib import Path
import re
p=Path('/home/ubuntu/credwise-ai/client/src/components/DocumentReview.tsx')
t=p.read_text()
old='''<button className="doc-upload-btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Upload another</button><input ref={fileRef} hidden type="file" accept=".pdf" onChange={e => handleUpload(e.target.files?.[0])} />'''
new='''<button className="doc-upload-btn" onClick={() => { if (fileRef.current) fileRef.current.value = ""; fileRef.current?.click(); }}><Upload size={15} /> Upload another</button><input ref={fileRef} hidden type="file" accept="application/pdf,.pdf" onChange={e => { void handleUpload(e.target.files?.[0]); e.currentTarget.value = ""; }} />'''
if old not in t: raise SystemExit('upload header not found')
t=t.replace(old,new,1)
needle='</div>{libraryDocs.map(item =>'
t=t.replace(needle,'</div>{uploadError && <div className="upload-error library-error"><CircleAlert size={14} />{uploadError}</div>}{libraryDocs.map(item =>',1)
p.write_text(t)
print('patched library upload')
