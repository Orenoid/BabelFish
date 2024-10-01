"use server"

// TODO reorganize the functions

export async function chatCompletion(messageList: {role: string, content: string}[]) {
    'use server'
    const url = process.env.OPENAI_CHAT_COMPLETION_URL;
    if (!url) {
        console.error('API URL is not defined');
        return;
    }
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messageList
        }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

export async function reviseMessageAction(message: { role: string, content: string }) {
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
            model: 'gpt-4o-mini',
            messages: [message],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        console.error('Error translating message:', response.statusText);
        return;
    }

    const data = await response.json();
    const revisedTextInJson = data.choices[0].message.content;
    const revisedText = JSON.parse(revisedTextInJson).suggested_answer;
    return revisedText;
}


