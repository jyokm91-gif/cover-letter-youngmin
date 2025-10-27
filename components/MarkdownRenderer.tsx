
import React from 'react';

const markdownToHtml = (text: string): string => {
  if (!text) return '';

  let processedText = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const blocks = processedText.split('\n\n');

  const htmlBlocks = blocks.map(block => {
    // Headers
    if (block.startsWith('# ')) return `<h1 class="text-2xl font-bold mb-4 pb-2 border-b">${block.substring(2)}</h1>`;
    if (block.startsWith('## ')) return `<h2 class="text-xl font-semibold mb-3 pb-2 border-b">${block.substring(3)}</h2>`;
    if (block.startsWith('### ')) return `<h3 class="text-lg font-semibold mb-2">${block.substring(4)}</h3>`;
    
    // Horizontal Rule
    if (block.startsWith('---')) return '<hr class="my-4" />';

    // Blockquote
    if (block.startsWith('> ')) {
        return `<blockquote class="border-l-4 border-slate-300 pl-4 italic text-slate-600">${block.substring(2)}</blockquote>`;
    }

    // Lists
    if (block.match(/^(\*|-|\d+\.) /m)) {
      const isOrdered = /^\d+\./.test(block);
      const listTag = isOrdered ? 'ol' : 'ul';
      const listClass = isOrdered ? 'list-decimal' : 'list-disc';
      
      const items = block.split('\n').map(item => {
        if (item.trim()) {
            const content = item.replace(/^(\*|-|\d+\.) /, '').trim();
            return `<li>${content}</li>`;
        }
        return '';
      }).join('');

      return `<${listTag} class="${listClass} list-inside space-y-1 pl-2">${items}</${listTag}>`;
    }

    // Paragraphs
    return `<p class="mb-4 leading-relaxed">${block.replace(/\n/g, '<br />')}</p>`;
  });
  
  let finalHtml = htmlBlocks.join('');

  // Inline elements
  finalHtml = finalHtml
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-200 text-sm rounded px-1 py-0.5 font-mono">$1</code>');
    
  return finalHtml;
};

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const htmlContent = markdownToHtml(content);
  return (
    <div
      className="prose-output max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;
