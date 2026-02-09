---
'@tadpolehq/core': minor
'@tadpolehq/schema': patch
'@tadpolehq/cli': patch
---

- Add: filter action (evaluators to filter out specific elements)
- Add: while action (loop while evaluators return true)
- Add: maybe action (action that's allowed to fail)
- Add: as_boolean evaluator (casting values to boolean)
- Add: child evaluator (loads a child element at the provided index)
- Add: wait_until supports life cycle events like networkIdle and networkAlmostIdle
- Add: log action
- Add: format expression function
- Improve: consistent logging across actions
- Fix: struct errors wrong length check
