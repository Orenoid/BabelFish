export function Chat() {
    return <div className="w-1/2">
        <MessageList className="mb-10" />
        {/* <MessageInput /> */}
    </div>
}

export interface SenderProps {
    name: string;
    className?: string;
    avatarUrl?: string;
}

export function Sender({ name, className }: SenderProps) {
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

export function MessageContent({ content, className }: MessageContentProps) {
    return (
        <div className={`message-content ${className} bg-gray-200 rounded-lg max-w-[80%] w-auto p-2`}>
            <p>{content}</p>
        </div>
    );
}


export interface MessageProps {
    sender: string;
    content: string;
    className?: string;
    // id: string;
    // timestamp: Date;
}

export function Message({ sender, content, className }: MessageProps) {
    return <>
        <div className={`flex flex-col ${className}`}>
            <Sender className="mb-2" name={sender} />
            <MessageContent content={content} />
        </div>
    </>
}

export function MessageList({ className }: { className?: string }) {
    const messageList = [
        { sender: "System", content: "Babel Fish activated." },
        { sender: "User", content: "Translate 'Hello, how are you?' to fish." },
        { sender: "Assistant", content: "Bloop bloop! I'm swimming!" },
        { sender: "User", content: "Can you tell me a joke?" },
        { sender: "Assistant", content: "What do you call a fish with no eyes? Fsh!" },
    ];
    return <div className={`flex flex-col ${className}`}>
        {messageList.map((message, index) => (
            <Message key={index} sender={message.sender} content={message.content} className={index < messageList.length - 1 ? "mb-5" : ""} />
        ))}
    </div>
}

export function MessageInput({ }: { className?: string }) {
    return <>
        <input type="text" placeholder="Type your message here..." />
        <button>Send</button>
    </>
}
