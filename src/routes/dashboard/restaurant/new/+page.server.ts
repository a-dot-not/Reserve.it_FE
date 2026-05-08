import { API } from "$env/static/private";
import { fail, redirect, type Actions } from "@sveltejs/kit";

export const actions: Actions = {
  createRestaurant: async ({ locals, request, cookies }) => {
    const data = await request.formData();
    const restaurantName = data.get("restaurantName")?.toString().trim();
    const restaurantCode = data.get("restaurantCode")?.toString().trim();
    const createdById = locals.user?.id;
    const accessToken = cookies.get("accessToken");
    console.log(
      JSON.stringify({
        createdById,
        restaurantName,
        restaurantCode,
      }),
    );

    try {
      const response = await fetch(`${API}/create-restaurant`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          createdById,
          restaurantName,
          restaurantCode,
        }),
      });
      console.log(response);
      if (!response.ok) {
        const err = await response.json();
        const generalErrors = err.errors[""] ? err.errors[""].join(" ") : "";
        const fieldErrors = err.errors;

        return fail(400, {
          error: generalErrors || "Creating restaurant failed",
          details: fieldErrors,
        });
      }
      if (!response.ok) {
        const err = await response.json();
        //Errors from backend
        const errorMsg = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : "Registration failed";
        return fail(400, { error: errorMsg });
      }
      throw redirect(302, "/dashboard");
      //Redirect to restaurant detail
    } catch (err) {
      return fail(503, {
        error: `${err}`,
      });
    }
  },
};
