"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FaBackspace, FaMicrophone, FaSpellCheck } from "react-icons/fa";
import { LuUserCog2 } from "react-icons/lu";
import { MdGTranslate } from "react-icons/md";
import { TbPencilQuestion } from "react-icons/tb";
import { Audio, Oval } from "react-loader-spinner";
import { messageAddedCallbackOptions } from "./chat";
import { TextMessage } from "./message";
import { diffChars } from "diff";
import { LiaComments } from "react-icons/lia";
import { PiKeyReturnBold } from "react-icons/pi";
import { Message } from "../lib/message";
import { chatCompletion } from "../lib/chat-server";
import Switch from "react-switch"
import { IMediaRecorder } from "extendable-media-recorder";

enum UtilsTypes {
    Generation = "generation",
    Revision = "revision"
}


export interface UtilsEntry {
    iconNode: React.ReactNode;
    userInstruction: string;
    type: UtilsTypes;
    // allow the icon to specify a callback to handle its custom shortcut key
    shortcutKeyCallback?: (e: React.KeyboardEvent) => boolean;
}

const defaultUtils: UtilsEntry[] = [
    {
        iconNode: <MdGTranslate size={20} />, userInstruction: "How do I say it in English to express the same meaning?",
        type: UtilsTypes.Revision,
        shortcutKeyCallback: (e: React.KeyboardEvent) => e.key === 'k' && (e.metaKey || e.ctrlKey)
    },
    {
        iconNode: <TbPencilQuestion size={20} title="Ask AI to answer this question" />, userInstruction: "Help me respond to this message",
        type: UtilsTypes.Generation,
        shortcutKeyCallback: (e: React.KeyboardEvent) => e.key === '/' && (e.metaKey || e.ctrlKey)
    },
    {
        iconNode: <FaSpellCheck size={20} className="ml-[-2px]" />, userInstruction: "Correct grammar issue",
        type: UtilsTypes.Revision,
        shortcutKeyCallback: (e: React.KeyboardEvent) => e.key === 'g' && (e.metaKey || e.ctrlKey)
    }
];

export async function reviseMessage(
    messageToRevise: string,
    userInstruction: string,
    historyMessages: Message[],
    includeHistory: boolean = true,
    historyMessageCount: number | undefined = undefined) {

    const historyContext = includeHistory ?
        historyMessages.slice(-(historyMessageCount ?? historyMessages.length)).
            filter((msg) => msg.includedInChatCompletion).
            map(msg => `[START]${msg.role}: ${msg.toJSON().content}[END]`).join('\n') : "";

    const systemPrompt = `You're a helpful assistant. Your duty is to assist users in a conversation, and sometimes users will provide you with the message they are about to send, asking you to help modify, correct, translate or rewrite the provided message.First, the user will send you the ongoing conversation history in the following format:
"""
[START]somebody: ...[END]
[START]user: ...[END]
[START]somebody: ...[END]
"""
Then, the user will provide the message text they are about to send:
"""
message content about to send
"""
Next, the user will give an instruction:
"""
instruction about the revision you should do on the message above
"""
Please follow the user's instruction, considering the historical context of the conversation, and revise or rewrite the message. Then, return the revised message in the following JSON format:
"""
{"revision": "..."}
"""
IMPORTANT: The revision you generate is intended for the user to respond the ongoing conversation, not to reply to the user's current instruction.
`

    const fewShotMessages = [
        `here is the ongoing conversation history:
"""
[START]assistant: Hello, how can I assist you?[END]
[START]user: I want to book a room.[END]
[START]assistant: Sure, what kind of room do you need?[END]
"""
here is the message I'm about to send:
"""
我需要一个双人房，住两晚。
"""
here is what you shoud do with the message:
"""
translate it into English
"""`,
        `{"revision": "I need a double room for two nights."}`
    ]
    const userMessage = `here is the ongoing conversation history:
"""
${historyContext}
"""
here is the message I'm about to send:
"""
${messageToRevise}
"""
here is what you shoud do with the message:
"""
${userInstruction}
"""`
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fewShotMessages[0] },
        { role: 'assistant', content: fewShotMessages[1] },
        { role: 'user', content: userMessage }
    ]
    const rawJson = await chatCompletion(messages);
    const revision = JSON.parse(rawJson).revision;
    return revision;
}

