"use client";

import { useEffect, useRef, useState } from "react";
import { AddMesssageInChat, ChatLoader, UpdateMessageInChat as updateMessageInChat } from "../lib/chat"; // Changed to type-only import
import { chatCompletion } from "../lib/chat-server";
import { useImmer } from "use-immer";
import { type Message } from "../lib/message";
import { RecommendedRespMessage, SpecialRoleTypes as SpecialRoles, StreamingTextMessage, TextMessage } from "./message";
import { IoIosArrowDown } from "react-icons/io";
import { readStreamableValue } from "ai/rsc";
import { MessageInput } from "./input";

export function Chat({ chatID, loadChatByID, className = "" }: {
    chatID: string,
    loadChatByID: ChatLoader
    className?: string;
}) {
    // compState: normal, stacking
    const [messageListStack, updateMessageListStack] = useImmer<Message[][]>([])
    const isTopLevel = messageListStack.length <= 1
    const currentMessageList = messageListStack.length > 0 ? messageListStack[messageListStack.length - 1] : []
    const [inputCompKey, setInputCompKey] = useState(0) // for force update

    useEffect(() => {
        const messageList = loadChatByID(chatID)
        updateMessageListStack([messageList])
        setInputCompKey(prev => prev + 1)
    }, [chatID, loadChatByID, updateMessageListStack])

    const messageAddedCallbacks: (({ }: { messageList: Message[], opts?: messageAddedCallbackOptions }) => void)[] = [
        // generate assistant message
        async ({ messageList, opts = { generateAssistantMsg: true } }: { messageList: Message[], opts?: messageAddedCallbackOptions }) => {
            if (!opts.generateAssistantMsg) return
            // only generate assistant message if the last message is from the user
            // TODO reference 'user' role constant instead
            if (messageList.length === 0 || messageList[messageList.length - 1].role !== 'user') return

            async function* genFunc() {
                const { status } = await chatCompletion(
                    messageList.filter((msg) => msg.includedInChatCompletion).map((msg) => (msg.toJSON()))
                )

                for await (const value of readStreamableValue(status)) {
                    yield value ?? '' // no idea what it represents when the value is undefined, so just replace it with ''
                }
                return
            }
            const gen = genFunc()

            const streamingMsg = new StreamingTextMessage(SpecialRoles.ASSISTANT, gen)
            if (isTopLevel) {
                AddMesssageInChat(chatID, streamingMsg)
            }
            updateMessageListStack(draft => {
                draft[draft.length - 1].push(streamingMsg)
            })
        }
        // TODO rename chat based on messages while the number of messages is greater than 1

    ]

    async function addMesssage(newMessage: Message, callbackOpts?: messageAddedCallbackOptions) {
        if (isTopLevel) {
            AddMesssageInChat(chatID, newMessage)
        }
        updateMessageListStack(draft => {
            draft[draft.length - 1].push(newMessage)
        })
        for (const callback of messageAddedCallbacks) {
            callback({ messageList: [...currentMessageList, newMessage], opts: callbackOpts });
        }
    }

    async function updateMessage(messageID: number, newMessage: Message) {
        if (!isTopLevel) {
            // only persist top-level messages
            return
        }
        const serialized = newMessage.serialize()
        updateMessageInChat(chatID, messageID, serialized)
        updateMessageListStack(draft => {
            draft[draft.length - 1][messageID] = newMessage
        })
    }

    function startFollowUpDiscussion(userInstruction: string, messageToRevise: string, revisedText: string) {
        const historyContext = true ?
            currentMessageList.slice(-currentMessageList.length).
                filter((msg) => msg.includedInChatCompletion).
                map(msg => `[START]${msg.role}: ${msg.toJSON().content}[END]`).join('\n') : ""
        const revisePrompt = `${true ? `This is an ongoing conversation:
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

        Please provide a recommended response based on the user's instruction or question, considering the context of the conversation, and preserving the user's line breaks and formatting if any.

        IMPORTANT: The suggested_answer you generate is intended for the user to respond to a previous conversation, not to reply to the user's current instruction or question.
        `
        const nextLevelMessages: Message[] = [
            // 1. revise prompt with chat history, included in chat completion, but not displaying to users
            new TextMessage('user', revisePrompt, false, true),
            // 2. ai's json response, included in request but not displaying either
            new TextMessage('assistant', revisedText, false, true),
            // 3. the revised text, displaying but not included
            new RecommendedRespMessage('assistant', revisedText, true, false)
        ]
        updateMessageListStack(draft => { draft.push(nextLevelMessages) })
    }

    return <div className={`flex flex-col flex-grow items-center rounded-lg ${className}`}>
        {/* Chat title */}
        {/* <div className={`self-start ml-[100px] font-bold text-xl pt-2 w-4/5 text-[#5f5f5f]`}>New Chat</div> */}

        {/* button for jumping back to top level while in follow-up discussions */}
        {!isTopLevel &&
            <div className="hover:bg-gray-200 cursor-pointer py-2 w-4/5 flex justify-center"
                onClick={() => { updateMessageListStack(draft => { draft.pop() }); }}>
                <IoIosArrowDown size={30} color="#5f5f5f" />
            </div>}

        <MessageList className="flex-initial overflow-auto w-4/5 h-full" messageList={currentMessageList} updateMessage={updateMessage} />

        <MessageInput className="w-4/5" key={inputCompKey} // for force reset
            addMesssage={addMesssage} messageList={currentMessageList}
            // Temporarily forbid nested multi-level discussions, the component has already supported, 
            // it's just the AI might be unable to handle too many levels
            allowFollowUpDiscussion={isTopLevel}
            startFollowUpDiscussion={startFollowUpDiscussion}
        />
    </div>
}

export type messageAddedCallbackOptions = {
    generateAssistantMsg?: boolean
}

export function MessageList({ messageList, updateMessage, className }: {
    messageList: Message[]
    updateMessage: (messageID: number, newMessage: Message) => void,
    className?: string
}) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messageList])
    return <div className={`flex flex-col pb-5 ${className}`}>
        {messageList.
            filter((msg) => msg.displayToUser).
            map((message, index) => {
                const messageID = index
                const Comp = message.render()
                return <Comp key={index} className="mb-5"
                    updateMessage={(message: Message) => {
                        updateMessage(messageID, message)
                    }} />
            })}
        <div ref={messagesEndRef} />
    </div>
}