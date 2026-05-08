import type { PageServerLoad } from "./$types";
import { fail, redirect, type Actions } from "@sveltejs/kit";
import { API } from "$env/static/private";

//Load data on page load
export const load = (async () => {
  try {
    const response = await fetch(`${API}/filters`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    });
    const filters = await response.json();
    const response2 = await fetch(`${API}/restaurants`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    });

    const restaurants = await response2.json();
    return {
      restaurants: restaurants,
      filters: filters,
    };
  } catch {
    return {
      error: "backend not runnin",
    };
  }
}) satisfies PageServerLoad;
export const actions: Actions = {
  //Matches the action="?/getRestaurantByCode" at +page.svelte
  getRestaurantByCode: async ({ request }) => {
    const data = await request.formData();
    const restaurantCode = data
      .get("restaurantCode")
      ?.toString()
      .toUpperCase()
      .trim();
    if (!restaurantCode) {
      return fail(400, { error: "Restaurant code " });
    }
    //Add regex validation here for the code format "##-000-000"
    const codePattern = /^[A-Z]{2}-\d{3}-\d{3}$/;
    if (!codePattern.test(restaurantCode)) {
      return fail(400, { error: "Invalid code format. Expected: XX-000-000" });
    }
    try {
      const response = await fetch(
        `${API}/get-restaurant-by-code?code=${restaurantCode}`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        },
      );
      if (response.ok) {
        const restaurant = await response.json();
        console.log(restaurant);

        redirect(302, `/restaurants/${restaurant.restaurantCode}`);
      } else {
        const errorText = await response.text();
        console.error(response.status, errorText);
        throw new Error(`${response.status}`);
      }
    } catch (error) {
      console.error("Network or other error:", error);
      throw error;
    }
  },
  logout: async ({ cookies, request }) => {
    const accessToken = cookies.get("accessToken");

    //Revoke token on backend
    await fetch(`${API}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        //Give the refresh token
        cookie: request.headers.get("cookie") || "",
      },
    });
    console.log("logged out");

    //Clear tokens on frontend
    cookies.delete("accessToken", { path: "/" });
    cookies.delete("RefreshToken", { path: "/" });
    console.log("Logged out");
    throw redirect(302, "/login");
  },
};
