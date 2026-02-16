---
'@tadpolehq/core': minor
'@tadpolehq/schema': patch
'@tadpolehq/cli': patch
---

- Add: apply_identity action (overrides user agent and SEC-CH headers with a recent release)
- Add: set_hardware_concurrency action (overrides the device CPU count)
- Add: set_device_memory action (overrides the device memory)
- Add: set_viewport (overrides the user viewport/screen settings)
- Add: set_webgl_vendor action (overrides the webgl vendor/renderer)
- Add: screenshot action (takes a screenshot and writes it to a file)
- Add: random action (randomly executes one of the child actions)
- Add: --proxy-server cli option
- Change: use --headless=new and --disable-blink-features=AutomationControlled to further avoid detection
