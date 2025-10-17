// Shared module helpers for quizzes, certificates and SVG conversion
(function() {
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
        alert(`Resultado global: ${correct} de ${total} correctas (${pct}%).`);
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

    // Expose to global scope
    window.gradeQuiz = gradeQuiz;
    window.gradeAllAndGenerate = gradeAllAndGenerate;
    window.generateCertificatePNG = generateCertificatePNG;
    window.downloadInlineSvgAsPng = downloadInlineSvgAsPng;
    window.downloadInlineSvgAsPngFromUrl = downloadInlineSvgAsPngFromUrl;

    // Attach default listeners when DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.getElementById('grade-all-btn');
        if (btn) btn.addEventListener('click', gradeAllAndGenerate);
    });
})();
