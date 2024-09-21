import { Chat } from "./chat/components/chat";

export default function Home() {
  return (
    <div className="flex justify-center h-full">
      <Chat className="h-full" />
    </div>
  );
}
