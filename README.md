# Tadpole
<p align="center" width="100%">
<img src="apps/docs/src/assets/logo.png" width="250g" />
</p>

Tadpole is a DSL designed specifically for browser automation and data extraction. It is built
on top of [KDL](https://kdl.dev/). It is designed to be modular and concise.

## Why?
Tadpole tries to simplify the complexities of web scraping and automation by:
- **Abstraction**: Simulating realistic human behavior (bezier curves, easing) through high-level composed actions.
- **Zero Config**: Import and share scraper modules directly via Git, bypass NPM/Registry overhead.
- **Reusability**: Actions and evaluators can be composed through slots to create more complex workflows.

### Example
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

## Getting Started
See [Documentation](https://tadpolehq.com) to get started!

## Roadmap
**NOTE**: Expect there to be a lot of changes, these earlier versions are not going to be stable!

**The Goal**
The long term vision and goal I have for this project is to create a new standard way of web scraping.

**Planned 0.3.0**
- **Piping**: Allowing different files to chain input/output through external triggers (message queues, AMQP).
- **Plugins**: Allow dynamic extension of the language runtime.
- **Root Slots**: Support for top level dynamic placeholders
- **Static HTML Parser**: Add faster, static site parsing without a browser
- **`launch` Action**: Create an action to specifically launch Chrome

**Beyond**
- **Outputs**: Complex output sinks to databases, s3, kafka, etc.
- **DAGs**: Use directed acylic graphs to create complex crawling scenarios and parallel compute.  

**Beyond that?**
Thinking about it!

## Community
Checkout our [Community Repository](https://github.com/tadpolehq/community) to share your scrapers or find pre-built modules.
