# ⚡ Quick Reference - Essential Rules

Quick lookup for the most critical rules. For detailed info, see `RULES_CATALOG.md`.

---

## 🔴 P0 BLOCKING - Must Never Violate

### **Incremental Intelligence**
- **No large rewrites** — Only atomic, surgical changes
- **Max 20% code change** per modification
- **All tests must pass** after each change
- **Violation Cost:** Requires complete rewrite

### **Regression Prevention**  
- **No feature deletion** — All tested features remain working
- **No test disabling** — Tests cannot be commented out
- **Backward compatible** — Old code still works after changes
- **Violation Cost:** Feature rollback + urgent fix

### **Unidirectional Dependencies**
- **Flow:** Pages → Components → Hooks/Utils → Types
- **NO circular imports** — File A cannot import from file B if B imports A
- **NO Pages importing Pages** 
- **Violation Cost:** Architecture refactor + build failure

### **Component Size Limits**
- **Max 250 lines** per component (hard limit)
- **Soft 150 lines** (review required if exceeded)
- **Max 3 useEffect** per component
- **Violation Cost:** Component decomposition required

### **Security & Privacy**
- **Private by default** — Ask "who can access?" for every data access
- **No hardcoded secrets** — All credentials via `process.env`
- **storageManager only** — No direct `localStorage` or `IndexedDB`
- **No external APIs** outside whitelist
- **Violation Cost:** Immediate code rejection + security review

---

## 🟠 P1 HIGH - Fix Immediately in Same Session

### **Testing Mandate**
- **80% coverage minimum** for new code
- **Unit tests** for all business logic
- **Component tests** for key UI elements
- **E2E tests** for critical user flows
- **Violation:** P1 flag, must fix in session

### **Accessibility (WCAG 2.1)**
- **Semantic HTML** — Use `<button>`, not `<div onClick>`
- **Keyboard navigation** — Tab key must work everywhere
- **Image alt text** — Every image must have `alt` attribute
- **ARIA labels** — Dynamic components need ARIA context
- **Violation:** P1 flag, accessibility audit required

### **Error Handling**
- **Error Boundary** — Entire app must be wrapped
- **API error states** — Handle `isError` on every fetch
- **Form validation** — Field-level error messages required
- **Violation:** P1 flag, must add error handling

### **Component Responsibility**
- **Single Responsibility** — One thing per component
- **Logic extraction** — Complex logic → custom hooks
- **Clear naming** — Name must describe what it does
- **Violation:** P1 flag, component refactor required

---

## 🟡 P2 MEDIUM - Track for Future Sprint

### **Performance**
- **Core Web Vitals** — LCP, FID, CLS must pass Lighthouse
- **Bundle size** — Keep < 200KB (gzipped)
- **Lazy loading** — Heavy components use React.lazy()

### **Code Quality**
- **Consistent formatting** — Use Prettier + ESLint
- **Semantic naming** — Names clearly describe purpose
- **Documentation** — Complex logic has comments explaining why

---

## 🔵 P3 LOW - Advisory Only

- Style preferences (Prettier handles most)
- Documentation completeness
- Code organization tips
- Non-breaking improvements

---

## 🛠️ Common Violations & Fixes

### **Violation: Circular Import**
```javascript
// ❌ WRONG - Creates circle
// file-a.ts
import { funcB } from './file-b';

// file-b.ts  
import { funcA } from './file-a';

// ✅ FIX - Extract shared logic down the chain
// shared-utils.ts
export const sharedFunc = () => {};

// file-a.ts & file-b.ts
import { sharedFunc } from './shared-utils';
```

### **Violation: Hardcoded Secret**
```javascript
// ❌ WRONG
const API_KEY = 'AIzaSyXXXXXXXXX';

// ✅ FIX - Use environment variable
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('Missing GEMINI_API_KEY');
```

### **Violation: Direct localStorage**
```javascript
// ❌ WRONG
localStorage.setItem('preferences', JSON.stringify(data));

// ✅ FIX - Use storageManager
import { saveToStorage, loadFromStorage } from '@/utils/storageManager';
saveToStorage('preferences', data);
```

### **Violation: Oversized Component**
```typescript
// ❌ WRONG - 500+ line component
export const MegaComponent = () => {
  // ... 500 lines of code
};

// ✅ FIX - Decompose into sub-components
export const MegaComponent = () => (
  <>
    <MegaHeader />
    <MegaContent />
    <MegaFooter />
  </>
);
```

### **Violation: No Testing**
```typescript
// ❌ WRONG - No tests
export const calculateTotal = (items: Item[]) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ FIX - Add unit test
describe('calculateTotal', () => {
  it('should sum all item prices', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
});
```

---

## 📱 Quick Verification Before Code Output

```
Checklist (run before EVERY output):

[ ] Dependency flow correct? (Pages→Components→Hooks→Types)
[ ] Any circular imports? (No)
[ ] Component size OK? (< 250 lines)
[ ] Tests included? (Unit + integration)
[ ] Accessible? (Keyboard nav, alt text, ARIA)
[ ] No hardcoded secrets? (Using env vars)
[ ] No direct localStorage? (Using storageManager)
[ ] API calls whitelisted? (On allow-list)
[ ] Error handling present? (Error boundary + API errors)
[ ] Security checks passed? (Private by default, auth on routes)
```

---

## 🎯 When to Escalate

**Escalate to tech lead if:**
- Rule conflict with task spec
- Unsure which rule applies
- Rule seems wrong for this context
- P0 violation but fix seems impossible

**Contact:** See `../docs/architecture/code-audit-and-remediation.md` for escalation process.

---

## 📚 Find Detailed Rules

| Need | Find here | File |
|------|-----------|------|
| Full rule details | `RULES_CATALOG.md` | rules/docs/RULES_CATALOG.md |
| AI setup instructions | `SETUP_FOR_AI_AGENTS.md` | rules/docs/SETUP_FOR_AI_AGENTS.md |
| All rules by priority | `RULES_INDEX.json` | rules/RULES_INDEX.json |
| Architecture rules | `architecture/` folder | rules/architecture/*.rules.json |
| Security rules | `quality/security-privacy.rules.json` | rules/quality/ |
| Testing rules | `quality/testing.rules.json` | rules/quality/ |

---

**Keep this document open while coding. When in doubt, check RULES_CATALOG.md for the full rule.**
