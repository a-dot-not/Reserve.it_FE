import type { PageServerLoad } from "./$types";
import type { Actions } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";
import { API } from "$env/static/private";

//Load data on page load
export const load = (async ({ params }) => {
  try {
    const response = await fetch(`${API}/r/${params.id}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    });
    if (response.ok) {
      const restaurant = await response.json();
      console.log(restaurant);
      return {
        restaurant: restaurant,
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
}) satisfies PageServerLoad;
export const actions: Actions = {
  //Save the current restaurant layout
  sync: async ({ request }) => {
    try {
      const formData = await request.formData();
      const restaurantId = formData.get("restaurantId")?.toString();
      const floorPlanStr = formData.get("floorPlan")?.toString();
      console.log(restaurantId, floorPlanStr);

      if (!restaurantId || !floorPlanStr) {
        return fail(400, {
          error: "Missing restaurant ID or floor plan data",
        });
      }
      const floorPlan = JSON.parse(floorPlanStr);

      const tableDtos = floorPlan.tables.map((table: any) => ({
        editorId: table.id.toString(),
        identification: table.identification || table.info || "Unnamed Table",
        capacity: table.capacity || 2,
      }));

      const data = {
        restaurantId: restaurantId,
        layoutJson: floorPlanStr,
        tables: tableDtos,
      };
      const response = await fetch(`${API}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      return { success: true, message: "Layout synchronized successfully" };
    } catch (error: any) {
      console.error("Failed to sync floor plan:", error);
      return fail(500, { error: error.message || "Error syncing to server" });
    }
  },
};
