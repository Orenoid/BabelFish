"use client"

import { useEffect, useState } from "react";
// messasge types: 
// systemMessage, text, audio, suggested_answer(apply callback)

import { Message } from "../lib/message";
import { CgChevronDoubleDown } from "react-icons/cg";
import { TbPencil } from "react-icons/tb";
import React from "react";
import { ThreeDots } from "react-loader-spinner";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { FaStopCircle } from "react-icons/fa";

export const MessageTypes = {
    SYSTEM: 'systemMessage',
    TEXT: 'text',
    STREAMING_TEXT: 'streamingText',
    AUDIO: 'audio',
    SUGGESTED_ANSWER: 'suggested_answer'
};

export const SpecialRoleTypes = {
    SYSTEM: 'system',
    USER: 'user',
    ASSISTANT: 'assistant'
};


type systemMessgeState =
    | { type: 'normal', showMore: boolean, content: string }
    | { type: 'folded', showMore: boolean, content: string }
    | { type: 'editing', editingContent: string, originalContent: string }
export class SystemMessage extends Message {
    isEmpty(): boolean {
        return this._systemPrompt.trim() === '';
    }

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
    | { type: 'playingAudio', content: string, audioIns: SpeechSynthesisUtterance }
    | { type: 'editing', editingContent: string, originalContent: string }

export class TextMessage extends Message {
    isEmpty(): boolean {
        return this.content.trim() === '';
    }
    readonly content: string

    constructor(role: string, content: string, displayToUser: boolean = true, includedInChatCompletion: boolean = true) {
        super('text', role, displayToUser, includedInChatCompletion)
        this.content = content
    }

    updateContent(content: string): TextMessage {
        return new TextMessage(this.role, content, this.displayToUser, this.includedInChatCompletion)
    }

