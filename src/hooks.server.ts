import type { Handle } from "@sveltejs/kit";
import { API } from "$env/static/private";

export const handle: Handle = async ({ event, resolve }) => {
  const accessToken = event.cookies.get("accessToken");

  const fetchUserInfo = async (token: string) => {
    const response = await fetch(`${API}/user-info`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  };

  if (accessToken) {
    let response = await fetchUserInfo(accessToken);

    if (response.status === 401) {
      //Refresh
      const refreshResponse = await fetch(`${API}/refresh`, {
        method: "POST",
        headers: {
          cookie: event.request.headers.get("cookie") || "",
        },
      });
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newAccessToken = data.token;

        event.cookies.set("accessToken", newAccessToken, {
          path: "/",
          httpOnly: true,
          secure: false, //Set to true with https
        });

        response = await fetchUserInfo(newAccessToken);
      } else {
        //Refresh failed (token revoked or expired), clear cookies
        event.cookies.delete("accessToken", { path: "/" });
      }
    }

    if (response.ok) {
      const user = await response.json();
      event.locals.user = {
        id: user.id,
        email: user.name,
        isAuthenticated: user.isAuthenticated,
        profilePictureUrl: user.profilePictureUrl,
      };
    } else {
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }
  return await resolve(event);
};
