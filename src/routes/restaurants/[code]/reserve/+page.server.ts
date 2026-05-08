import type { PageServerLoad } from "./$types";
import { API } from "$env/static/private";
import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const load = (async ({ params }) => {
  console.log(params.code);
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
export const actions = {
  fetchTable: async ({ request, fetch }) => {
    const data = await request.formData();
    const editorId = data.get("editorId");

    if (!editorId || typeof editorId !== "string") {
      return fail(400, { fetchError: "Missing or invalid table ID" });
    }

    try {
      const response = await fetch(
        `${API}/get-table-by-editorId?editorId=${editorId}`,
      );

      if (response.ok) {
        const tableData = await response.json();
        return { tableData };
      }

      if (response.status === 404) {
        return fail(404, {
          fetchError: "Table not synced with live database",
        });
      }

      return fail(response.status, { fetchError: "Error loading table data" });
    } catch (error) {
      console.error("Failed to fetch table data:", error);
      return fail(500, { fetchError: "Network error occurred on the server" });
    }
  },
  reserveTable: async ({ request, fetch }) => {
    const data = await request.formData();
    const date = data.get("dateOfReservation");
    const postgresCompatible = date.replace("T", " ") + ":00";
    console.log(postgresCompatible);

    const dataToSend = {
      restaurantId: data.get("restaurantId"),
      tableId: data.get("tableId"),
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      email: data.get("email"),
      numberOfGuests: Number(data.get("numberOfGuests")),
      dateOfReservation: postgresCompatible,
    };
    console.log(JSON.stringify(dataToSend));
    try {
      const response = await fetch(`${API}/create-anonymous-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        console.log(response);
        const errorData = await response.json().catch(() => null);
        return fail(response.status, {
          error: "Failed to create reservation.",
          details: errorData,
        });
      }

      const reservation = await response.json();
      return { success: true, reservation };
    } catch (error) {
      console.error("Reservation error:", error);
      return fail(500, { error: "Network error occurred." });
    }
  },
  userReserveTable: async ({ request, fetch, locals }) => {
    const data = await request.formData();
    const date = data.get("dateOfReservation");
    const postgresCompatible = date.replace("T", " ") + ":00";
    console.log(postgresCompatible);

    const dataToSend = {
      restaurantId: data.get("restaurantId"),
      tableId: data.get("tableId"),
      userId: locals.user?.id,
      numberOfGuests: Number(data.get("numberOfGuests")),
      dateOfReservation: postgresCompatible,
    };
    console.log(JSON.stringify(dataToSend));
    try {
      const response = await fetch(`${API}/create-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        console.log(response);
        const errorData = await response.json().catch(() => null);
        return fail(response.status, {
          error: "Failed to create reservation.",
          details: errorData,
        });
      }

      const reservation = await response.json();
      return { success: true, reservation };
    } catch (error) {
      console.error("Reservation error:", error);
      return fail(500, { error: "Network error occurred." });
    }
  },
} satisfies Actions;
