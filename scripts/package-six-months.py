#!/usr/bin/env python3
"""Package a committed Alford Daily source tree and byte-verified staged web build."""
import argparse, hashlib, json, subprocess, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def digest(data):return hashlib.sha256(data).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--stage',required=True,type=Path);p.add_argument('--output',required=True,type=Path);p.add_argument('--commit',required=True);args=p.parse_args()
 stage=args.stage.resolve();out=args.output.resolve()
 if out.exists():raise ValueError('Refusing to replace an existing archive')
 commit=subprocess.check_output(['git','rev-parse',args.commit],cwd=ROOT,text=True).strip()
 inv=json.loads((stage/'release.json').read_text());manifest=json.loads((stage/'playtest-build.json').read_text())
 assert inv['gameCount']==32 and inv['minimumPerGame']>=200
 for asset in manifest['assets']:
  f=stage/asset['url'];assert f.is_file() and not f.is_symlink() and digest(f.read_bytes())==asset['sha256'],asset['url']
 folders=[f"games/{g['slug']}/" for g in inv['games']]+['games/nested-tic-tac-toe/','games/daily/','games/kimi-runtime/','games/deepseek-runtime/','packages/kimi-pebbles/','ios/','scripts/','docs/','design/','sources/','tests/']
 records=subprocess.check_output(['git','ls-tree','-rz',commit],cwd=ROOT).split(b'\0')
 files=[]
 for entry in records:
  if not entry:continue
  meta,name=entry.split(b'\t',1);mode,kind,sha=meta.decode().split();name=name.decode()
  if kind!='blob' or mode=='120000' or not any(name.startswith(prefix) for prefix in folders):continue
  local=ROOT/name;data=local.read_bytes();actual=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
  assert actual==sha,f'Source differs from commit: {name}'
  files.append((f'source/{name}',data))
 for f in sorted(stage.rglob('*')):
  if f.is_file():
   assert not f.is_symlink();files.append(('web/'+str(f.relative_to(stage)),f.read_bytes()))
 readme=f'''Alford Daily — verified six-month build, October 29, 2026

32 daily games + nine-board Tic-Tac-Toe bonus.
182 distinct daily challenge configurations per game: October29–April28,2027.
{inv['totalPuzzles']:,} stored puzzle records; at least200 eligible distinct challenges per daily game.
Some word games reuse vocabulary, clues, or component puzzles in different combinations.

The updated build was opened on James's Mac in an isolated local preview.
The web/ folder is a complete standalone build. Serve this folder through an approved
local HTTP server or the existing private Alford Daily host. Opening index.html as a
file:// URL does not reliably support modules, saved games, or offline caching.
On James's managed Macs, select the registered project port with local-projects first;
do not use port8765 (Live TV). No hosting or access-control changes were made by this package.
Keep the same browser and origin for saved games. The isolated preview has separate saves.

Read source/docs/SIX-MONTH-VERIFICATION.md for per-game evidence and review limitations.
The three model reviews are static code reviews; author-run tests and real browser
playthroughs are separately recorded. Physical iPhone and human editorial testing remain open.

source/ contains the scoped game project, including the native iOS source and offline assets.
The unsigned iPhone build compiled successfully; it was not installed on a device.
Source commit: {commit}
Web build ID: {manifest['buildId']}
No public deployment is represented by this archive.
'''
 files.append(('START-HERE.txt',readme.encode()))
 receipt={'sourceCommit':commit,'webBuildId':manifest['buildId'],'files':[{'path':name,'bytes':len(data),'sha256':digest(data)} for name,data in files]}
 files.append(('PACKAGE-MANIFEST.json',(json.dumps(receipt,indent=2)+'\n').encode()))
 out.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
  for name,data in files:archive.writestr(name,data)
 with zipfile.ZipFile(out) as archive:
  assert archive.testzip() is None
  for record in receipt['files']:assert digest(archive.read(record['path']))==record['sha256']
 checksum=digest(out.read_bytes());out.with_suffix(out.suffix+'.sha256').write_text(f'{checksum}  {out.name}\n')
 print(json.dumps({'archive':str(out),'bytes':out.stat().st_size,'files':len(files),'sha256':checksum,'commit':commit,'buildId':manifest['buildId']}))
if __name__=='__main__':main()
