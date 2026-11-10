# Styling (client)

- One SCSS module per component, named to match it: `ShipForm.tsx` → `ShipForm.module.scss`.
- Class names in kebab-case, following `component-element-role`, e.g. `ship-form-pilot-select`.
  Vite exposes them in camelCase (`classes.shipFormPilotSelect`).
- Shared colors and sizes come from [client/src/variables.scss](../../client/src/variables.scss).
- No inline `style` props.
