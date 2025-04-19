import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

import * as clips from "../operations/clips.js";
import * as lives from "../operations/lives.js";
import * as home from "../operations/home.js";
import zodToJsonSchema from "zod-to-json-schema";
import { LiveSortTypeSchema } from "../operations/lives.js";

// const server = new McpServer({
//   name: "Chzzk MCP",
//   version: "1.0.0"
// });

// Create an MCP server
const server = new McpServer({
  name: "chzzk-sse",
  version: "1.0.0"
});

// Add an addition tool
server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

server.tool("getChzzkClip",
  { 
    chzzkChannelId: z.string().describe("chzzk channel Id"),
    size: z.number().describe("검색할 클립 수"),
    filterType: z.string().describe("필터 타입"),
    orderType: z.enum(["RECENT", "POPULAR"]).describe("정렬 타입"),
  },
  async (request) => {
    const args = clips.SearchClipSchema.parse(request);
    const result = await clips.getChzzkClip({
      ...args,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool("getChzzkLives",
  {
    size: z.number().describe("검색할 라이브 수"),
    sortType: LiveSortTypeSchema.describe("정렬 타입"),
  },
  async (request) => {
    const args = lives.SearchLiveSchema.parse(request);
    const result = await lives.getChzzkLives({ ...args });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);


const app = express();
app.use(express.json());

const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // set to undefined for stateless servers
});

// Setup routes for the server
const setupServer = async () => {
  await server.connect(transport);
};

app.post('/mcp', async (req, res) => {
  console.log('Received MCP request:', req.body);
  try {
      await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', async (req, res) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

app.delete('/mcp', async (req, res) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

// Start the server
const PORT = 5678;
setupServer().then(() => {
  app.listen(PORT, () => {
    console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to set up the server:', error);
  process.exit(1);
});
