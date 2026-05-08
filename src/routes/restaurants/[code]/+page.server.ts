import type { PageServerLoad } from "./$types";
import { API } from "$env/static/private";

//Load data on page load
export const load = (async ({ params }) => {
  const normalizedCode = params.code.trim().toUpperCase();
  try {
    const response = await fetch(
      `${API}/get-restaurant-by-code?code=${normalizedCode}`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      },
    );
    if (response.ok) {
      const restaurant = await response.json();
      console.log(restaurant.id);
      const filtersResponse = await fetch(
        `${API}/fr/?restaurantId=${restaurant.id}`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        },
      );
      if (filtersResponse.ok) {
        const filters = await filtersResponse.json();
        console.log("EaaaNFEK");
        return {
          restaurant: restaurant,
          filters: filters,
        };
      } else {
        console.log(filtersResponse);
        console.error("Failed to load filters:", filtersResponse.status);
      }
    }
  } catch (error) {
    console.error("Network or other error:", error);
    throw error;
  }
}) satisfies PageServerLoad;
