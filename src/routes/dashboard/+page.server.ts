import { redirect } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";
import { API } from "$env/static/private";
import type { Actions } from "./$types";
//GET (on load)
export const load = async ({ cookies, locals }) => {
  const accessToken = cookies.get("accessToken");
  if (!locals.user || !accessToken) {
    throw redirect(303, "/login");
  }
  try {
    const response = await fetch(`${API}/ur?userId=${locals.user.id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      const restaurants = await response.json();
      const response2 = await fetch(`${API}/reserved-restaurants`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const reservations = await response2.json();
      return {
        restaurants,
        reservations,
      };
    } else {
      const errorText = await response.text();
      console.error(response.status, errorText);
      throw new Error(`${response.status}`);
    }
  } catch (error) {
    console.error("Network or other error:", error);
    throw error;
  }
};
//get user reservations
//POST
export const actions: Actions = {
  createRestaurant: async ({ request }) => {
    const data = await request.formData();
    const restaurantName = data.get("restaurantName")?.toString().trim();
    const restaurantCode = data.get("restaurantCode")?.toString().trim();
    console.log(restaurantCode, restaurantName);

    const response = await fetch(`${API}/create-restaurant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        RestaurantName: restaurantName,
        RestaurantCode: restaurantCode,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      //dontnet errors
      const errorMsg = err.errors
        ? Object.values(err.errors).flat().join(", ")
        : "Create failed";
      return fail(400, { error: errorMsg, message: "nauurr" });
    }

    return { success: true, message: "ok,  bro" };
  },
};
