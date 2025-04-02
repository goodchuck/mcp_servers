import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { URL } from 'url';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  LoggingMessageNotificationSchema,
  NotificationSchema,
  ProgressNotificationSchema,
  ServerNotificationSchema,
  ToolListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Protocol client that maintain 1:1 connection with servers
class MCPClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport | null = null;
  private isCompleted = false;

  constructor(serverName: string) {
    this.client = new Client({
      name: `mcp-client-for-${serverName}`,
      version: '1.0.0',
    });
  }

  async connectToServer(serverUrl: string) {
    const url = new URL(serverUrl);
    try {
      this.transport = new StreamableHTTPClientTransport(url);
      await this.client.connect(this.transport);
      console.log('Connected to server');

      this.setUpTransport();
    } catch (e) {
      console.log('Failed to connect to MCP server: ', e);
      throw e;
    }
  }

  private setUpTransport() {
    if (this.transport === null) {
      return;
    }
    this.transport.onclose = () => {
      console.log('SSE transport closed.');
      this.isCompleted = true;
    };

    this.transport.onerror = async (error) => {
      console.log('SSE transport error: ', error);
      await this.cleanup();
    };

    this.transport.onmessage = (message) => {
      console.log('message received: ', message);
    };
  }

  async waitForCompletion() {
    while (!this.isCompleted) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async cleanup() {
    await this.client.close();
  }
}

async function main() {
  const client = new MCPClient('sse-server');

  try {
    await client.connectToServer('http://localhost:5678/mcp');
    await client.waitForCompletion();
  } finally {
    await client.cleanup();
  }
}

main();
