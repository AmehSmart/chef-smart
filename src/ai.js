import Anthropic from "@anthropic-ai/sdk"
import { HfInference } from '@huggingface/inference'

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page
`

// Initialize Anthropic using Vite's environment variables syntax
const anthropic = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true,
})

export async function getRecipeFromChefClaude(ingredientsArr) {
    const ingredientsString = ingredientsArr.join(", ")

    const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
            { role: "user", content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!` },
        ],
    });
    return msg.content[0].text
}

// Initialize Hugging Face using Vite's environment variables syntax
const hf = new HfInference(import.meta.env.VITE_HF_ACCESS_TOKEN)

export async function getRecipeFromMistral(ingredientsArr) {
    const ingredientsString = ingredientsArr.join(", ")
    try {
        const response = await hf.chatCompletion({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!` },
            ],
            max_tokens: 1024,
        })
        return response.choices[0].message.content
    } catch (err) {
        console.error(err.message)
    }
}



const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

// Ordered fallback list — tried in sequence until one succeeds
const FREE_MODELS = [
    "openrouter/free",              // auto-picks from currently available free models
    "meta-llama/llama-3.3-70b:free",
    "openai/gpt-oss-120b:free",
]

async function callOpenRouter(model, ingredientsString) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Recipe App"
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `I have ${ingredientsString}. Please give me a recipe!` }
            ],
            max_tokens: 1024
        })
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error?.message || `Request failed with status ${response.status}`)
    }

    return data.choices[0].message.content
}

export async function getRecipeFromOpenRouter(ingredientsArr) {
    const ingredientsString = ingredientsArr.join(", ")

    for (const model of FREE_MODELS) {
        try {
            const result = await callOpenRouter(model, ingredientsString)
            console.log(`Recipe generated using: ${model}`)
            return result
        } catch (err) {
            console.warn(`Model "${model}" failed: ${err.message}. Trying next...`)
        }
    }

    console.error("All free models failed.")
    return "Sorry, I couldn't generate a recipe right now. Please try again in a moment."
}