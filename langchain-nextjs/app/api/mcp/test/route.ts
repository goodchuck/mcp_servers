import { NextRequest, NextResponse } from 'next/server';
// import { ChatOpenAI } from '@langchain/openai';
// import { MemorySaver } from '@langchain/langgraph';
// import { HumanMessage, SystemMessage } from '@langchain/core/messages';
// import { createReactAgent } from '@langchain/langgraph/prebuilt';
// import { postMessage } from '@/shared/slack/api/post-message';
// import { AnyBlock } from '@slack/web-api';
// import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import {
  experimental_createMCPClient as createMCPClient,
  generateText,
} from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import { openai } from '@ai-sdk/openai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const AGENT_SYSTEM_TEMPLATE = `당신은 비즈니스 영어 교육 전문가입니다. 다음과 같은 방식으로 영어 학습 내용을 제공해주세요:

1. 매일 다른 주제의 비즈니스 영어 표현을 선택하여 설명합니다 (회의, 이메일, 프레젠테이션, 협상 등)
2. 각 표현마다 다음 내용을 포함합니다:
   - 표현/단어/숙어 (영어)
   - 한국어 의미
   - 실제 사용 예시 (비즈니스 상황)
   - 유의어/반의어 (있는 경우)
3. 최소 3개에서 최대 5개의 표현을 선택하여 설명합니다
4. 설명은 간단명료하게 하되, 실용적인 예시를 반드시 포함합니다
5. 모든 설명은 한국어로 제공합니다
6. 예시문장의 경우 한글어로 번역을해줍니다
7. 이모지를 사용해서 더 쉽게 이해할 수 있도록 합니다

slack 메시지 형식으로 정리된 모습으로 제공합니다
오늘의 비즈니스 영어 학습 내용을 제공해주세요.`;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  // let client: MultiServerMCPClient | null = null;

  //@ts-ignore
  let mcpClient: MCPClient | undefined;

  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  const teamId = process.env.TEAM_ID;
  try {
    // mcpClient = await createMCPClient({
    //   transport: new StdioMCPTransport({
    //     command: 'npx',
    //     args: ['-y', '@smithery/cli@latest', 'run', '@smithery-ai/slack', '--config', `"{\\"slackTeamId\\":\\"${teamId}\\",\\"slackBotToken\\":\\"${slackBotToken}\\"}"`],
    //   }),
    // });
    console.log('slackBotToken', slackBotToken);
    console.log('teamId', teamId);
    // mcpClient = await createMCPClient({
    //   transport: new StdioMCPTransport({
    //     command: 'npx',
    //     args: ['-y', '@modelcontextprotocol/server-slack'],
    //     env: {
    //       SLACK_BOT_TOKEN: slackBotToken!,
    //       SLACK_TEAM_ID: teamId!,
    //     },
    //   }),
    // });

    mcpClient = await createMCPClient({
      transport: new StreamableHTTPClientTransport(
        new URL('http://localhost:5678/mcp'),
      ),
    });

    // const body = await req.json();

    // client = new MultiServerMCPClient({
    //   slack: {
    //     transport: 'stdio',
    //     command: 'npx',
    //     args: ['-y', '@smithery/cli@latest', 'run', '@smithery-ai/slack', '--config', `"{\\"slackTeamId\\":\\"${teamId}\\",\\"slackBotToken\\":\\"${slackBotToken}\\"}"`],
    //   },
    // });

    // await client.initializeConnections();
    // console.log('Connected to servers from multiple servers configuration');

    // const mcpTools = client.getTools();
    // if (mcpTools.length === 0) {
    //   throw new Error('No tools found');
    // }

    // console.log(`Loaded ${mcpTools.length} MCP tools: ${mcpTools.map((tool) => tool.name).join(', ')}`);
    const tools = await mcpClient.tools();
    console.log('tools', tools);
    // const chat = new ChatOpenAI({
    //   model: 'gpt-4o-mini',
    //   temperature: 0,
    // });
    // Initialize memory to persist state between graph runs
    // const agentCheckpointer = new MemorySaver();

    // const agent = createReactAgent({
    //   llm: chat,
    //   // tools: mcpTools,
    //   tools: tools,
    //   // checkpointSaver: agentCheckpointer,
    //   messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
    // });

    // const message = `
    // channelId: C08N9V57A8H에
    // slack mcp를 활용하여 메인메시지로 이쁘게 모습을 포장하여 오늘의 비즈니스 영어 표현들을 알려주세요.`;
    // const messages = [new HumanMessage(message)];
    // const result = await agent.invoke(
    //   {
    //     messages,
    //   },
    //   // { configurable: { thread_id: '42' } },
    // );

    // console.log('result', result.messages[result.messages.length - 1]?.content);

    const response = await generateText({
      model: openai('gpt-4o-mini'),
      tools,
      messages: [
        {
          role: 'system',
          content: AGENT_SYSTEM_TEMPLATE,
        },
        {
          role: 'user',
          content: `channelId: C08N9V57A8H에
    slack mcp를 활용하여 메인메시지로 이쁘게 모습을 포장하여 오늘의 비즈니스 영어 표현들을 알려주세요.`,
        },
      ],
    });

    return NextResponse.json({ response }, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to fetch videos', details: e.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch videos', details: String(e) },
      { status: 500 },
    );
  } finally {
    await mcpClient?.close();
  }
}
