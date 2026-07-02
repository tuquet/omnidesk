---
name: coding-standards
description: "Detailed coding standards for documentation, comments, and clean code practices. Use this skill when writing complex APIs, generating documentation, or reviewing code quality."
---

# Clean Code & Documentation Standards

As an AI Agent writing or modifying code in this ecosystem, you MUST follow these detailed documentation standards. The goal is to maximize developer experience (DX) and tooling intelligence (IntelliSense) without cluttering the source code.

## 1. Principle: "Why", Not "What"

Comments should explain the reasoning behind a piece of code, not narrate the code itself. If the code is too complex to understand without a "what" comment, refactor the code to be self-documenting.

### ❌ Incorrect (Redundant "What")
```typescript
// Check if user is active and has admin role
if (user.isActive && user.role === 'ADMIN') {
  // Call the delete account function
  deleteAccount(user.id);
}
```

### ✅ Correct (Valuable "Why")
```typescript
// Legacy accounts from before 2023 do not have a soft-delete flag.
// We must hard-delete them directly via the admin role to comply with GDPR.
if (user.isActive && user.role === 'ADMIN') {
  deleteAccount(user.id);
}
```

---

## 2. JSDoc for TypeScript/JavaScript APIs

Always use standard JSDoc (`/** */`) for exported functions, hooks, classes, and shared UI components. This ensures VS Code and other IDEs display rich hover documentation.

### ❌ Incorrect (Regular comments)
```typescript
// Calculates the total price including tax
// taxRate is a decimal between 0 and 1
export function calculateTotal(price: number, taxRate: number) { ... }
```

### ✅ Correct (JSDoc IntelliSense)
```typescript
/**
 * Calculates the total checkout price including regional taxes.
 * 
 * @param price - The base price of the cart in cents.
 * @param taxRate - The regional tax multiplier (e.g., 0.08 for 8%).
 * @returns The final total price in cents, rounded to the nearest integer.
 * 
 * @example
 * const total = calculateTotal(1000, 0.08); // Returns 1080
 */
export function calculateTotal(price: number, taxRate: number): number { ... }
```

---

## 3. Rustdoc for Rust Backend

For Rust code, use standard doc comments (`///`) for all public `pub` structs, enums, and functions so that `cargo doc` can generate the documentation website.

### ❌ Incorrect
```rust
// The background worker that processes email queues.
// Uses a channel receiver to listen for jobs.
pub struct EmailWorker { ... }
```

### ✅ Correct
```rust
/// The background worker that processes email queues.
///
/// This worker spawns a Tokio task and listens on an `mpsc` receiver
/// for incoming [`EmailJob`] requests.
///
/// # Examples
/// ```
/// let worker = EmailWorker::new(receiver);
/// worker.start();
/// ```
pub struct EmailWorker { ... }
```

---

## 4. Zero Tolerance for Dead Code

NEVER leave blocks of commented-out code. It causes confusion and bloats the file. If an alternative approach was tried and discarded, or a feature was temporarily disabled, remove the code entirely. We rely on Git history for recovery.

### ❌ Incorrect
```typescript
function processPayment() {
  // const oldGateway = new StripeGateway();
  // await oldGateway.charge();
  
  const newGateway = new PayPalGateway();
  await newGateway.charge();
}
```

### ✅ Correct
```typescript
function processPayment() {
  const newGateway = new PayPalGateway();
  await newGateway.charge();
}
```
