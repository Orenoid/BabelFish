"use client";

import { useEffect, useState } from "react";
import { AddMesssageInChat, ChatLoader, type Message } from "../lib/chat"; // Changed to type-only import
import { MdGTranslate } from "react-icons/md";
import { chatCompletion, translateMessage } from "../lib/chat-server";

export function Chat({ chatID, loadChatByID, className = "" }: {
    chatID: string,
    loadChatByID: ChatLoader
    className?: string;
}) {
    const [messageList, setMessageList] = useState<Message[]>([]);

    useEffect(() => {
        const messageList = loadChatByID(chatID)
        setMessageList(messageList)
    }, [chatID, loadChatByID])

    async function addMesssage({ content, role = "user" }: { content: string, role?: string }) {
        setMessageList(prev => [...prev, { role, content }]);
        AddMesssageInChat(chatID, { role, content })
        const answer = await chatCompletion(messageList)
        AddMesssageInChat(chatID, { role: "assistant", content: answer })
        setMessageList(prev => [...prev, { role: "assistant", content: answer }]);
    }

    return <div className={`flex flex-col flex-grow items-center ${className}`}>
        {/* <MessageList className="flex-grow overflow-y-auto" messageList={messageList} /> */}
        <MessageList className="flex-initial overflow-auto w-4/5 h-full" messageList={messageList} />
        {/* <MessageInput className="bottom-0" addMesssage={addMesssage} /> */}
        <MessageInput className="w-4/5" addMesssage={addMesssage} messageList={messageList} />
    </div>
}

export interface MessageProps {
    role: string;
    content: string;
    className?: string;
}

interface MessageListProps {
    messageList: { role: string; content: string; }[];
    className?: string;
}

export function MessageList({ messageList, className }: MessageListProps) {
    return <div className={`flex flex-col pb-5 ${className}`}>
        {messageList.map((message, index) => (
            <Message key={index} role={message.role} content={message.content}
                className={"mb-5"} />
        ))}
    </div>
}


export function Message({ role, content, className }: MessageProps) {
    return <>
        <div className={`flex flex-col ${className}`}>
            <Role className="mb-2" name={role} />
            <MessageContent content={content} />
        </div>
    </>
}

export interface RoleProps {
    name: string;
    className?: string;
    avatarUrl?: string;
}

export function Role({ name, className }: RoleProps) {
    return (
        <div className={`flex items-center p-1 ${className}`}>
            <span className="font-semibold">{name}</span>
        </div>
    );
}

export interface MessageContentProps {
    content: string;
    className?: string;
}

export function MessageContent({ content, className = "" }: MessageContentProps) {
    return (
        <div className={`bg-[#F6F5F5] rounded-lg w-fit max-w-[80%] p-2 ${className}`}>
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </div>
    );
}


export function MessageInput({ messageList, addMesssage, className = "", customNode }: {
    messageList: Message[],
    addMesssage: (message: { content: string, role?: string }) => void,
    className?: string,
    customNode?: React.ReactNode,
}) {
    const [messageContent, setMessageContent] = useState("");

    function handleSend() {
        if (messageContent.trim() === "") return;
        addMesssage({ content: messageContent });
        setMessageContent("");
    }

    async function translateInput(targetLanguage: string = "English", includeHistory: boolean = true, historyMessageCount: number | undefined = undefined) {
        const historyContext = includeHistory ?
            messageList.slice(-(historyMessageCount ?? messageList.length)).map(message => `[START]${message.role}: ${message.content}[END]`).join('\n') : ""
        const translatePrompt = `${includeHistory ? `This is an ongoing conversation:
        """
        ${historyContext}
        """` : ""}
        This is a message the user is about to send in conversation:
        """
        ${messageContent}
        """
        Please translate this message into ${targetLanguage}, considering the context of the conversation, and return it in JSON format, while preserving the user's line breaks and formatting:
        {
            "translated": "..."
        }`
        const translatedText = await translateMessage({ role: 'user', content: translatePrompt })
        setMessageContent(translatedText);

    }

    return <div className={`flex flex-col border-t pt-4 pb-2 px-4 ${className}`}>
        {/* icons */}
        <div className="flex flex-row px-4 mb-2">
            {customNode}
            <button onClick={() => { translateInput("English", false) }} title="Translate"><MdGTranslate /></button>
        </div>
        <textarea
            className="flex-1 p-4 resize-none focus:outline-none"
            placeholder={`Type your message here...\n\nPress Enter to send, Shift+Enter to add a new line`}
            value={messageContent} onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    translateInput("English", false);
                }
            }} rows={4} />
    </div >
}
