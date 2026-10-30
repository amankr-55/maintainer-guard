// MaintainerGuard Front-end Application Controller

let currentSamples = {};
let currentAnalysis = null;

function safeCreateIcons() {
  if (window.lucide && typeof lucide.createIcons === 'function') {
    try {
      safeCreateIcons();
    } catch (e) {
      console.warn('Lucide icon error:', e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  safeCreateIcons();
  fetchSamples();
  setupEventListeners();
  drawEmptyBlastRadius();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('btn-analyze').addEventListener('click', runAnalysis);
  
  document.getElementById('btn-sample-spam').addEventListener('click', () => loadScenario('scenario_spam'));
  document.getElementById('btn-sample-hallucination').addEventListener('click', () => loadScenario('scenario_hallucination'));
  document.getElementById('btn-sample-genuine').addEventListener('click', () => loadScenario('scenario_genuine'));

  document.getElementById('btn-copy-comment').addEventListener('click', copyReviewComment);
  document.getElementById('btn-action-close').addEventListener('click', () => executeSimulatedAction('CLOSE_PR'));
  document.getElementById('btn-action-merge').addEventListener('click', () => executeSimulatedAction('MERGE_PR'));
}

// Fetch samples from backend
async function fetchSamples() {
  try {
    const res = await fetch('/api/samples');
    if (res.ok) {
      const data = await res.json();
      data.forEach(s => {
        currentSamples[s.id] = s;
      });
      // Load Scenario 1 by default for instant gratification
      if (currentSamples['scenario_spam']) {
        loadScenario('scenario_spam');
      }
    }
  } catch (err) {
    console.error('Failed to load samples:', err);
  }
}

// Load chosen scenario into editor
function loadScenario(scenarioId) {
  const sample = currentSamples[scenarioId];
  if (!sample) return;

  document.getElementById('input-repo').value = sample.repo_name || 'project/repo';
  document.getElementById('input-author').value = sample.pr_author || 'user';
  document.getElementById('input-title').value = sample.pr_title || '';
  document.getElementById('input-desc').value = sample.pr_description || '';
  document.getElementById('input-diff').value = sample.diff_content || '';
  document.getElementById('pr-badge-status').textContent = `#PR-${sample.pr_number || 404}`;

  // Automatically run analysis to demonstrate speed
  runAnalysis();
}

// Trigger Deep Analysis
async function runAnalysis() {
  const btn = document.getElementById('btn-analyze');
  btn.disabled = true;
  btn.classList.add('opacity-75', 'cursor-not-allowed');
  btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>Analyzing with Open-Source AI...</span>`;
  safeCreateIcons();

  const payload = {
    repo_name: document.getElementById('input-repo').value,
    pr_title: document.getElementById('input-title').value,
    pr_author: document.getElementById('input-author').value,
    pr_description: document.getElementById('input-desc').value,
    diff_content: document.getElementById('input-diff').value,
    run_sandbox: true
  };

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      currentAnalysis = data;
      renderAnalysisResults(data);
      showToast('Analysis completed successfully!');
    } else {
      const err = await res.json();
      showToast(err.detail || 'Analysis error', true);
    }
  } catch (err) {
    showToast('Failed to connect to MaintainerGuard backend', true);
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
    btn.innerHTML = `<i data-lucide="scan" class="w-5 h-5"></i><span>Run Autonomous Triage</span>`;
    safeCreateIcons();
  }
}

// Render Results on Dashboard
function renderAnalysisResults(data) {
  const verdictTitle = document.getElementById('verdict-title');
  const verdictBadge = document.getElementById('verdict-badge');
  const verdictSummary = document.getElementById('verdict-summary');
  const riskLabel = document.getElementById('risk-label');
  const gaugeValue = document.getElementById('gauge-value');
  const gaugeCircle = document.getElementById('gauge-circle');

  // 1. Update Gauge & Risk
  gaugeValue.textContent = `${data.spam_score}%`;
  gaugeCircle.setAttribute('stroke-dasharray', `${data.spam_score}, 100`);

  if (data.spam_score > 70) {
    gaugeCircle.className.baseVal = 'text-red-500 transition-all duration-700 ease-out';
    riskLabel.textContent = 'HIGH SPAM RISK';
    riskLabel.className = 'text-xs font-semibold text-red-400 font-mono';
  } else if (data.spam_score > 30) {
    gaugeCircle.className.baseVal = 'text-amber-500 transition-all duration-700 ease-out';
    riskLabel.textContent = 'NEEDS REVIEW';
    riskLabel.className = 'text-xs font-semibold text-amber-400 font-mono';
  } else {
    gaugeCircle.className.baseVal = 'text-emerald-500 transition-all duration-700 ease-out';
    riskLabel.textContent = 'CLEAN / VERIFIED';
    riskLabel.className = 'text-xs font-semibold text-emerald-400 font-mono';
  }

  // 2. Update Verdict
  verdictTitle.textContent = data.verdict.replace(/_/g, ' ');
  verdictSummary.textContent = data.summary;

  if (data.verdict === 'FLAGGED_SPAM') {
    verdictBadge.textContent = 'SPAM REJECTED';
    verdictBadge.className = 'px-2.5 py-1 text-xs rounded-full font-mono font-semibold bg-red-950/60 text-red-300 border border-red-700/60';
  } else if (data.verdict === 'CRITICAL_HALLUCINATION') {
    verdictBadge.textContent = 'CRITICAL AI RISK';
    verdictBadge.className = 'px-2.5 py-1 text-xs rounded-full font-mono font-semibold bg-red-900 text-red-200 border border-red-500 animate-pulse';
  } else if (data.verdict === 'NEEDS_CHANGES') {
    verdictBadge.textContent = 'CHANGES REQUESTED';
    verdictBadge.className = 'px-2.5 py-1 text-xs rounded-full font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-700/60';
  } else {
    verdictBadge.textContent = 'VERIFIED ACCEPT';
    verdictBadge.className = 'px-2.5 py-1 text-xs rounded-full font-mono font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-700/60';
  }

  // 3. Render Signals Tags
  const signalsContainer = document.getElementById('signals-container');
  signalsContainer.innerHTML = '';

  if (data.signals && data.signals.length > 0) {
    data.signals.forEach(sig => {
      const tag = document.createElement('div');
      let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
      if (sig.severity === 'CRITICAL') colorClasses = 'bg-red-950/50 text-red-300 border-red-800/50';
      else if (sig.severity === 'WARNING') colorClasses = 'bg-amber-950/50 text-amber-300 border-amber-800/50';
      else if (sig.severity === 'INFO') colorClasses = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50';

      tag.className = `px-2.5 py-1 rounded-lg text-xs font-mono border flex items-center gap-1.5 ${colorClasses}`;
      tag.innerHTML = `<span>[${sig.category}]</span> <span>${sig.message}</span>`;
      signalsContainer.appendChild(tag);
    });
  } else {
    signalsContainer.innerHTML = `<span class="text-xs text-slate-500">No negative signals detected. Code conforms to repository baseline.</span>`;
  }

  // 4. Render Sandbox Logs
  const sandboxLogs = document.getElementById('sandbox-logs');
  sandboxLogs.innerHTML = '';
  if (data.sandbox && data.sandbox.logs) {
    data.sandbox.logs.forEach(log => {
      const p = document.createElement('p');
      if (log.includes('FAIL') || log.includes('CRITICAL')) {
        p.className = 'text-red-400 font-semibold';
      } else if (log.includes('WARN')) {
        p.className = 'text-amber-300';
      } else if (log.includes('PASS') || log.includes('OK')) {
        p.className = 'text-emerald-400';
      } else {
        p.className = 'text-slate-400';
      }
      p.textContent = log;
      sandboxLogs.appendChild(p);
    });
  }

  // 5. Render Suggested Comment & Actions
  document.getElementById('github-comment-preview').textContent = data.suggested_comment;
  document.getElementById('suggested-action-tag').textContent = data.suggested_github_action;

  // 6. Draw Blast Radius on Canvas
  drawBlastRadiusGraph(data.blast_radius);
}

// Interactive Canvas Graph Renderer
function drawBlastRadiusGraph(graphData) {
  const canvas = document.getElementById('blast-canvas');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    drawEmptyBlastRadius();
    return;
  }

  const nodes = graphData.nodes;
  const edges = graphData.edges;

  // Calculate layout coordinates
  const positions = {};
  const total = nodes.length;

  nodes.forEach((n, idx) => {
    if (n.id === 'repo_root') {
      positions[n.id] = { x: 70, y: height / 2 };
    } else if (n.type === 'file') {
      positions[n.id] = { x: 230, y: (height / (total)) * (idx + 1) };
    } else if (n.type === 'dependency' || n.type === 'endpoint') {
      positions[n.id] = { x: 420, y: (height / (total)) * (idx + 1) };
    } else {
      positions[n.id] = { x: 570, y: (height / (total)) * (idx + 1) };
    }
  });

  // Draw Edges
  edges.forEach(edge => {
    const src = positions[edge.source];
    const tgt = positions[edge.target];
    if (src && tgt) {
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.bezierCurveTo((src.x + tgt.x) / 2, src.y, (src.x + tgt.x) / 2, tgt.y, tgt.x, tgt.y);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  // Draw Nodes
  nodes.forEach(n => {
    const pos = positions[n.id];
    if (!pos) return;

    let fillColor = '#0ea5e9';
    let strokeColor = '#38bdf8';

    if (n.status === 'modified') {
      fillColor = '#f59e0b';
      strokeColor = '#fbbf24';
    } else if (n.status === 'broken' || n.status === 'critical') {
      fillColor = '#ef4444';
      strokeColor = '#f87171';
    } else if (n.status === 'intact') {
      fillColor = '#10b981';
      strokeColor = '#34d399';
    }

    // Outer glow
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Node label
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    const label = n.label.length > 20 ? n.label.substring(0, 18) + '..' : n.label;
    ctx.fillText(label, pos.x, pos.y + 20);
  });
}

function drawEmptyBlastRadius() {
  const canvas = document.getElementById('blast-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '12px Inter';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('Interactive Blast-Radius Graph will render upon triage.', canvas.width / 2, canvas.height / 2);
}

// Copy Review Comment
function copyReviewComment() {
  const text = document.getElementById('github-comment-preview').textContent;
  navigator.clipboard.writeText(text);
  showToast('Copied GitHub Review Comment to clipboard!');
}

// Execute Simulated Action
async function executeSimulatedAction(actionType) {
  if (!currentAnalysis) {
    showToast('Please analyze a PR first.', true);
    return;
  }

  const payload = {
    action: actionType,
    pr_number: 4102,
    repo_name: document.getElementById('input-repo').value,
    comment: currentAnalysis.suggested_comment,
    labels: currentAnalysis.suggested_labels
  };

  try {
    const res = await fetch('/api/action/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      showToast(`⚡ ${data.message}`);
    }
  } catch (err) {
    showToast('Failed to trigger action', true);
  }
}

// Simple Toast Notification
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  toastMsg.textContent = msg;
  if (isError) {
    toastIcon.setAttribute('data-lucide', 'alert-circle');
    toastIcon.className = 'w-4 h-4 text-red-400';
  } else {
    toastIcon.setAttribute('data-lucide', 'check-circle');
    toastIcon.className = 'w-4 h-4 text-emerald-400';
  }
  safeCreateIcons();

  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}
