import { AppOptions } from './argparse';
import { GmiToGopher } from './gmitogopher';

export class GmiToPlainText extends GmiToGopher {
  constructor(options: AppOptions) {
    super(options);
    this.textPrefix = '';
  }

  protected formatLink(target: string, label: string): string {
    if (label) {
      return `${label}: ${target}`;
    } else {
      return target;
    }
  }
}
