// analysis-tab.js
// Simple Analysis viewer that reads AttentiaCore.getRuns and shows basic charts using Chart.js (CDN required)

document.addEventListener('DOMContentLoaded', () => {
  // add analysis link if nav exists
  const nav = document.querySelector('.navbar nav ul') || document.querySelector('nav') || null;
  if (nav && !document.getElementById('analysis-link')){
    const li = document.createElement('li');
    li.style.listStyle = 'none';
    li.innerHTML = `<a href="#" id="analysis-link" style="color:#00bfff">Analysis</a>`;
    nav.appendChild(li);
    document.getElementById('analysis-link').addEventListener('click', (e)=> {
      e.preventDefault();
      showAnalysisOverlay();
    });
  }
});

function showAnalysisOverlay(){
  const overlay = document.createElement('div');
  overlay.className = 'att-modal-backdrop';
  overlay.innerHTML = `
    <div class="att-modal" style="max-width:1000px;overflow:auto;max-height:80vh">
      <div style="padding:18px;">
        <h3>Analysis</h3>
        <div style="display:flex;gap:14px;">
          <div style="flex:1;">
            <label style="color:#8b949e">Game</label>
            <select id="an-game-select" style="width:100%;padding:8px;margin:6px 0;background:#111;border:1px solid #333;color:#fff;">
              <option value="reflex_dash">Reflex × Dash</option>
              <option value="sequence_recall">Sequence Recall</option>
              <option value="logic_flow">Logic Flow</option>
              <option value="chess">Chess</option>
              <option value="sudoku">Sudoku</option>
              <option value="jigsaw">Jigsaw</option>
              <option value="riddles">Riddles</option>
            </select>
            <div id="an-summary" style="margin-top:10px;color:#cbd5db"></div>
          </div>
          <div style="flex:1;">
            <canvas id="anChart" style="width:100%;height:220px;"></canvas>
          </div>
        </div>
        <div style="margin-top:12px;">
          <h4 style="margin:8px 0">Recent runs</h4>
          <div id="an-runs" style="max-height:260px;overflow:auto;background:#0b0d0f;padding:8px;border-radius:8px;border:1px solid #171a1d"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:14px;"><button id="an-close" class="att-btn att-small-btn">Close</button></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const select = overlay.querySelector('#an-game-select');
  const chartCtx = overlay.querySelector('#anChart').getContext('2d');
  let chart = null;

  function update(){
    const gameId = select.value;
    const runs = AttentiaCore.getRuns(gameId);
    const last30 = runs.slice(-30);
    const wins = runs.filter(r=>r.outcome==='win').length;
    const total = runs.length;
    const avgReward = total ? (runs.reduce((s,r)=>s+r.reward,0)/total).toFixed(3) : '—';
    overlay.querySelector('#an-summary').innerHTML = `<p>Total runs: ${total} • Wins: ${wins} • Avg reward: ${avgReward}</p>`;

    const labels = last30.map(r=>new Date(r.timestamp).toLocaleTimeString());
    const data = last30.map(r=>r.reward);
    if (chart) chart.destroy();
    chart = new Chart(chartCtx, { type:'line', data:{ labels, datasets:[{ label:'Reward', data, borderColor:'#00BFFF', tension:0.35, fill:false }] }, options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true}}} });

    const runsDiv = overlay.querySelector('#an-runs');
    runsDiv.innerHTML = '';
    last30.slice().reverse().forEach(r=>{
      const div = document.createElement('div');
      div.style = 'padding:8px;border-bottom:1px solid #0f1316;color:#cfd8de;font-size:13px';
      div.innerHTML = `<strong style="color:${r.outcome==='win'?'#39d78a':'#f66'}">${r.outcome.toUpperCase()}</strong> • reward: ${r.reward} • ${new Date(r.timestamp).toLocaleString()} <div style="font-size:12px;color:#8b949e">prompt:${r.promptUsedKey} seq:${JSON.stringify(r.actionSequence)}</div>`;
      runsDiv.appendChild(div);
    });
  }

  select.addEventListener('change', update);
  overlay.querySelector('#an-close').addEventListener('click', ()=> overlay.remove());
  update();
}
