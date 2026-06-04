import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string | null | undefined): SafeHtml {
    if (!text) return '';
    let html = text;

    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    const lines = html.split('\n');
    const result: string[] = [];
    let tableRows: string[] = [];
    let i = 0;

    const normaliseSeparator = (line: string) => {
      const trimmed = line.trim();
      if (/^[-:| \t]+$/.test(trimmed) && trimmed.replace(/[-:| \t]/g, '').length === 0) return true;
      return false;
    };

    const splitRow = (line: string): string[] => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        return trimmed.slice(1, -1).split('|').map(c => c.trim());
      }
      if (trimmed.includes('\t')) {
        return trimmed.split('\t').map(c => c.trim()).filter(c => c.length > 0);
      }
      return trimmed.split(/\s{2,}/).map(c => c.trim()).filter(c => c.length > 0);
    };

    const looksLikeTable = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) return true;
      if (trimmed.includes('\t')) return true;
      if (/[-—–]/.test(trimmed) && trimmed.split(/\s{2,}/).length >= 2) return true;
      return false;
    };

    const toRow = (cells: string[]) => {
      if (cells.length === 0) return '';
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        result.push('<table class="md-table">');
        result.push(...tableRows);
        result.push('</table>');
        tableRows = [];
      }
    };

    while (i < lines.length) {
      const trimmed = lines[i].trim();

      if (!trimmed) {
        flushTable();
        result.push('<br>');
        i++;
        continue;
      }

      if (looksLikeTable(trimmed)) {
        if (normaliseSeparator(trimmed)) {
          i++;
          continue;
        }
        tableRows.push(toRow(splitRow(trimmed)));
        i++;
        continue;
      }

      flushTable();
      result.push(trimmed);
      i++;
    }
    flushTable();

    html = result.join('\n');
    html = html.replace(/^---$/gm, '<hr>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
