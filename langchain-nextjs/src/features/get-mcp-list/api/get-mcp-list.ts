'use server';

import { Connection, MultiServerMCPClient } from '@langchain/mcp-adapters';

export async function getMcpList() {
  let client: MultiServerMCPClient | null = null;
  try {
    const multipleServersConfig: Record<string, Connection> = {};
    console.log(
      'Initializing MCP client from multiple servers configuration...',
    );
    client = new MultiServerMCPClient({
      ...multipleServersConfig,
    });
    console.log('Connected to servers from multiple servers configuration');

    await client.initializeConnections();
    const mcpTools = await client.getTools();

    if (mcpTools.length === 0) {
      throw new Error('No tools found');
    }

    console.log('original mcpTools', mcpTools);
    console.log(
      `Loaded ${mcpTools.length} MCP tools: ${mcpTools
        .map((tool) => tool.name)
        .join(', ')}`,
    );

    return mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
  } catch (error) {
    console.error('Error in getMcpList:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}
