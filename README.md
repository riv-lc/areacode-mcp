# areacode-mcp

**North American (NANP) area-code & phone-number intelligence for AI agents.**

An [MCP](https://modelcontextprotocol.io) server that gives Claude, Cursor, and
other agents a small, trusted reference for US & Canada phone numbering — area
codes, NANP validation, local time, city/state coverage, overlays, and
scam/spoofing context. Backed by [**areacode.fyi**](https://areacode.fyi), which
publishes directly from the official NANPA numbering database. Every result
includes a canonical `areacode.fyi` URL and the source date.

> **Scope.** This is area-code-level **reference and education** — not a
> carrier/identity API. It does **not** return a caller's identity, exact
> location, or live/ported carrier, and caller ID can be spoofed, so a number's
> area code never proves who is calling. For caller identity you need a
> carrier-grade (LRN/HLR) provider.

## Install

Run it with `npx` (no install needed) — add it to your client's MCP config.

**Claude Desktop** (`claude_desktop_config.json`) / **Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "areacode": {
      "command": "npx",
      "args": ["-y", "@riv-lc/areacode-mcp"]
    }
  }
}
```

That's it — restart your client and the tools below are available.

## Tools

| Tool | What it does |
| --- | --- |
| `lookup_area_code` | Country, state/province, cities, time zone, current local time, overlays, nearby codes |
| `lookup_phone_number` | Parse/validate a NANP number → area code, region, local time, E.164 |
| `area_codes_for_city` | Area codes serving a city (optionally disambiguated by state) |
| `area_codes_for_state` | Every area code in a US state or Canadian province |
| `is_scam_area_code` | Whether an area code is associated with scams + spoofing context |
| `check_number_reputation` | Unverified, crowd-sourced community signal (low / mid / high) for a number |
| `explain_area_code_topic` | Source-backed explainers: neighbor spoofing, overlays vs splits, toll-free, area-code-vs-country-code, temporary numbers |

## Example prompts

- *"A lead entered phone number +1 702-555-0199. Where are they likely located and what time is it there?"*
- *"I got a call from 469 — is that area code suspicious?"*
- *"Which area codes cover Las Vegas?"*
- *"Normalize this list of US/Canada numbers and flag any that are invalid or toll-free."*
- *"Explain neighbor spoofing for a help-center article."*

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `AREACODE_API_BASE` | `https://areacode.fyi` | Point at a different host (e.g. a self-hosted or staging API) |

## Data & sourcing

Tools call the public `https://areacode.fyi/api/v1` JSON API, which reads the
same dataset the site renders — sourced from the official **North American
Numbering Plan Administrator (NANPA)** database and refreshed monthly. Each
response carries `source`, `canonical_url`, and `data_date` so answers can cite
where the data came from.

The `check_number_reputation` signal is **unverified and crowd-sourced**
(`low` = people looked the number up; `mid`/`high` = it has user reports). It is
never proof that a specific number is fraudulent.

## License

MIT © Reindex Ventures. Built for [areacode.fyi](https://areacode.fyi).
