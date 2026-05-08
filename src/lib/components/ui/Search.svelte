<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation"; // Use goto for client-side redirect
    import type { SubmitFunction } from "@sveltejs/kit";
    import { resolve } from "$app/paths";

    let { showSearch = $bindable(false) } = $props();

    let dialog: HTMLDialogElement | undefined = $state();
    let searchQuery = $state(""); // Bound to input
    let resultStatus = $state<{
        type: "success" | "error";
        text?: string;
    } | null>(null);

    $effect(() => {
        if (showSearch) {
            dialog?.showModal();
        } else {
            dialog?.close();
        }
    });

    const handleSubmit: SubmitFunction = ({ formData }) => {
        resultStatus = null;
        // Grab the query directly from the form before it's sent
        const q = formData.get("searchQuery")?.toString();

        return async ({ result }) => {
            if (result.type === "success") {
                showSearch = false; // Close dialog
                goto(
                    resolve(
                        `/restaurants?query=${encodeURIComponent(q || "")}`,
                    ),
                );
            } else if (result.type === "failure") {
                resultStatus = {
                    type: "error",
                    text: (result.data as any)?.error ?? "Search failed.",
                };
            }
        };
    };
</script>

<dialog
    bind:this={dialog}
    onclose={() => (showSearch = false)}
    onclick={() => (showSearch = false)}
    class="m-auto rounded-lg p-0 shadow-2xl backdrop:bg-black/60 overflow-hidden"
>
    <div
        class="relative block w-[90vw] max-w-md bg-white p-8"
        onclick={(e) => e.stopPropagation()}
    >
        {#if resultStatus}
            <div
                class="mb-4 p-3 rounded text-sm {resultStatus.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'}"
            >
                {resultStatus.text}
            </div>
        {/if}

        <!-- Linked to search action at restaurants/ -->
        <form
            method="POST"
            action="/restaurants?/search"
            use:enhance={handleSubmit}
            class="flex"
        >
            <input
                name="searchQuery"
                bind:value={searchQuery}
                placeholder="Search name, description, or filters..."
                required
                class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#2300B0] focus:outline-none"
            />
            <button
                class="bg-[#2300B0] px-4 flex items-center justify-center rounded-r-md"
                type="submit"
            >
                <span class="text-white">➤</span>
            </button>
        </form>
    </div>
</dialog>
