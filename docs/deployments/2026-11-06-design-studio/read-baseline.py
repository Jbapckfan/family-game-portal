from pathlib import Path
import json,hashlib,subprocess,datetime
root=Path('/volume2/docker/caddy/sites/games/alford-daily')
target=root/'previews/design-studio'
assert not target.exists(),'Preview target already exists; inspect before continuing'
containers=json.loads(subprocess.check_output(['docker','inspect','reflex-riot-public-web','reflex-riot-public-tunnel','alford-daily-feedback']))
result={'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'hostname':subprocess.check_output(['hostname'],text=True).strip(),'target':str(target),'files':{},'containers':[{'name':c['Name'],'id':c['Id'],'startedAt':c['State']['StartedAt'],'running':c['State']['Running'],'restarts':c['RestartCount']} for c in containers]}
assert result['hostname']=='DXP6800PRO'
for f in sorted(root.rglob('*')):
 assert not f.is_symlink()
 if f.is_file():result['files'][str(f.relative_to(root))]=hashlib.sha256(f.read_bytes()).hexdigest()
result['caddySHA256']=hashlib.sha256(subprocess.check_output(['docker','exec','reflex-riot-public-web','cat','/etc/caddy/Caddyfile'])).hexdigest()
result['portalSHA256']=hashlib.sha256((root.parent/'index.html').read_bytes()).hexdigest()
print(json.dumps(result,indent=2))
