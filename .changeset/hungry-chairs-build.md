---
'@tadpolehq/core': patch
'@tadpolehq/cli': patch
---

- Fix for_each: Used wrong value for remoteObjectId, ensure object isn't a primitive
- Fix withPrefix: Do not append an extra `.`
- Add stepPrecision to natural mouse Scroll
- Fix hover: dom.getBoxModel returns a relative position, not absolute
