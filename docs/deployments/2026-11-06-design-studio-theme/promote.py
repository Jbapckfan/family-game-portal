from pathlib import Path,PurePosixPath
import json,hashlib,tarfile,os,subprocess,datetime,ctypes
root=Path('/volume2/docker/caddy/sites/games/alford-daily');target=root/'previews/design-studio'
package=Path('/volume2/docker/caddy/alford-daily-feedback/packages/MAKER-opus__design-studio-theme-20261106')
baseline=json.loads((package/'baseline.json').read_text());receipt=json.loads((package/'receipt.json').read_text())
assert subprocess.check_output(['hostname'],text=True).strip()==baseline['hostname']=='DXP6800PRO'
def inventory(folder):
 files={}
 for f in sorted(folder.rglob('*')):
  assert not f.is_symlink()
  if f.is_file():files[str(f.relative_to(folder))]=hashlib.sha256(f.read_bytes()).hexdigest()
 return files
original_other={k:v for k,v in baseline['files'].items() if not k.startswith('previews/design-studio/')}
def guard():
 raw=json.loads(subprocess.check_output(['docker','inspect','reflex-riot-public-web','reflex-riot-public-tunnel','alford-daily-feedback']))
 now=[{'name':c['Name'],'id':c['Id'],'startedAt':c['State']['StartedAt'],'running':c['State']['Running'],'restarts':c['RestartCount']} for c in raw]
 assert now==baseline['containers'],'Service state changed'
 assert hashlib.sha256(subprocess.check_output(['docker','exec','reflex-riot-public-web','cat','/etc/caddy/Caddyfile'])).hexdigest()==baseline['caddySHA256']
 assert hashlib.sha256((root.parent/'index.html').read_bytes()).hexdigest()==baseline['portalSHA256']
 assert {k:v for k,v in inventory(root).items() if not k.startswith('previews/design-studio/')}==original_other,'Player files changed'
guard();assert inventory(target)==baseline['previousGallery'],'Gallery changed since baseline'
archive=package/'design-studio.tar.gz';assert hashlib.sha256(archive.read_bytes()).hexdigest()==receipt['archiveSHA256']
stage=package/'incoming';assert not stage.exists();stage.mkdir(mode=0o755)
with tarfile.open(archive) as tf:
 members=tf.getmembers();assert {m.name for m in members}==set(receipt['files'])
 for m in members:
  n=PurePosixPath(m.name);assert m.isfile() and not n.is_absolute() and '..' not in n.parts
  data=tf.extractfile(m).read();assert hashlib.sha256(data).hexdigest()==receipt['files'][m.name]
  f=stage/m.name;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(data);os.chmod(f,0o644)
for d in stage.rglob('*'):
 if d.is_dir():os.chmod(d,0o755)
assert inventory(stage)==receipt['files'];guard();assert inventory(target)==baseline['previousGallery']
assert stage.stat().st_dev==target.stat().st_dev
libc=ctypes.CDLL(None,use_errno=True);exchange=libc.renameat2;exchange.argtypes=[ctypes.c_int,ctypes.c_char_p,ctypes.c_int,ctypes.c_char_p,ctypes.c_uint];exchange.restype=ctypes.c_int
def swap():
 if exchange(-100,os.fsencode(stage),-100,os.fsencode(target),2):raise OSError(ctypes.get_errno(),os.strerror(ctypes.get_errno()))
swap()
try:
 assert inventory(target)==receipt['files'];guard()
except Exception:
 swap();raise
previous=package/'previous-gallery';stage.rename(previous);assert inventory(previous)==baseline['previousGallery']
result={'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'publicURL':receipt['publicURL'],'revision':2,'filesVerified':len(receipt['files']),'concepts':91,'unchangedProductionFiles':len(original_other),'containersUnchanged':True,'caddyUnchanged':True,'playerDataUntouched':True,'previousGallery':str(previous)}
(package/'promotion.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
