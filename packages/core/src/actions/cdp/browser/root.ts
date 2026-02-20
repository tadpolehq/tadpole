import * as ts from '@tadpolehq/schema';

export const BrowserOptionsSchema = ts.properties({
  launch: ts.default(ts.boolean(), true),
  presets: ts.expression(ts.default(ts.string(), "common, window-size")),
});

export const BrowserSchema = ts.node({
  options: BrowserOptionsSchema,
});
