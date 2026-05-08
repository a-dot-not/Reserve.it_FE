<script lang="ts">
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
</script>

<div class="bg-gray-100">
    <div class="h-screen flex flex-col justify-center items-center">
        <!-- Error status code -->
        <h1>{page.status}</h1>
        <!-- Error message -->
        <p class="text-4xl font-medium text-gray-800">{page.error?.message}</p>
        <a
            href={resolve("/")}
            class="mt-4 text-xl text-[#2300B0] hover:underline"
            >Return to home</a
        >
    </div>
</div>
