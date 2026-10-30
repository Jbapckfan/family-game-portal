from pathlib import Path
import random,json
rng=random.Random(20261030)
n=5;count=n*n
adj=[[b for b in range(count) if abs(a%n-b%n)+abs(a//n-b//n)==1] for a in range(count)]
# Construct comparisons from a valid serpentine route, then verify independently.
route=[r*n+c for r in range(n) for c in (range(n) if r%2==0 else range(n-1,-1,-1))]
start,end=route[0],route[-1]
def solve(values):
 solutions=[];visits=0
 def walk(path,seen):
  nonlocal visits
  visits+=1
  if len(solutions)>1:return
  if len(path)==count:
   if path[-1]==end:solutions.append(path.copy())
   return
  a=path[-1]
  for b in adj[a]:
   if seen>>b&1 or (b==end and len(path)!=count-1):continue
   if (values[b]>values[a]) != (len(path)%2==1):continue
   walk(path+[b],seen|(1<<b))
 walk([start],1<<start)
 return solutions,visits
for attempt in range(1,10001):
 before=[set() for _ in range(count)]
 for i in range(count-1):
  a,b=route[i:i+2]
  low,high=(a,b) if i%2==0 else (b,a)
  before[high].add(low)
 values=[0]*count;remaining=set(range(count))
 for rank in range(1,count+1):
  available=[v for v in sorted(remaining) if not before[v]&remaining]
  chosen=rng.choice(available);values[chosen]=rank;remaining.remove(chosen)
 solutions,visits=solve(values)
 if len(solutions)==1:
  assert solutions[0]==route
  data={'label':'5x5 sizing concept; not a playable release','size':n,'values':values,'start':start,'end':end,'solution':route,'solutionCount':1,'independentSearchStates':visits,'attempt':attempt,'minimumMoves':count-1}
  Path(__file__).with_name('five-by-five-study.json').write_text(json.dumps(data,indent=2)+'\n')
  print(json.dumps({k:v for k,v in data.items() if k not in ('values','solution')}));break
else:raise RuntimeError('No uniquely solvable example found')
