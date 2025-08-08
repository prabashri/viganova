// scripts/prepare-indexnow.ts
import { ensureIndexNowKeyFile } from '../utils/bingApiIndex';

const { changed, keyLocation } = ensureIndexNowKeyFile();
console.log(changed ? `✅ IndexNow key refreshed: ${keyLocation}` : `ℹ️ IndexNow key OK: ${keyLocation}`);