export async function generateMessage(
    userInstruction: string,
    historyMessages: Message[],
    includeHistory: boolean = true,
    historyMessageCount: number | undefined = undefined
) {

    const historyContext = includeHistory ?
        historyMessages.slice(-(historyMessageCount ?? historyMessages.length)).
            filter((msg) => msg.includedInChatCompletion).
            map(msg => `[START]${msg.role}: ${msg.toJSON().content}[END]`).join('\n') : "";

    const systemPrompt = `You're a helpful assistant. Your duty is to assist users in a conversation, and sometimes users don't know how to respond, you need to help the user provide a response for reference. First, the user will send you the ongoing conversation history in the following format:
"""
[START]somebody: ...[END]
[START]user: ...[END]
[START]somebody: ...[END]
"""
Next, the user will give an instruction:
"""
instruction on how you should generate relevant repl
"""
Please follow the user's instruction, considering the historical context of the conversation, and provide a recommended response for the user's reference. Then, return the recommended response in the following JSON format:
"""
{"recommended": "..."}
"""
IMPORTANT: The response you generate is intended for the user to respond the ongoing conversation, not to reply to the user's current instruction.
`

    const fewShotMessages = [
        `here is the ongoing conversation history:
"""
[START]assistant: Hello, welcome to our interview. Can you please introduce yourself?[END]
[START]user: Sure, my name is John Doe and I have a background in software development.[END]
[START]assistant: Great, John. Can you briefly tell me what data types are in Python?[END]
"""
here is my instruction:
"""
help me answer it
"""`,
        `{"recommended": "In Python, data types include integers, floats, strings, lists, tuples, sets, and dictionaries."}`
    ]
    const userMessage = `here is the ongoing conversation history:
"""
${historyContext}
"""
here is my instruction:
"""
${userInstruction}
"""`
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fewShotMessages[0] },
        { role: 'assistant', content: fewShotMessages[1] },
        { role: 'user', content: userMessage }
    ]
    const rawJson = await chatCompletion(messages);
    const recommended = JSON.parse(rawJson).recommended;
    return recommended;
}


// Temporarily use this to convert message to text for revision
function messageToText(message: Message): string {
    return message.toJSON().content
}

export type MessageInputState =
    | { type: 'init' }
    | { type: 'normal'; message: Message; fromRevision: boolean }
    | { type: 'revising'; message: Message; revisingIndex: number; }
    | { type: 'waitingApproval'; message: Message; revisedMsg: Message; revisionInstruction: string; };

