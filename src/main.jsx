import React from "react"
import IngredientsList from "./components/IngredientsList"
import ClaudeRecipe from "./components/ClaudeRecipe"
import { getRecipeFromOpenRouter } from "./ai"

export default function Main() {
    const [ingredients, setIngredients] = React.useState(
        ["chicken", "all the main spices", "corn", "heavy cream", "pasta"]
    )
    const [recipe, setRecipe] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState("")
    const [mealType, setMealType] = React.useState("")
    const [measurementSystem, setMeasurementSystem] = React.useState("metric")
    const recipeSection = React.useRef(null)
    React.useEffect(() => {
        if (recipeSection.current && recipe !== "") {
            recipeSection.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [recipe])

    async function getRecipe() {
        setIsLoading(true)
        setError("")
        setRecipe("")

        try {
            const recipeMarkdown = await getRecipeFromOpenRouter(ingredients, mealType, measurementSystem)
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

    function deleteIngredient(ingredientToDelete) {
        setIngredients(prevIngredients =>
            prevIngredients.filter(ingredient => ingredient !== ingredientToDelete)
        )
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

            <div className="preferences-form">
                <label>
                    Meal type
                    <select value={mealType} onChange={e => setMealType(e.target.value)}>
                        <option value="">Any</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                        <option value="dessert">Dessert</option>
                    </select>
                </label>

                <label>
                    Measurements
                    <select value={measurementSystem} onChange={e => setMeasurementSystem(e.target.value)}>
                        <option value="metric">Metric (g, ml, °C)</option>
                        <option value="imperial">Imperial (oz, cups, °F)</option>
                    </select>
                </label>
            </div>

            <div className="app-layout">
                {ingredients.length > 0 &&
                    <IngredientsList
                        ref = {recipeSection}
                        ingredients={ingredients}
                        getRecipe={getRecipe}
                        isLoading={isLoading}
                        deleteIngredient={deleteIngredient}
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