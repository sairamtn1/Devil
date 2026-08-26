# VOLGA OS Screenshots Guide

## Required Screenshots

### 1. Landing Page
**File:** `landing-page.png`  
**Size:** 1920x1080  
**Description:** Full landing page showing hero section, features, and CTA

### 2. Dashboard
**File:** `dashboard.png`  
**Size:** 1920x1080  
**Description:** Main dashboard with mission overview, agent status, and quick actions

### 3. Mission Center
**File:** `mission-center.png`  
**Size:** 1920x1080  
**Description:** Mission creation wizard and active missions list

### 4. Mission Detail
**File:** `mission-detail.png`  
**Size:** 1920x1080  
**Description:** Individual mission with progress, agents, and results

### 5. Agent Network
**File:** `agent-network.png`  
**Size:** 1920x1080  
**Description:** Grid of available agents with status and capabilities

### 6. Simulation Center
**File:** `simulation-center.png`  
**Size:** 1920x1080  
**Description:** Simulation configuration and results view

### 7. Enterprise Console
**File:** `enterprise-console.png`  
**Size:** 1920x1080  
**Description:** Organization management, teams, and workspaces

### 8. Agent Factory
**File:** `agent-factory.png`  
**Size:** 1920x1080  
**Description:** Agent templates, creation wizard, and marketplace

### 9. Analytics
**File:** `analytics.png`  
**Size:** 1920x1080  
**Description:** Usage metrics, charts, and statistics

### 10. Settings
**File:** `settings.png`  
**Size:** 1920x1080  
**Description:** User settings, profile, and preferences

### 11. Login Page
**File:** `login-page.png`  
**Size:** 1920x1080  
**Description:** Professional login page with OAuth options

### 12. Registration
**File:** `registration.png`  
**Size:** 1920x1080  
**Description:** Sign-up page with beta code option

---

## Screenshot Requirements

### Quality
- Resolution: 1920x1080 minimum
- Format: PNG
- Quality: High (no compression artifacts)

### Style
- Dark theme (matches VOLGA branding)
- Purple/pink gradient accents
- Clean, modern UI
- Realistic demo data

### Content
- Use demo accounts
- Show realistic data
- Include helpful annotations if needed

---

## How to Generate

### Option 1: Manual Screenshots
1. Start the application
2. Navigate to each page
3. Take full-page screenshots
4. Optimize and save as PNG

### Option 2: Automated (Playwright)
```javascript
const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  const pages = [
    { url: '/', file: 'landing-page.png' },
    { url: '/dashboard', file: 'dashboard.png' },
    // ...
  ];
  
  for (const p of pages) {
    await page.goto(`http://localhost:3000${p.url}`);
    await page.screenshot({ path: `screenshots/${p.file}` });
  }
  
  await browser.close();
}
```

---

## Storage

Screenshots should be stored in:
```
artifacts/assets/screenshots/
```

---

**Last Updated:** August 2026