export function MessageInput({
    messageList, addMesssage, chatKey, allowFollowUpDiscussion, startFollowUpDiscussion, className = ""
}: {
    messageList: Message[];
    addMesssage: (message: Message, callbackOpts?: messageAddedCallbackOptions) => void;
    chatKey: number,
    allowFollowUpDiscussion: boolean;
    startFollowUpDiscussion: (userInstruction: string, messageToRevise: string, revisedText: string) => void;
    className?: string;
}) {

    const [compState, setCompState] = useState<MessageInputState>({ type: 'init' });

    const isNormal = compState.type === 'normal';
    const waitingForApproval = compState.type === 'waitingApproval';

    // state convertors
    const updateMessage = useCallback((message: Message) => {
        if (compState.type !== 'init' && compState.type !== 'normal') {
            return
        }
        setCompState({ type: 'normal', message, fromRevision: false });
    }, [compState.type])
    async function startRevising(triggeredIndex: number) {
        if (!isNormal) {
            return;
        }
        const util = defaultUtils[triggeredIndex]
        if (util.type === UtilsTypes.Generation && !compState.message.isEmpty()) {
            return // TODO raise error
        }
        if (util.type === UtilsTypes.Revision && compState.message.isEmpty()) {
            return
        }
        setCompState({ type: 'revising', revisingIndex: triggeredIndex, message: compState.message });
        const userInstruction = util.userInstruction;
        let result: string
        if (compState.message.isEmpty()) {
            result = await generateMessage(userInstruction, messageList)
        } else {
            result = await reviseMessage(messageToText(compState.message), userInstruction, messageList);
        }
        setCompState({
            type: 'waitingApproval',
            revisedMsg: new TextMessage(compState.message.role, result),
            revisionInstruction: userInstruction,
            message: compState.message
        });
    }
    function approveRevision(revisedText: string) {
        if (!waitingForApproval) {
            return;
        }
        setCompState({ type: 'normal', message: new TextMessage(compState.message.role, revisedText), fromRevision: true });
        // TODO
        // textAreaRef.current?.focus();
    }
    function rejectRevision() {
        if (!waitingForApproval) {
            return;
        }
        setCompState({ type: 'normal', message: compState.message, fromRevision: false });
        // TODO
        // textAreaRef.current?.focus();
    }

    function calculateTextAreaHeight(): number {
        // TODO
        // if (textAreaRef.current) {
        //     const textAreaRect = textAreaRef.current.getBoundingClientRect();
        //     return window.innerHeight - textAreaRect.top;
        // }
        return 170; // by default
    }

    return <div className={`flex flex-col relative border-t pt-4 pb-2 px-4 ${className}`}
        onKeyDown={(e) => {
            defaultUtils.forEach((icon, i) => {
                if (icon.shortcutKeyCallback && icon.shortcutKeyCallback(e)) {
                    const ii = i;
                    e.preventDefault();
                    startRevising(ii);
                    return;
                }
            });
        }}>
        {/* top bar */}
        <div className="flex flex-row px-4 mb-2">
            {/* top bar - revision entry icons */}
            <div className="flex flex-row">
                {defaultUtils.map((icon, index) => {
                    // loading effect while revising
                    if (compState.type === 'revising' && compState.revisingIndex === index) {
                        return <div className="p-1 mr-1 w-[28px]" key={index}>
                            <Oval height={17} width={17} color="#959595" secondaryColor="#959595" strokeWidth={4} strokeWidthSecondary={4} />
                        </div>;
                    }
                    // icons to display in normal status
                    return <div className="p-1 mr-1 w-[28px] bg-transparent hover:bg-gray-300 rounded" key={index}><button className="" key={index}
                        onClick={() => {
                            const ii = index;
                            startRevising(ii);
                        }}>{icon.iconNode}
                    </button></div>;
                })}
            </div>
        </div>
        {/* revision DiffView pop-up */}
        {
            // TODO 1. more appropriate max-width 2. line wrapping for content
            waitingForApproval && <DiffView className={`absolute w-fit min-w-[700px] max-w-[1000px] bg-white`} style={{ bottom: `${calculateTextAreaHeight()}px` }}
                originalText={messageToText(compState.message)} revisedText={messageToText(compState.revisedMsg)} allowFollowUpDiscussion={allowFollowUpDiscussion}
                approveRevisionCallback={approveRevision} rejectRevisionCallback={rejectRevision}
                startFollowUpDiscussion={(messageToRevise: string, revisedText: string) => {
                    if (!waitingForApproval) return
                    setCompState({ type: 'normal', message: new TextMessage(compState.message.role, ''), fromRevision: false });
                    // TODO
                    // textAreaRef.current?.focus();
                    startFollowUpDiscussion(compState.revisionInstruction, messageToRevise, revisedText);
                }} />}
        {/* message input area (perhaps calling it 'message constructor' would be more appropriate) */}
        <TextInput chatKey={chatKey} allowEdit={isNormal} addMessage={addMesssage} updateMessage={updateMessage}
            revisionMessage={isNormal ? [compState.message, compState.fromRevision] : undefined} />
    </div>;
}

