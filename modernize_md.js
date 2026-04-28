const fs = require('fs');
const path = require('path');

const directories = [
  'sigmedia-astro/src/content/dataset/',
  'sigmedia-astro/src/content/software/'
];

function titleCase(str) {
  return str.split(' ').map(word => {
    if (word.length === 0) return word;
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
        if (/[A-Z].*[A-Z]/.test(word) || word.includes('-')) {
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
  
  // 1. Extract BibTeX block
  let bibBlock = null;
  let bibStart = -1;
  let bibEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('```bibtex')) {
      bibStart = i;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '```') {
          bibEnd = j;
          bibBlock = lines.slice(bibStart, bibEnd + 1).join('\n');
          break;
        }
      }
      break;
    }
  }

  // 2. Process lines
  let newLines = [];
  let inGlobalInfo = false;
  let bibRemoved = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip the original BibTeX block and its wrappers
    if (bibStart !== -1 && i >= bibStart && i <= bibEnd) {
      bibRemoved = true;
      continue;
    }
    
    // Skip reference div wrappers
    if (line.trim() === '<div id="reference">') continue;
    if (line.trim() === '</div>' && bibRemoved) {
        // Only skip the </div> if we just removed the bib block before it
        // and there isn't another div above it.
        // Actually, let's just skip all <div> wrappers in Global Info area for safety
        continue;
    }

    // Fix broken headers
    if (line.startsWith('#')) {
        line = fixHeader(line);
        if (line.includes('Global Information')) {
            inGlobalInfo = true;
        } else {
            inGlobalInfo = false;
        }
    }

    // Fix broken tables
    if (line.trim().startsWith(':---') || (line.trim().startsWith('|') && line.includes('---'))) {
        let fixedLine = line.trim();
        if (fixedLine.startsWith(':')) fixedLine = fixedLine.slice(1);
        if (!fixedLine.startsWith('|')) fixedLine = '| ' + fixedLine;
        if (!fixedLine.endsWith('|')) fixedLine = fixedLine + ' |';
        
        // Check if it's actually a separator row (contains only -, :, |, and spaces)
        if (/^[|:\-\s]+$/.test(fixedLine)) {
            const prevLine = newLines[newLines.length - 1];
            if (prevLine && !prevLine.trim().startsWith('|') && !prevLine.trim().includes('|')) {
                const columnCount = (fixedLine.match(/\|/g) || []).length - 1;
                const emptyHeader = '|' + ' |'.repeat(columnCount);
                newLines.push(emptyHeader);
            }
            line = fixedLine;
        }
    } else if (line.includes('|') && !line.trim().startsWith('|')) {
        if (line.trim().split('|').length > 1) {
             line = '| ' + line.trim() + ' |';
        }
    }

    // Fix Global Information fields
    if (inGlobalInfo && line.trim().startsWith('- ')) {
        const commonFields = ['Download link', 'Contact', 'License', 'Reference', 'Repository', 'Sponsor'];
        let found = false;
        for (const field of commonFields) {
            const regex = new RegExp(`^(\\s*-\\s+)(?:(\\*\\*)|<span class="field-label">)(${field})(?:(\\*\\*)|<\\/span>):?\\s*(.*)`, 'i');
            const match = line.match(regex);
            if (match) {
                const indent = match[1];
                const fieldName = match[3];
                let value = match[5].trim();

                if (fieldName.toLowerCase() === 'license' && (value === '' || value === 'Non-commercial only')) {
                    value = 'Non-commercial only';
                }

                if (fieldName.toLowerCase() === 'reference' && bibBlock) {
                    // Place the bibBlock here
                    line = `${indent}<span class="field-label">${fieldName}</span>\n\n${bibBlock}`;
                    found = true;
                    break;
                }

                line = `${indent}<span class="field-label">${fieldName}</span> ${value}`.trimEnd();
                found = true;
                break;
            }
        }
        
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
  }

  // Cleanup: remove multiple empty lines that might have been created
  let finalLines = [];
  for (let i = 0; i < newLines.length; i++) {
      if (newLines[i].trim() === '' && i > 0 && finalLines[finalLines.length-1].trim() === '') {
          continue;
      }
      finalLines.push(newLines[i]);
  }

  const newContent = finalLines.join('\n');
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
