from pathlib import Path
import hashlib,json,shutil
out=Path(__file__).parent.resolve();base=Path('/Users/jamesalford/Documents/Codex/2026-11-03/task-4/MAKER-codex__alford-herdr/cloudflare-current/site-v9-source/Alford-Daily-Site-v9/public');source=Path('/Users/jamesalford/Projects/MAKER-codex__alford-site-20261104/public');public=Path('/Users/jamesalford/Documents/Codex/2026-11-03/task-4/MAKER-codex__alford-herdr/cloudflare-current/player-site-candidate');candidate=out/'candidate';baseline=json.loads((out/'baseline.json').read_text())
def inventory(root):
 result={}
 for p in sorted(root.rglob('*')):
  assert not p.is_symlink(),p
  if p.is_file(): result[str(p.relative_to(root))]=hashlib.sha256(p.read_bytes()).hexdigest()
 return result
assert inventory(public)==baseline['files'],'Public candidate does not match live baseline'
assert not candidate.exists(),'Candidate already exists; inspect instead of overwriting'
shutil.copytree(public,candidate)
changes=[]
for p in sorted(source.rglob('*')):
 if not p.is_file():continue
 rel=p.relative_to(source);key=str(rel)
 if key in ['playtest-build.json','offline-worker.js']:continue
 previous=base/rel
 assert previous.is_file(),('new private file needs explicit review',key)
 if previous.read_bytes()==p.read_bytes():continue
 assert (public/rel).read_bytes()==previous.read_bytes(),('public-specific conflict',key)
 (candidate/rel).write_bytes(p.read_bytes());changes.append(key)
report={'publicURL':'https://pal-hand-strategic-competitions.trycloudflare.com/alford-daily/','baselineBuild':baseline['buildId'],'privateSourceCommit':'ae405e555392d1d528c9636257ea09f65f2bcafc','completedFixFiles':changes,'filesBefore':len(baseline['files']),'publicProfileAndFeedbackBytesPreserved':True}
(out/'merge-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
