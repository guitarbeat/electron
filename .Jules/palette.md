## 2026-01-10 - Input Accessibility
**Learning:** `aria-describedby` and `aria-invalid` need to be explicitly managed when `error` props are used in form components. Associating labels with inputs requires unique IDs, which `React.useId` handles elegantly.
**Action:** When creating form components, always use `useId` to generate a base ID for connecting labels, inputs, and error messages.
