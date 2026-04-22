const fetch = require('node-fetch');
const { cekKey, limitAdd, isLimit } = require('../database/db');
const { aiApiKey } = require('../lib/settings');

async function validateRequest(req, res, extraChecks = []) {
    const { apikey } = req.query;
    if (!apikey) {
        res.status(400).send({ status: 400, message: 'apikey parameter cannot be empty', result: 'error' });
        return null;
    }

    const check = await cekKey(apikey);
    if (!check) {
        res.status(404).send({ status: 404, message: `apikey ${apikey} not found, please register first.` });
        return null;
    }

    const limit = await isLimit(apikey);
    if (limit) {
        res.status(429).send({ status: 429, message: 'requests limit exceeded (100 req / day), call owner for an upgrade to premium', result: 'error' });
        return null;
    }

    for (const checker of extraChecks) {
        const output = checker();
        if (output) {
            res.status(output.status || 400).send(output);
            return null;
        }
    }

    if (!aiApiKey) {
        res.status(500).send({ status: 500, message: 'AI service is not configured yet', result: 'error' });
        return null;
    }

    limitAdd(apikey);
    return true;
}

async function sendChatModel(model, prompt) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiApiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message || 'failed to fetch ai response');
    }

    return {
        id: data.id || null,
        model: data.model || model,
        result: data.choices?.[0]?.message?.content || '',
        usage: data.usage || null
    };
}

async function sendEmbeddingModel(model, text, imageUrl) {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiApiKey}`
        },
        body: JSON.stringify({
            model,
            input: [
                {
                    content: [
                        { type: 'text', text },
                        { type: 'image_url', image_url: imageUrl }
                    ]
                }
            ],
            encoding_format: 'float'
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message || 'failed to fetch embedding response');
    }

    return {
        model: data.model || model,
        embedding: data.data?.[0]?.embedding?.slice(0, 20) || [],
        dimensions: data.data?.[0]?.embedding?.length || 0
    };
}

function createChatHandler(model) {
    return async (req, res) => {
        const { text } = req.query;
        const isValid = await validateRequest(req, res, [
            () => !text ? { status: 400, message: 'text parameter cannot be empty', result: 'error' } : null
        ]);
        if (!isValid) return;

        try {
            const result = await sendChatModel(model, text);
            return res.status(200).json({ status: 200, result });
        } catch (error) {
            console.log(error);
            return res.status(500).send({ status: 500, message: error.message || 'An internal error occurred', result: 'error' });
        }
    };
}

async function llamaNemotronEmbedVl(req, res) {
    const { text, imageUrl } = req.query;
    const isValid = await validateRequest(req, res, [
        () => !text ? { status: 400, message: 'text parameter cannot be empty', result: 'error' } : null,
        () => !imageUrl ? { status: 400, message: 'imageUrl parameter cannot be empty', result: 'error' } : null
    ]);
    if (!isValid) return;

    try {
        const result = await sendEmbeddingModel('nvidia/llama-nemotron-embed-vl-1b-v2:free', text, imageUrl);
        return res.status(200).json({ status: 200, result });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ status: 500, message: error.message || 'An internal error occurred', result: 'error' });
    }
}

module.exports = {
    ling26: createChatHandler('inclusionai/ling-2.6-flash:free'),
    nemotron3super120b: createChatHandler('nvidia/nemotron-3-super-120b-a12b:free'),
    gptoss120b: createChatHandler('openai/gpt-oss-120b:free'),
    glm45air: createChatHandler('z-ai/glm-4.5-air:free'),
    nemotron3nano30b: createChatHandler('nvidia/nemotron-3-nano-30b-a3b:free'),
    nemotronnano12bvl: createChatHandler('nvidia/nemotron-nano-12b-v2-vl:free'),
    qwen3coder: createChatHandler('qwen/qwen3-coder:free'),
    llamaNemotronEmbedVl
};
