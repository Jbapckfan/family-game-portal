from pathlib import Path
import hashlib,json,shutil,os
p=Path('/volume2/docker/caddy/alford-daily-feedback/packages/MAKER-opus__design-studio-theme-20261106');root=Path('/volume2/docker/caddy/sites/games/alford-daily/previews/design-studio')
def inv():return {str(f.relative_to(root)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(root.rglob('*')) if f.is_file()}
old=json.loads((p/'receipt-initial.json').read_text())['files'];new=json.loads((p/'receipt.json').read_text())['files'];assert inv()==old;changed=[n for n,v in new.items() if old.get(n)!=v];assert changed==['index.html','studio-shell.css']
backup=p/'before-wordmark';backup.mkdir()
for n in ['studio-shell.css','index.html']:
 src=p/'wordmark-patch'/n;assert hashlib.sha256(src.read_bytes()).hexdigest()==new[n];shutil.copy2(root/n,backup/n);os.chmod(src,0o644);os.replace(src,root/n)
assert inv()==new;result={'files':changed,'allGalleryHashesMatch':True,'reason':'Match gallery wordmark ink to main-page charcoal; version stylesheet URL.'};(p/'wordmark-patch.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
