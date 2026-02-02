# Tadpole
<p align="center" width="100%">
<img src="apps/docs/src/assets/logo.png" width="250g" />
</p>

Tadpole is a DSL designed specifically for browser automation and data extraction. It is built
on top of [KDL](https://kdl.dev/). It is designed to be modular and concise.

See [Documentation](https://tadpolehq.com) to learn more!

## Example
```kdl
import "modules/redfin/mod.kdl" repo="github.com/tadpolehq/community"

main {
  new_page {
    redfin.search text="=text"
    wait_until
    redfin.extract_from_card extract_to="addresses" {
      address {
        redfin.extract_address_from_card
      }
    }
  }
}
```

## Roadmap
**NOTE**: Expect there to be a lot of changes, these earlier versions are not going to be stable!

**Planned for 0.2.0**
- **Control Flow**: Add if/else and loops
- **DOMPick**: Used to select elements by index
- **DOMFilter**: Used to filter elements using evaluators
- **More Evaluators**: Type casting, regex, exists
- **Root Slots**: Support for top level dynamic placeholders

## Community
Checkout our [Community Repository](https://github.com/tadpolehq/community) to share your scrapers or find pre-built modules.
