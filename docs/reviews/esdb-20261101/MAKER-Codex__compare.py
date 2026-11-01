from pathlib import Path
import json,re,gzip,hashlib,collections
out=Path(__file__).resolve().parent
root=out.parents[1]
data=root/'packages/kimi-pebbles/data'
english=json.loads((data/'english-words-source.json').read_text())
pins=json.loads((data/'word-game-sources.json').read_text())
inputs=[('english-words-alpha.txt',english['files']['words_alpha.txt']['sha256'],'text'),('wordnik-game-words.txt',next(x for x in pins if x['repository'].endswith('/wordnik/wordlist'))['files']['wordlist-20210729.txt']['sha256'],'quoted'),('enable2k.txt.gz',next(x for x in pins if x['repository'].endswith('/BartMassey/wordlists'))['files']['enable2k.txt.gz']['sha256'],'gzip')]
base=set();baseline=[]
for name,expected,kind in inputs:
 raw=(data/name).read_bytes();sha=hashlib.sha256(raw).hexdigest();assert sha==expected
 text=gzip.decompress(raw).decode() if kind=='gzip' else raw.decode()
 rows=[json.loads(w) for w in text.splitlines() if w] if kind=='quoted' else text.split()
 words={w for w in rows if re.fullmatch('[a-z]+',w)}
 base.update(words);baseline.append({'file':name,'words':len(words),'sha256':sha})
zynga=json.loads((data/'zynga-disclosed-words.json').read_text())['words'];base.update(zynga);assert len(base)==409097
modern='emoji emojis twerk twerks twerked twerking selfie selfies blog blogs blogging podcast podcasts livestream livestreams livestreamed livestreaming doomscroll doomscrolls doomscrolling hashtag hashtags smartphone smartphones smartwatch smartwatches crowdfund crowdfunds crowdfunding vape vapes vaped vaping vlog vlogs vlogging nonbinary neurodiversity cisgender avatar sudoku boba ramen umami quinoa kombucha sriracha terabyte chatbot chatbots codebase codebases tokenize tokenizes tokenized tokenizing wifi webcam'.split()
variants='color colour center centre yogurt yoghurt yogourt fetus foetus organize organise ax axe naive naïve cooperate co-operate'.split()
sets={};summaries=[]
for p in sorted((out/'current').glob('en_*.txt'))+sorted((out/'release-2026.02.25').glob('en_*.txt')):
 raw=p.read_bytes();rows=raw.decode('utf8').splitlines();words={w for w in rows if re.fullmatch('[a-z]+',w)};folded={w.lower() for w in rows if re.fullmatch('[A-Za-z]+',w)}
 name=str(p.relative_to(out));sets[name]=words;added=words-base
 count=lambda values:{str(n):sum(len(w)==n for w in values) for n in range(3,8)}
 categories=collections.Counter();examples=collections.defaultdict(list)
 for w in rows:
  if re.fullmatch('[a-z]+',w):category='acceptedLowerASCII'
  elif re.fullmatch('[A-Za-z]+',w):category='capitalizedASCII'
  elif "'" in w or '\u2019' in w:category='apostrophe'
  elif '-' in w:category='hyphen'
  elif any(ord(c)>127 for c in w):category='nonASCII'
  else:category='other'
  categories[category]+=1
  if len(examples[category])<12:examples[category].append(w)
 summaries.append({'file':name,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'lines':len(rows),'uniqueLines':len(set(rows)),'strictLowerASCII':len(words),'caseFoldedASCII':len(folded),'caseFoldOnly':len(folded-words),'strictAdditionsToBaseline':len(added),'strictCounts3to7':count(words),'additionCounts3to7':count(added),'added3to7':sum(3<=len(w)<=7 for w in added),'categories':dict(categories),'categorySamples':dict(examples)})
for label,names in {
 'current_default60_all_dialects':[n for n in sets if n.startswith('current/') and 'large' not in n],
 'current_large70_all_dialects':[n for n in sets if n.startswith('current/') and 'large' in n],
 'current_large70_non_AU':[n for n in sets if n.startswith('current/') and 'large' in n and 'AU' not in n],
 'current_all9':[n for n in sets if n.startswith('current/')],
}.items():
 words=set().union(*(sets[n] for n in names));sets[label]=words;added=words-base
 summaries.append({'file':label,'componentFiles':names,'strictLowerASCII':len(words),'strictAdditionsToBaseline':len(added),'newUnionTotal':len(base|words),'strictCounts3to7':count(words),'additionCounts3to7':count(added),'added3to7':sum(3<=len(w)<=7 for w in added)})
 (out/(label+'-additions.txt')).write_text('\n'.join(sorted(added))+'\n')
# Retain complete candidate additions, not only hand-picked examples.
for name in ['current/en_US.txt','current/en_US-large.txt']:
 (out/(Path(name).stem+'-additions.txt')).write_text('\n'.join(sorted(sets[name]-base))+'\n')
matrix=[{'word':w,'baseline':w in base,**{name:w in words for name,words in sets.items()}} for w in modern+variants]
release_diffs={}
for name in ['en_US.txt','en_US-large.txt']:
 a=sets['release-2026.02.25/'+name];b=sets['current/'+name]
 release_diffs[name]={'addedSinceRelease':len(b-a),'removedSinceRelease':len(a-b),'newWords':sorted(b-a),'removedWords':sorted(a-b)}
manifest=json.loads((out/'MAKER-Codex__download-manifest.json').read_text())
report={'baselineWords':len(base),'baselineSources':baseline,'currentGeneratedCommit':manifest['generatedCommit'],'currentSourceCommit':manifest['correspondingSourceCommit'],'releaseGeneratedCommit':manifest['releaseGeneratedCommit'],'filter':'Only original lines matching ^[a-z]+$; no case folding, punctuation stripping, inferred inflections or deaccenting.','lists':summaries,'coverage':matrix,'releaseDeltas':release_diffs,'allCandidateAdditionsRetained':True}
(out/'MAKER-Codex__coverage.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'baselineWords':len(base),'lists':[{k:r[k] for k in ['file','strictLowerASCII','strictAdditionsToBaseline','added3to7','additionCounts3to7']} for r in summaries],'modernMissingBoth': [w for w in modern if w not in base and w not in sets['current_all9']],'newModernExamples':[w for w in modern if w not in base and w in sets['current_all9']]},indent=2))
