from pathlib import Path
import os,re,json,subprocess,sys,time
root=Path(__file__).resolve().parent;job=sys.argv[1];folder=root/job;prompt=(folder/'prompt.txt').read_text()
env={k:v for k,v in os.environ.items() if not re.search(r'(_KEY|_TOKEN|_SECRET|PASSWORD|CREDENTIAL|APIKEY)$',k,re.I) and not re.match(r'^(ANTHROPIC|OPENAI|OPENROUTER|NVIDIA|GLM|KIMI|GEMINI|GOOGLE_API|HERMES)_',k,re.I)}
env.pop('CLAUDECODE',None);env['CLAUDE_CODE_MAX_OUTPUT_TOKENS']='32000'
args=['claude','-p','--model','claude-opus-5-5','--agents',str(root/'agents.json'),'--agent','design-lead','--effort','high','--restricted','--tools','Read,Write,Edit,Glob,Grep','--allowedTools','Read,Write,Edit,Glob,Grep','--permission-mode','acceptEdits','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--no-session-persistence','--output-format','stream-json','--verbose']
started=time.time()
with (root/'provenance'/(job+'.jsonl')).open('w') as out,(root/'provenance'/(job+'.stderr')).open('w') as err:
 p=subprocess.run(args,input=prompt,cwd=root,env=env,stdout=out,stderr=err,text=True,timeout=1800)
last=None
for line in (root/'provenance'/(job+'.jsonl')).read_text().splitlines():
 try:
  d=json.loads(line)
  if d.get('type')=='result':last=d
 except:pass
summary={'job':job,'exitCode':p.returncode,'seconds':round(time.time()-started,1),'isError':last.get('is_error') if last else True,'models':list(last.get('modelUsage',{})) if last else [],'result':last.get('result') if last else 'No terminal result'}
(root/'provenance'/(job+'-result.json')).write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))
