---
description: Work with the engineering competency matrix
---

# Matrix Workflow

## Steps for Matrix Development

1. **Start development servers**
   ```bash
   npm run dev:all
   ```

2. **Verify matrix functionality**
   - Visit http://localhost:5173/matrix
   - Check that competency levels display correctly
   - Verify interactive features work

3. **Test matrix data**
   ```bash
   node verification/scripts/check-all-developer-data.js
   ```

4. **Run matrix tests**
   ```bash
   node verification/tests/test-matrix-functionality.js
   ```

5. **Update matrix configuration**
   - Edit matrix levels in configuration
   - Refresh data using GUI buttons
   - Reanalyze competency scores

6. **Generate reports**
   - Export competency matrix reports
   - Verify data accuracy
   - Check visualization components

## Troubleshooting

- If matrix doesn't load: Check backend API health
- If data is stale: Use Refresh button in configuration
- If scores seem wrong: Use Reanalyze button to reculate
