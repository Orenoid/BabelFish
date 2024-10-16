"use server"
import { createStreamableValue } from 'ai/rsc';
import { convertToCoreMessages, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// TODO reorganize the functions

export const chatCompletionInStream = async (messageList: { role: string, content: string }[]) => {
    const openai = createOpenAI({
        baseURL: process.env.OPENAI_BASE_URL,
        apiKey: process.env.OPENAI_API_KEY,
    })

    const result = streamText({
        model: openai.chat('deepseek-ai/DeepSeek-V2.5'),
        messages: convertToCoreMessages(messageList as {role: 'system' | 'user' | 'assistant', content: string}[]),
    })

    const streamableStatus = createStreamableValue<string>();
    (async () => {
        for await (const chunk of (await result).textStream) {
            streamableStatus.update(chunk);
        }
        streamableStatus.done();
    })();

    return {
        status: streamableStatus.value,
    };
};

export async function chatCompletion(messages: { role: string, content: string }[]) {
    'use server'
    const url = process.env.OPENAI_CHAT_COMPLETION_URL;
    if (!url) {
        console.error('API URL is not defined');
        return;
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify({
            model: 'deepseek-ai/DeepSeek-V2.5',
            messages: messages,
            temperature: 0.7,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        console.error('Error translating message:', response.statusText);
        return;
    }

    const data = await response.json();
    const respRawJson = data.choices[0].message.content;
    return respRawJson
}
