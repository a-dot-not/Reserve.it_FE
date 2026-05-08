import type { PageServerLoad } from "./$types";
import { API } from "$env/static/private";
import type { Actions } from "./$types";

//Load data on page load
export const load = (async ({ url, fetch }) => {
  const query = url.searchParams.get("query");

  //Apply search query if given
  if (query) {
    //Search load (restaurants that correspond to query)
    const res = await fetch(`${API}/search?query=${query}`);
    const restaurants = await res.json();
    return { restaurants, isSearch: true };
  }
  //Default load (all restaurants)
  const res = await fetch(`${API}/restaurants`);
  const restaurants = await res.json();
  return { restaurants, isSearch: false };
}) satisfies PageServerLoad;

//Search action for element at "$lib/components/ui/Search.svelte";
export const actions: Actions = {
  search: async ({ request }) => {
    const formData = await request.formData();
    const query = formData.get("query");

    const response = await fetch(`${API}/search?query=${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const err = await response.json();
      return err;
    }
    const restaurants = await response.json();
    return restaurants;
  },
};
