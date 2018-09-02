import Search from "./models/Search";
import Recipe from "./models/recipe";
import List from "./models/list";
import Likes from "./models/likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import {
    elements,
    renderLoader,
    clearLoader
} from "./views/base";



/** Global state of the app
 * Search object
 * Curent Recipe object
 * Shopping list object
 * Liked recipes
 */
const state = {};


const controlSearch = async () => {
    //1. Get Query from view
    const query = searchView.getInput();


    if (query) {
        //2. New search object and add to state
        state.search = new Search(query);

        //3.  Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            //4. Search for results

            await state.search.getResults();

            //5. Render results on UI
            searchView.renderResults(state.search.result);
            clearLoader();
        } catch (err) {
            alert("Something went wrong with the search");
            clearLoader();
        }

    }
}

elements.searchForm.addEventListener("submit", e => {
    e.preventDefault();
    controlSearch();
});




elements.resultsPages.addEventListener("click", e => {
    const btn = e.target.closest(".btn-inline");
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

const controlRecipe = async () => {
    const id = window.location.hash.replace("#", "");


    if (id) {
        //Prepre UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        //highlight selected search item
        if (state.search) searchView.highlightSelected(id);
        //create new recipe object
        state.recipe = new Recipe(id);

        try {
            //get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );
        } catch (err) {
            console.log(err);
            alert("Error processing recipe!");
        }
    }
};


["hashchange", "load"].forEach(event => window.addEventListener(event, controlRecipe));

const controlList = () => {
    if (!state.list) state.list = new List();

    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//handle list item events
elements.shopping.addEventListener("click", e => {
    const id = e.target.closest(".shopping__item").dataset.itemid;

    //delete button
    if (e.target.matches(".shopping__delete, .shopping__delete * ")) {
        //delete from state
        state.list.deleteItem(id);

        //delete from UI
        listView.deleteItem(id);

        //handle count update
    } else if (e.target.matches(".shopping__count-value")) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});




const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //user has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);

        likesView.toggleLikeBtn(true);

        likesView.renderLike(newLike);

        //user has already liked current recipe
    } else {
        state.likes.deleteLike(currentID);

        likesView.toggleLikeBtn(false);

        likesView.deleteLike(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener("load", () => {
    
    state.likes = new Likes();
    
    state.likes.readStorage();

    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => likesView.renderLike(like));
});

//handling recipe button clicks
elements.recipe.addEventListener("click", e => {
    if (e.target.matches(".btn-decrease, .btn-decrease *")) {
        if (state.recipe.servings > 1) {
            state.recipe.updateServings("dec");
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches(".btn-increase, .btn-increase *")) {
        state.recipe.updateServings("inc");
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
        controlList();
    } else if (e.target.matches(".recipe__love, .recipe__love *")) {
        controlLike();
    }

});

