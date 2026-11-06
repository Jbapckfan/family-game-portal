from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from urllib.parse import quote
import hashlib,json
out=Path(__file__).parent;r=json.loads((out/'receipt.json').read_text());base=r['publicURL']
def check(item):
 n,expected=item;u=base+quote(n,safe='/')
 with urlopen(Request(u,headers={'Cache-Control':'no-cache'}),timeout=25) as response:
  data=response.read();assert response.status==200;assert response.geturl().startswith(base);assert hashlib.sha256(data).hexdigest()==expected,n
  mime=response.headers.get('Content-Type','')
  if n.endswith('.mjs'):assert 'javascript' in mime,(n,mime)
  if n.endswith('.css'):assert 'text/css' in mime,(n,mime)
 return n
with ThreadPoolExecutor(max_workers=6) as pool:checked=list(pool.map(check,r['publicFiles'].items()))
with urlopen(Request(base,headers={'Cache-Control':'no-cache'}),timeout=20) as response:assert hashlib.sha256(response.read()).hexdigest()==r['publicFiles']['index.html']
try:
 urlopen(base+'api/feedback',timeout=15)
 raise AssertionError('Feedback unexpectedly permits a public read')
except HTTPError as e:assert e.code==405,e.code
result={'publicURL':base,'buildId':r['buildId'],'verifiedPublicFiles':len(checked),'rootMatches':True,'feedbackPublicReadStatus':405,'postRequestsMade':0};(out/'public-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
