import React from "react"
import IngredientsList from "./components/IngredientsList"
import ClaudeRecipe from "./components/ClaudeRecipe"
import { getRecipeFromChefClaude, getRecipeFromMistral, getRecipeFromOpenRouter } from "./ai"

export default function Main() {
    const [ingredients, setIngredients] = React.useState(
        []
    )
    const [recipe, setRecipe] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState("")

    async function getRecipe() {
        setIsLoading(true)
        setError("")
        setRecipe("")

        try {
            const recipeMarkdown = await getRecipeFromOpenRouter(ingredients)
            setRecipe(recipeMarkdown)
        } catch (err) {
            setError("Something went wrong generating your recipe. Please try again.")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    function addIngredient(formData) {
        const newIngredient = formData.get("ingredient")
        setIngredients(prevIngredients => [...prevIngredients, newIngredient])
    }

    return (
    <main>
        <form action={addIngredient} className="add-ingredient-form">
            <input
                type="text"
                placeholder="e.g. oregano"
                aria-label="Add ingredient"
                name="ingredient"
            />
            <button>Add ingredient</button>
        </form>

        <div className="app-layout">
            {ingredients.length > 0 &&
                <IngredientsList
                    ingredients={ingredients}
                    getRecipe={getRecipe}
                    isLoading={isLoading}
                />
            }

            <div className="recipe-panel">
                {isLoading && <p className="loading-message">Generating your recipe...</p>}
                {error && <p className="error-message">{error}</p>}
                {recipe && <ClaudeRecipe recipe={recipe} />}
            </div>
        </div>
    </main>
)
}