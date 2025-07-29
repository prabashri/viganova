// src/scripts/generate-main-css.ts
import path from 'path';
import { buildCssBundle } from '../utils/buildCssBundle.ts';

await buildCssBundle({
  type: 'main',
  inputDir: path.resolve('./src/styles/main'),
  outputDir: path.resolve('./public/styles'),
  outputFileBase: 'main',
  publicBase: '/styles',
  hashed: true,
  outputType: 'css'
});
