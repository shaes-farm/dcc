DCC action button — use for all commands; labels are verb-first imperatives ("Re-run failed checks").

```jsx
<Button variant="primary">Restart workload</Button>
<Button icon={<span>▶</span>}>Tail logs</Button>
<Button variant="danger" size="sm">Restart</Button>
```

Variants: `primary` (accent fill — one per surface), `secondary` (default), `ghost` (toolbar/inline), `danger` (destructive-adjacent safe actions). Sizes sm/md/lg. Never scale on press; background darkens instead.
