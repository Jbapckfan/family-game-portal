from pathlib import Path,PurePosixPath
import ctypes,hashlib,json,os,tarfile,subprocess,stat,datetime,shutil
base=Path('/volume2/docker/caddy/alford-daily-feedback')
target=Path('/volume2/docker/caddy/sites/games/alford-daily')
package=base/'packages/MAKER-codex__public-sync-20261106'
baseline=json.loads((package/'baseline.json').read_text())
receipt=json.loads((package/'receipt.json').read_text())
assert subprocess.check_output(['hostname'],text=True).strip()=='DXP6800PRO'
assert len(receipt['buildId'])==16 and all(x in '0123456789abcdef' for x in receipt['buildId'])
stage_parent=base/'releases'/('public-fixes-20261106-'+receipt['buildId'])
stage=stage_parent/'incoming'
archive=package/receipt['archiveName']
assert archive.name=='alford-public-'+receipt['buildId']+'.tar.gz'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==receipt['archiveSHA256']
assert not stage_parent.exists(),'Existing release path: inspect an uncertain result before retrying'
assert shutil.disk_usage(base).free>100*1024*1024
def inventory(root):
    result={}
    for p in sorted(root.rglob('*')):
        assert not p.is_symlink(),str(p)
        if p.is_file():result[str(p.relative_to(root))]=hashlib.sha256(p.read_bytes()).hexdigest()
    return result
def guard():
    raw=json.loads(subprocess.check_output(['docker','inspect','reflex-riot-public-web','reflex-riot-public-tunnel','alford-daily-feedback']))
    current=[{'name':x['Name'],'id':x['Id'],'startedAt':x['State']['StartedAt'],'running':x['State']['Running'],'restarts':x['RestartCount']} for x in raw]
    assert current==baseline['containers'],'Service state changed; stop'
    assert hashlib.sha256(subprocess.check_output(['docker','exec','reflex-riot-public-web','cat','/etc/caddy/Caddyfile'])).hexdigest()==baseline['caddySHA256']
    assert hashlib.sha256((target.parent/'index.html').read_bytes()).hexdigest()==baseline['portalSHA256']
    assert stat.S_IMODE((base/'data').stat().st_mode)==baseline['dataMode']
    assert stat.S_IMODE((base/'data/feedback.sqlite3').stat().st_mode)==baseline['databaseMode']
guard()
assert inventory(target)==baseline['files'],'Public files changed since the inspected baseline'
stage_parent.mkdir(mode=0o700)
stage.mkdir(mode=0o755)
with tarfile.open(archive) as tf:
    members=tf.getmembers()
    assert len(members)==len(receipt['publicFiles'])
    assert {m.name for m in members}=={'alford-daily/'+n for n in receipt['publicFiles']}
    for member in members:
        name=PurePosixPath(member.name)
        assert member.isfile() and not name.is_absolute() and '..' not in name.parts
        relative=str(name.relative_to('alford-daily'))
        data=tf.extractfile(member).read()
        assert hashlib.sha256(data).hexdigest()==receipt['publicFiles'][relative]
        destination=stage/relative;destination.parent.mkdir(parents=True,exist_ok=True)
        with destination.open('xb') as stream:stream.write(data)
        os.chmod(destination,0o644)
for p in [stage,*stage.rglob('*')]:
    if p.is_dir():os.chmod(p,0o755)
assert inventory(stage)==receipt['publicFiles']
assert stage.stat().st_dev==target.stat().st_dev
assert inventory(target)==baseline['files']
guard()
libc=ctypes.CDLL(None,use_errno=True)
exchange=libc.renameat2
exchange.argtypes=[ctypes.c_int,ctypes.c_char_p,ctypes.c_int,ctypes.c_char_p,ctypes.c_uint]
exchange.restype=ctypes.c_int
def swap():
    if exchange(-100,os.fsencode(stage),-100,os.fsencode(target),2):raise OSError(ctypes.get_errno(),os.strerror(ctypes.get_errno()))
swap()
try:
    assert inventory(target)==receipt['publicFiles']
    guard()
except Exception:
    swap()
    raise
previous=stage_parent/'previous-live'
stage.rename(previous)
assert inventory(previous)==baseline['files']
proof={'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'buildId':receipt['buildId'],'previousBuildId':baseline['buildId'],'filesVerified':len(receipt['publicFiles']),'changedFiles':receipt['changed'],'previousLive':str(previous),'publicURL':receipt['publicURL'],'containersUnchanged':True,'caddyUnchanged':True,'portalUnchanged':True,'feedbackAndProfilesUntouched':True}
(stage_parent/'promotion.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps(proof))
