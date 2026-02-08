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

### Common Issues to Check

- 404 errors for dynamically imported modules
- CORS issues with external resources
- Missing files due to `.gitignore`
- Incorrect relative paths in deployed environment
- Missing CI/CD build steps

## cat2151 Library Integration Policy

### Version Pinning Policy

**IMPORTANT: Do NOT pin cat2151 repository libraries to specific commits or tags.**

When integrating libraries from cat2151 repositories (e.g., mmlabc-to-smf-rust, smf-to-ym2151log-rust):

1. **Always use the latest main/master branch**
2. **Never pin to specific commits or version tags**
3. **Always pull the latest changes during build**

#### Rationale

- cat2151 repositories receive critical bug fixes daily
- Fast integration of bug fixes is mandatory for project stability
- Pinning versions would delay critical fixes and potentially break functionality
- The rapid iteration cycle requires always using the latest code

#### Implementation

In setup scripts (e.g., `setup-mml.sh`):

```bash
# ✅ CORRECT: Use latest from main branch
cd lib/repository-name
git fetch origin
git checkout origin/main  # or origin/master
git pull

# ❌ WRONG: Do not pin to commits
git checkout specific-commit-hash  # Never do this
```

#### CI/CD Considerations

- Build pipelines should always fetch latest changes
- No caching of specific versions
- Accept that builds may occasionally break, but fixes will be available quickly
- Report any breaking changes to cat2151 repositories immediately

## Implementation Checklist

Before completing any feature implementation:

- [ ] Functionality works in local development environment
- [ ] Tested in headless browser (if web feature)
- [ ] No console errors in browser
- [ ] All required files are included in deployment
- [ ] CI/CD workflow updated if needed
- [ ] Documentation updated
- [ ] cat2151 libraries use latest versions (no pinning)
- [ ] Code reviewed and tested
