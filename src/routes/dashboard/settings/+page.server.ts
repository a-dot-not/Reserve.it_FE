import { fail, type Actions } from "@sveltejs/kit";
import { writeFileSync } from "fs";
import { API } from "$env/static/private";

export function load({ locals }) {
  return {
    locals,
  };
}
export const actions: Actions = {
  default: async ({ request, cookies, locals }) => {
    const email = locals.user.email!;
    const accessToken = cookies.get("accessToken");
    const formData = await request.formData();
    const file = formData.get("avatar") as File;
    const purpose = "avatar";

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
      const profilePictureUrl = `/uploads/${purpose}-${timestamp}-${file.name}`;

      console.log(JSON.stringify({ email, profilePictureUrl }));
      const response = await fetch(`${API}/set-profile-image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, profilePictureUrl }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.log(err); //.net errors
        return fail(400, "Incorrect email or password");
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
};
