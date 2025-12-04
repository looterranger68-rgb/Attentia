window.AnalysisController = {
    init() {
        console.log('AnalysisController Initialized');
        this.renderKPIs();
        if (typeof Chart !== 'undefined') {
            this.renderCharts();
        } else {
            console.warn('Chart.js not loaded. Skipping charts.');
        }
        this.renderExperiments();
        this.setupEventListeners();
    },


    getRealData() {
        // Mock data generation for now
        const allRuns = [];

        const gameTypes = ['reflex_dash', 'sequence_recall', 'logic_flow', 'chess', 'sudoku', 'jigsaw', 'riddles'];
        gameTypes.forEach(type => {
            const runs = AttentiaCore.getRuns(type);
            runs.forEach(r => allRuns.push({ ...r, type: 'game', category: 'Brain Games', gameId: type }));
        });

        const medRuns = AttentiaCore.getRuns('meditation');
        medRuns.forEach(r => allRuns.push({ ...r, type: 'meditation', category: 'Meditation' }));

        const podRuns = AttentiaCore.getRuns('podcast');
        podRuns.forEach(r => allRuns.push({ ...r, type: 'podcast', category: 'Podcasts' }));

        const bookRuns = AttentiaCore.getRuns('ebook');
        bookRuns.forEach(r => allRuns.push({ ...r, type: 'ebook', category: 'E-Books' }));

        // Sort by timestamp (newest first)
        allRuns.sort((a, b) => b.timestamp - a.timestamp);

        // 1. KPI Calculations
        const totalSessions = allRuns.length;
        const totalGames = allRuns.filter(r => r.type === 'game').length;

        // Avg Duration (Mocking duration for games if missing, using real for meditation)
        let totalDuration = 0;
        allRuns.forEach(r => {
            if (r.duration) totalDuration += parseInt(r.duration); // Meditation/Podcast
            else totalDuration += 5; // Assume 5 min per game avg
        });
        const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

        // Cognitive Score (Mock calculation based on game wins)
        const wins = allRuns.filter(r => r.outcome === 'win').length;
        const score = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        // 2. Session Trends (Last 30 Days)
        const sessionsByDate = {};
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            sessionsByDate[dateStr] = 0;
        }

        allRuns.forEach(r => {
            const dateStr = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (sessionsByDate[dateStr] !== undefined) {
                sessionsByDate[dateStr]++;
            }
        });

        // 3. Feature Usage
        const featureCounts = { 'Brain Games': 0, 'Meditation': 0, 'Podcasts': 0, 'E-Books': 0 };
        allRuns.forEach(r => {
            if (r.type === 'game') featureCounts['Brain Games']++;
            else if (r.type === 'meditation') featureCounts['Meditation']++;
            else if (r.type === 'podcast') featureCounts['Podcasts']++;
            else if (r.type === 'ebook') featureCounts['E-Books']++;
        });

        return {
            kpi: {
                sessions: { value: totalSessions, trend: 10 }, // Trend is mocked for now
                duration: { value: `${avgDuration}m`, trend: 5 },
                games: { value: totalGames, trend: 12 },
                score: { value: score, trend: 2 }
            },
            sessions: {
                labels: Object.keys(sessionsByDate),
                data: Object.values(sessionsByDate)
            },
            funnel: {
                // Mock funnel for now as we don't track granular steps client-side yet
                labels: ['Sign Up', 'Tutorial', 'First Game', 'Retention D1', 'Retention D7'],
                data: [100, 90, 75, 60, 45]
            },
            features: {
                labels: Object.keys(featureCounts),
                data: Object.values(featureCounts)
            },
            cognitive: {
                // Mock cognitive trends as we don't have historical score snapshots yet
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                attention: [65, 68, 72, score],
                memory: [60, 62, 65, score - 5],
                speed: [50, 55, 60, score + 5]
            },
            recentActivity: allRuns.slice(0, 5), // Top 5 recent
            experiments: [
                { name: 'Gamified Onboarding', status: 'active', lift: '+12%', conf: '98%', sample: '5.2k' },
                { name: 'Dark Mode Default', status: 'paused', lift: '-2%', conf: '40%', sample: '1.1k' },
                { name: 'New Chess AI', status: 'active', lift: '+5%', conf: '85%', sample: '3.0k' }
            ]
        };
    },

    // --- Rendering ---
    renderKPIs() {
        const data = this.getRealData().kpi;

        this.updateKPI('sessions', data.sessions.value, data.sessions.trend);
        this.updateKPI('duration', data.duration.value, data.duration.trend);
        this.updateKPI('games', data.games.value, data.games.trend);
        this.updateKPI('score', data.score.value, data.score.trend);
    },

    updateKPI(id, value, trend) {
        const el = document.getElementById(`kpi-${id}`);
        if (el) el.textContent = value;

        const trendEl = document.getElementById(`trend-${id}`);
        if (trendEl) {
            trendEl.textContent = `${Math.abs(trend)}%`;
            const parent = trendEl.parentElement;
            if (trend >= 0) {
                parent.className = 'kpi-trend trend-up';
                parent.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${Math.abs(trend)}%`;
            } else {
                parent.className = 'kpi-trend trend-down';
                parent.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> ${Math.abs(trend)}%`;
            }
        }
    },

    renderExperiments() {
        const data = this.getRealData().experiments;
        const tbody = document.getElementById('experiments-table');
        if (!tbody) return;
        tbody.innerHTML = '';

        data.forEach(exp => {
            const tr = document.createElement('tr');
            const statusClass = exp.status === 'active' ? 'status-active' : 'status-paused';

            tr.innerHTML = `
                <td>${exp.name}</td>
                <td><span class="status-badge ${statusClass}">${exp.status.toUpperCase()}</span></td>
                <td style="color: ${exp.lift.startsWith('+') ? '#00ff88' : '#ff4444'}">${exp.lift}</td>
                <td>${exp.conf}</td>
                <td>${exp.sample}</td>
                <td>
                    <button class="control-btn" style="padding: 4px 8px; font-size: 12px;">Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderRecentActivity(activities) {
        const list = document.getElementById('recent-activity-list');
        if (!list) return;
        list.innerHTML = '';

        if (activities.length === 0) {
            list.innerHTML = '<div style="padding: 10px; color: #8b949e;">No recent activity.</div>';
            return;
        }

        activities.forEach(act => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; padding: 12px; border-bottom: 1px solid rgba(48, 54, 61, 0.5); gap: 15px;';

            let icon = 'fa-gamepad';
            let color = '#00BFFF';
            if (act.type === 'meditation') { icon = 'fa-spa'; color = '#00ff88'; }
            else if (act.type === 'podcast') { icon = 'fa-headphones'; color = '#ffdd00'; }
            else if (act.type === 'ebook') { icon = 'fa-book'; color = '#b19cd9'; }

            const timeStr = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const title = act.title || act.session || (act.category + ' Session');

            item.innerHTML = `
                <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: ${color};">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div style="flex-grow: 1;">
                    <div style="color: #fff; font-weight: 500;">${title}</div>
                    <div style="color: #8b949e; font-size: 12px;">${act.category} • ${act.outcome || 'Completed'}</div>
                </div>
                <div style="color: #8b949e; font-size: 12px;">${timeStr}</div>
            `;
            list.appendChild(item);
        });
    },

    renderCharts() {
        const data = this.getRealData();

        // Render Recent Activity List
        this.renderRecentActivity(data.recentActivity);

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#c9d1d9' } }
            },
            scales: {
                y: { grid: { color: 'rgba(48, 54, 61, 0.5)' }, ticks: { color: '#8b949e' } },
                x: { grid: { display: false }, ticks: { color: '#8b949e' } }
            }
        };

        // 1. Session Trends Chart
        const ctxSessions = document.getElementById('sessionsChart');
        if (ctxSessions) {
            new Chart(ctxSessions, {
                type: 'line',
                data: {
                    labels: data.sessions.labels,
                    datasets: [{
                        label: 'Daily Sessions',
                        data: data.sessions.data,
                        borderColor: '#00BFFF',
                        backgroundColor: 'rgba(0, 191, 255, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: commonOptions
            });
        }

        // 2. Funnel Chart
        const ctxFunnel = document.getElementById('funnelChart');
        if (ctxFunnel) {
            new Chart(ctxFunnel, {
                type: 'bar',
                data: {
                    labels: data.funnel.labels,
                    datasets: [{
                        label: 'Users',
                        data: data.funnel.data,
                        backgroundColor: [
                            '#00BFFF',
                            '#00aaff',
                            '#0099ff',
                            '#0088ff',
                            '#0077ff'
                        ]
                    }]
                },
                options: {
                    ...commonOptions,
                    indexAxis: 'y'
                }
            });
        }

        // 3. Feature Usage Chart
        const ctxFeature = document.getElementById('featureChart');
        if (ctxFeature) {
            new Chart(ctxFeature, {
                type: 'doughnut',
                data: {
                    labels: data.features.labels,
                    datasets: [{
                        data: data.features.data,
                        backgroundColor: ['#00BFFF', '#00ff88', '#ffdd00', '#b19cd9'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { color: '#c9d1d9' } }
                    }
                }
            });
        }

        // 4. Cognitive Metrics Chart
        const ctxCognitive = document.getElementById('cognitiveChart');
        if (ctxCognitive) {
            new Chart(ctxCognitive, {
                type: 'radar',
                data: {
                    labels: ['Attention', 'Memory', 'Speed', 'Problem Solving', 'Flexibility'],
                    datasets: [{
                        label: 'Current Score',
                        data: [
                            data.cognitive.attention[3],
                            data.cognitive.memory[3],
                            data.cognitive.speed[3],
                            data.kpi.score.value,
                            data.kpi.score.value - 5
                        ],
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.2)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            grid: { color: 'rgba(48, 54, 61, 0.5)' },
                            pointLabels: { color: '#c9d1d9' },
                            ticks: { display: false }
                        }
                    }
                }
            });
        }
    },

    setupEventListeners() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // Simulate refresh
                const icon = refreshBtn.querySelector('i');
                icon.classList.add('fa-spin');
                setTimeout(() => {
                    icon.classList.remove('fa-spin');
                    if (typeof AttentiaCore !== 'undefined') {
                        AttentiaCore.reload();
                    }
                    this.renderKPIs();
                    if (typeof Chart !== 'undefined') {
                        this.renderCharts();
                    }
                    this.renderExperiments();
                }, 1000);
            });
        }


    }
};
