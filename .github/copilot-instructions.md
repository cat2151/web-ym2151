# Agent Instructions for Development

## Testing Requirements

### Headless Browser Testing

When implementing features that involve browser functionality, especially dynamic imports, DOM manipulation, or external resources:

1. **Always verify in a headless browser environment** before completing the implementation
2. **Test the deployed version** to ensure resources load correctly from the deployed URL
3. **Check browser console** for errors (404s, failed imports, runtime errors)

#### How to Test in Headless Browser

Use Playwright or Puppeteer to launch a headless browser and navigate to the deployed page:

```javascript
// Example with Playwright
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  // Listen for errors
  page.on('pageerror', error => console.error('PAGE ERROR:', error));
  
  // Navigate to the page
  await page.goto('https://cat2151.github.io/web-ym2151/', { waitUntil: 'networkidle' });
  
  // Wait for scripts to execute
  await page.waitForLoadState('domcontentloaded');
  
  await browser.close();
})();
```

### Deployment Considerations

When adding external libraries or resources:

1. **Check if they're git-ignored**: Ensure required files are included in the deployment
2. **Add setup steps to CI/CD**: If files need setup scripts, add them to `.github/workflows/deploy.yml`
3. **Test the full deployment pipeline**: Verify resources are available after deployment
4. **Document setup requirements**: Update README and relevant documentation
5. **Fail fast on cat2151 library 404s**: When cat2151-owned library assets (e.g., smf-to-ym2151log, mmlabc-to-smf) return 404 or similar, do not build from source as a fallback. Treat it as a publishing issue, surface the failure, and notify cat2151 instead of masking it.

### Common Issues to Check

- 404 errors for dynamically imported modules
- CORS issues with external resources
- Missing files due to `.gitignore`
- Incorrect relative paths in deployed environment
- Missing CI/CD build steps

## Implementation Checklist

Before completing any feature implementation:

- [ ] Functionality works in local development environment
- [ ] Tested in headless browser (if web feature)
- [ ] No console errors in browser
- [ ] All required files are included in deployment
- [ ] CI/CD workflow updated if needed
- [ ] Documentation updated
- [ ] Code reviewed and tested
