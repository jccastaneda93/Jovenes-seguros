// Shared module helpers for quizzes, certificates and SVG conversion
(function() {
    // state for modal accessibility
    let _lastFocusedElement = null;
    let _keydownHandler = null;
    const STATS_KEY = 'miniGameStats_v1';

    function loadStats() {
        try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}'); } catch(e){ return {}; }
    }
    function saveStats(s){ try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch(e){} }
    function incStat(gameId, field, by=1){ const s = loadStats(); s[gameId] = s[gameId] || {opens:0, attempts:0, successes:0}; s[gameId][field] = (s[gameId][field]||0) + by; saveStats(s); return s[gameId]; }
    function resetStats(gameId){ const s = loadStats(); if (gameId) { delete s[gameId]; } else { for(const k in s) delete s[k]; } saveStats(s); }

    function showToast(msg, timeout=3500){
        const existing = document.getElementById('mini-toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.id = 'mini-toast';
        t.textContent = msg;
        t.style.position = 'fixed';
        t.style.right = '16px';
        t.style.bottom = '16px';
        t.style.background = 'rgba(15,23,36,0.95)';
        t.style.color = '#fff';
        t.style.padding = '10px 14px';
        t.style.borderRadius = '10px';
        t.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
        t.style.zIndex = 10000;
        document.body.appendChild(t);
        setTimeout(()=>{ t.style.transition='opacity 300ms'; t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, timeout);
    }

    function showModalMessage(message, success){
        const feedback = document.getElementById('mini-game-feedback');
        if (!feedback) return showToast(message);
        feedback.textContent = message;
        feedback.className = 'game-feedback ' + (success ? 'correct' : 'incorrect');
        feedback.style.display = 'block';
    }

    function renderStatsInModal(gameId){
        const statsEl = document.getElementById('mini-game-stats');
        if (!statsEl) return;
        const all = loadStats();
        const g = all[gameId] || {opens:0, attempts:0, successes:0};
        statsEl.innerHTML = `<div style="font-size:13px;color:#ddd">Abierto: <strong>${g.opens}</strong> · Intentos: <strong>${g.attempts}</strong> · Éxitos: <strong>${g.successes}</strong></div><div style="margin-top:6px;text-align:right;"><button id="mini-reset-stats" class="action-button" style="background:rgba(255,255,255,0.06);">Resetear estadísticas</button></div>`;
        const resetBtn = document.getElementById('mini-reset-stats');
        if (resetBtn) resetBtn.addEventListener('click', ()=>{ resetStats(gameId); renderStatsInModal(gameId); showModalMessage('Estadísticas reiniciadas.', true); });
    }
    // Grade a quiz block
    function gradeQuiz(quizId, answers) {
        const quizEl = document.getElementById(quizId);
        if (!quizEl) return;
        const feedbackEl = quizEl.querySelector('.quiz-feedback');
        if (!feedbackEl) return;

        let total = 0;
        let correct = 0;

        for (const [key, value] of Object.entries(answers)) {
            total++;
            const radios = quizEl.querySelectorAll(`input[name="${key}"]`);
            let selected = null;
            radios.forEach(r => { if (r.checked) selected = r.value; });
            if (selected === value) correct++;
        }

        feedbackEl.style.display = 'block';
        if (total === 0) {
            feedbackEl.textContent = 'No hay preguntas configuradas para este quiz.';
            return;
        }
        const pct = Math.round((correct / total) * 100);
        feedbackEl.textContent = `Has respondido ${correct} de ${total} correctamente (${pct}%).`;
        if (pct === 100) feedbackEl.textContent += ' ¡Excelente!';
        else if (pct >= 60) feedbackEl.textContent += ' Buen trabajo, revisa las respuestas incorrectas.';
        else feedbackEl.textContent += ' Revisa los recursos y vuelve a intentarlo.';
    }

    // Grade all quizzes defined in an array and generate certificate
    function gradeAllAndGenerate() {
        const quizzes = [
            {id: 'quiz-consumo', answers: {q1:'b'}},
            {id: 'quiz-contrasenas', answers: {q2:'b'}},
            {id: 'quiz-malware', answers: {q3:'a'}},
            {id: 'quiz-pseudo', answers: {q4:'a'}},
            {id: 'quiz-wifi', answers: {q5:'a'}}
        ];

        let total = 0, correct = 0;
        quizzes.forEach(q => {
            const quizEl = document.getElementById(q.id);
            if (!quizEl) return;
            for (const [key, value] of Object.entries(q.answers)) {
                total++;
                const radios = quizEl.querySelectorAll(`input[name="${key}"]`);
                let selected = null;
                radios.forEach(r => { if (r.checked) selected = r.value; });
                if (selected === value) correct++;
            }
        });

    const pct = total ? Math.round((correct/total)*100) : 0;
    showToast(`Resultado global: ${correct} de ${total} correctas (${pct}%).`);
        const studentNameEl = document.getElementById('student-name') || document.getElementById('student-name-m2');
        const studentName = (studentNameEl && studentNameEl.value) ? studentNameEl.value : 'Estudiante';
        generateCertificatePNG(studentName, pct);
    }

    // Generate certificate on canvas and trigger PNG download
    function generateCertificatePNG(name, score) {
        const w = 1200, h = 800;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f1724'; ctx.fillRect(0,0,w,h);
        const pad = 70;
        ctx.fillStyle = '#fff'; ctx.fillRect(pad,pad,w-pad*2,h-pad*2);

        const grad = ctx.createLinearGradient(pad, pad, w-pad, pad+120);
        grad.addColorStop(0, '#8b5cf6');
        grad.addColorStop(1, '#00d4ff');
        ctx.fillStyle = grad; ctx.fillRect(pad, pad, w-pad*2, 120);

        const logoX = pad + 30, logoY = pad + 20;
        ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.moveTo(logoX+20, logoY);
        ctx.lineTo(logoX+60, logoY+15);
        ctx.lineTo(logoX+60, logoY+55);
        ctx.quadraticCurveTo(logoX+40, logoY+75, logoX+20, logoY+55);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#fff'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Certificado de Participación', w/2, pad + 80);

        ctx.textAlign = 'left'; ctx.fillStyle = '#0f1724'; ctx.font = '28px Arial';
        ctx.fillText(`Otorgado a: ${name}`, pad + 60, pad + 220);
        ctx.font = '24px Arial'; ctx.fillText(`Puntaje obtenido: ${score}%`, pad + 60, pad + 270);
        ctx.font = '18px Arial'; ctx.fillText('Módulo 2: Privacidad y Datos', pad + 60, pad + 320);
        ctx.fillText('Fecha: ' + new Date().toLocaleDateString(), pad + 60, pad + 350);

        ctx.strokeStyle = '#111827'; ctx.lineWidth = 1.5; const sigX = w - pad - 360, sigY = h - pad - 140;
        ctx.beginPath(); ctx.moveTo(sigX, sigY); ctx.lineTo(sigX + 300, sigY); ctx.stroke();
        ctx.font = '18px Arial'; ctx.fillStyle = '#0f1724'; ctx.fillText('Firma del instructor', sigX, sigY + 30);

        ctx.fillStyle = '#8b5cf6'; ctx.beginPath(); ctx.arc(w - pad - 80, pad + 80, 36, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('CYBER', w - pad - 80, pad + 88);

        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            const safeName = name.replace(/[^a-z0-9_\-]/gi, '_'); a.download = `certificado_${safeName}.png`;
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        });
    }

    // Convert inline SVG element to PNG and download
    function downloadInlineSvgAsPng(svgElement, filename) {
        if (!svgElement) { alert('SVG no encontrado'); return; }
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 800; canvas.height = img.height || 1000;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(img,0,0);
            canvas.toBlob(function(blob) { const a = document.createElement('a'); const url2 = URL.createObjectURL(blob); a.href = url2; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url2); });
            URL.revokeObjectURL(url);
        };
        img.onerror = function() { alert('Error al procesar SVG'); URL.revokeObjectURL(url); };
        img.src = url;
    }

    // Convert external SVG URL to PNG (fetch then draw)
    function downloadInlineSvgAsPngFromUrl(svgUrl, filename) {
        fetch(svgUrl).then(r => r.text()).then(svgText => {
            const blob = new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width || 800; canvas.height = img.height || 1000;
                const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
                ctx.drawImage(img,0,0);
                canvas.toBlob(function(blob2){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob2); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); });
                URL.revokeObjectURL(url);
            };
            img.src = url;
        }).catch(()=> alert('No se pudo descargar la infografía'));
    }

    // --- Mini-game modal helpers (create modal on demand so it's available across pages)
    function createMiniGameModalIfNeeded() {
        let modal = document.getElementById('mini-game-modal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'mini-game-modal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.background = 'rgba(0,0,0,0.6)';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';

        const box = document.createElement('div');
        box.style.background = '#0b1220';
        box.style.color = '#fff';
        box.style.padding = '18px';
        box.style.borderRadius = '12px';
        box.style.width = 'min(720px,95%)';
        box.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6)';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.gap = '8px';

        const h3 = document.createElement('h3');
        h3.id = 'mini-game-title';
        h3.style.margin = '0';
        h3.textContent = 'Mini-juego';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'mini-game-close';
    closeBtn.innerText = '✕';
    closeBtn.setAttribute('aria-label','Cerrar diálogo');
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#fff';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.addEventListener('click', closeMiniGame);

        header.appendChild(h3);
        header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.id = 'mini-game-body';
    body.style.marginTop = '12px';
    body.style.color = '#ddd';
    body.setAttribute('role','region');
    body.setAttribute('aria-live','polite');

    const feedback = document.createElement('div');
    feedback.id = 'mini-game-feedback';
    feedback.className = 'game-feedback';
    feedback.style.display = 'none';
    feedback.style.marginTop = '12px';

    const stats = document.createElement('div');
    stats.id = 'mini-game-stats';
    stats.style.marginTop = '12px';

        const footer = document.createElement('div');
        footer.style.marginTop = '16px';
        footer.style.textAlign = 'right';
        const footerClose = document.createElement('button');
        footerClose.className = 'action-button';
        footerClose.innerText = 'Cerrar';
        footerClose.addEventListener('click', closeMiniGame);
        footer.appendChild(footerClose);

    box.appendChild(header);
    box.appendChild(body);
    box.appendChild(feedback);
    box.appendChild(stats);
    box.appendChild(footer);
    // Accessibility: link dialog to title/body
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','mini-game-title');
    modal.setAttribute('aria-describedby','mini-game-body');
        // close when clicking on backdrop
        modal.addEventListener('click', function(e){ if (e.target === modal) closeMiniGame(); });

        modal.appendChild(box);
        document.body.appendChild(modal);
        return modal;
    }

    function openMiniGame(id) {
        const modal = createMiniGameModalIfNeeded();
        const title = document.getElementById('mini-game-title');
        const body = document.getElementById('mini-game-body');
        if (!title || !body) return;
        // save focus and prepare keyboard handling
        _lastFocusedElement = document.activeElement;
        // attach keydown handler to manage Escape and Tab trap
        _keydownHandler = function(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeMiniGame();
                return;
            }
            if (e.key === 'Tab') {
                // focus trap
                const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
                const nodes = Array.prototype.filter.call(focusable, function(el){ return el.offsetWidth || el.offsetHeight || el.getClientRects().length; });
                if (nodes.length === 0) return;
                const first = nodes[0];
                const last = nodes[nodes.length-1];
                if (e.shiftKey) {
                    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
                } else {
                    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
            }
        };
        document.addEventListener('keydown', _keydownHandler);
    // increment open counter and render stats
    try { incStat(id,'opens'); } catch(e){}
    if (id === 'game-password') {
            title.textContent = 'Fortalece tu contraseña';
            body.innerHTML = '<ol><li>Evita palabras comunes o patrones.</li><li>Usa frases largas y únicas.</li><li>Activa 2FA cuando sea posible.</li></ol><p>Selecciona las 3 recomendaciones correctas:</p><div><label><input type="checkbox" value="1"> Usar "12345" (malo)</label><br><label><input type="checkbox" value="2"> Usar frase larga con espacios (bueno)</label><br><label><input type="checkbox" value="3"> Reusar la misma contraseña en varias cuentas (malo)</label><br><label><input type="checkbox" value="4"> Usar un gestor de contraseñas (bueno)</label></div><div style="margin-top:12px;text-align:right;"><button class="action-button" id="mini-check-password">Comprobar</button></div>';
            // attach handler
            setTimeout(()=>{
                const btn = document.getElementById('mini-check-password');
                if (btn) btn.addEventListener('click', checkPasswordGame);
                renderStatsInModal('game-password');
            }, 0);
        } else if (id === 'game-wifi') {
            title.textContent = 'Wi‑Fi Seguro';
            body.innerHTML = '<p>Elige la opción más segura al conectarte a una red pública:</p><ul><li>No realizar operaciones sensibles sin VPN.</li><li>Conectarse siempre a cualquier red abierta.</li><li>Compartir archivos libremente.</li></ul><div style="margin-top:12px;text-align:right;"><button class="action-button" id="mini-check-wifi">Comprobar</button></div>';
            setTimeout(()=>{
                const btn = document.getElementById('mini-check-wifi');
                if (btn) btn.addEventListener('click', checkWifiGame);
                renderStatsInModal('game-wifi');
            }, 0);
        } else if (id === 'game-consumo') {
            title.textContent = 'Consumo digital consciente';
            body.innerHTML = '<p>Encuentra la afirmación más fiable entre las siguientes:</p><ul><li>Una noticia sin fuente es probablemente falsa.</li><li>Una publicación con muchos likes siempre es verdadera.</li><li>Si viene de un familiar, se puede compartir sin verificar.</li></ul><div style="margin-top:12px;text-align:right;"><button class="action-button" id="mini-check-consumo">Comprobar</button></div>';
            setTimeout(()=>{ const b = document.getElementById('mini-check-consumo'); if (b) b.addEventListener('click', ()=>{ incStat('game-consumo','attempts'); incStat('game-consumo','successes'); renderStatsInModal('game-consumo'); showModalMessage('Correcto: verificar fuentes. Los likes no garantizan veracidad. Confirma antes de compartir.', true); }); },0);
        } else if (id === 'game-malware') {
            title.textContent = 'Detecta malware';
            body.innerHTML = '<p>Selecciona las acciones que ayudan a evitar malware:</p><ul><li>Descargar software desde la web oficial.</li><li>Ignorar actualizaciones del sistema.</li><li>Instalar extensiones desde tiendas oficiales.</li></ul><div style="margin-top:12px;text-align:right;"><button class="action-button" id="mini-check-malware">Comprobar</button></div>';
            setTimeout(()=>{ const b = document.getElementById('mini-check-malware'); if (b) b.addEventListener('click', ()=>{ incStat('game-malware','attempts'); incStat('game-malware','successes'); renderStatsInModal('game-malware'); showModalMessage('Correcto: usar fuentes oficiales, mantener actualizado el sistema y evitar software pirateado.', true); }); },0);
        } else if (id === 'game-pseudo') {
            title.textContent = 'Verifica la fuente';
            body.innerHTML = '<p>¿Qué pasos debes seguir para validar una afirmación científica?</p><ol><li>Buscar la fuente original y su evidencia.</li><li>Verificar si hay consenso científico.</li><li>Consultar fact-checkers y fuentes oficiales.</li></ol><div style="margin-top:12px;text-align:right;"><button class="action-button" id="mini-check-pseudo">Comprobar</button></div>';
            setTimeout(()=>{ const b = document.getElementById('mini-check-pseudo'); if (b) b.addEventListener('click', ()=>{ incStat('game-pseudo','attempts'); incStat('game-pseudo','successes'); renderStatsInModal('game-pseudo'); showModalMessage('Correcto: busca evidencia, revisa fuentes confiables y evita compartir sin verificar.', true); }); },0);
        } else {
            title.textContent = 'Mini-juego';
            body.textContent = 'Actividad no encontrada.';
        }
        modal.style.display = 'flex';
        // set accessibility attributes and focus
        modal.setAttribute('role','dialog');
        modal.setAttribute('aria-modal','true');
        modal.tabIndex = -1;
        // focus the close button if present, otherwise the modal container
        setTimeout(()=>{
            const c = document.getElementById('mini-game-close');
            if (c) c.focus(); else modal.focus();
        },50);
    }

    function closeMiniGame() {
        const modal = document.getElementById('mini-game-modal');
        if (modal) modal.style.display = 'none';
        // remove keyboard handler and restore focus
        if (_keydownHandler) {
            document.removeEventListener('keydown', _keydownHandler);
            _keydownHandler = null;
        }
        if (_lastFocusedElement && typeof _lastFocusedElement.focus === 'function') {
            try { _lastFocusedElement.focus(); } catch(e) {}
            _lastFocusedElement = null;
        }
    }

    function checkPasswordGame() {
        incStat('game-password','attempts');
        incStat('game-password','successes');
        renderStatsInModal('game-password');
        showModalMessage('Has verificado las recomendaciones. Correcto: usar frase larga, usar gestor y activar 2FA.', true);
    }

    function checkWifiGame() {
        incStat('game-wifi','attempts');
        incStat('game-wifi','successes');
        renderStatsInModal('game-wifi');
        showModalMessage('Correcto: no realizar operaciones sensibles en redes públicas y usar VPN.', true);
    }

    // Expose to global scope
    window.gradeQuiz = gradeQuiz;
    window.gradeAllAndGenerate = gradeAllAndGenerate;
    window.generateCertificatePNG = generateCertificatePNG;
    window.downloadInlineSvgAsPng = downloadInlineSvgAsPng;
    window.downloadInlineSvgAsPngFromUrl = downloadInlineSvgAsPngFromUrl;
    // Mini-game globals
    window.openMiniGame = openMiniGame;
    window.closeMiniGame = closeMiniGame;
    window.checkPasswordGame = checkPasswordGame;
    window.checkWifiGame = checkWifiGame;

    // Attach default listeners when DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.getElementById('grade-all-btn');
        if (btn) btn.addEventListener('click', gradeAllAndGenerate);
    });
})();
