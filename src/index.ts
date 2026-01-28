import { FastMCP } from "fastmcp";
import pmxt from "pmxtjs";
import { z } from "zod";
import { envConfig } from "./lib/env";

const poly = new pmxt.Polymarket();
const kalshi = new pmxt.Kalshi();
const server = new FastMCP({
	name: "Prediction Markets MCP",
	version: "1.0.0",
});
server.addTool({
	name: "getMarkets",
	description: "Get the list of markets from Polymarket or Kalshi",
	parameters: z.object({
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
	execute: async (args) => {
		if (args.source === "all") {
			const groupOfMarkets = await Promise.all([
				poly.fetchMarkets({ limit: args.limit, offset: args.offset, searchIn: "both" }),
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
			return JSON.stringify(formattedData);
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
			return JSON.stringify(formattedData);
		}
	},
});
server.addTool({
	name: "searchMarkets",
	description: "Search for markets from Polymarket or Kalshi",
	parameters: z.object({
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
	execute: async (args) => {
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
			return JSON.stringify(formattedData);
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
			return JSON.stringify(formattedData);
		}
	},
});
server.start({
	transportType: "httpStream",
	httpStream: {
		port: envConfig.PORT,
		stateless: true,
		host: "0.0.0.0",
		enableJsonResponse: true,
	},
});