function TextInput(
    { allowEdit, chatKey, addMessage, updateMessage, revisionMessage }: {
        allowEdit: boolean
        chatKey: number
        updateMessage: (message: Message) => void
        addMessage: (message: Message, opts: messageAddedCallbackOptions) => void
        revisionMessage: [Message, boolean] | undefined // Updated when a revision is provided, initialized as undefined
    }
) {
    type typingOrVoiceMode = { type: 'typing' } | { type: 'voiceMode', autoSend: boolean };
    const [inputState, setInputState] = useState<
        | { type: 'noEdit', recoverState: typingOrVoiceMode }
        | { type: 'typing' }
        | { type: 'voiceMode', autoSend: boolean }
        | { type: 'recording', recorder: IMediaRecorder, stream: MediaStream, previousState: typingOrVoiceMode }
        | { type: 'transcribing', previousState: typingOrVoiceMode }
    >(allowEdit ? { type: 'typing' } : { type: 'noEdit', recoverState: { type: 'typing' } });
    const allowEditRef = useRef(allowEdit)
    useEffect(() => {
        // only trigger when allowEdit changes
        if (allowEdit == allowEditRef.current) { return }
        allowEditRef.current = allowEdit
        if (inputState.type !== 'noEdit' && !allowEdit) {
            let recoverState: typingOrVoiceMode
            if (inputState.type === 'typing') {
                recoverState = { type: 'typing' }
            } else if (inputState.type === 'voiceMode') {
                recoverState = { type: 'voiceMode', autoSend: inputState.autoSend }
            } else {
                recoverState = inputState.previousState
            }
            setInputState({ type: 'noEdit', recoverState: recoverState })
        } else if (inputState.type === 'noEdit' && allowEdit) {
            setInputState(inputState.recoverState)
        }
    }, [allowEdit, inputState])

    const isTyping = inputState.type === 'typing'
    const isVoiceMode = inputState.type === 'voiceMode'
    const isRecording = inputState.type === 'recording'

    const defaultRole = 'user'
    const [role, setRole] = useState<'system' | 'user' | 'assistant'>(defaultRole);
    const [showRoleMenu, setShowRoleMenu] = useState(false);

    const [msg, setMsg] = useState<TextMessage>(new TextMessage(defaultRole, ''))
    // Sync msg changes to the parent component
    useEffect(() => {
        updateMessage(msg)
    }, [msg, updateMessage])

    // update msg when a revision is provided
    useEffect(() => {
        if (revisionMessage && revisionMessage[0] instanceof TextMessage && revisionMessage[1]) {
            setMsg(revisionMessage[0]);
            textAreaRef.current?.focus() // After the revision is applied, for convenience, focus the text area for the user to continue typing
        }
    }, [msg.content, revisionMessage])

    useEffect(() => {
        setMsg(new TextMessage(role, ''))
    }, [chatKey]) // TODO fix the warning

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const inputDivRef = useRef<HTMLDivElement>(null);

    // inputState convertors
    function handleSend(msg: TextMessage, callbackOpts: messageAddedCallbackOptions = { generateAssistantMsg: true }) {
        if (inputState.type !== 'typing' && inputState.type !== 'voiceMode') return;
        if (msg.content.trim() === "") return;
        addMessage(msg, callbackOpts);
        setMsg(new TextMessage(role, ''));
        if (inputState.type === 'typing') {
            textAreaRef.current?.focus();
        }
    }
    const startRecording = async () => {
        if (inputState.type !== 'typing' && inputState.type !== 'voiceMode') {
            return
        }
        const { MediaRecorder, register } = await import("extendable-media-recorder");
        const { connect } = await import("extendable-media-recorder-wav-encoder");
        if (!MediaRecorder.isTypeSupported('audio/wav')) {
            await register(await connect());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/wav' })
        setInputState(prev => ({ type: 'recording', recorder: recorder, stream: stream, previousState: prev as typingOrVoiceMode }))

        const audioChunks: Blob[] = []
        recorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data)
        })
        recorder.addEventListener("stop", () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
            startTranscribing(audioBlob, inputState)
        })
        recorder.start()
    }
    const stopRecording = async () => {
        if (inputState.type !== 'recording') {
            return
        }
        inputState.recorder.stop();
        // https://stackoverflow.com/questions/44274410/mediarecorder-stop-doesnt-clear-the-recording-icon-in-the-tab
        inputState.stream.getTracks().forEach(track => track.stop())
        setInputState({ type: 'transcribing', previousState: inputState.previousState })
    }
    const startTranscribing = (audioBlob: Blob, previousState: typingOrVoiceMode) => {
        // TODO switch to server actions
        const form = new FormData();
        form.append("model", "FunAudioLLM/SenseVoiceSmall");
        form.append("file", audioBlob, "recording.wav");
        const options = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
            },
            body: form
        };
        const apiUrl = process.env.NEXT_PUBLIC_STT_API_URL;
        if (!apiUrl) {
            throw new Error('API URL is not defined');
        }
        fetch(apiUrl, options)
            .then(response => {
                response.json().then(data => {
                    const newMsg = msg.updateContent(msg.content + data.text);
                    setMsg(newMsg);
                    setInputState(previousState)
                    if (previousState.type === 'voiceMode' && previousState.autoSend) {
                        handleSend(newMsg)
                    }
                    if (previousState.type === 'typing') {
                        textAreaRef.current?.focus();
                    }
                });
            }).catch(err => {
                console.error(err);
                stopRecording();
            });
    };
    const enableVoiceMode = () => {
        if (inputState.type !== 'typing') return;
        setInputState({ type: 'voiceMode', autoSend: false })
        inputDivRef.current?.focus();
    }
    const disableVoiceMode = () => {
        if (inputState.type !== 'voiceMode') return;
        setInputState({ type: 'typing' })
        textAreaRef.current?.focus();
    }
    const clearMessageInVoiceMode = () => {
        if (inputState.type !== 'voiceMode') return;
        setMsg(msg.updateContent(''))
    }
    const toggleAutoSend = () => {
        if (inputState.type !== 'voiceMode') return;
        setInputState({ type: 'voiceMode', autoSend: !inputState.autoSend })
    }

    return <div ref={inputDivRef} className="flex flex-col focus:outline-none"
        onKeyDown={(e) => e.key === ' ' && isVoiceMode && startRecording()}
        // TODO bug: if the space key is released too soon right after pressing it, the recording will not stop
        onKeyUp={
            (e) => {
                if (e.key === ' ' && isRecording && inputState.previousState.type === 'voiceMode') { stopRecording() }
                if (e.key === 'i' && isVoiceMode) { disableVoiceMode() }
                if (e.key === 'Enter' && isVoiceMode) { handleSend(msg) }
                if (e.key === 'Backspace' && isVoiceMode) { clearMessageInVoiceMode() }
            }
        }
    >
        {/* Text input and preview area */}
        <textarea
            className={`flex-1 p-4 resize-none focus:outline-none ${!isTyping && "cursor-default"}`}
            ref={textAreaRef}
            placeholder={isTyping ? `Type your message here...\n\nPress Enter to send, Ctrl+Enter to add the message, Shift+Enter to add a new line` : `Press Space to start recording, release to stop`}
            value={msg.content} onChange={(e) => setMsg(msg.updateContent(e.target.value))}
            readOnly={!isTyping}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleSend(msg, { generateAssistantMsg: false });
                    return;
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(msg);
                    return;
                }
            }} rows={4} />
        {/* Bottom Bar */}
        <div className="flex flex-row items-center justify-between">
            {/* current message role */}
            <div className="flex flex-row p-1 px-3 mr-3 rounded-full hover:bg-gray-300 cursor-pointer" onClick={() => setShowRoleMenu(!showRoleMenu)}>
                <LuUserCog2 className="mr-2" size={25} /> <span className="font-bold">{role}</span>
                {showRoleMenu && (
                    <div className="absolute mt-2 p-2 bg-white border border-gray-300 rounded shadow-lg">
                        {/* Add role options here */}
                        <div className="cursor-pointer hover:bg-gray-200 p-2" onClick={() => setRole('system')}>system</div>
                        <div className="cursor-pointer hover:bg-gray-200 p-2" onClick={() => setRole('assistant')}>assistant</div>
                        <div className="cursor-pointer hover:bg-gray-200 p-2" onClick={() => setRole('user')}>user</div>
                    </div>
                )}
            </div>
            {/* voice control buttons */}
            <div className="flex flex-row items-center">
                <label className="flex items-center mr-2">
                    <span className="mr-1">Voice Mode</span>
                    <Switch checked={
                        isVoiceMode
                        // while recording and transcribing, keep what was set before
                        || (inputState.type === 'recording' && inputState.previousState.type === 'voiceMode')
                        || (inputState.type === 'transcribing' && inputState.previousState.type === 'voiceMode')
                    }
                        onChange={(checked) => { return checked ? enableVoiceMode() : disableVoiceMode() }}
                        className="mr-2" width={34} height={17} uncheckedIcon={false} checkedIcon={false} />
                </label>
                {(isVoiceMode || (inputState.type === 'recording' && inputState.previousState.type === 'voiceMode') || (inputState.type === 'transcribing' && inputState.previousState.type === 'voiceMode'))
                    && <label className={`flex items-center mr-2`}>
                        <span className="mr-1">Auto Send</span>
                        <Switch
                            disabled={!isVoiceMode}
                            checked={isVoiceMode && inputState.autoSend
                                // while recording and transcribing, keep what was set before
                                || (inputState.type === 'recording' && inputState.previousState.type === 'voiceMode' && inputState.previousState.autoSend)
                                || (inputState.type === 'transcribing' && inputState.previousState.type === 'voiceMode' && inputState.previousState.autoSend)}
                            onChange={toggleAutoSend}
                            className={`mr-2`} width={34} height={17} uncheckedIcon={false} checkedIcon={false}
                        />
                    </label>}
                <button
                    className="rounded-full bg-black hover:bg-gray-700 focus:outline-none"
                    onClick={isRecording ? stopRecording : startRecording}
                >
                    {isRecording ?
                        <div className="flex items-center justify-center w-16 h-8">
                            <Audio height={17} width={34} color="white" wrapperClass="p-2" />
                        </div> :
                        <div className="flex items-center justify-center w-16 h-8">
                            <FaMicrophone size={17} color="white" />
                        </div>
                    }
                </button>
            </div>
        </div>
    </div>
}

