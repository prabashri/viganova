// src/scripts/generate-non-critical-css.ts
import path from 'path';
import { buildCssBundle } from '../utils/buildCssBundle.ts';

await buildCssBundle({
  type: 'nonCritical',
  inputDir: path.resolve('./src/styles/non-critical'),
  outputDir: path.resolve('./public/styles'),
  outputFileBase: 'non-critical',
  publicBase: '/styles',
  hashed: true,
  outputType: 'css'
});
