---
'@tadpolehq/core': minor
'@tadpolehq/schema': patch
'@tadpolehq/cli': patch
---

- Add: and evaluator (logical and)
- Add: default evaluator (provides default static value)
- Add: deq evaluator (dynamic eq operator)
- Add: dne evaluator (dynamic ne operator)
- Add: eq evaluator (static eq operator)
- Add: extract evaluator (regex extract capture groups)
- Add: matches evaluator (test if input matches regex pattern)
- Add: ne evaluator (static ne operator)
- Add: not evaluator (logical not operator)
- Add: or evaluator (logical or)
- Add: prop evaluator (access object property)
- Add: root evaluator (allows access to original input passed to sequence of evaluators)
- Add: node and struct builders now have extend
- Add: common regex type to schema
- Fix: All evaluators do a null check to prevent runtime errors