export function DiffView(
    { originalText, revisedText, approveRevisionCallback, rejectRevisionCallback, allowFollowUpDiscussion, startFollowUpDiscussion, style, className = "" }: {
        originalText: string;
        revisedText: string;
        allowFollowUpDiscussion: boolean;
        approveRevisionCallback: (revisedText: string) => void;
        rejectRevisionCallback: () => void;
        startFollowUpDiscussion: (messageToRevise: string, revisedText: string) => void;
        className?: string;
        style: object;
    }
) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, []);
    const changes = diffChars(originalText, revisedText);
    return (
        <div className={`p-4 pb-2 rounded-lg border-2 shadow-md focus:outline-none ${className}`} style={style}
            tabIndex={0} ref={containerRef}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }}
            onKeyUp={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (e.key === 'Enter') {
                    approveRevisionCallback(revisedText);
                } else if (e.key === 'Backspace') {
                    rejectRevisionCallback();
                } else if (e.key === 'Tab') {
                    startFollowUpDiscussion(originalText, revisedText);
                }
            }}>
            {changes.length > 0 && (
                <div className="flex flex-col relative">
                    {/* diff text */}
                    <div className="flex flex-wrap mb-4">
                        {changes.map((change, index) => (
                            <div key={index} className={`inline-block whitespace-pre-wrap break-words ${change.added ? 'bg-green-200' : change.removed ? 'bg-red-200 line-through text-gray-500' : ''}`}>
                                {/* TODO fix displaying line break issue */}
                                {change.value}
                                {/* <div className="w-full whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{
                                __html: change.value.replace(/\n/g, '<br />').replace(/ /g, '&nbsp;'),
                            }} /> */}
                            </div>
                        ))}
                    </div>
                    {/* buttons */}
                    <div className="flex flex-row self-end">
                        <button className="mr-2 py-0 px-2 bg-gray-800 rounded-md text-[12px] text-white" onClick={() => { approveRevisionCallback(revisedText); }}>
                            <PiKeyReturnBold className="inline-block mr-1" color="white" /> Approve
                        </button>
                        <button className="mr-2 py-0 px-1 rounded-lg text-[15px] text-gray-500" onClick={rejectRevisionCallback}>
                            <FaBackspace className="inline-block mr-1" color="6b7280" /> Reject
                        </button>
                        {allowFollowUpDiscussion && <button className="mr-2 py-0 px-1 rounded-lg text-[15px] text-gray-500"
                            onClick={() => startFollowUpDiscussion(originalText, revisedText)}>
                            <LiaComments className="inline-block mr-1" color="6b7280" /> Follow-up discussions
                        </button>}
                    </div>
                </div>
            )}

        </div>
    );
}

