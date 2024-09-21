"use client";

import { useState } from "react";

interface Message {
    role: string;
    content: string;
}

export function Chat({ }: {
    className?: string;
}) {
    const defaultMessageList: Message[] = [
        { role: "system", content: "You're a helpful assistant." },
    ];
    const [messageList, setMessageList] = useState<Message[]>(defaultMessageList);

    async function addMesssage({ content, role = "user" }: { content: string, role?: string }) {
        setMessageList(prev => [...prev, { role, content }]);
        const response = await fetch("https://chat.orenoid.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role, content },
                ],
            }),
        });
        const data = await response.json();
        console.log(data);
        setMessageList(prev => [...prev, { role: "assistant", content: data.choices[0].message.content }]);
    }

    return <div className="w-1/2">
        <MessageList className="mb-10" messageList={messageList} />
        <MessageInput addMesssage={addMesssage} />
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
    return <div className={`flex flex-col ${className}`}>
        {messageList.map((message, index) => (
            <Message key={index} role={message.role} content={message.content}
                // TODO 改成 not last child
                className={index < messageList.length - 1 ? "mb-5" : ""} />
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
    console.log(content);
    return (
        <div className={`bg-gray-200 rounded-lg w-fit max-w-[80%] p-2 ${className}`}>
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </div>
    );
}


export function MessageInput({ addMesssage, className = "" }: {
    addMesssage: (message: { content: string, role?: string }) => void,
    className?: string;
}) {
    const [messageContent, setMessageContent] = useState("");

    function handleSend() {
        addMesssage({ content: messageContent });
        setMessageContent("");
    }

    return <div className={`flex flex-row ${className}`}>
        <textarea
            className="flex-1"
            placeholder="Type the message content here..."
            value={messageContent} onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent default behavior of Enter key
                    handleSend();
                }
            }} rows={4} />
        <button onClick={handleSend}>Send</button>
    </div>
}
