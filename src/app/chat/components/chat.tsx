"use client";

import { useEffect, useRef, useState } from "react";
import { AddMesssageInChat, ChatLoader, type Message } from "../lib/chat"; // Changed to type-only import
import { MdGTranslate } from "react-icons/md";
import { chatCompletion, reviseMessageAction } from "../lib/chat-server";
import { TbPencilQuestion, TbTextGrammar } from "react-icons/tb";
import { diffChars } from "diff";
import { PiKeyReturnBold } from "react-icons/pi";
import { FaBackspace } from "react-icons/fa";

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

// TODO consider where to put these types and functions

interface RevisionEntry {
    iconNode: React.ReactNode;
    userInstruction: string;
    // allow the icon to specify a callback to handle its custom shortcut 
    shortcutCallback?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
}

async function reviseMessage(
    messageToRevise: string,
    userInstruction: string,
    historyMessages: Message[],
    includeHistory: boolean = true,
    historyMessageCount: number | undefined = undefined
) {
    const historyContext = includeHistory ?
        historyMessages.slice(-(historyMessageCount ?? historyMessages.length)).map(message => `[START]${message.role}: ${message.content}[END]`).join('\n') : ""
    const translatePrompt = `${includeHistory ? `This is an ongoing conversation:
    """
    ${historyContext}
    """` : ""}
    This is a message the user is about to send in conversation:
    """
    ${messageToRevise}
    """
    If the message is empty, it potentially means the user needs a answer suggestion.

    This is the user's instruction or question:
    """
    ${userInstruction}
    """
    
    Please generate a suggestion based on the user's instruction or question, considering the context of the conversation, and return it in the following JSON format, while preserving the user's line breaks and formatting if any:
    """
    {
        "suggested_answer": "..."
    }
    """

    IMPORTANT: The suggested_answer you generate is intended for the user to respond to another conversation, not to reply to the user's current instruction or question.
    `
    const revisedText = await reviseMessageAction({ role: 'user', content: translatePrompt })
    return revisedText
}

export function MessageInput({ messageList, addMesssage, className = "" }: {
    messageList: Message[],
    addMesssage: (message: { content: string, role?: string }) => void,
    className?: string,
}) {
    type MessageInputState =
        | { type: 'normal' }
        | { type: 'revising', revisingIndex: number }
        | { type: 'waitingApprovement', revisedText: string };

    const [compState, setCompState] = useState<MessageInputState>({ type: 'normal' });
    const [messageContent, setMessageContent] = useState("");
    const textAreaRef = useRef<HTMLTextAreaElement>(null)
    const isNormal = compState.type === 'normal'
    const waitingForApprovement = compState.type === 'waitingApprovement'

    function handleSend() {
        if (!isNormal) {
            return
        }
        if (messageContent.trim() === "") return;
        addMesssage({ content: messageContent });
        setMessageContent("");
    }

    async function startRevising(triggeredIndex: number) {
        if (!isNormal) {
            return
        }
        setCompState({ type: 'revising', revisingIndex: triggeredIndex })
        console.log(`setCompState({ type: 'revising', revisingIndex: triggeredIndex })`)
        const userInstruction = icons[triggeredIndex].userInstruction
        const revisedText = await reviseMessage(messageContent, userInstruction, messageList)
        setCompState({ type: 'waitingApprovement', revisedText })
        console.log(`setCompState({ type: 'waitingApprovement', revisedText })`)
    }

    function approveRevision(revisedText: string) {
        if (!waitingForApprovement) {
            return
        }
        setCompState({ type: 'normal' })
        setMessageContent(revisedText)
        textAreaRef.current?.focus()
    }

    function rejectRevision() {
        if (!waitingForApprovement) {
            return
        }
        setCompState({ type: 'normal' })
        textAreaRef.current?.focus()
    }

    // TODO pass from props
    const icons: RevisionEntry[] = [
        {
            iconNode: <MdGTranslate size={20} />, userInstruction: "Please translate this message into English",
            shortcutCallback: (e: React.KeyboardEvent<HTMLTextAreaElement>) => e.key === 'k' && (e.metaKey || e.ctrlKey)
        },
        {
            iconNode: <TbPencilQuestion size={20} title="Ask AI to answer this question" />, userInstruction: "Help me respond to this message",
            shortcutCallback: (e: React.KeyboardEvent<HTMLTextAreaElement>) => e.key === '/' && (e.metaKey || e.ctrlKey)
        },
        {
            iconNode: <TbTextGrammar />, userInstruction: "Correct grammar issue",
            shortcutCallback: (e: React.KeyboardEvent<HTMLTextAreaElement>) => e.key === 'g' && (e.metaKey || e.ctrlKey)
        }
    ]

    return <div className={`flex flex-col border-t pt-4 pb-2 px-4 ${className}`}>
        {/* top bar */}
        <div className="flex flex-row px-4 mb-2">
            {icons.map((icon, index) => {
                if (compState.type === 'revising' && compState.revisingIndex === index) {
                    return <span key={index}>Loading</span>
                }
                return <button className="mr-1 bg-transparent p-1 hover:bg-gray-300 rounded" key={index}
                    onClick={() => {
                        const ii = index
                        startRevising(ii)
                    }}>{icon.iconNode}
                </button>
            })}
        </div>
        {
            waitingForApprovement && <DiffView originalText={messageContent} revisedText={compState.revisedText}
                approveRevisionCallback={approveRevision} rejectRevisionCallback={rejectRevision} />
        }
        <textarea
            className="flex-1 p-4 resize-none focus:outline-none"
            ref={textAreaRef}
            placeholder={`Type your message here...\n\nPress Enter to send, Shift+Enter to add a new line`}
            value={messageContent} onChange={(e) => setMessageContent(e.target.value)}
            readOnly={!isNormal}

            onKeyDown={(e) => {
                icons.forEach((icon, i) => {
                    if (icon.shortcutCallback && icon.shortcutCallback(e)) {
                        const ii = i
                        e.preventDefault();
                        startRevising(ii)
                    }
                });
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }} rows={4} />
    </div >
}

export function DiffView(
    { originalText, revisedText, approveRevisionCallback, rejectRevisionCallback, className = "" }: {
        originalText: string,
        revisedText: string,
        approveRevisionCallback: (revisedText: string) => void,
        rejectRevisionCallback: () => void
        className?: string
    }
) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, []);
    const changes = diffChars(originalText, revisedText)
    return (
        <div className={`p-4 pb-2 rounded-lg border-2 shadow-md ${className}`}
            tabIndex={0} ref={containerRef}
            onKeyDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (e.key === 'Enter') {
                    approveRevisionCallback(revisedText);
                } else if (e.key === 'Backspace') {
                    rejectRevisionCallback();
                }
            }}>
            {changes.length > 0 && (
                <div className="flex flex-col relative">
                    <div className="flex flex-row mb-4">
                        {changes.map((change, index) => (
                            <span key={index} className={`text-sm ${change.added ? 'bg-green-200' : change.removed ? 'bg-red-200 line-through text-gray-500' : ''}`}>
                                {change.value}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-row self-end">
                        <button className="mr-2 py-0 px-2 bg-gray-800 rounded-md text-[12px] text-white" onClick={() => { approveRevisionCallback(revisedText) }}>
                            <PiKeyReturnBold className="inline-block mr-1" color="white" /> Approve
                        </button>
                        <button className="mr-2 py-0 px-1 rounded-lg text-[15px] text-gray-500" onClick={rejectRevisionCallback}>
                            <FaBackspace className="inline-block mr-1" color="6b7280" /> Reject
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}