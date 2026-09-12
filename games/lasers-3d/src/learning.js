/* Contextual lessons, accessible camera controls and a fired-route inspector. */
(function (root) {
  'use strict';
  function attach(app) {
    var doc = document, seen = '', selected = '', eventIndex = 0, lastTrace = null;
    var describe = doc.createElement('div'); describe.id = 'cursor-description'; describe.className = 'glass'; describe.setAttribute('role','status');
    doc.getElementById('stage').appendChild(describe);
    var move = doc.createElement('button'); move.id = 'btn-move'; move.className = 'btn'; move.textContent = '↗'; move.setAttribute('aria-label','Move selected piece');
    doc.getElementById('piece-controls').appendChild(move);
    move.addEventListener('click', app.moveSelected);
    var tools = doc.createElement('button'); tools.id = 'btn-camera-tools'; tools.className = 'btn'; tools.textContent = 'VIEW'; tools.setAttribute('aria-label','Camera and beam tools');
    doc.getElementById('more-sheet').appendChild(tools);
    tools.classList.add('tray-side-only');
    var panel = doc.createElement('div'); panel.className = 'backdrop'; panel.hidden = true;
    panel.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="Camera and beam tools"><button class="btn close-tools">Close</button><h2>Explore the board</h2><p>Tap 2D or 3D to switch views and centre the board. One finger pans. Drag two fingers down to tilt, up to look from above, or sideways to rotate around the board centre. Pinch to zoom. Hold a piece before dragging it to move. You can also pan with the arrows below. Tilting never costs a campaign star.</p><div class="camera-pad"><button class="btn" data-pan="-1,1" aria-label="Pan northwest">↖</button><button class="btn" data-pan="0,1" aria-label="Pan north">↑</button><button class="btn" data-pan="1,1" aria-label="Pan northeast">↗</button><button class="btn" data-pan="-1,0" aria-label="Pan west">←</button><button class="btn" data-zoom="1.3" aria-label="Zoom in">+</button><button class="btn" data-pan="1,0" aria-label="Pan east">→</button><button class="btn" data-pan="-1,-1" aria-label="Pan southwest">↙</button><button class="btn" data-pan="0,-1" aria-label="Pan south">↓</button><button class="btn" data-zoom="0.77" aria-label="Zoom out">−</button></div><h3>Follow your last shot</h3><p class="event-description" role="status">Fire a shot to inspect its path.</p><div class="coach-actions"><button class="btn" data-event="-1">Previous</button><button class="btn" data-event="1">Next event</button></div><button class="btn" data-practice>Replay this lesson</button><p>Campaign stars: connect the beam, use par or fewer pieces, solve without revealing an answer. A separate FROM ABOVE badge celebrates an unassisted solve without tilting. Previously earned stars are kept.</p></div>';
    doc.body.appendChild(panel);
    function close() { var was=!panel.hidden; panel.hidden = true; app.input.setEnabled(!app.ui.isModalOpen() && app.state.status !== 'tracing' && !app.state.revealPlaying && !app.state.resetting); if(was) tools.focus(); }
    tools.addEventListener('click',function(){ panel.hidden = false; app.input.setEnabled(false); panel.querySelector('.close-tools').focus(); });
    panel.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault();close();}
      if(e.key==='Tab'){var f=Array.from(panel.querySelectorAll('button:not(:disabled)')),i=f.indexOf(doc.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();}
    });
    panel.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      if(b.classList.contains('close-tools'))close();
      if(b.dataset.pan){var d=b.dataset.pan.split(',').map(Number);app.render.pan(-d[0]*100,d[1]*100);app.motion.requestRender();app.saveAttempt();}
      if(b.dataset.zoom){app.render.zoom(Number(b.dataset.zoom));app.motion.requestRender();app.saveAttempt();}
      if(b.hasAttribute('data-practice')){close();app.reset();seen='';app.getProgress().tutorialDone=false;app.ui.saveProgress(app.getProgress());if(app.state.levelIndex!==0)app.ui.showToast(app.state.level.intro||'Follow the beam, place a piece, and fire to discover its path.',{kind:'intro',ms:12000});}
      if(b.dataset.event){
        var s=app.state,r=s.lastShot,events=r?(r.events||[]).filter(function(ev){return app.knownCell(ev);}):[];
        if(r!==lastTrace){eventIndex=-1;lastTrace=r;}
        eventIndex=Math.max(0,Math.min(events.length-1,eventIndex+Number(b.dataset.event)));
        var ev=events[eventIndex],label=panel.querySelector('.event-description');
        if(!ev){label.textContent='Fire a shot to inspect its path.';return;}
        var kind=String(ev.kind||'beam').replace(/-/g,' ');
        label.textContent='Event '+(eventIndex+1)+' of '+events.length+': '+kind+', column '+(ev.x+1)+', row '+(ev.y+1)+', height '+ev.z+'.';
        app.focusCell(ev,true);app.render.pulseCell(ev);app.motion.requestRender();
      }
    });
    function update(v) {
      tools.disabled = v.revealPlaying || v.cameraBusy || v.status === 'tracing';
      var docked=getComputedStyle(doc.getElementById('btn-more')).display!=='none';
      var host=docked?doc.getElementById('more-sheet'):doc.querySelector('.tray-actions');
      if(tools.parentNode!==host)host.appendChild(tools);tools.classList.toggle('tray-side-only',!docked);
      var a=app.state,p=app.getProgress(),c=v.cursorCell||v.selectedCell;
      if(c){var key=c.x+','+c.y+','+a.version;if(key!==selected){selected=key;var piece=v.placed.find(function(t){return t.x===c.x&&t.y===c.y;});describe.textContent='Column '+(c.x+1)+', row '+(c.y+1)+(piece?' · '+piece.type+' '+piece.orient:app.knownCell(c)?' · square selected':' · undiscovered');}}
      else describe.textContent='';
      doc.querySelectorAll('.tray-card').forEach(function(b){var t=b.dataset.type,introduced=t==='SPLITTER'?a.level.tray.indexOf(t)!==-1:app.levels.slice(0,v.levelIndex+1).some(function(l){return l.tray.indexOf(t)!==-1;});b.setAttribute('data-unintroduced',introduced?'false':'true');});
      if(v.levelIndex===0&&!p.tutorialDone&&!app.ui.isModalOpen()){
        var first=v.placed[0],step=v.status==='won'?'done':!v.selectedTray&&!first?'pick':!first?'place':app.sim.trace(a.level,v.placed).allTargetsHit?'fire':'rotate';
        if(step!==seen){seen=step;
          var words={pick:'Choose MIRROR in the tray below.',place:'Tap the marked square to place your mirror.',rotate:'Tap your mirror to rotate it. Follow the beam toward the ring.',fire:'The beam reaches the target. Press FIRE!',done:'Connected! Tilt freely to explore. Your next puzzle is ready.'};
          app.ui.showToast(words[step],{kind:'intro',ms:10000});
          if(step==='place'){app.focusCell(a.solution[0],false);app.render.pulseCell(a.solution[0]);}
          if(step==='done'){p.tutorialDone=true;app.ui.saveProgress(p);}
        }
      }

    }
    return {close:close,update:update,destroy:function(){describe.remove();move.remove();tools.remove();panel.remove();}};
  }
  root.LaserLearning={attach:attach};
}(typeof self!=='undefined'?self:this));
