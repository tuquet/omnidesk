# Data TestID Guidelines & Best Practices

To ensure automation testing (E2E with Playwright/Cypress) is robust and maintainable, this standard follows industry best practices (similar to Meta, Google, and Cypress guidelines) for applying `data-testid` attributes.

## 1. Naming Convention (Format)
All `data-testid` attributes **must** adhere to a strict hierarchical format to prevent global collisions, especially in monorepos or large applications:
`[scope/app-name]:[component/page]:[element-or-action]`

*   **scope/app-name**: The domain or application the component belongs to (e.g., `admin-panel`, `storefront`, `shared-ui`).
*   **component/page**: The specific UI location or component block (e.g., `data-table`, `login-form`, `sidebar`).
*   **element-or-action**: What the element represents or does (e.g., `btn-submit`, `input-email`, `row-1`).

### Examples:
- `<Button data-testid="admin-panel:user-table:btn-delete">`
- `<Input data-testid="storefront:checkout-form:input-email">`

---

## 2. Best Practices: WHERE to place `data-testid`
To avoid cluttering the DOM and creating duplicate/useless IDs, follow these strict placement rules:

### ✅ DO: Target Interactive & Assertable Elements
Place `data-testid` ONLY on elements that tests need to interact with or assert.
- **Actionable Elements**: Buttons, links, dropdowns, checkboxes, form inputs.
- **Assertable States**: Error messages, empty states (`No data found`), loading spinners, or critical data cells.

### ✅ DO: Establish Component Boundaries (Scoping)
For complex components (like a Form or a Dialog), place a `data-testid` on the **root wrapper** (e.g., `storefront:checkout-form:root`).
*Why?* Tests can use scoping to find elements, avoiding global duplication.
```javascript
// Playwright Example:
const form = page.getByTestId('storefront:checkout-form:root');
await form.getByTestId('input-email').fill('...');
```

### ✅ DO: Append Unique IDs for Iterations (Lists/Tables)
When rendering a list `.map()`, **never** use the array `index` as part of the `data-testid` because order changes will break tests. ALWAYS use a stable database ID or unique slug.
*Correct:* `data-testid={"admin-panel:user-list:row-" + user.id}`
*Incorrect:* `data-testid={"admin-panel:user-list:row-" + index}` (Fragile).

### ❌ DON'T: Clutter Layout Wrappers
Do NOT place `data-testid` on purely structural layout elements (`<div>`, `<section>`, `<Spacer>`) unless they have semantic meaning for an assertion.

### ❌ DON'T: Hardcode Dynamic Content
Do NOT use dynamic text directly inside the `data-testid` if it is prone to change (e.g. localized strings).

---

## 3. Uniqueness Rule
- A specific `data-testid` **must be globally unique** unless it serves as a scoped child identifier inside a strictly scoped root (as defined in Rule 2).
- The scanning script will flag any identical `data-testid` strings found across multiple files.

## 4. Verification Tooling
Use the provided script to verify `data-testid` uniqueness across your project:
```bash
node scripts/scan-testids.mjs
```
The script will recursively scan your project and generate a markdown report `testid-report.md` highlighting duplicates and file locations.
