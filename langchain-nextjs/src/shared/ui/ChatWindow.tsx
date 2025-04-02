'use client';
import { type Message } from 'ai';
import { useChat } from 'ai/react';
import { FormEvent, ReactNode, useState } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { cn } from '../utils/cn';
import { Checkbox } from './checkbox';
import ChatMessages from './chat-messages';
import ChatInput from './chat-input';
import Sidebar from '@/src/widgets/sidebar';

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <button className={props.className} onClick={() => scrollToBottom()}>
      <span>Scroll to bottom</span>
    </button>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  // scrollRef will also switch between overflow: unset to overflow: auto
  return (
    <div
      ref={context.scrollRef}
      className={cn('grid grid-rows-[1fr,auto]', props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ChatLayout(props: { content: ReactNode; footer: ReactNode }) {
  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={props.content}
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
            {props.footer}
          </div>
        }
      />
    </StickToBottom>
  );
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
  showIngestForm?: boolean;
  showIntermediateStepsToggle?: boolean;
}) {
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(
    !!props.showIntermediateStepsToggle,
  );

  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

  const chat = useChat({
    api: props.endpoint,
    onResponse(response) {
      const sourcesHeader = response.headers.get('x-sources');
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, 'base64').toString('utf-8'))
        : [];

      const messageIndexHeader = response.headers.get('x-message-index');
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    streamMode: 'text',
    onError: (e) => {
      console.error(e);
      //       toast.error(`Error while processing your request`, {
      //   description: e.message,
      // }),
    },
  });

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 1. 로딩 상태 체크
    if (chat.isLoading || intermediateStepsLoading) return;

    // 2. 중간 단계 표시 여부에 따른 분기
    if (!showIntermediateSteps) {
      chat.handleSubmit(e);
      return;
    }

    // 3. 중간 단계 표시 모드일 때의 처리
    setIntermediateStepsLoading(true);

    // 4. 사용자 메시지 추가
    chat.setInput('');
    const messagesWithUserReply = chat.messages.concat({
      id: chat.messages.length.toString(),
      content: chat.input,
      role: 'user',
    });
    chat.setMessages(messagesWithUserReply);

    // 5. API 요청
    const response = await fetch(props.endpoint, {
      method: 'POST',
      body: JSON.stringify({
        messages: messagesWithUserReply,
        show_intermediate_steps: true,
      }),
    });
    const json = await response.json();
    setIntermediateStepsLoading(false);

    // 6. 에러 처리
    if (!response.ok) {
      console.error(json.error);
      return;
    }

    // 7. 응답 메시지 처리
    const responseMessages: Message[] = json.messages;

    // 8. 도구 호출 메시지 필터링
    const toolCallMessages = responseMessages.filter(
      (responseMessage: Message) => {
        return (
          (responseMessage.role === 'assistant' &&
            !!responseMessage.tool_calls?.length) ||
          responseMessage.role === 'tool'
        );
      },
    );

    // 9. 중간 단계 메시지 생성
    const intermediateStepMessages = [];
    for (let i = 0; i < toolCallMessages.length; i += 2) {
      const aiMessage = toolCallMessages[i];
      const toolMessage = toolCallMessages[i + 1];

      intermediateStepMessages.push({
        id: (messagesWithUserReply.length + i / 2).toString(),
        role: 'system' as const,
        content: JSON.stringify({
          action: aiMessage.tool_calls?.[0],
          observation: toolMessage.content,
        }),
      });
    }

    // 10. 순차적 메시지 표시
    const newMessages = messagesWithUserReply;
    for (const message of intermediateStepMessages) {
      newMessages.push(message);
      chat.setMessages([...newMessages]);
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000),
      );
    }

    // 11. 최종 응답 메시지 추가
    chat.setMessages([
      ...newMessages,
      {
        id: newMessages.length.toString(),
        content: responseMessages[responseMessages.length - 1].content,
        role: 'assistant',
      },
    ]);
  }

  return (
    <div className="flex gap-[8px]">
      <Sidebar />
      <div className="relative flex-1">
        <ChatLayout
          content={
            chat.messages.length === 0 ? (
              <div>{props.emptyStateComponent}</div>
            ) : (
              <ChatMessages
                aiEmoji={props.emoji}
                messages={chat.messages}
                emptyStateComponent={props.emptyStateComponent}
                sourcesForMessages={sourcesForMessages}
              />
            )
          }
          footer={
            <ChatInput
              value={chat.input}
              onChange={chat.handleInputChange}
              onSubmit={sendMessage}
              loading={chat.isLoading || intermediateStepsLoading}
              placeHolder={
                props.placeholder ?? "What's it like to be a pirate?"
              }
            >
              {props.showIngestForm && (
                <></>
                //   <Dialog>
                //   <DialogTrigger asChild>
                //     <Button
                //       variant="ghost"
                //       className="pl-2 pr-3 -ml-2"
                //       disabled={chat.messages.length !== 0}
                //     >
                //       <Paperclip className="size-4" />
                //       <span>Upload document</span>
                //     </Button>
                //   </DialogTrigger>
                //   <DialogContent>
                //     <DialogHeader>
                //       <DialogTitle>Upload document</DialogTitle>
                //       <DialogDescription>
                //         Upload a document to use for the chat.
                //       </DialogDescription>
                //     </DialogHeader>
                //     <UploadDocumentsForm />
                //   </DialogContent>
                // </Dialog>
              )}
              {props.showIntermediateStepsToggle && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show_intermediate_steps"
                    name="show_intermediate_steps"
                    checked={showIntermediateSteps}
                    disabled={chat.isLoading || intermediateStepsLoading}
                    onCheckedChange={(e) => setShowIntermediateSteps(!!e)}
                  />
                  <label htmlFor="show_intermediate_steps" className="text-sm">
                    Show intermediate steps
                  </label>
                </div>
              )}
            </ChatInput>
          }
        ></ChatLayout>
      </div>
    </div>
  );
}
