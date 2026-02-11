// ===================================
// B2 Exam - External JavaScript
// ===================================

// Global variables
let timeInSeconds = 30 * 60;
let timerInterval;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeExam();
});

function initializeExam() {
    const essay = document.getElementById('essay');
    const count = document.getElementById('count');
    const charCount = document.getElementById('char-count');
    const checkBtn = document.getElementById('check-btn');
    const timeDisplay = document.getElementById('time-display');
    
    // Word and character counter
    function updateWordCount() {
        const text = essay.value.trim();
        const words = text === "" ? 0 : text.split(/\s+/).length;
        const chars = essay.value.length;
        
        count.innerText = words;
        if (charCount) {
            charCount.innerText = chars;
        }
        count.style.color = words >= 150 ? "#00ff00" : "white";
    }
    
    essay.addEventListener('input', updateWordCount);
    
    // Timer
    timerInterval = setInterval(() => {
        let min = Math.floor(timeInSeconds / 60);
        let sec = timeInSeconds % 60;
        timeDisplay.innerText = `${min < 10 ? '0'+min : min}:${sec < 10 ? '0'+sec : sec}`;
        
        // Warning at 5 minutes
        if (timeInSeconds === 300) {
            showNotification('⚠️ Nur noch 5 Minuten!', 'error');
        }
        
        // Warning at 2 minutes - change timer color
        if (timeInSeconds === 120) {
            document.querySelector('.timer-highlight').style.color = "#ff0000";
        }
        
        if (timeInSeconds <= 0) { 
            clearInterval(timerInterval); 
            essay.disabled = true;
            if (checkBtn) checkBtn.disabled = true;
            showNotification('⏰ Zeit abgelaufen!', 'error');
        } else { 
            timeInSeconds--;
        }
    }, 1000);
    
    // Warn before leaving page if there's unsaved text
    window.addEventListener('beforeunload', (e) => {
        if (essay.value.trim()) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Save and return function
function saveAndReturn() {
    const essay = document.getElementById('essay');
    if (essay.value.trim()) {
        localStorage.setItem('b2_essay_text', essay.value);
        showNotification('✓ Text wurde gespeichert!');
        setTimeout(() => {
            window.location.href = 'indexb2.html';
        }, 1500);
    } else {
        window.location.href = 'indexb2.html';
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show ' + (type === 'error' ? 'error' : '');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Check text with LanguageTool
async function checkText() {
    const essay = document.getElementById('essay');
    const checkBtn = document.getElementById('check-btn');
    const correctionPanel = document.getElementById('correction-panel');
    const correctionContent = document.getElementById('correction-content');
    
    const text = essay.value.trim();
    
    if (!text) {
        showNotification('⚠️ Bitte schreiben Sie zuerst einen Text!', 'error');
        return;
    }

    if (text.split(/\s+/).length < 50) {
        showNotification('⚠️ Text ist zu kurz für eine sinnvolle Überprüfung!', 'error');
        return;
    }

    checkBtn.disabled = true;
    checkBtn.textContent = '⏳ Überprüfung läuft...';
    correctionPanel.classList.add('show');
    correctionContent.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div>Text wird überprüft...</div>
        </div>
    `;

    try {
        const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'text': text,
                'language': 'de-DE',
                'enabledOnly': 'false'
            })
        });

        if (!response.ok) {
            throw new Error('API-Fehler');
        }

        const data = await response.json();
        displayCorrections(data, text);
        showNotification('✓ Überprüfung abgeschlossen!');

    } catch (error) {
        correctionContent.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #dc3545;">
                <p><strong>⚠️ Fehler bei der Überprüfung</strong></p>
                <p>Bitte versuchen Sie es später erneut oder überprüfen Sie Ihre Internetverbindung.</p>
            </div>
        `;
        showNotification('❌ Fehler bei der Überprüfung', 'error');
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = '🔍 Text überprüfen';
    }
}

// Display corrections
function displayCorrections(data, originalText) {
    const correctionContent = document.getElementById('correction-content');
    const matches = data.matches;
    const wordCount = originalText.trim().split(/\s+/).length;
    
    if (matches.length === 0) {
        // Even with no errors, calculate score based on content quality
        let contentScore = 12;
        if (wordCount >= 150 && wordCount <= 250) contentScore = 12;
        else if (wordCount < 150) contentScore = Math.round((wordCount / 150) * 12);
        else contentScore = 11;

        const grammarScore = 12; // Perfect grammar
        const coherenceScore = 12; // Assume good structure
        
        // Check format
        let formatScore = 9;
        const textLower = originalText.toLowerCase();
        const hasGreeting = textLower.includes('sehr geehrte') || textLower.includes('liebe');
        const hasClosing = textLower.includes('mit freundlichen grüßen') || textLower.includes('freundliche grüße');
        if (!hasGreeting) formatScore -= 2;
        if (!hasClosing) formatScore -= 2;

        const finalScore = contentScore + grammarScore + coherenceScore + formatScore;
        
        let gradeText = '';
        let gradeColor = '#28a745';
        if (finalScore >= 40) {
            gradeText = 'Sehr gut (A)';
        } else if (finalScore >= 35) {
            gradeText = 'Gut (B)';
            gradeColor = '#5cb85c';
        } else {
            gradeText = 'Befriedigend (C)';
            gradeColor = '#ffc107';
        }

        correctionContent.innerHTML = `
            <div class="no-errors">
                Ausgezeichnet! Keine grammatischen Fehler gefunden.
            </div>
            <div class="correction-summary">
                <div class="summary-item">
                    <span class="summary-label">Gesamtpunktzahl:</span>
                    <span class="score-badge" style="background: ${gradeColor}; font-size: 18px;">
                        ${finalScore}/45
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Bewertung:</span>
                    <span class="summary-value" style="color: ${gradeColor};">${gradeText}</span>
                </div>
                <div style="border-top: 1px solid #dee2e6; margin: 10px 0; padding-top: 10px;">
                    <div class="summary-item">
                        <span class="summary-label">📝 Inhalt & Aufgabe:</span>
                        <span class="summary-value">${contentScore}/12</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">📚 Grammatik & Wortschatz:</span>
                        <span class="summary-value">${grammarScore}/12</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">🔗 Kohärenz & Struktur:</span>
                        <span class="summary-value">${coherenceScore}/12</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">✉️ Format & Stil:</span>
                        <span class="summary-value">${formatScore}/9</span>
                    </div>
                </div>
                <div style="border-top: 1px solid #dee2e6; margin-top: 10px; padding-top: 10px;">
                    <div class="summary-item">
                        <span class="summary-label">Wörter:</span>
                        <span class="summary-value">${wordCount}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Zeichen:</span>
                        <span class="summary-value">${originalText.length}</span>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Calculate score based on B2 exam criteria (45 points total)
    // Scoring breakdown:
    // - Content & Task (12 points): Did they address the task requirements?
    // - Coherence & Organization (12 points): Structure, paragraphs, flow
    // - Grammar & Vocabulary (12 points): Based on errors found
    // - Format & Style (9 points): Formal letter format
    
    // 1. Content score (12 points) - based on word count
    let contentScore = 0;
    if (wordCount >= 150 && wordCount <= 250) {
        contentScore = 12;
    } else if (wordCount >= 130 && wordCount < 150) {
        contentScore = 10;
    } else if (wordCount >= 100 && wordCount < 130) {
        contentScore = 8;
    } else if (wordCount < 100) {
        contentScore = 4;
    } else if (wordCount > 250) {
        contentScore = 11; // Slightly penalized for being too long
    }

    // 2. Grammar & Vocabulary score (12 points) - based on error count
    let grammarScore = 12;
    if (matches.length <= 2) {
        grammarScore = 12;
    } else if (matches.length <= 5) {
        grammarScore = 10;
    } else if (matches.length <= 8) {
        grammarScore = 8;
    } else if (matches.length <= 12) {
        grammarScore = 6;
    } else if (matches.length <= 16) {
        grammarScore = 4;
    } else {
        grammarScore = 2;
    }

    // 3. Coherence & Organization (12 points) - estimated based on text structure
    const hasGoodLength = wordCount >= 150 && wordCount <= 250;
    const hasFewErrors = matches.length <= 8;
    let coherenceScore = 10; // Default good score
    if (hasGoodLength && hasFewErrors) coherenceScore = 12;
    if (!hasGoodLength || matches.length > 12) coherenceScore = 8;

    // 4. Format & Style (9 points) - check for formal letter elements
    let formatScore = 9; // Assume proper format unless detected otherwise
    const textLower = originalText.toLowerCase();
    const hasGreeting = textLower.includes('sehr geehrte') || textLower.includes('liebe');
    const hasClosing = textLower.includes('mit freundlichen grüßen') || textLower.includes('freundliche grüße');
    
    if (!hasGreeting) formatScore -= 2;
    if (!hasClosing) formatScore -= 2;

    // Total score out of 45
    const finalScore = contentScore + grammarScore + coherenceScore + formatScore;
    
    // Determine grade level
    let gradeText = '';
    let gradeColor = '';
    if (finalScore >= 40) {
        gradeText = 'Sehr gut (A)';
        gradeColor = '#28a745';
    } else if (finalScore >= 35) {
        gradeText = 'Gut (B)';
        gradeColor = '#5cb85c';
    } else if (finalScore >= 27) {
        gradeText = 'Befriedigend (C)';
        gradeColor = '#ffc107';
    } else if (finalScore >= 20) {
        gradeText = 'Ausreichend (D)';
        gradeColor = '#ff9800';
    } else {
        gradeText = 'Nicht bestanden';
        gradeColor = '#dc3545';
    }

    let html = `
        <div class="correction-summary">
            <div class="summary-item">
                <span class="summary-label">Gesamtpunktzahl:</span>
                <span class="score-badge" style="background: ${gradeColor}; font-size: 18px;">
                    ${finalScore}/45
                </span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Bewertung:</span>
                <span class="summary-value" style="color: ${gradeColor};">${gradeText}</span>
            </div>
            <div style="border-top: 1px solid #dee2e6; margin: 10px 0; padding-top: 10px;">
                <div class="summary-item">
                    <span class="summary-label">📝 Inhalt & Aufgabe:</span>
                    <span class="summary-value">${contentScore}/12</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">📚 Grammatik & Wortschatz:</span>
                    <span class="summary-value">${grammarScore}/12</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">🔗 Kohärenz & Struktur:</span>
                    <span class="summary-value">${coherenceScore}/12</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">✉️ Format & Stil:</span>
                    <span class="summary-value">${formatScore}/9</span>
                </div>
            </div>
            <div style="border-top: 1px solid #dee2e6; margin-top: 10px; padding-top: 10px;">
                <div class="summary-item">
                    <span class="summary-label">Gefundene Fehler:</span>
                    <span class="summary-value" style="color: #dc3545;">${matches.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Wörter:</span>
                    <span class="summary-value">${wordCount} ${wordCount >= 150 ? '✓' : '⚠️ (min. 150)'}</span>
                </div>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <h4 style="color: #1a2a44; margin-bottom: 15px;">🔍 Gefundene Fehler:</h4>
    `;

    matches.forEach((match, index) => {
        const errorType = match.rule.category.name;
        const message = match.message;
        const context = match.context.text;
        const offset = match.context.offset;
        const length = match.context.length;
        
        const beforeError = context.substring(0, offset);
        const errorWord = context.substring(offset, offset + length);
        const afterError = context.substring(offset + length);
        
        const suggestions = match.replacements.slice(0, 3).map(r => r.value).join(', ');

        html += `
            <div class="error-item">
                <div class="error-type">${errorType}</div>
                <div class="error-message">${message}</div>
                <div class="error-context">
                    ${beforeError}<span class="error-word">${errorWord}</span>${afterError}
                </div>
                ${suggestions ? `<div style="margin-top: 5px; font-size: 13px;">
                    <strong>Vorschlag:</strong> <span class="suggestion">${suggestions}</span>
                </div>` : ''}
            </div>
        `;
    });

    html += '</div>';
    correctionContent.innerHTML = html;
}

// Close correction panel
function closeCorrection() {
    const correctionPanel = document.getElementById('correction-panel');
    correctionPanel.classList.remove('show');
}
