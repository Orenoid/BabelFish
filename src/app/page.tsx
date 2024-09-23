"use client"
import { Chat } from "./chat/components/chat";
import { ChatSelectionList, NewChat } from "./chat/components/chatList";
import { AddNewChat, LoadChatByIDFromLocalStorage, LoadChatSelectionListFromLocalStorage } from "./chat/lib/chat";
import { useAppSelector } from "./hooks";

export default function Home() {

  const chatSelectionList = useAppSelector((state) => state.chatSelectionList)
  const chatSelected = chatSelectionList.currentChatID !== undefined

  return (
    <div className="flex flex-row h-full">
      {/* sidebar */}
      <div className="flex flex-col border-r w-[250px]">
        <ChatSelectionList className="ml-4 mt-12 flex-1 overflow-y-auto" chatSelectionListLoader={LoadChatSelectionListFromLocalStorage}/>
        <NewChat className="ml-4 mb-12" addNewChat2={AddNewChat}/>
      </div>
      {/* chat */}
      {chatSelected && <div className="flex flex-col h-full w-full mt-12">
        <Chat chatID={chatSelectionList.currentChatID as string} className="h-full w-full" loadChatByID={LoadChatByIDFromLocalStorage} />
      </div>}
    </div>
  );
}
