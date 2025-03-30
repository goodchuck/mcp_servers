import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import * as clips from "./operations/clips.js";
import * as lives from "./operations/lives.js";
import * as home from "./operations/home.js";
import { config } from "dotenv";

config();

const server = new Server(
  {
    name: "Chzzk MCP Server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "test",
        description: "테스트 메시지를 반환하는 도구",
        inputSchema: zodToJsonSchema(
          z.object({
            message: z.string().describe("테스트 메시지"),
          })
        ),
        outputSchema: zodToJsonSchema(
          z.object({
            message: z.string().describe("테스트 메시지"),
          })
        ),
      },
      {
        name: "getChzzkClip",
        description: "채널 클립 검색 도구",
        inputSchema: zodToJsonSchema(clips.SearchClipSchema),
      },
      {
        name: "getChzzkPopularClip",
        description: "채널 인기 클립 검색 도구",
        inputSchema: zodToJsonSchema(clips.SearchPopularClipSchema),
      },
      {
        name: "getChzzkLives",
        description: "채널 인기 라이브 검색 도구",
        inputSchema: zodToJsonSchema(lives.SearchLiveSchema),
      },
      {
        name: "getChzzkVideos",
        description: "채널 인기 비디오 검색 도구",
        inputSchema: zodToJsonSchema(home.SearchVideoSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "test": {
        const msg = "테스트로 말해요";
        return {
          content: [{ type: "text", text: JSON.stringify(msg, null, 2) }],
        };
      }

      case "getChzzkClip": {
        const args = clips.SearchClipSchema.parse(request.params.arguments);
        const result = await clips.getChzzkClip({
          ...args,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "getChzzkPopularClip": {
        const args = clips.SearchPopularClipSchema.parse(
          request.params.arguments
        );
        const result = await clips.getChzzkPopularClip({
          ...args,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "getChzzkLives": {
        const args = lives.SearchLiveSchema.parse(request.params.arguments);
        const result = await lives.getChzzkLives({
          ...args,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "getChzzkVideos": {
        const args = home.SearchVideoSchema.parse(request.params.arguments);
        const result = await home.getChzzkVideos({
          ...args,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