    render() {
        const Root = ({ updateMessage, className }: { updateMessage: (message: Message) => void, className?: string }) => {
            const [compState, setCompState] = useState<textMessageState>({ type: 'normal', showMore: false, content: this.content })
            const showMore = (compState.type === 'normal' && compState.showMore)
                || compState.type === 'playingAudio' // you will want to keep the buttons showing while playing the audio
            const isEditing = (compState.type === 'editing')
            const isPlaying = compState.type === 'playingAudio'

            // state convertors
            function setShowMore(showMore: boolean): void {
                if (compState.type !== 'normal') {
                    return
                }
                setCompState({ ...compState, showMore: showMore })
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
            async function startPlaying() {
                if (compState.type !== 'normal') {
                    return
                }
                const utterance = new SpeechSynthesisUtterance();
                // TODO detect the text language
                utterance.lang = 'en-US';
                const allVoices: SpeechSynthesisVoice[] = [];
                const getVoices = () => {
                    const voices = speechSynthesis.getVoices();
                    if (voices.length > 0) {
                        allVoices.push(...voices);
                    } else {
                        setTimeout(getVoices, 100);
                    }
                };
                getVoices();
                let prefferedVoice: SpeechSynthesisVoice | undefined = undefined;
                const preferredVoices = ['Google US English', 'Nicky', 'Karen', 'Aaron', 'Gordon', 'Google UK English Male', 'Google UK English Female', 'Catherine']
                while (allVoices.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                for (const name of preferredVoices) {
                    for (const voice of allVoices) {
                        if (voice.name === name) {
                            prefferedVoice = voice;
                            break;
                        }
                    }
                    if (prefferedVoice !== undefined) {
                        break;
                    }
                }
                if (prefferedVoice !== undefined) {
                    utterance.voice = prefferedVoice;
                }
                // https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts
                let myTimeout: NodeJS.Timeout
                function myTimer() {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                    myTimeout = setTimeout(myTimer, 10000);
                }
                window.speechSynthesis.cancel()
                myTimeout = setTimeout(myTimer, 10000)
                utterance.text = compState.content
                utterance.onend = () => {
                    clearTimeout(myTimeout)
                    setCompState({ type: 'normal', content: compState.content, showMore: true })
                }
                setCompState({ ...compState, type: 'playingAudio', audioIns: utterance })
                window.speechSynthesis.speak(utterance)
            }
            async function stopPlaying() {
                if (!isPlaying) {
                    return
                }
                window.speechSynthesis.cancel()
                setCompState({ type: 'normal', showMore: true, content: compState.content })
            }

            return <div className={`flex flex-col ${className}`}
                onMouseEnter={() => { setShowMore(true) }} onMouseLeave={() => { setShowMore(false) }}>
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
                                    updateMessage(this.updateContent(compState.editingContent)) // TODO error handling
                                    saveEdit()
                                }}>Save</button>
                        </div>
                    </div>
                }
                <div className={`flex flex-row mt-1 pl-1 ${showMore ? 'visible' : 'invisible'}`}>
                    <div className="mr-2 cursor-pointer" onClick={!isPlaying ? startPlaying : stopPlaying}>
                        {isPlaying ? <FaStopCircle color="#898989" size={25} /> : <HiMiniSpeakerWave color="#898989" size={25} />}
                    </div>
                    <TbPencil className="cursor-pointer" size={25} color="#898989"
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
    isEmpty(): boolean {
        return this.consumedChunks.join('').trim() === '';
    }

    private streamingGenerator: AsyncGenerator<string, void, unknown>
    private consumedChunks: string[] = []
    private finished: boolean = false

    constructor(role: string, streamingGenerator: AsyncGenerator<string, void, unknown>) {
        super(MessageTypes.STREAMING_TEXT, role, true, false)
        this.streamingGenerator = streamingGenerator
    }

    render() {
        const Root = ({ updateMessage: persistMessage, className }: { updateMessage: (message: Message) => void, className?: string }) => {

            const [streamingContent, setStreamingContent] = useState<string>(this.consumedChunks.join(''));
            const [finished, setFinished] = useState<boolean>(this.finished)
            const TextMsg = new TextMessage(this.role, streamingContent, true, true).render()

            // TODO: Issues exist with strict mode
            useEffect(() => {
                const iterator = this.streamingGenerator[Symbol.asyncIterator]();
                let _finished = false
                const buffer: string[] = []
                const splited: string[] = []
                // const splited = createChannel<string>()

                const processChunk = async () => {
                    // const send = splited.send
                    for await (const value of iterator) {
                        this.consumedChunks.push(value);
                        buffer.push(value)
                        // try to split the first sentence from buffer, if so, send it to splited channel
                        const sentenceEndings = /([.!?。！？,，;；:：\n])/g;
                        const sentences = buffer.join('').split(sentenceEndings);
                        if (sentences.length > 1) {
                            const firstSentence = sentences[0] + sentences[1];
                            if (firstSentence !== '') {
                                splited.push(firstSentence)
                                // send(firstSentence);
                                buffer.length = 0
                                buffer.push(sentences.slice(2).join(''))
                            }
                        }
                        persistMessage(this);
                        setStreamingContent(prevContent => prevContent + value);
                    }
                    if (buffer.length > 0) {
                        splited.push(buffer.join(''))
                        buffer.length = 0
                        // send(buffer.join(''))
                    }
                    if (splited.length > 0) {
                        const left = splited.join('')
                        splited.length = 0
                        splited.push(left)
                    }
                    // splited.close()
                    persistMessage(new TextMessage(this.role, this.consumedChunks.join(''), true, true))
                    _finished = true
                    setFinished(true);
                };
                const playAudioFromBuffer = async () => {
                    const allVoices: SpeechSynthesisVoice[] = [];
                    let prefferedVoice: SpeechSynthesisVoice | undefined = undefined
                    // https://stackoverflow.com/questions/49506716/speechsynthesis-getvoices-returns-empty-array-on-windows
                    const tryLoadVoices = () => {
                        if (allVoices.length > 0) { return }
                        const voices = speechSynthesis.getVoices();
                        if (voices.length > 0) {
                            allVoices.push(...voices);
                        } else {
                            setTimeout(tryLoadVoices, 100);
                        }
                    };
                    tryLoadVoices();
                    // https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts
                    let myTimeout: NodeJS.Timeout
                    function myTimer() {
                        window.speechSynthesis.pause();
                        window.speechSynthesis.resume();
                        myTimeout = setTimeout(myTimer, 10000);
                    }
                    window.speechSynthesis.cancel()
                    myTimeout = setTimeout(myTimer, 10000)
                    // for await (const text of splited) {
                    while (!_finished || splited.length > 0) {
                        if (splited.length === 0) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                            continue
                        }
                        const text = splited.shift()!
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = 'en-US';
                        if (prefferedVoice === undefined) {
                            const preferredVoices = ['Google US English', 'Nicky', 'Karen', 'Aaron', 'Gordon', 'Google UK English Male', 'Google UK English Female', 'Catherine']
                            // wait until voices have been loaded
                            while (allVoices.length === 0) {
                                await new Promise(resolve => setTimeout(resolve, 100));
                            }
                            for (const name of preferredVoices) {
                                for (const voice of allVoices) {
                                    if (voice.name === name) {
                                        prefferedVoice = voice
                                        break
                                    }
                                }
                                if (prefferedVoice !== undefined) {
                                    break
                                }
                            }
                        }
                        if (prefferedVoice !== undefined) {
                            utterance.voice = prefferedVoice
                        }
                        utterance.text = text
                        utterance.onend = () => {
                            clearTimeout(myTimeout)
                        }
                        window.speechSynthesis.speak(utterance)
                        await new Promise(resolve => {
                            utterance.onend = resolve;
                        });
                    }
                }
                processChunk();
                playAudioFromBuffer();

            }, [persistMessage]); // TODO fix the warning

            return (
                <>
                    {/* if not finished, render as streaming message */}
                    {!finished &&
                        <div className={`flex flex-col ${className}`}>
                            <Role className="mb-2" name={this.role} />
                            <div className={`bg-[#F6F5F5] rounded-lg w-fit max-w-[80%] p-2 ${className}`}>
                                {streamingContent.length === 0 &&
                                    <ThreeDots color="#959595" height={15} width={15} />
                                }
                                {streamingContent.length > 0 &&
                                    <div dangerouslySetInnerHTML={{ __html: streamingContent.replace(/\n/g, '<br />') }} />
                                }
                            </div>
                        </div>
                    }
                    {/* if finished, render as normal text message */}
                    {finished && <TextMsg updateMessage={persistMessage} className={className} />}
                </>
            );
        }
        return Root
    }

    static deserialize(serialized: string): TextMessage {
        const { role, consumedChunks } = JSON.parse(serialized);
        // it's pointless to deserialize into a streaming message, since the stream will be lost while serializing
        // so just return a normal text message with already consumed chunks, 
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
    isEmpty(): boolean {
        return false
    }
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

export function Role({ name, className }: {
    name: string;
    className?: string;
    avatarUrl?: string;
}) {
    return (
        <div className={`flex items-center p-1 ${className}`}>
            <span className="font-semibold">{name}</span>
        </div>
    );
}

export function MessageContent({ content, className = "" }: {
    content: string;
    className?: string;
}) {
    return (
        <div className={`bg-[#F6F5F5] rounded-lg w-fit max-w-[80%] p-2 ${className}`}>
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </div>
    );
}

