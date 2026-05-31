import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { fetchCurrent, fetchForecast, fetchAllSources, resolveLocation } from './router.js';
import { getSevenTimer } from './sources/seventimer.js';
const server = new Server({ name: 'weather-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'get_current_weather',
            description: 'Get current weather for any city using keyless APIs',
            inputSchema: {
                type: 'object',
                properties: {
                    location: { type: 'string', description: 'City name' },
                },
                required: ['location'],
            },
        },
        {
            name: 'get_forecast',
            description: 'Get up to 16-day weather forecast for any city',
            inputSchema: {
                type: 'object',
                properties: {
                    location: { type: 'string', description: 'City name' },
                    days: {
                        type: 'number',
                        description: 'Number of forecast days (1–16, default 7)',
                        minimum: 1,
                        maximum: 16,
                        default: 7,
                    },
                },
                required: ['location'],
            },
        },
        {
            name: 'compare_sources',
            description: 'Fetch current weather from all keyless sources and compare',
            inputSchema: {
                type: 'object',
                properties: {
                    location: { type: 'string', description: 'City name' },
                },
                required: ['location'],
            },
        },
        {
            name: 'get_precipitation_detail',
            description: 'Get detailed precipitation and cloud cover from 7Timer (next 24 hours)',
            inputSchema: {
                type: 'object',
                properties: {
                    location: { type: 'string', description: 'City name' },
                },
                required: ['location'],
            },
        },
    ],
}));
const CurrentWeatherArgs = z.object({ location: z.string() });
const ForecastArgs = z.object({ location: z.string(), days: z.number().min(1).max(16).default(7) });
const LocationArgs = z.object({ location: z.string() });
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'get_current_weather': {
            const { location } = CurrentWeatherArgs.parse(args);
            const result = await fetchCurrent(location);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        case 'get_forecast': {
            const { location, days } = ForecastArgs.parse(args);
            const result = await fetchForecast(location, days);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        case 'compare_sources': {
            const { location } = LocationArgs.parse(args);
            const { openmeteo, wttr, seventimer } = await fetchAllSources(location);
            const payload = {
                open_meteo: openmeteo.status === 'fulfilled' ? openmeteo.value : { error: openmeteo.reason?.message },
                wttr_in: wttr.status === 'fulfilled' ? wttr.value : { error: wttr.reason?.message },
                seven_timer_next_24h: seventimer.status === 'fulfilled' ? seventimer.value : { error: seventimer.reason?.message },
            };
            return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
        }
        case 'get_precipitation_detail': {
            const { location } = LocationArgs.parse(args);
            const geo = await resolveLocation(location);
            const points = await getSevenTimer(geo.lat, geo.lon);
            return { content: [{ type: 'text', text: JSON.stringify(points, null, 2) }] };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Weather MCP server running');
