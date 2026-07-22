Select for environment pickers, filters, and Settings reference pickers (pick over existing IDs — no free-text foreign keys).

```jsx
<Select
  options={["dev", "qa", "staging"]}
  mono
  value={env}
  onChange={(e) => setEnv(e.target.value)}
/>
```
