# SmartFashion design direction

The storefront follows an editorial fashion lookbook rather than a generic SaaS dashboard. The palette is Optic White `#F7F7F3`, Ink `#11110F`, Cobalt `#2447F9`, Signal Lime `#C7FF3D`, and Structural Grey `#DADBD4`. Display type uses a high-contrast system serif; controls and data use a neutral sans-serif stack.

Desktop storefront wireframe:

```text
┌ brand ─ search rail ─ account / bag ┐
├──────────────┬───────────────────────┤
│ statement    │ live product look     │
│ + AI search  │ image / variant rail  │
├──────────────┴───────────────────────┤
│ editorial product grid (asymmetric)  │
└──────────────────────────────────────┘
```

Mobile collapses navigation into a compact top bar and keeps the multimodal search rail as the first interaction. Admin screens use the same tokens with dense tables and square status markers. Motion is limited to the search-mode switch and drawer transitions, with a reduced-motion fallback.
