import { API } from "$env/static/private";
import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { writeFileSync } from "fs";

//Load on page load
export const load = (async ({ params }) => {
  console.log(params.id);
  try {
    const response = await fetch(`${API}/r/${params.id}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    });
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
        const usersResponse = await fetch(`${API}/${restaurant.id}/users`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        });
        const restaurantUsers = await usersResponse.json();
        const reservationsResponse = await fetch(
          `${API}/reservations-for-restaurant?restauarntId=${restaurant.id}`,
        );
        if (!response.ok) {
          error(response.status, "Failed to fetch reservations");
        }

        const reservations = await reservationsResponse.json();
        return {
          restaurantUsers: restaurantUsers,
          restaurant: restaurant,
          filters: filters,
          reservations: reservations,
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

export const actions: Actions = {
  updateRestaurant: async ({ request, cookies }) => {
    const accessToken = cookies.get("accessToken");
    const data = await request.formData();
    const id = data.get("Id")?.toString().trim();
    const restaurantName = data.get("restaurantName")?.toString().trim();
    const reservationsDuration = Number(data.get("reservationsDuration"));
    const openingHourAndMinute = data
      .get("openingHourAndMinute")
      ?.toString()
      .trim();
    const closingHourAndMinute = data
      .get("closingHourAndMinute")
      ?.toString()
      .trim();
    const priceRange = data.get("priceRange")?.toString().trim();
    const description = data.get("description")?.toString().trim();
    const published = false;

    console.log(
      JSON.stringify({
        id,
        restaurantName,
        reservationsDuration,
        openingHourAndMinute,
        closingHourAndMinute,
        priceRange,
        description,
        published,
      }),
    );
    try {
      const response = await fetch(`${API}/update-restaurant/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id,
          restaurantName,
          reservationsDuration,
          openingHourAndMinute,
          closingHourAndMinute,
          priceRange,
          description,
          published,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        console.log(err);
        const generalErrors = err.errors[""] ? err.errors[""].join(" ") : "";
        const fieldErrors = err.errors;

        return fail(400, {
          error: generalErrors || "Updating restaurant failed",
          details: fieldErrors,
        });
      }

      return {
        success: true,
      };
    } catch (err) {
      return fail(503, {
        error: `${err}`,
      });
    }
  },
  uploadResImage: async ({ request, cookies }) => {
    const accessToken = cookies.get("accessToken");
    const formData = await request.formData();
    const file = formData.get("avatar") as File;
    const id = formData.get("Id");
    const purpose = "restaurant";

    //Validation
    if (!file || file.size === 0) {
      return fail(400, { error: "No file uploaded" });
    }

    if (file.size > 5 * 1024 * 1024) {
      //5MB limit
      return fail(400, { error: "File is too large" });
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const timestamp = Date.now();
      const imageUrl = `/uploads/${purpose}-${timestamp}-${file.name}`;

      console.log(JSON.stringify({ id, imageUrl }));
      const response = await fetch(`${API}/set-restaurant-image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, imageUrl }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.log(err); //.net errors
        return fail(400, "Incorrect restaurantId");
      }
      //Save to local filesystem (for local dev)
      const filePath = `static/uploads/${purpose}-${timestamp}-${file.name}`;
      writeFileSync(filePath, buffer);

      return { success: true, message: "Upload successful!" };
    } catch (err) {
      console.error(err);
      return fail(500, { error: "Internal server error" });
    }
  },
  createFilter: async ({ request, fetch, cookies }) => {
    const data = await request.formData();
    const accessToken = cookies.get("accessToken");
    const filterName = data.get("filterName")?.toString();
    const restaurantId = data.get("restaurantId")?.toString();
    const response = await fetch(`${API}/create-filter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        restaurantId,
        filterName,
      }),
    });

    if (!response.ok) {
      console.log(response.status);
      return fail(response.status, { message: "Failed to create filter" });
    }
    const filter = await response.json();
    console.log(filter);
    return filter;
  },

  addFilter: async ({ request, fetch, cookies }) => {
    const data = await request.formData();
    const accessToken = cookies.get("accessToken");

    const restaurantId = data.get("restaurantId");
    const filterId = data.get("filterId");

    const response = await fetch(
      `${API}/add-filter/${restaurantId}+${filterId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          restaurantId,
          filterId,
        }),
      },
    );

    if (response.status === 204) return { success: true };

    if (!response.ok) {
      console.log(response);
      return fail(response.status);
    }
    console.log("success");
    return await response.json();
  },
  addUser: async ({ request, fetch }) => {
    const data = await request.formData();
    const restaurantId = data.get("restaurantId")?.toString();
    const userId = data.get("userId")?.toString();
    const role = Number(data.get("role"));

    if (!restaurantId || !userId || !role) {
      return fail(400, { error: "Missing required fields to add user." });
    }
    console.log("adding user");
    try {
      const res = await fetch(`${API}/${restaurantId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      console.log(res);
      if (!res.ok) {
        const errorData = await res.text();
        return fail(res.status, { error: errorData || "Failed to add user." });
      }

      return { success: true };
    } catch (err) {
      return fail(500, { error: "Could not connect to the server." });
    }
  },

  updateUserRole: async ({ request, fetch }) => {
    const data = await request.formData();
    const restaurantId = data.get("restaurantId")?.toString();
    const userId = data.get("userId")?.toString();
    const role = Number(data.get("role"));

    if (!restaurantId || !userId || !role) {
      return fail(400, { error: "Missing required fields." });
    }
    console.log("HEREHERE");
    try {
      const res = await fetch(`${API}/${restaurantId}/users/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, userId, role }),
      });
      console.log(res);
      if (!res.ok)
        return fail(res.status, { error: "Failed to update user role." });
      return { success: true };
    } catch (err) {
      return fail(500, { error: "Could not connect to the server." });
    }
  },

  removeUser: async ({ request, fetch }) => {
    const data = await request.formData();
    const restaurantId = data.get("restaurantId")?.toString();
    const userId = data.get("userId")?.toString();

    if (!restaurantId || !userId) {
      return fail(400, { error: "Missing required fields." });
    }

    try {
      const res = await fetch(`${API}/${restaurantId}/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) return fail(res.status, { error: "Failed to remove user." });
      return { success: true };
    } catch (err) {
      return fail(500, { error: "Could not connect to the server." });
    }
  },
};
