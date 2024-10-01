"use client"

// messasge types: 
// systemMessage, text, audio, suggested_answer(apply callback)

import { Message } from "../lib/message";
import { MessageContent, Role } from "./chat";

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

    toJSON(): {role: string, content: string} {
        return {role: 'system', content: this.systemPrompt}
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

    toJSON(): {role: string, content: string} {
        return {role: this.role, content: this.content}
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
                <MessageContent content={this.recommendedContent} />
            </div>
        }
        return Root
    }

    toJSON(): {role: string, content: string} {
        return {role: this.role, content: this.recommendedContent}
    }
}