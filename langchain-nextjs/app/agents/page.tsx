import { ChatWindow } from "@/src/shared/ui/ChatWindow";



export default function AgentsPage() {
  const InfoCard = (
    <div>안녕하세요</div>
  );

  return (
    <ChatWindow
      endpoint="api/chat/agents"
      emptyStateComponent={InfoCard}
      placeholder="Squawk! I'm a conversational agent! Ask me about the current weather in Honolulu!"
      emoji="🦜"
      showIntermediateStepsToggle={true}
    />
  );
}
