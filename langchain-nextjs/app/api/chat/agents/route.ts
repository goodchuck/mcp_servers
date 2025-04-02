import { NextRequest, NextResponse } from 'next/server';
import { Message as VercelChatMessage, StreamingTextResponse } from 'ai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatAnthropic } from '@langchain/anthropic';
// import fs from 'fs';
// import path from 'path';
import { loadMcpTools, MultiServerMCPClient } from '@langchain/mcp-adapters';
import { MCPClient } from '@/src/shared/lib/client';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
// Path for our multiple servers config file
// const multipleServersConfigPath = path.join(
//   process.cwd(),
//   'examples',
//   'multiple_servers_config.json',
// );
// console.log(multipleServersConfigPath);
// /**
//  * Create a configuration file for multiple MCP servers
//  */
// function createMultipleServersConfigFile() {
//   const configContent = {
//     servers: {
//       // Firecrawl server configuration
//       // firecrawl: {
//       //   transport: "stdio",
//       //   command: "npx",
//       //   args: ["-y", "firecrawl-mcp"],
//       //   env: {
//       //     FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || "",
//       //     FIRECRAWL_RETRY_MAX_ATTEMPTS: "3",
//       //   },
//       // },
//       // Math server configuration
//       // math: {
//       //   transport: "stdio",
//       //   command: "python",
//       //   args: [path.join(process.cwd(), "examples", "math_server.py")],
//       // },
//       chzzk: {
//         transport: 'stdio',
//         command: 'node',
//         args: ['/Users/yang/coding/mcp_servers/chzzk/dist/index.js'],
//       },
//     },
//   };

//   fs.writeFileSync(
//     multipleServersConfigPath,
//     JSON.stringify(configContent, null, 2),
//   );
//   console.log(
//     `Created multiple servers configuration file at ${multipleServersConfigPath}`,
//   );
// }

// export const runtime = 'edge';

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === 'user') {
    return new HumanMessage(message.content);
  } else if (message.role === 'assistant') {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === 'human') {
    return { content: message.content, role: 'user' };
  } else if (message._getType() === 'ai') {
    return {
      content: message.content,
      role: 'assistant',
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

const AGENT_SYSTEM_TEMPLATE = `당신은 착한 agent입니다`;

export async function POST(req: NextRequest) {
  let client: MCPClient | null = null;
  try {
    console.log(
      'Initializing MCP client from multiple servers configuration file...',
    );

    // Initialize the client
    const client = new Client({
      name: 'chzzk-sse-mcp',
      version: '1.0.0',
    });

    await client.connect(
      new StreamableHTTPClientTransport(
        new URL('https://mcp-servers-tau.vercel.app/mcp'),
      ),
    );

    console.log('Connected to servers from multiple servers configuration');

    const tools = await loadMcpTools('chzzk', client);
    // const mcpTools = client.getTools();

    // if (mcpTools.length === 0) {
    //   throw new Error('No tools found');
    // }

    // console.log(
    //   `Loaded ${mcpTools.length} MCP tools: ${mcpTools
    //     .map((tool) => tool.name)
    //     .join(', ')}`,
    // );

    const body = await req.json();
    const returnIntermediateSteps = body.show_intermediate_steps;

    const messages = (body.messages ?? [])
      .filter(
        (message: VercelChatMessage) =>
          message.role === 'user' || message.role === 'assistant',
      )
      .map(convertVercelMessageToLangChainMessage);

    const chat = new ChatAnthropic({
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0,
    });

    const agent = createReactAgent({
      llm: chat,
      tools: tools,
      messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
    });

    const result = await agent.invoke({ messages });
    await client.close();
    return NextResponse.json(
      {
        messages: result.messages.map(convertLangChainMessageToVercelMessage),
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
