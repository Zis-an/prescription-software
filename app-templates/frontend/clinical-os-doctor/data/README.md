# Doctor formulary pack

`dgda-drugs.js` is the offline Bangladesh DGDA medicine list used by Rx search.

Regenerate from an XLSX export:

```bash
python scripts/import-dgda-medicines.py --xlsx "path/to/Bangladesh_Medicines_DGDA.xlsx"
```

Postgres gets a **subset** of these rows during `prisma db seed` (`MEDICINE_SEED_LIMIT` in `.env`). That is a one-time/manual load, not live sync.

<!-- TODO(dgda-auto-import): When DGDA publishes new products, automate: refresh this file + upsert into API `medicines` (preserve admin ranking). -->
