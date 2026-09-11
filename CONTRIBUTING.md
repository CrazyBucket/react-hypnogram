# Contributing

Start with the [API reference](docs/api.md). Keep public types, behavior,
documentation and the playground's generated code consistent. The playground
must use the public component rather than its own renderer.

Use Node.js 22.12 or newer, then run `npm ci` and `npm run check`.
Computation tests cover timeline and geometry behavior; lightweight DOM tests
cover callbacks and tooltip state. Review visual changes in `npm run dev`.
There is no Playwright dependency or browser automation suite.

Prefer small changes within the documented API. New features require a concrete
use case; do not restore removed features from the old API proposal as part of a
refactor. Keep business-schema adaptation outside the library.

The source separates pure layout/geometry, SVG paint definitions and React state.
Only documented symbols are exported from `src/index.ts`. React remains a peer
dependency and must stay external to the library build.

Before publishing, choose the registry package name, add the actual repository
metadata, review the `npm pack --dry-run` contents and verify supported React
versions. Publishing is a separate action from building or packaging locally.
