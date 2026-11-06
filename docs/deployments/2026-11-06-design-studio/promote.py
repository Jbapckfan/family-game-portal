from pathlib import Path,PurePosixPath
import json,hashlib,tarfile,os,subprocess,datetime
root=Path('/volume2/docker/caddy/sites/games/alford-daily')
base=Path('/volume2/docker/caddy/alford-daily-feedback')
package=base/'packages/MAKER-opus__design-studio-20261106'
target=root/'previews/design-studio'
baseline=json.loads((package/'baseline.json').read_text())
receipt=json.loads((package/'receipt.json').read_text())
assert subprocess.check_output(['hostname'],text=True).strip()==baseline['hostname']=='DXP6800PRO'
assert not target.exists(),'Already published: inspect before retrying'
def inventory(folder,exclude_studio=False):
 files={}
 for f in sorted(folder.rglob('*')):
  assert not f.is_symlink()
  if exclude_studio and (f==target or target in f.parents):continue
  if f.is_file():files[str(f.relative_to(folder))]=hashlib.sha256(f.read_bytes()).hexdigest()
 return files
def guard():
 raw=json.loads(subprocess.check_output(['docker','inspect','reflex-riot-public-web','reflex-riot-public-tunnel','alford-daily-feedback']))
 now=[{'name':c['Name'],'id':c['Id'],'startedAt':c['State']['StartedAt'],'running':c['State']['Running'],'restarts':c['RestartCount']} for c in raw]
 assert now==baseline['containers'],'Service state changed'
 assert hashlib.sha256(subprocess.check_output(['docker','exec','reflex-riot-public-web','cat','/etc/caddy/Caddyfile'])).hexdigest()==baseline['caddySHA256']
 assert hashlib.sha256((root.parent/'index.html').read_bytes()).hexdigest()==baseline['portalSHA256']
 assert inventory(root,True)==baseline['files'],'Existing public files changed'
guard()
archive=package/'design-studio.tar.gz'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==receipt['archiveSHA256']
stage=package/'incoming';assert not stage.exists();stage.mkdir(mode=0o755)
with tarfile.open(archive) as tf:
 members=tf.getmembers();assert {m.name for m in members}==set(receipt['files'])
 for m in members:
  n=PurePosixPath(m.name);assert m.isfile() and not n.is_absolute() and '..' not in n.parts
  b=tf.extractfile(m).read();assert hashlib.sha256(b).hexdigest()==receipt['files'][m.name]
  dest=stage/m.name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b);os.chmod(dest,0o644)
for d in stage.rglob('*'):
 if d.is_dir():os.chmod(d,0o755)
assert inventory(stage)==receipt['files'];guard();assert not target.exists()
assert stage.stat().st_dev==target.parent.stat().st_dev
os.rename(stage,target)
try:
 assert inventory(target)==receipt['files'];guard()
except Exception:
 os.rename(target,package/'failed-promotion');raise
result={'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'publicURL':receipt['publicURL'],'filesVerified':len(receipt['files']),'concepts':91,'unchangedProductionFiles':len(baseline['files']),'containersUnchanged':True,'caddyUnchanged':True,'playerDataUntouched':True,'target':str(target)}
(package/'promotion.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
