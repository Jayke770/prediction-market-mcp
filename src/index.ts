import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from 'cors'
import express from "express";
import pmxt from "pmxtjs";
import { z } from "zod";
import { envConfig } from "./lib/env";

const poly = new pmxt.Polymarket();
const kalshi = new pmxt.Kalshi();
const server = new McpServer({
	name: "Prediction Markets MCP",
	version: "1.0.0",
});
server.registerTool(
	"getMarkets",
	{
		description: "Get the list of markets from Polymarket or Kalshi",
		inputSchema: z.object({
			limit: z
				.number()
				.optional()
				.default(10)
				.describe("Number of markets to fetch"),
			offset: z
				.number()
				.optional()
				.default(0)
				.describe("Number of markets to skip"),
			source: z
				.enum(["polymarket", "kalshi", "all"])
				.optional()
				.default("all")
				.describe("Source of the markets"),
		}),
	},
	async (args) => {
		if (args.source === "all") {
			const groupOfMarkets = await Promise.all([
				poly.fetchMarkets({
					limit: args.limit,
					offset: args.offset,
					searchIn: "both",
				}),
				kalshi.fetchMarkets({
					limit: args.limit,
					offset: args.offset,
				}),
			]);
			const markets = groupOfMarkets.flat();
			const formattedData = markets.map((market) => ({
				question: market.title,
				liquidity: `$${Number(market.liquidity || 0).toLocaleString()}`,
				icon: market.image ?? "",
				volume24hr: `$${Number(market.volume24h || 0).toLocaleString()}`,
				marketLink: market.url,
				resolutionDate: market.resolutionDate
					? new Date(market.resolutionDate)
					: undefined,
			}));
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(formattedData),
					},
				],
			};
		} else {
			const markets =
				args.source === "polymarket"
					? await poly.fetchMarkets({
							limit: args.limit,
							offset: args.offset,
							searchIn: "both",
						})
					: await kalshi.fetchMarkets({
							limit: args.limit,
							offset: args.offset,
							searchIn: "both",
						});
			const formattedData = markets.map((market) => ({
				question: market.title,
				liquidity: `$${Number(market.liquidity || 0).toLocaleString()}`,
				icon: market.image ?? "",
				volume24hr: `$${Number(market.volume24h || 0).toLocaleString()}`,
				marketLink: market.url,
				resolutionDate: market.resolutionDate
					? new Date(market.resolutionDate)
					: undefined,
			}));
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(formattedData),
					},
				],
			};
		}
	},
);
server.registerTool(
	"searchMarkets",
	{
		description: "Search for markets from Polymarket or Kalshi",
		inputSchema: z.object({
			query: z.string().describe("Query to search for"),
			limit: z
				.number()
				.optional()
				.default(10)
				.describe("Number of markets to fetch"),
			offset: z
				.number()
				.optional()
				.default(0)
				.describe("Number of markets to skip"),
			source: z
				.enum(["polymarket", "kalshi", "all"])
				.optional()
				.default("all")
				.describe("Source of the markets"),
		}),
	},
	async (args) => {
		if (args.source === "all") {
			const groupOfMarkets = await Promise.all([
				poly.searchMarkets(args.query, {
					limit: args.limit,
					offset: args.offset,
				}),
				kalshi.searchMarkets(args.query, {
					limit: args.limit,
					offset: args.offset,
				}),
			]);
			const markets = groupOfMarkets.flat();
			const formattedData = markets.map((market) => ({
				question: market.title,
				liquidity: `$${Number(market.liquidity || 0).toLocaleString()}`,
				icon: market.image ?? "",
				volume24hr: `$${Number(market.volume24h || 0).toLocaleString()}`,
				marketLink: market.url,
				resolutionDate: market.resolutionDate
					? new Date(market.resolutionDate)
					: undefined,
			}));
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(formattedData),
					},
				],
			};
		} else {
			const markets =
				args.source === "polymarket"
					? await poly.searchMarkets(args.query, {
							limit: args.limit,
							offset: args.offset,
						})
					: await kalshi.searchMarkets(args.query, {
							limit: args.limit,
							offset: args.offset,
						});
			const formattedData = markets.map((market) => ({
				question: market.title,
				liquidity: `$${Number(market.liquidity || 0).toLocaleString()}`,
				icon: market.image ?? "",
				volume24hr: `$${Number(market.volume24h || 0).toLocaleString()}`,
				marketLink: market.url,
				resolutionDate: market.resolutionDate
					? new Date(market.resolutionDate)
					: undefined,
			}));
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(formattedData),
					},
				],
			};
		}
	},
);

const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());
expressApp.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
expressApp.listen(envConfig.PORT, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`Server listening on http://localhost:${envConfig.PORT}/mcp`);
});
