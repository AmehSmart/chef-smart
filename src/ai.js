const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients.

If the user specifies a meal type (e.g. breakfast, lunch, dinner, snack, dessert), the recipe must fit that meal type.

If the user specifies a measurement system (metric or imperial), use that system consistently for all ingredient measurements:
- Metric: grams (g), kilograms (kg), milliliters (ml), liters (l), Celsius
- Imperial: ounces (oz), pounds (lb), cups, tablespoons, teaspoons, Fahrenheit

Format your response in markdown to make it easier to render to a web page
`

function buildUserPrompt(ingredientsString, mealType, measurementSystem) {
    let prompt = `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!`

    if (mealType) {
        prompt += ` I'd like it to be a ${mealType}.`
    }

    if (measurementSystem) {
        prompt += ` Please give measurements in the ${measurementSystem} system.`
    }

    return prompt
}

// ... (Anthropic and Mistral functions can be updated the same way if you use them)

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

const FREE_MODELS = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b:free",
    "openai/gpt-oss-120b:free",
]

async function callOpenRouter(model, userPrompt) {
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
                { role: "user", content: userPrompt }
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

export async function getRecipeFromOpenRouter(ingredientsArr, mealType, measurementSystem) {
    const ingredientsString = ingredientsArr.join(", ")
    const userPrompt = buildUserPrompt(ingredientsString, mealType, measurementSystem)

    for (const model of FREE_MODELS) {
        try {
            const result = await callOpenRouter(model, userPrompt)
            console.log(`Recipe generated using: ${model}`)
            return result
        } catch (err) {
            console.warn(`Model "${model}" failed: ${err.message}. Trying next...`)
        }
    }

    console.error("All free models failed.")
    return "Sorry, I couldn't generate a recipe right now. Please try again in a moment."
}