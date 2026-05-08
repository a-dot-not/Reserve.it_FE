import { fail, redirect } from "@sveltejs/kit";
import { API } from "$env/static/private";
import type { Actions } from "./$types";
import type { PageServerLoad } from "./$types";

//Loading data on page load
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, "/dashboard");
  }
};
export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    const response = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.log(err); //.net errors
      return fail(400, "Incorrect email or password");
    }

    const data = await response.json();

    cookies.set("accessToken", data.token, {
      path: "/",
      httpOnly: true,
      secure: false,
    });

    //Manual Set-Cookie header due to .NET and SvelteKit incompatibility
    const setCookieHeader = response.headers.get("set-cookie");

    if (setCookieHeader) {
      //Simple parser to forward the RefreshToken
      const parts = setCookieHeader.split(".");
      const refreshTokenPart = parts.find((p) =>
        p.trim().startsWith("RefreshToken="),
      );
      if (refreshTokenPart) {
        const value = refreshTokenPart.split("=")[1];
        cookies.set("RefreshToken", value, {
          path: "/",
          httpOnly: true,
          secure: false,
        });
      }
    }
    throw redirect(302, "/dashboard");
  },
};
