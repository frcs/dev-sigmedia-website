const fs = require('fs');
const path = require('path');

const directories = [
  'sigmedia-astro/src/content/dataset/',
  'sigmedia-astro/src/content/software/'
];

function titleCase(str) {
  return str.split(' ').map(word => {
    if (word.length === 0) return word;
    // Keep TCD-VoIP or other acronyms as is if they are already uppercase-heavy?
    // The user example was "Global information" -> "Global Information"
    // "Summary of Degradations and Parameters used in TCD-VoIP" 
    // -> "Summary of Degradations and Parameters Used in TCD-VoIP"
    // Words to keep lowercase (articles, prepositions, etc.) if not first word
    const lowerWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'with', 'in', 'of'];
    if (lowerWords.includes(word.toLowerCase()) && !str.startsWith(word)) {
        return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

// Improved title case for headers
function fixHeader(line) {
    const match = line.match(/^(#+ )(.*)/);
    if (!match) return line;
    const prefix = match[1];
    let text = match[2];
    
    const words = text.split(' ');
    const newWords = words.map((word, index) => {
        // Special case for TCD-VoIP or other acronyms - keep them if they have multiple caps
        if (/[A-Z].*[A-Z]/.test(word) || word.includes('-')) {
            // If it's something like TCD-VoIP, maybe leave it?
            // Actually, let's just capitalize first letter if it's all lowercase, 
            // otherwise keep it if it looks like an acronym.
            if (word === word.toLowerCase()) {
                 return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
        }
        
        const lowerWord = word.toLowerCase();
        const lowerWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'with', 'in', 'of'];
        
        if (index > 0 && lowerWords.includes(lowerWord)) {
            return lowerWord;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    
    return prefix + newWords.join(' ');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let newLines = [];
  let inGlobalInfo = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 0. Wrap bibtex in div id=reference
    if (line.trim().startsWith('```bibtex')) {
        const prevLine = newLines.length > 0 ? newLines[newLines.length-1].trim() : '';
        const prevPrevLine = newLines.length > 1 ? newLines[newLines.length-2].trim() : '';
        if (prevLine !== '<div id="reference">' && prevPrevLine !== '<div id="reference">') {
            newLines.push('<div id="reference">');
            newLines.push('');
        }
    }

    // 1. Remove {: ... }
    line = line.replace(/\{: [^}]+\}/g, '');
    line = line.replace(/\{:[^}]+\}/g, '');

    // 2. Fix broken headers
    if (line.startsWith('#')) {
        line = fixHeader(line);
        if (line.includes('Global Information')) {
            inGlobalInfo = true;
        } else {
            inGlobalInfo = false;
        }
    }

    // 3. Fix broken tables
    // Pattern: :---:|:---:
    if (line.trim().startsWith(':---')) {
        // This is a separator line. Ensure it has | at start and end and no leading colon
        let fixedLine = line.trim();
        if (fixedLine.startsWith(':')) fixedLine = fixedLine.slice(1);
        if (!fixedLine.startsWith('|')) fixedLine = '| ' + fixedLine;
        if (!fixedLine.endsWith('|')) fixedLine = fixedLine + ' |';
        
        // Check if previous line was a header. If not, add an empty header.
        const prevLine = newLines[newLines.length - 1];
        if (prevLine && !prevLine.trim().startsWith('|') && !prevLine.trim().includes('|')) {
            // Previous line doesn't look like a table header.
            const columnCount = fixedLine.split('|').length - 2;
            const emptyHeader = '|' + ' |'.repeat(columnCount);
            newLines.push(emptyHeader);
        }
        line = fixedLine;
    } else if (line.includes('|') && !line.trim().startsWith('|')) {
        // Table row missing leading/trailing pipes?
        if (line.trim().split('|').length > 1) {
             line = '| ' + line.trim() + ' |';
        }
    }

    // 4. Fix Global Information fields (use custom span for label)
    if (inGlobalInfo && line.trim().startsWith('- ')) {
        const commonFields = ['Download link', 'Contact', 'License', 'Reference', 'Repository', 'Sponsor'];
        
        // Try to find a match for common fields first
        let found = false;
        for (const field of commonFields) {
            // Match "- **Field** Value" or "- <span class="field-label">Field</span> Value"
            const regex = new RegExp(`^(\\s*-\\s+)(?:(\\*\\*)|<span class="field-label">)(${field})(?:(\\*\\*)|<\\/span>):?\\s*(.*)`, 'i');
            const match = line.match(regex);
            if (match) {
                const indent = match[1];
                const fieldName = match[3];
                let value = match[5].trim();

                // a) Default License if empty
                if (fieldName.toLowerCase() === 'license' && value === '') {
                    value = 'Non-commercial only';
                }

                // b) Map Reference to bibtex key if empty
                if (fieldName.toLowerCase() === 'reference' && value === '') {
                    // Look ahead for the bibtex block and extract the key
                    for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
                        const nextLine = lines[j];
                        // Match @type{key,
                        const bibMatch = nextLine.match(/@[a-zA-Z]+\{([^,]+),/);
                        if (bibMatch) {
                            value = `[${bibMatch[1]}](#reference)`;
                            break;
                        }
                    }
                }

                line = `${indent}<span class="field-label">${fieldName}</span> ${value}`.trimEnd();
                found = true;
                break;
            }
        }
        
        // Fallback for other short bolded items at the start of the list item
        if (!found) {
            const match = line.match(/^(\s*-\s+)\*\*([^*:]+)\*\*:\s*(.*)/);
            if (match) {
                const indent = match[1];
                const fieldName = match[2].trim();
                const value = match[3].trim();
                if (fieldName.length < 25) {
                    line = `${indent}<span class="field-label">${fieldName}</span> ${value}`.trimEnd();
                }
            }
        }
    }

    newLines.push(line);

    if (line.trim() === '```' && i > 0 && lines[i-1].includes('}')) {
        // This is likely the end of a bibtex block we wrapped
        // Check if we are inside a bibtex block (crude check)
        let isBibtexEnd = false;
        for (let k = i - 1; k >= Math.max(0, i - 20); k--) {
            if (lines[k].trim().startsWith('```bibtex')) {
                isBibtexEnd = true;
                break;
            }
            if (lines[k].trim().startsWith('```')) break;
        }
        
        // Only close if we are not already closed by existing content
        const nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : '';
        const nextNextLine = (i + 2 < lines.length) ? lines[i+2].trim() : '';
        
        if (isBibtexEnd && nextLine !== '</div>' && nextNextLine !== '</div>') {
            newLines.push('');
            newLines.push('</div>');
        }
    }
  }

  const newContent = newLines.join('\n');
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
}

directories.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.md') || file.endsWith('.markdown')) {
      processFile(path.join(dir, file));
    }
  });
});
