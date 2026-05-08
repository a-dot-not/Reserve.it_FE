<script lang="ts">
    import type { SubmitFunction } from "@sveltejs/kit";
    import { enhance } from "$app/forms";

    let restaurantName = $state("");
    let restaurantCode = $state("");
    let resultStatus = $state<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const handleSubmit: SubmitFunction = () => {
        resultStatus = null;

        return async ({ result, update }) => {
            if (result.type === "success") {
                resultStatus = {
                    type: "success",
                    text: "Restaurant Created",
                };
            } else if (result.type === "failure") {
                resultStatus = {
                    type: "error",
                    text:
                        (result.data as any)?.error ??
                        "An unexpected error occurred.",
                };
            }
            await update();
        };
    };
</script>

<form
    class="flex justify-start px-38"
    method="POST"
    action="?/createRestaurant"
    use:enhance={handleSubmit}
>
    <input
        type="text"
        id="restaurantName"
        name="restaurantName"
        placeholder="Enter restaurant name here"
        required
        class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#2300B0] focus:outline-none"
        bind:value={restaurantName}
    />
    <input
        type="text"
        id="restaurantCode"
        name="restaurantCode"
        placeholder="CHANGE"
        required
        class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#2300B0] focus:outline-none"
        bind:value={restaurantCode}
    /><button
        class="bg-[#2300B0] px-4 flex items-center justify-center"
        type="submit"
    >
        <p class="text-white">➤</p>
    </button>
</form>
{#if resultStatus}
    <div
        class="mb-4 p-3 rounded text-sm {resultStatus.type === 'error'
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'}"
    >
        {resultStatus.text}
    </div>
{/if}
