import { type Message } from 'ai';
import { ReactNode } from 'react';
import { IntermediateStep } from './intermediate-step';
import { ChatMessageBubble } from './chat-message-bubble';

export default function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  sourcesForMessages: Record<string, any>;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {props.messages.map((m, i) => {
        if (m.role === 'system') {
          return <IntermediateStep key={m.id} message={m} />;
        }

        const sourceKey = (props.messages.length - 1 - i).toString();
        console.log(sourceKey, props.sourcesForMessages, m);
        return (
          <ChatMessageBubble
            key={m.id}
            message={m}
            aiEmoji={props.aiEmoji}
            sources={props.sourcesForMessages[sourceKey]}
          />
        );
      })}
    </div>
  );
}
