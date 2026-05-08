import { fail } from "@sveltejs/kit";
import { API } from "$env/static/private";
import type { Actions } from "./$types";

//Calling register from anywhere in the app (considering modal)
export const actions: Actions = {
  register: async ({ request }) => {
    const data = await request.formData();
    const email = data.get("email")?.toString().trim();
    const password = data.get("password")?.toString().trim();
    const confirmPassword = data.get("confirmPassword")?.toString().trim();
    const expression: RegExp =
      /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;

    if (!expression.test(email)) {
      return fail(400, {
        error: "Invalid email",
      });
    }
    if (password != confirmPassword) {
      return fail(400, {
        error: "Passwords dont match",
      });
    }
    if (!email || !password || !confirmPassword) {
      return fail(400, {
        error: "All fields are required",
      });
    }

    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const err = await response.json();
        const generalErrors = err.errors[""] ? err.errors[""].join(" ") : "";
        const fieldErrors = err.errors;

        return fail(400, {
          error: generalErrors || "Registration failed",
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

      return {
        success: true,
        message: "Please check your email to confirm account.",
      };
    } catch (err) {
      return fail(503, {
        error: "503: Service Unavailable",
      });
    }
  },
};
