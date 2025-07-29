// src/scripts/generate-inline-css.ts
import path from 'path';
import { buildCssBundle } from '../utils/buildCssBundle.ts';

await buildCssBundle({
  type: 'inline',
  inputDir: path.resolve('./src/styles/inline'),
  outputDir: path.resolve('./src/data'),
  outputFileBase: 'generated-inline-css',
  publicBase: '/src/data',
  hashed: false,
  outputType: 'ts'
});
