# Access Point Lawn Care

Updated customer-facing site package for the `access-point-lawn-care-site` repo.

## Included
- `index.html`
- `styles.css`
- `config.js`
- `script.js`
- `vercel.json`
- `google-apps-script.js`
- `google-sheet-template.csv`
- `DEPLOY_NEXT.txt`

## What changed
- Removed developer/demo copy
- Added a cleaner customer-facing homepage
- Added quote estimator logic
- Kept browser backup capture for form submissions
- Moved the webhook URL into `config.js`

## To reconnect Google Sheets
Paste your live deployed Google Apps Script `/exec` URL into `config.js`:

```js
window.APL_CONFIG = {
  LEAD_ENDPOINT: "PASTE-YOUR-URL-HERE"
};
```

Then redeploy through GitHub/Vercel.
