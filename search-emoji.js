const fs = require('fs');
const path = require('path');

// Regex to match emojis (modern regex)
const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                const matches = line.match(emojiRegex);
                if (matches) {
                    const realEmojis = matches.filter(m => !/^[0-9#*\x00-\x7F]/.test(m));
                    if(realEmojis.length > 0) {
                        console.log(`${fullPath}:${index + 1}: ${line.trim()} [EMOJIS: ${realEmojis.join(' ')}]`);
                    }
                }
            });
        }
    }
}

searchFiles('./src');
