from pathlib import Path
p=Path('/home/ubuntu/credwise-ai/client/src/components/DocumentReview.tsx')
lines=p.read_text().splitlines()
handlers=[]
kept=[]
for line in lines:
    if line.startswith('  const handleUpload = async') or line.startswith('  const handleDelete = async'):
        handlers.append(line)
    else:
        kept.append(line)
idx=next(i for i,line in enumerate(kept) if line.startswith('  if (isLoading)'))
kept[idx:idx]=handlers
p.write_text('\n'.join(kept)+'\n')
print('moved handlers before returns')
