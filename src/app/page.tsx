"use client"
import { useEffect, useState } from "react";
import { Chat } from "./chat/components/chat";
import { ChatSelectionList, NewChat } from "./chat/components/chatList";
import { AddNewChat, LoadChatByIDFromLocalStorage, LoadChatSelectionListFromLocalStorage, type Message } from "./chat/lib/chat";
import { useAppSelector } from "./hooks";

export default function Home() {

  const chatSelectionList = useAppSelector((state) => state.chatSelectionList)
  const chatSelected = chatSelectionList.currentChatID !== undefined
  const [messageList, setMessageList] = useState<Message[]>([])

  useEffect(()=>{
    if (chatSelectionList.currentChatID !== undefined) {
      const messageList = LoadChatByIDFromLocalStorage(chatSelectionList.currentChatID)
      setMessageList(messageList)
    }
  }, [chatSelectionList.currentChatID])

  return (
    <div className="flex flex-row h-full">
      {/* sidebar */}
      <div className="flex flex-col w-[160px]">
        <ChatSelectionList chatSelectionListLoader={LoadChatSelectionListFromLocalStorage}/>
        <NewChat addNewChat2={AddNewChat}/>
      </div>
      {/* chat */}
      {chatSelected && <div className="flex flex-col h-full w-full">
        <Chat chatID={chatSelectionList.currentChatID as string} className="h-full w-full" messageList={messageList} setMessageList={setMessageList} />
      </div>}
    </div>
  );
}
