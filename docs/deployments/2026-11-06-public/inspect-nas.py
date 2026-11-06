from pathlib import Path
import hashlib,json,subprocess,stat
root=Path('/volume2/docker/caddy/sites/games/alford-daily');base=Path('/volume2/docker/caddy/alford-daily-feedback')
assert subprocess.check_output(['hostname'],text=True).strip()=='DXP6800PRO'
assert root.is_dir() and not root.is_symlink()
files={}
for p in sorted(root.rglob('*')):
 assert not p.is_symlink(),str(p)
 if p.is_file():files[str(p.relative_to(root))]=hashlib.sha256(p.read_bytes()).hexdigest()
raw=json.loads(subprocess.check_output(['docker','inspect','reflex-riot-public-web','reflex-riot-public-tunnel','alford-daily-feedback']))
containers=[{'name':x['Name'],'id':x['Id'],'startedAt':x['State']['StartedAt'],'running':x['State']['Running'],'restarts':x['RestartCount']} for x in raw]
assert all(c['running'] for c in containers)
result={'root':str(root),'buildId':json.loads((root/'playtest-build.json').read_text())['buildId'],'files':files,'containers':containers,'caddySHA256':hashlib.sha256(subprocess.check_output(['docker','exec','reflex-riot-public-web','cat','/etc/caddy/Caddyfile'])).hexdigest(),'portalSHA256':hashlib.sha256((root.parent/'index.html').read_bytes()).hexdigest(),'dataMode':stat.S_IMODE((base/'data').stat().st_mode),'databaseMode':stat.S_IMODE((base/'data/feedback.sqlite3').stat().st_mode)}
print(json.dumps(result,indent=2))
