"use client"

import { useEffect, useState } from "react";
// messasge types: 
// systemMessage, text, audio, suggested_answer(apply callback)

import { Message } from "../lib/message";
import { MessageContent, Role } from "./chat";
import { CgChevronDoubleDown } from "react-icons/cg";
import { TbPencil } from "react-icons/tb";
import React from "react";
import { ThreeDots } from "react-loader-spinner";

// TODO message types constants declaration
// export const MessageType = {
//     SYSTEM: 'systemMessage',
//     TEXT: 'text',
//     AUDIO: 'audio',
//     SUGGESTED_ANSWER: 'suggested_answer'
// } as const;

// export const RoleType = {
//     SYSTEM: 'system',
//     USER: 'user',
//     ASSISTANT: 'assistant'
// } as const;


type systemMessgeState =
    | { type: 'normal', showMore: boolean, content: string }
    | { type: 'folded', showMore: boolean, content: string }
    | { type: 'editing', editingContent: string, originalContent: string }
export class SystemMessage extends Message {

    private _systemPrompt: string
    private _fold: boolean

    constructor(systemPrompt: string, fold: boolean = true, displayToUser: boolean = true, includedInChatCompletion: boolean = true) {
        super('systemMessage', 'system', displayToUser, includedInChatCompletion)
        this._systemPrompt = systemPrompt
        this._fold = fold
    }

    render() {
        const Root = ({ updateMessage, className }: { updateMessage: (message: Message) => void, className?: string }) => {
            const [compState, setCompState] = useState<systemMessgeState>({ type: 'normal', showMore: false, content: this._systemPrompt })
            const showMore = (compState.type !== 'editing' && compState.showMore)
            const isEditing = (compState.type === 'editing')

            // state convertors
            function toggleShowMore(): void {
                if (compState.type === 'editing') {
                    return
                }
                setCompState({ type: compState.type, showMore: !compState.showMore, content: compState.content })
            }
            const toEditingState = () => {
                if (compState.type === 'editing') {
                    return
                }
                setCompState({ type: 'editing', editingContent: compState.content, originalContent: compState.content })
            }
            function saveEdit() {
                if (compState.type !== 'editing') {
                    return
                }
                setCompState({ type: 'normal', showMore: false, content: compState.editingContent })
            }
            function cancelEdit() {
                if (compState.type !== 'editing') {
                    return
                }
                setCompState({ type: 'normal', showMore: false, content: compState.originalContent })
            }

            return <div className={`flex flex-col ${className}`}
                onMouseEnter={toggleShowMore} onMouseLeave={toggleShowMore}>
                <Role className="mb-2" name={this.role} />
                {!isEditing && <MessageContent content={compState.content} />}
                {isEditing &&
                    <div className="bg-[#F6F5F5] rounded-lg max-w-[80%] p-4">
                        <textarea className="w-full bg-[#F6F5F5] h-32 resize-none focus:outline-none"
                            value={compState.editingContent} onChange={(e) => { setCompState({ type: 'editing', editingContent: e.target.value, originalContent: compState.originalContent }) }
                            } />
                        <div className="flex flex-row">
                            <button className="rounded-2xl border border-gray-300 bg-white p-2 mr-2"
                                onClick={() => {
                                    cancelEdit()
                                }}>
                                Cancel
                            </button>
                            <button className="rounded-2xl bg-black text-white p-2"
                                onClick={() => {
                                    this._systemPrompt = compState.editingContent
                                    updateMessage(this) // TODO error handling
                                    saveEdit()
                                }}>Save</button>

                        </div>

                    </div>}
                <div className={`flex flex-row mt-1 pl-1 ${showMore ? 'visible' : 'invisible'}`}>
                    <TbPencil className="cursor-pointer" size={20}
                        onClick={() => {
                            toEditingState()
                        }} />
                </div>
            </div>
        }
        return Root
    }

    toJSON(): { role: string, content: string } {
        return { role: 'system', content: this._systemPrompt }
    }

    serialize(): string {
        return JSON.stringify({
            type: this.type,
            systemPrompt: this._systemPrompt,
            fold: this._fold,
            displayToUser: this.displayToUser,
            includedInChatCompletion: this.includedInChatCompletion,
        })
    }

