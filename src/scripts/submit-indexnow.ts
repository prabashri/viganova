// scripts/submit-indexnow.ts
import { getUpdatedUrlsSinceLastPing } from '../utils/urlsToIndex';
import { submitToIndexNow } from '../utils/bingApiIndex';

(async () => {
  const updatedUrls = getUpdatedUrlsSinceLastPing();
  const result = await submitToIndexNow(updatedUrls, {
    minDaysBetween: 14, // throttle window
    maxUrls: 50,        // cap per request (polite)
    // force: true,     // uncomment to bypass throttle
  });
  console.log(result);
})();
