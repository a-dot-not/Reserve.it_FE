<script lang="ts">
    import { Mail } from "lucide-svelte";
    export let href: string | null = null;
    export let type: "submit" | "button" | "reset" = "button";
</script>

<svelte:element
    this={href ? "a" : "button"}
    {href}
    {type}
    class="group relative inline-flex items-stretch overflow-hidden bg-[#2300B0] font-sans text-white transition-transform active:scale-98 shadow-sm rounded-lg hover:transition hover:rounded-none w-full"
>
    <div class="flex items-center transition-colors px-6">
        <Mail />
    </div>
    <div class="flex items-center px-6 py-3 font-medium text-lg tracking-wide">
        <slot>Send email confirmation</slot>
    </div>

    <div class="flex items-center transition-colors">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="h-5 w-5 transform transition-transform group-hover:translate-x-1"
        >
            <path d="M8 5v14l11-7z" />
        </svg>
    </div>
</svelte:element>
