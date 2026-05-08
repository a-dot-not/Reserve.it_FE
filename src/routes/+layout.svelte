<script lang="ts">
    //Application
    import "../app.css";
    import { resolve } from "$app/paths";
    let { children, data } = $props();

    //Components
    import Register from "$lib/components/ui/Register.svelte";
    import Search from "$lib/components/ui/Search.svelte";

    //Properties
    import { t, locale, locales } from "../i18n";
    let isRegisterOpen = $state(false);
    let isSearchOpen = $state(false);

    const user = $derived(data.locals.user);
</script>

<div
    class="h-2 bg-gradient-to-r from-[#2300B0] to-[#2E2E2E] flex items-center px-4 gap-3 shrink-0 shadow-sm"
></div>
<nav class="py-12 flex gap-18 justify-center">
    <a href={resolve("/")} class="text-4xl font-poppins-bold">
        <span class="text-[#2300B0]">Reserve</span><span class="text-[#2E2E2E]"
            >.it</span
        >
    </a>
    <div class="flex gap-8">
        <a
            href={resolve("/restaurants")}
            class="m-auto font-poppins-semi-bold text-[#2300B0] text-xl justify-between gap-4 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-[#2300B0] after:transition-all after:duration-100 hover:after:w-full"
            >{$t("nav.browse")}</a
        >
        <a
            href={resolve("/about")}
            class="m-auto nav-link-black text-xl relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-black after:transition-all after:duration-100 hover:after:w-full"
            >{$t("nav.about")}</a
        >
    </div>
    <button
        onclick={() => (isSearchOpen = true)}
        class="text-xl font-poppins-regular mr-20 px-4 py-2 border border-black rounded-full text-black font-medium hover:cursor-text"
    >
        <span class="mr-2 text-lg">🔍︎</span>
        <span>{$t("nav.search")}</span>
        <span class="text-[#2300B0] ml-25">ctrl + k</span>
    </button>
    <div class="flex gap-4">
        {#if user}
            <span class="text-sm font-medium"
                ><a href={resolve("/dashboard")}>{user.email}</a></span
            >
            <img id="avatar" src={user.profilePictureUrl} alt="Avatar" />
            <a
                href={resolve("/logout")}
                class="text-xl font-poppins-semi-bold bg-red-600 text-white px-6 py-2 rounded-lg hover:rounded-none"
            >
                {$t("nav.logout")}
            </a>
        {:else}
            <button
                onclick={() => (isRegisterOpen = true)}
                class="text-xl font-poppins-regular px-6 py-2 border border-black rounded-lg text-black font-medium hover:bg-black hover:text-white transition hover:rounded-none hover:cursor-pointer"
            >
                {$t("nav.register")}
            </button>
            <a
                href={resolve("/login")}
                class="text-xl font-poppins-semi-bold bg-[#2300B0] text-white px-6 py-2 rounded-lg hover:rounded-none"
            >
                {$t("nav.login")}
            </a>
        {/if}
        <p
            class="m-auto font-poppins-semi-bold text-[#2300B0] text-xl justify-between gap-4 relative"
        >
            <select bind:value={$locale}>
                {#each locales as l}
                    <option value={l}>{l}</option>
                {/each}
            </select>
        </p>
    </div>
</nav>
<Register bind:showModal={isRegisterOpen} />
<Search bind:showSearch={isSearchOpen} />

{@render children()}

<style>
    #avatar {
        border-radius: 50%;
        width: 64px;
        height: 64px;
        object-fit: cover;
    }
</style>
