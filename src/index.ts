#!/usr/bin/env node
/**
 * areacode-mcp — North American (NANP) area-code & phone-number intelligence
 * for AI agents. A thin MCP server over the areacode.fyi public API
 * (https://areacode.fyi/api/v1). Every result carries a canonical areacode.fyi
 * URL + the NANPA source date.
 *
 * Scope: area-code-level reference + education. It does NOT return a caller's
 * identity, exact location, or live/ported carrier — and caller ID can be
 * spoofed, so a number's area code never proves who is calling.
 *
 * Config: set AREACODE_API_BASE to point at a different host (default
 * https://areacode.fyi).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE =
  (process.env.AREACODE_API_BASE || "https://areacode.fyi").replace(/\/+$/, "") + "/api/v1";

const enc = encodeURIComponent;

/** Fetch an API path and return it as an MCP tool result (raw JSON text). */
async function api(path: string) {
  try {
    const res = await fetch(API_BASE + path, {
      headers: { accept: "application/json", "user-agent": "areacode-mcp" },
    });
    const text = await res.text();
    return { content: [{ type: "text" as const, text }], isError: !res.ok };
  } catch (e) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: `Request to ${API_BASE} failed: ${(e as Error).message}` }),
        },
      ],
      isError: true,
    };
  }
}

const server = new McpServer({ name: "areacode-mcp", version: "0.1.0" });

server.registerTool(
  "lookup_area_code",
  {
    title: "Look up an area code",
    description:
      "Look up a North American (NANP) area code: country, state/province, principal city and served cities, time zone, current local time, 10-digit-dialing flag, overlay codes, and nearby codes. Returns a canonical areacode.fyi URL and the NANPA source date.",
    inputSchema: { code: z.string().describe('A 3-digit area code, e.g. "702".') },
  },
  ({ code }) => api(`/area-code/${enc(code)}`),
);

server.registerTool(
  "lookup_phone_number",
  {
    title: "Look up a phone number",
    description:
      "Parse and validate a US/Canada (NANP) phone number. Returns whether the format is valid, the E.164 form, the area code, the likely region and time zone, and the current local time there. Area-code level only — NOT the caller's identity, exact location, or live carrier; caller ID can be spoofed.",
    inputSchema: { number: z.string().describe('A phone number in any format, e.g. "+1 702-555-0199".') },
  },
  ({ number }) => api(`/phone/${enc(number)}`),
);

server.registerTool(
  "lookup_carrier",
  {
    title: "Look up a number's carrier (assigned block)",
    description:
      "Look up the carrier, line type (wireless/landline), and rate center that a US/Canada number's NPA-NXX block was assigned to — covering nearly every active area code. Based on public block-allocation data, NOT a live lookup: if the number was ported the current carrier differs. Not for caller identity, fraud, or FCRA decisions.",
    inputSchema: { number: z.string().describe('A US/Canada phone number, e.g. "212-555-0143".') },
  },
  ({ number }) => api(`/carrier/${enc(number)}`),
);

server.registerTool(
  "area_codes_for_city",
  {
    title: "Area codes for a city",
    description:
      "List the area codes that serve a US or Canadian city. Optionally pass a state/province to disambiguate cities that share a name.",
    inputSchema: {
      city: z.string().describe('City name, e.g. "Las Vegas".'),
      state: z
        .string()
        .optional()
        .describe('Optional state/province name or 2-letter code to disambiguate, e.g. "NV".'),
    },
  },
  ({ city, state }) => api(`/area-codes?city=${enc(city)}${state ? `&state=${enc(state)}` : ""}`),
);

server.registerTool(
  "area_codes_for_state",
  {
    title: "Area codes for a state/province",
    description: "List every area code in a US state or Canadian province.",
    inputSchema: {
      state: z.string().describe('State/province name or 2-letter code, e.g. "Nevada" or "ON".'),
    },
  },
  ({ state }) => api(`/area-codes?state=${enc(state)}`),
);

server.registerTool(
  "is_scam_area_code",
  {
    title: "Is an area code a scam?",
    description:
      "Explain whether an area code is associated with scams. An area code is never a scam by itself; returns that context + spoofing notes, PLUS an aggregate of public FTC Do Not Call complaints about specific numbers shown with that code (how many flagged numbers, total complaints, top subjects, worst offenders).",
    inputSchema: { code: z.string().describe('A 3-digit area code, e.g. "702".') },
  },
  ({ code }) => api(`/scam/${enc(code)}`),
);

server.registerTool(
  "check_number_reputation",
  {
    title: "Check a number's community + FTC spam signal",
    description:
      "Spam signal for a US/Canada number from areacode.fyi: the UNVERIFIED crowd-sourced community signal ('low' = looked up, 'mid'/'high' = user reports) PLUS public FTC Do Not Call complaint data when present (complaint count, % robocalls, top subject, date range). Caller ID can be spoofed — none of this proves a number is currently fraudulent.",
    inputSchema: { number: z.string().describe('A US/Canada phone number, e.g. "702-555-0199".') },
  },
  ({ number }) => api(`/reputation/${enc(number)}`),
);

server.registerTool(
  "explain_area_code_topic",
  {
    title: "Explain a phone / area-code topic",
    description:
      "Source-backed explanation of a phone-numbering topic, suitable for answering end users.",
    inputSchema: {
      topic: z
        .enum([
          "neighbor_spoofing",
          "overlays",
          "toll_free",
          "country_code_vs_area_code",
          "temporary_phone_numbers",
        ])
        .describe("The topic to explain."),
    },
  },
  ({ topic }) => api(`/explain/${enc(topic)}`),
);

const transport = new StdioServerTransport();
await server.connect(transport);
