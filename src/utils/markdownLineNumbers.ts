export const getMarkdownLineNumbers = (markdown: string): number[] => {
  const lines = markdown.split('\n');
  const lineNumbers: number[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      lineNumbers.push(i + 1);
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    if (
      line.startsWith('#') ||
      line.startsWith('- ') ||
      line.startsWith('* ') ||
      /^\d+\.\s/.test(line) ||
      line.startsWith('>') ||
      line.startsWith('---') ||
      line.startsWith('***') ||
      line.startsWith('___')
    ) {
      lineNumbers.push(i + 1);
    } else if (line.length > 0 && (i === 0 || lines[i - 1].trim() === '')) {
      // This is a paragraph
      lineNumbers.push(i + 1);
    }
  }

  return lineNumbers;
};
