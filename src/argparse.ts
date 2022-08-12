import { ArgumentParser } from 'argparse';
import {
  version as PackageVersion,
  description as PackageDescription,
} from '../package.json';

export interface AppOptions {
  input: string;
  plain_text: boolean;
}

export function parseArguments(): AppOptions {
  const parser = new ArgumentParser({
    description: PackageDescription,
  });

  parser.add_argument('-v', '--version', {
    action: 'version',
    version: PackageVersion,
  });
  parser.add_argument('-t', '--plain-text', {
    help: 'output as plaintext (not gophermap)',
    action: 'store_true',
  });
  parser.add_argument('input', {
    help: 'Path to input file',
    default: '.',
    nargs: '?',
  });

  return parser.parse_args() as AppOptions;
}
