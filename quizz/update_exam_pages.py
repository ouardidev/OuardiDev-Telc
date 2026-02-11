#!/usr/bin/env python3
"""
B2 Exam Pages Auto-Updater
Automatically updates all exam HTML pages with external CSS and JS
"""

import os
import re
from pathlib import Path

# Files to process
HTML_FILES = [
    'schreiben2_b2.html',
    'schreiben03_b2.html', 
    'schreiben4_b2.html',
    'schreiben5_b2.html',
    'schreiben6_b2.html',
    'schreiben7_b2.html',
    'schreiben8_b2.html',
    'schreiben9_b2.html',
    'schreiben10_b2.html',
    'schreiben11_b2.html',
    'schreiben12_b2.html',
    'schreiben13_b2.html',
    'schreiben14_b2.html',
    'schreiben15_b2.html',
    'schreiben16_b2.html',
    'schreiben17_b2.html',
    'schreiben18_b2.html',
    'schreiben19_b2.html',
    'schreiben20_b2.html'
]

def update_html_file(filepath):
    """Update a single HTML file with external CSS and JS references"""
    
    print(f"Processing: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Remove old <style> block
    content = re.sub(
        r'<style>.*?</style>',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 2. Add external CSS link in <head>
    if '<link rel="stylesheet" href="exam-styles.css">' not in content:
        content = content.replace(
            '</head>',
            '    <link rel="stylesheet" href="exam-styles.css">\n</head>'
        )
    
    # 3. Remove old inline <script> block
    content = re.sub(
        r'<script>.*?</script>(?=\s*</body>)',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 4. Update word counter HTML to include character count
    old_counter = r'<div class="word-counter">Wörter: <span id="count">0</span> / 150</div>'
    new_counter = '''<div class="word-counter">
            <div class="counter-left">
                <span>Wörter: <span id="count">0</span> / 150</span>
                <span>Zeichen: <span id="char-count">0</span></span>
            </div>
            <button class="btn-green" id="check-btn" onclick="checkText()">
                🔍 Text überprüfen
            </button>
        </div>'''
    
    content = re.sub(old_counter, new_counter, content)
    
    # Also handle German special characters version
    old_counter_de = r'<div class="word-counter">WÃ¶rter: <span id="count">0</span> / 150</div>'
    content = re.sub(old_counter_de, new_counter, content)
    
    # 5. Update textarea container structure
    old_textarea = r'<textarea id="essay"[^>]*></textarea>'
    new_textarea = '''<div class="textarea-container">
            <textarea id="essay" placeholder="Fangen Sie hier an zu schreiben..."></textarea>
        </div>

        <div id="correction-panel" class="correction-panel">
            <div class="correction-header">
                <div class="correction-title">📝 Korrektur-Ergebnisse</div>
                <button class="close-btn" onclick="closeCorrection()">✕ Schließen</button>
            </div>
            <div id="correction-content"></div>
        </div>'''
    
    content = re.sub(old_textarea, new_textarea, content, flags=re.DOTALL)
    
    # 6. Update "SPEICHERN & ZURÜCK" button to use function
    content = re.sub(
        r'<a class=[\'"]btn-blue[\'"] href=[\'"][^"\']+["\']>',
        '<a class=\'btn-blue\' href=\'#\' onclick="saveAndReturn()">',
        content
    )
    
    # 7. Add notification div before </body>
    if '<div id="notification"' not in content:
        content = content.replace(
            '</body>',
            '\n<div id="notification" class="notification"></div>\n\n<script src="exam-script.js"></script>\n</body>'
        )
    else:
        # Just add the script if notification exists
        if '<script src="exam-script.js">' not in content:
            content = content.replace(
                '</body>',
                '\n<script src="exam-script.js"></script>\n</body>'
            )
    
    # 8. Save updated file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Updated: {filepath}")

def main():
    """Main function to process all HTML files"""
    
    print("=" * 60)
    print("B2 Exam Pages Auto-Updater")
    print("=" * 60)
    print()
    
    # Work in current directory
    script_dir = Path.cwd()
    
    updated_count = 0
    
    for filename in HTML_FILES:
        filepath = script_dir / filename
        
        if filepath.exists():
            try:
                update_html_file(filepath)
                updated_count += 1
            except Exception as e:
                print(f"✗ Error processing {filename}: {e}")
        else:
            print(f"⚠ File not found: {filename}")
    
    print()
    print("=" * 60)
    print(f"✓ Successfully updated {updated_count}/{len(HTML_FILES)} files")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Copy exam-styles.css to your website folder")
    print("2. Copy exam-script.js to your website folder")
    print("3. Upload the updated HTML files")
    print()

if __name__ == "__main__":
    main()
