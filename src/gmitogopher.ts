import { AppOptions } from './argparse';
import fs from 'fs';
import wrap from 'word-wrap';

enum GopherDocType {
  TEXT = '0',
  DIR = '1',
  BINARY = '9',
  HTML = 'h',
}

export class GmiToGopher {
  protected fileContents: string;
  protected width: number = 80;
  protected textPrefix: string = 'i';

  constructor(protected options: AppOptions) {
    this.fileContents = fs.readFileSync(options.input).toString();
  }

  public convert(): string {
    let doc: string = '';
    const lines = this.fileContents.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('```')) {
        continue;
      }
      doc += this.convertLine(line) + '\n';
    }

    return doc;
  }

  protected convertLine(line: string): string {
    if (line.startsWith('=>')) {
      return this.convertLink(line);
    } else if (line.startsWith('#')) {
      return this.convertHeading(line);
    } else if (line.startsWith('*')) {
      return this.convertList(line);
    } else if (line.startsWith('>')) {
      return this.convertBlockquote(line);
    } else if (line.trim().length > 0) {
      return this.convertText(line);
    }
    return '';
  }

  protected convertHeading(line: string): string {
    let headingText = line.replace(/^#+ /, '');
    let heading = '';
    let maxWidth = 0;
    const wrappedHeading = wrap(headingText, {
      width: this.width,
      indent: '',
    }).split('\n');
    for (const l of wrappedHeading) {
      heading += this.textPrefix + l + '\n';
      maxWidth = Math.max(maxWidth, l.trimEnd().length);
    }
    heading += this.textPrefix + new Array(maxWidth + 1).join('=');
    return heading;
  }

  protected convertList(line: string): string {
    let text = line.replace(/^\* /, '');
    let listItem = '';
    const wrappedText = wrap(text, {
      width: this.width,
      indent: '  ',
    }).split('\n');
    for (let i = 0; i < wrappedText.length; i++) {
      wrappedText[i] = this.textPrefix + wrappedText[i];
    }
    return wrappedText.join('\n');
  }

  protected convertText(line: string): string {
    const wrappedText = wrap(line, {
      width: this.width,
      indent: '',
    }).split('\n');
    for (let i = 0; i < wrappedText.length; i++) {
      wrappedText[i] = this.textPrefix + wrappedText[i];
    }
    return wrappedText.join('\n');
  }

  protected convertBlockquote(line: string): string {
    const oldPrefix = this.textPrefix;
    this.textPrefix += '> ';
    const quote = this.convertText(line.replace(/^\> +/, ''));
    this.textPrefix = oldPrefix;
    return quote;
  }

  protected convertLink(line: string): string {
    const pieces = line.split(' ');
    if (pieces.length > 1) {
      pieces.shift(); // Remove the '=>'
      const target = pieces.shift() as string;
      let label = target;
      if (pieces.length > 0) {
        label = pieces.join(' ');
      }
      return this.formatLink(target, label);
    } else {
      return line;
    }
  }

  protected formatLink(target: string, label: string): string {
    if (target.startsWith('gopher://')) {
      return this.formatExternalGopherLink(target, label);
    } else if (target.match(/^(https?|gemini):\/\//)) {
      return `h${label}${'\t'}URL:${target}`;
    } else {
      return this.formatInternalLink(target, label);
    }
  }

  private formatExternalGopherLink(target: string, label: string): string {
    const documentType = this.getExternalGopherDocumentType(target);
    const pathPieces = target.replace('gopher://', '').split('/');
    let domain;
    let port = '70';
    let path = '/';
    if (pathPieces.length > 0) {
      if (pathPieces[0].includes(':')) {
        const domainPieces = pathPieces[0].split(':');
        port = domainPieces.pop() as string;
        domain = domainPieces.join(':');
      } else {
        domain = pathPieces[0];
      }
      pathPieces.shift();
      path = pathPieces.join('/') || '/';
      return `${documentType}${label}${'\t'}${path}${'\t'}${domain}${'\t'}${port}`;
    } else {
      return label;
    }
  }

  private getExternalGopherDocumentType(target: string): string {
    const pathPieces = target.replace('gopher://', '').split('/');
    if (pathPieces.length === 1) {
      return GopherDocType.DIR;
    }
    const filename = pathPieces.pop() as string;
    if (filename.length === 0 || !filename.includes('.')) {
      return GopherDocType.DIR;
    }
    const extension = filename.split('.').pop()?.toLocaleLowerCase();
    if (extension === 'txt') {
      return GopherDocType.TEXT;
    } else if (extension === 'html') {
      return GopherDocType.HTML;
    }
    return GopherDocType.BINARY;
  }

  private formatInternalLink(target: string, label: string): string {
    const documentType = this.getInternalDocumentType(target);
    const newPath = this.convertGmiFilename(target);
    return `${documentType}${label}${'\t'}${newPath}`;
  }

  private getInternalDocumentType(target: string): string {
    const pathPieces = target.split('/');
    const filename = pathPieces.pop() as string;
    if (filename.length === 0 || !filename.includes('.')) {
      return GopherDocType.DIR;
    }
    const extension = filename.split('.').pop()?.toLocaleLowerCase();
    if (extension === 'gmi') {
      if (filename === 'index.gmi') {
        return GopherDocType.DIR;
      } else {
        return GopherDocType.TEXT;
      }
    } else if (extension === 'txt') {
      return GopherDocType.TEXT;
    } else if (extension === 'html') {
      return GopherDocType.HTML;
    }
    return GopherDocType.BINARY;
  }

  private convertGmiFilename(target: string): string {
    const pathPieces = target.split('/');
    const filename = pathPieces.pop() as string;
    if (filename.length === 0 || !filename.includes('.')) {
      pathPieces.push(filename);
      return pathPieces.join('/');
    }
    const extension = filename.split('.').pop()?.toLocaleLowerCase();
    if (extension === 'gmi') {
      if (filename === 'index.gmi') {
        return pathPieces.join('/') || '/';
      } else {
        pathPieces.push(filename.replace(/\.gmi$/i, '.txt'));
        return pathPieces.join('/');
      }
    }
    pathPieces.push(filename);
    return pathPieces.join('/');
  }
}
