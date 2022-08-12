#!/usr/bin/env ts-node
import { parseArguments } from './argparse';
import { GmiToGopher } from './gmitogopher';
import { GmiToPlainText } from './gmitoplaintext';

const options = parseArguments();
const gmiToGopher = options.plain_text
  ? new GmiToPlainText(options)
  : new GmiToGopher(options);
console.log(gmiToGopher.convert());
