import type { PageServerLoad } from "./$types";
import { API } from "$env/static/private";
//Load data on page load
export const load = (async ({ url, fetch }) => {
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return {
      isSuccess: false,
      message: "Invalid confirmation link: Missing token or email",
    };
  }
  try {
    const res = await fetch(`${API}/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token, email }),
    });
    if (!res.ok) {
      //Read error message from response
      const errorData = await res.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        "Verification failed. The link may be invalid or expired";
      return {
        isSuccess: false,
        message: errorMessage,
      };
    }
    return {
      isSuccess: true,
      message:
        "Your email has been successfully verified! Redirecting to login...",
    };
  } catch (err) {
    console.error("Verification error:", err);
    return {
      isSuccess: false,
      message: "An unexpected error occurred during verification",
    };
  }
}) satisfies PageServerLoad;
