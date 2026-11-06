from pathlib import Path
import hashlib,json,subprocess,datetime
base=Path('/volume2/docker/caddy/alford-daily-feedback/packages/MAKER-codex__public-sync-20261106');r=json.loads((base/'route-restore.json').read_text());baseline=json.loads((base/'baseline.json').read_text());container='reflex-riot-public-web'
def digest(b):return hashlib.sha256(b).hexdigest()
def live():return subprocess.check_output(['docker','exec',container,'cat','/etc/caddy/Caddyfile'])
assert digest(live())==r['oldSHA256'],'Current route config changed; stop'
new=base/'restored-caddy.txt';assert digest(new.read_bytes())==r['newSHA256']
old=base/'caddy-before-route-restoration.txt';assert not old.exists();old.write_bytes(live())
subprocess.run(['docker','cp',str(new),container+':/tmp/alford-approved-route-restoration.Caddyfile'],check=True)
subprocess.run(['docker','exec',container,'caddy','validate','--config','/tmp/alford-approved-route-restoration.Caddyfile','--adapter','caddyfile'],check=True,capture_output=True)
assert digest(live())==r['oldSHA256']
try:
 subprocess.run(['docker','cp',str(new),container+':/etc/caddy/Caddyfile'],check=True)
 subprocess.run(['docker','exec',container,'caddy','reload','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'],check=True,capture_output=True)
 assert digest(live())==r['newSHA256']
except Exception:
 subprocess.run(['docker','cp',str(old),container+':/etc/caddy/Caddyfile'],check=True)
 subprocess.run(['docker','exec',container,'caddy','reload','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'],check=True,capture_output=True)
 raise
raw=json.loads(subprocess.check_output(['docker','inspect','reflex-riot-public-web','reflex-riot-public-tunnel','alford-daily-feedback']))
state=[{'name':x['Name'],'id':x['Id'],'startedAt':x['State']['StartedAt'],'running':x['State']['Running'],'restarts':x['RestartCount']} for x in raw];assert state==baseline['containers']
proof={**r,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'validated':True,'gracefullyReloaded':True,'containersUnchanged':True,'databaseNotAccessed':True};(base/'route-restoration-proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
