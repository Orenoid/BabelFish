"use client"

// messasge types: 
// systemMessage, text, audio, suggested_answer(apply callback)

import { Message } from "../lib/message";
import { MessageContent, Role } from "./chat";
import { CgChevronDoubleDown } from "react-icons/cg";

export class SystemMessage extends Message {

    systemPrompt: string
    _fold: boolean

    constructor(systemPrompt: string, fold: boolean = true, displayToUser: boolean = true, includedInChatCompletion: boolean = true, className: string = "") {
        super('systemMessage', 'system', displayToUser, includedInChatCompletion, className)
        this.systemPrompt = systemPrompt
        this._fold = fold
    }

    render() {
        const Root = ({ className }: { className?: string }) => {
            return <div className={`flex flex-col ${className}`}>
                <Role className="mb-2" name={this.role} />
                <MessageContent content={this.systemPrompt} />
            </div>
        }
        return Root
    }

    toJSON(): { role: string, content: string } {
        return { role: 'system', content: this.systemPrompt }
    }
}

export class TextMessage extends Message {
    content: string

    constructor(role: string, content: string, displayToUser: boolean = true, includedInChatCompletion: boolean = true, className: string = "") {
        super('text', role, displayToUser, includedInChatCompletion, className)
        this.content = content
    }

    render() {
        const Root = ({ className }: { className?: string }) => {
            return <div className={`flex flex-col ${className}`}>
                <Role className="mb-2" name={this.role} />
                <MessageContent content={this.content} />
            </div>
        }
        return Root
    }

    toJSON(): { role: string, content: string } {
        return { role: this.role, content: this.content }
    }
}

export class RecommendedRespMessage extends Message {
    recommendedContent: string

    constructor(role: string, recommendedContent: string, displayToUser: boolean = true, includedInChatCompletion: boolean = true, className: string = "") {
        super('recommendedResponse', role, displayToUser, includedInChatCompletion, className)
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
}