# @tadpolehq/core

## 0.2.0

### Minor Changes

- dc40db7: - Add: filter action (evaluators to filter out specific elements)
  - Add: while action (loop while evaluators return true)
  - Add: maybe action (action that's allowed to fail)
  - Add: as_bool evaluator (casting values to boolean)
  - Add: as_float evaluator (casting strings to floats)
  - Add: as_int evaluator (casting strings to integers)
  - Add: child evaluator (loads a child element at the provided index)
  - Add: wait_until supports life cycle events like networkIdle and networkAlmostIdle
  - Add: log action
  - Add: format expression function
  - Improve: consistent logging across actions
  - Fix: struct errors wrong length check
- df9baf4: - Add: apply_identity action (overrides user agent and SEC-CH headers with a recent release)
  - Add: set_hardware_concurrency action (overrides the device CPU count)
  - Add: set_device_memory action (overrides the device memory)
  - Add: set_viewport (overrides the user viewport/screen settings)
  - Add: set_webgl_vendor action (overrides the webgl vendor/renderer)
  - Add: screenshot action (takes a screenshot and writes it to a file)
  - Add: random action (randomly executes one of the child actions)
  - Add: --proxy-server cli option
  - Change: use --headless=new and --disable-blink-features=AutomationControlled to further avoid detection
- 84f3520: - Add: and evaluator (logical and)
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
  - Add: replace evaluator (replaces one or all of the matched pattern with another string)
  - Add: root evaluator (allows access to original input passed to sequence of evaluators)
  - Add: node and struct builders now have extend
  - Add: common regex type to schema
  - Fix: All evaluators do a null check to prevent runtime errors

### Patch Changes

- Updated dependencies [dc40db7]
- Updated dependencies [df9baf4]
- Updated dependencies [84f3520]
  - @tadpolehq/schema@0.1.3

## 0.1.3

### Patch Changes

- 9e09047: - Fix for_each: Used wrong value for remoteObjectId, ensure object isn't a primitive
  - Fix withPrefix: Do not append an extra `.`
  - Add stepPrecision to natural mouse Scroll
  - Fix hover: dom.getBoxModel returns a relative position, not absolute

## 0.1.2

### Patch Changes

- 79d0b4d: Initial release
- Updated dependencies [79d0b4d]
  - @tadpolehq/schema@0.1.2
