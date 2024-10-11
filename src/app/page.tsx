"use client"
import { Chat } from "./chat/components/chat";
import { ChatSelectionList, NewChat } from "./chat/components/chatList";
import { AddNewChat, LoadChatByIDFromLocalStorage, LoadChatSelectionListFromLocalStorage } from "./chat/lib/chat";
import { useAppSelector } from "./hooks";

export default function Home() {

  const chatSelectionList = useAppSelector((state) => state.chatSelectionList)
  const chatSelected = chatSelectionList.currentChatID !== undefined

  return (
    <div className="flex flex-row h-full w-full">
      {/* sidebar */}
      <div className="flex px-2 pb-12 flex-col w-[250px] bg-[#F9F9F9]">
        <ChatSelectionList className="mt-12 flex-1 overflow-y-auto w-[250px]"
          chatSelectionListLoader={LoadChatSelectionListFromLocalStorage} />
        <NewChat addNewChat={AddNewChat} />
      </div>
      {/* content */}
      {/* can't figure out why using mt-12 here stretches the page height, 
          while the mt-12 on ChatSelectionList does not... */}
      <div className="pt-12 w-full">
        {chatSelected && <Chat className="h-full w-full" chatID={chatSelectionList.currentChatID as string}
          loadChatByID={LoadChatByIDFromLocalStorage} />}
      </div>
    </div>
  );
}
