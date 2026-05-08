<script lang="ts">
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "@sveltejs/kit";
    import Button from "./Button-full.svelte";
    import GoogleLogo from "$lib/assets/Google__G__logo.svg";
    import { t } from "../../../i18n";

    // --- Props (Runes Mode) ---
    let { showModal = $bindable(false) } = $props();

    // --- State (Runes Mode) ---
    let dialog: HTMLDialogElement | undefined = $state();
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let resultStatus = $state<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    let generalErrors = $state("");
    let fieldErrors = $state("");

    $effect(() => {
        if (showModal) {
            dialog?.showModal();
        } else {
            dialog?.close();
        }
    });

    const handleSubmit: SubmitFunction = () => {
        resultStatus = null;

        return async ({ result, update }) => {
            if (result.type === "success") {
                resultStatus = {
                    type: "success",
                    text: "Check inbox to confirm registration",
                };
            } else if (result.type === "failure") {
                // In SvelteKit, errors usually come back as 'failure'
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

<dialog
    bind:this={dialog}
    onclose={() => (showModal = false)}
    class="m-auto rounded-lg p-0 shadow-2xl backdrop:bg-black/60 overflow-hidden"
>
    <div class="relative block w-[90vw] max-w-md bg-white p-8">
        <button
            type="button"
            onclick={() => (showModal = false)}
            class="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
        >
            ✕
        </button>

        <h2 class="pb-2 text-xl font-bold mb-2">{$t("register.signin")}</h2>

        <button
            class="group relative flex w-full items-center overflow-hidden rounded-lg bg-[#2300B0] font-sans text-white transition-transform active:scale-95 shadow-sm"
        >
            <div class="flex items-center px-6 transition-colors">
                <img src={GoogleLogo} alt="Google" class="h-5 w-5" />
            </div>
            <div
                class="flex flex-1 items-center py-3 text-lg font-medium tracking-wide"
            >
                {$t("register.google")}
            </div>
            <div class="flex items-center pr-8">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-5 w-5 transform transition-transform group-hover:translate-x-1"
                >
                    <path d="M8 5v14l11-7z" />
                </svg>
            </div>
        </button>

        <div class="relative my-8 border-t border-stone-300">
            <span
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-stone-400"
                >{$t("register.or")}</span
            >
        </div>

        {#if resultStatus}
            <div
                class="mb-4 p-3 rounded text-sm {resultStatus.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'}"
            >
                {resultStatus.text}
            </div>
        {/if}

        {#if resultStatus && resultStatus.type === "success"}{:else}
            <h2 class="py-2 text-xl font-bold mb-4">
                {$t("register.email")}
            </h2>
            <form
                novalidate
                method="POST"
                action="/register?/register"
                use:enhance={handleSubmit}
                class="flex flex-col gap-4"
            >
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    bind:value={email}
                    class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#2300B0] focus:outline-none"
                />
                <input
                    type="password"
                    name="password"
                    placeholder={$t("register.password")}
                    required
                    bind:value={password}
                    class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#2300B0] focus:outline-none"
                />
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder={$t("register.passwordconfirm")}
                    required
                    bind:value={confirmPassword}
                    class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#2300B0] focus:outline-none"
                />

                <Button type="submit">{$t("register.register")}</Button>
            </form>
        {/if}

        {#if generalErrors || fieldErrors}
            <span>{generalErrors}, {fieldErrors}</span>
        {/if}
    </div>
</dialog>

<style>
    :global(body:has(dialog[open])) {
        overflow: hidden;
    }
</style>
