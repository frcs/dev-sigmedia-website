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
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1. Remove {: ... }
    line = line.replace(/\{: [^}]+\}/g, '');
    line = line.replace(/\{:[^}]+\}/g, '');

    // 2. Fix broken headers
    if (line.startsWith('#')) {
        line = fixHeader(line);
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
            // But if it's "Examples", it's definitely not a header.
            // For the stereo_video_database.md case:
            // "Here are a couple of examples ... at full resolution."
            // We should insert an empty header row.
            const columnCount = fixedLine.split('|').length - 2;
            const emptyHeader = '|' + ' |'.repeat(columnCount);
            newLines.push(emptyHeader);
        }
        line = fixedLine;
    } else if (line.includes('|') && !line.trim().startsWith('|')) {
        // Table row missing leading/trailing pipes?
        // ![]() | ![]()
        // Let's add them for consistency if it looks like a table row
        if (line.trim().split('|').length > 1) {
             line = '| ' + line.trim() + ' |';
        }
    }

    newLines.push(line);
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