    static deserialize(serialized: string): SystemMessage {
        const { systemPrompt, fold, displayToUser, includedInChatCompletion } = JSON.parse(serialized)
        return new SystemMessage(systemPrompt, fold, displayToUser, includedInChatCompletion)
    }
}


type textMessageState =
    | { type: 'normal', showMore: boolean, content: string }
    | { type: 'editing', editingContent: string, originalContent: string }

export class TextMessage extends Message {
    content: string

    constructor(role: string, content: string, displayToUser: boolean = true, includedInChatCompletion: boolean = true) {
        super('text', role, displayToUser, includedInChatCompletion)
        this.content = content
    }

    render() {
        const Root = ({ updateMessage, className }: { updateMessage: (message: Message) => void, className?: string }) => {
            const [compState, setCompState] = useState<textMessageState>({ type: 'normal', showMore: false, content: this.content })
            const showMore = (compState.type !== 'editing' && compState.showMore)
            const isEditing = (compState.type === 'editing')

            // state convertors
            function toggleShowMore(): void {
                if (compState.type === 'editing') {
                    return
                }
                setCompState({ type: compState.type, showMore: !compState.showMore, content: compState.content })
            }
            const toEditingState = () => {
                if (compState.type === 'editing') {
                    return
                }
                setCompState({ type: 'editing', editingContent: compState.content, originalContent: compState.content })
            }
            function saveEdit() {
                if (compState.type !== 'editing') {
                    return
                }
                setCompState({ type: 'normal', showMore: false, content: compState.editingContent })
            }
            function cancelEdit() {
                if (compState.type !== 'editing') {
                    return
                }
                setCompState({ type: 'normal', showMore: false, content: compState.originalContent })
            }

            return <div className={`flex flex-col ${className}`}
                onMouseEnter={toggleShowMore} onMouseLeave={toggleShowMore}>
                <Role className="mb-2" name={this.role} />
                {!isEditing && <MessageContent content={compState.content} />}
                {isEditing &&
                    <div className="bg-[#F6F5F5] rounded-lg max-w-[80%] p-4">
                        <textarea className="w-full bg-[#F6F5F5] h-32 resize-none focus:outline-none"
                            value={compState.editingContent} onChange={(e) => { setCompState({ type: 'editing', editingContent: e.target.value, originalContent: compState.originalContent }) }
                            } />
                        <div className="flex flex-row">
                            <button className="rounded-2xl border border-gray-300 bg-white p-2 mr-2"
                                onClick={() => {
                                    cancelEdit()
                                }}>
                                Cancel
                            </button>
                            <button className="rounded-2xl bg-black text-white p-2"
                                onClick={() => {
                                    this.content = compState.editingContent
                                    updateMessage(this) // TODO error handling
                                    saveEdit()
                                }}>Save</button>

                        </div>
                    </div>}
                <div className={`flex flex-row mt-1 pl-1 ${showMore ? 'visible' : 'invisible'}`}>
                    <TbPencil className="cursor-pointer" size={20}
                        onClick={() => {
                            toEditingState()
                        }} />
                </div>
            </div>
        }
        return Root
    }

    toJSON(): { role: string, content: string } {
        return { role: this.role, content: this.content }
    }

    serialize(): string {
        return JSON.stringify({
            type: this.type,
            role: this.role,
            content: this.content,
            displayToUser: this.displayToUser,
            includedInChatCompletion: this.includedInChatCompletion,
        });
    }

    static deserialize(serialized: string): TextMessage {
        const { role, content, displayToUser, includedInChatCompletion } = JSON.parse(serialized);
        return new TextMessage(role, content, displayToUser, includedInChatCompletion);
    }

}

export class StreamingTextMessage extends Message {

    private streamingGenerator: AsyncGenerator<string, void, unknown>
    private consumedChunks: string[] = []
    private finished: boolean = false

    constructor(role: string, streamingGenerator: AsyncGenerator<string, void, unknown>) {
        // TODO type const
        super('streamingText', role, true, false)
        this.streamingGenerator = streamingGenerator
    }

    render() {
        const Root = ({ updateMessage, className }: { updateMessage: (message: Message) => void, className?: string }) => {

            const [streamingContent, setStreamingContent] = useState<string>('');
            const [finished, setFinished] = useState<boolean>(this.finished)
            const TextMsg = new TextMessage(this.role, streamingContent, true, true).render()

            useEffect(() => {
                const iterator = this.streamingGenerator[Symbol.asyncIterator]();
                let chunk = iterator.next();

                const processChunk = async () => {
                    const result = await chunk;
                    if (!result.done) {
                        setStreamingContent(prevContent => prevContent + result.value);
                        this.consumedChunks.push(result.value);
                        updateMessage(this);
                        chunk = iterator.next();
                        requestAnimationFrame(processChunk);
                    } else {
                        updateMessage(new TextMessage(this.role, this.consumedChunks.join(''), true, true))
                        setFinished(true);
                    }
                };
                processChunk();
            }, [this.streamingGenerator]); // TODO fix the warning

            return (
                <>
                    {/* if not finished, render as streaming message */}
                    {!finished &&
                        <div className={`flex flex-col ${className}`}>
                            <Role className="mb-2" name={this.role} />
                            <div className={`bg-[#F6F5F5] rounded-lg w-fit max-w-[80%] p-2 ${className}`}>
                                {streamingContent.length === 0 &&
                                    <ThreeDots color="#959595" height={15} width={15}/>
                                }
                                {streamingContent.length > 0 &&
                                    <div dangerouslySetInnerHTML={{ __html: streamingContent.replace(/\n/g, '<br />') }} />
                                }
                            </div>
                        </div>
                    }
                    {/* if finished, render as normal text message */}
                    {finished && <TextMsg updateMessage={updateMessage} className={className} />
                    }
                </>
            );
        }
        return Root
    }

    static deserialize(serialized: string): TextMessage {
        const { role, consumedChunks } = JSON.parse(serialized);
        // it's pointless to deserialize into a streaming message, since the stream has been closed
        // so just return a normal text message with previously consumed chunks, 
        // regardless of whether the previous stream has finished or not
        return new TextMessage(role, consumedChunks.join(''), true, true);
    }

    serialize(): string {
        return JSON.stringify({
            type: 'streamingText',
            role: this.role,
            consumedChunks: this.consumedChunks,
            finished: this.finished
        })
    }

    toJSON(): { role: string; content: string; } {
        return {
            role: this.role,
            content: this.consumedChunks.join('')
        }
    }

}

export class RecommendedRespMessage extends Message {
    recommendedContent: string

    constructor(role: string, recommendedContent: string, displayToUser: boolean = true, includedInChatCompletion: boolean = true) {
        super('recommendedResponse', role, displayToUser, includedInChatCompletion)
        this.recommendedContent = recommendedContent
    }

    render() {
        const Root = ({ className }: { className?: string }) => {
            return <div className={`flex flex-col ${className}`}>
                <Role className="mb-2" name={this.role} />
                <div className={`bg-[#F6F5F5] rounded-lg w-fit max-w-[80%] p-2 ${className}`}>
                    <div className="">{`The recommended response is as follow:`}</div>
                    <div className="flex flex-col p-3 m-4 ml-0 bg-white shadow-sm border-2 rounded-md">
                        <div dangerouslySetInnerHTML={{ __html: this.recommendedContent.replace(/\n/g, '<br />') }} />
                        <div className="flex flex-row self-end">
                            <button className="mr-2 py-0 px-2 bg-gray-800 rounded-md text-[15px] text-white" >
                                <CgChevronDoubleDown className="inline-block mr-1" color="white" /> Apply
                            </button>
                        </div>
                    </div>

                    <div className="">{`If you have any more questions, feel free to continue the discussion with me.`}</div>
                </div>
                <div>
                    {/* 
                    <div className="flex bg-gray-400 flex-wrap mb-4 h-fit min-h-8">
                        {this.recommendedContent}
                    </div> */}

                </div>
            </div>
        }
        return Root
    }

    toJSON(): { role: string, content: string } {
        return { role: this.role, content: this.recommendedContent }
    }

    serialize(): string {
        return JSON.stringify({
            type: this.type,
            role: this.role,
            recommendedContent: this.recommendedContent,
            displayToUser: this.displayToUser,
            includedInChatCompletion: this.includedInChatCompletion
        });
    }

    static deserialize(serialized: string): RecommendedRespMessage {
        const { role, recommendedContent, displayToUser, includedInChatCompletion } = JSON.parse(serialized);
        return new RecommendedRespMessage(role, recommendedContent, displayToUser, includedInChatCompletion);
    }
}