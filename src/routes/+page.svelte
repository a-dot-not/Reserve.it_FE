<script lang="ts">
    //Application
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { type SubmitFunction } from "@sveltejs/kit";
    let { data } = $props();

    //Components
    import { t } from "../i18n";
    import Register from "$lib/components/ui/Register.svelte";
    let isRegisterOpen = $state(false);

    let hero = "/hero.png";

    //Error messages
    let formMessage = $state<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    let resultStatus = $state<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    //Formatting filter elements
    const rawFilters = $derived(data.filters ?? []);
    const filters = $derived(
        rawFilters.map((f) => ({
            name: f.filterName,
            href: `/restaurants?query=${f.filterName}`,
            isSpecial:
                f.filterName === "Vegetarian" || f.filterName === "Vegan",
        })),
    );
    const duplicatedFilters = $derived([...filters, ...filters]);

    //Get restaurant by code
    let restaurantCode = $state("");
    const handleSubmit: SubmitFunction = () => {
        console.log("init passed");
        resultStatus = null;

        return async ({ result, update }) => {
            if (result.type === "redirect") {
                goto(resolve(`/restaurants/${restaurantCode}`));
            } else {
                //Error message
                resultStatus = {
                    type: "error",
                    text: `${result.data?.error}`,
                };
            }
        };
    };
    //on keyboard event ("ctrl + k") do ... prevent defaultz
</script>

<div class="flex gap-20 justify-center py-11">
    <div>
        <h1 class="text-6xl px-30 py-12">
            {$t("landing.title")}<br />{$t("landing.title2")}<br />{$t(
                "landing.title3",
            )}
        </h1>
        <form
            class="flex justify-start px-38"
            method="POST"
            action="?/getRestaurantByCode"
            use:enhance={handleSubmit}
        >
            <label for="restaurant-code"></label>
            <input
                type="text"
                id="restaurant-code"
                name="restaurantCode"
                placeholder={$t("landing.placeholder")}
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
        <p class="text-sm text-gray-500 mt-2 px-38">
            {$t("landing.code")}
        </p>
        {#if formMessage}
            <p
                class={formMessage.type === "error"
                    ? "error-message"
                    : "success-message"}
            >
                {formMessage.text}
            </p>
        {/if}
        {#if resultStatus}
            <div
                class="mb-4 p-3 rounded text-sm {resultStatus.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'}"
            >
                {resultStatus.text}
            </div>
        {/if}
    </div>
    <div class="my-5 w-200">
        <img src={hero} alt="Hero" />
    </div>
</div>

<div
    class="relative w-full mt-10 h-22 bg-[#2300B0] flex items-center overflow-hidden font-sans text-white"
>
    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-4 py-5 bg-[#2300B0] flex items-center gap-2 cursor-pointer"
    >
        <a
            href="#targetSection"
            class="scroll-btn text-3xl text-white font-poppins-bold flex items-center justify-center py-4.5"
        >
            {$t("landing.slider")}
        </a>
    </div>

    <div class="flex animate-marquee whitespace-nowrap">
        {#each duplicatedFilters as filter}
            <a
                href={resolve(filter.href)}
                class="text-2xl mx-6 transition-transform duration-200 hover:scale-110"
                class:text-green-400={filter.isSpecial}
                class:font-semibold={filter.isSpecial}
            >
                {filter.name}
            </a>
        {/each}
    </div>
</div>

<div
    id="targetSection"
    class="target w-full grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 justify-items-center justify-center gap-y-14 gap-x-10 bg-[#2300B0] pl-6 pr-6 pt-5 pb-8"
>
    {#each data.restaurants as restaurant (restaurant.id)}
        <div class=" bg-white p-2">
            <a href={resolve(`/restaurants/${restaurant.restaurantCode}`)}>
                <img
                    class="h-80 w-200 object-cover"
                    src={restaurant.imageUrl}
                    alt="{restaurant.restaurantName} Image"
                />
                <h1 class="ml-2 mt-2">{restaurant.restaurantName}</h1>
                <p class="ml-2 mt-1">{restaurant.description}</p>
            </a>
            <div class="flex justify-center gap-14 mt-4">
                <a
                    href={resolve("/test")}
                    class=" p-2 border border-black rounded-lg text-black font-medium hover:bg-black hover:text-white transition hover:rounded-none hover:cursor-pointer"
                    >Menu</a
                >
                <p class="m-auto">
                    {restaurant.openingHourAndMinute} - {restaurant.closingHourAndMinute}
                </p>
                <p class="m-auto">{restaurant.priceRange}</p>
                <a
                    href={resolve(
                        `/restaurants/${restaurant.restaurantCode}/reserve`,
                    )}
                    class="p-2 border border-black rounded-lg text-black font-medium hover:bg-black hover:text-white transition hover:rounded-none hover:cursor-pointer"
                    >Reserve</a
                >
            </div>
        </div>
    {/each}
</div>
<div class="bg-[#2300B0] h-10 justify-center flex">
    <a
        href={resolve("/restaurants")}
        class="p-2 margin-auto w-40 border border-white text-white rounded-lg text-black font-medium text-center hover:bg-white hover:text-[#2300B0] transition hover:rounded-none hover:cursor-pointer"
        >See more</a
    >
</div>
<div class="bg-[#2300B0] h-10"></div>

<div class="flex justify-center mt-30">
    <h1 class="text-6xl px-38 py-12">{$t("landing.areyou")}</h1>
</div>
<div class="flex justify-center mb-30">
    <button
        onclick={() => (isRegisterOpen = true)}
        class="group relative flex justify-center rounded-lg bg-[#2300B0] font-sans text-white transition-transform active:scale-95 shadow-sm h-20"
    >
        <div class="flex items-center px-6 transition-colors"></div>
        <div
            class="flex flex-1 items-center py-3 text-lg font-medium tracking-wide"
        >
            {$t("landing.start")}
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
</div>
<Register bind:showModal={isRegisterOpen} />

<style>
    @keyframes marquee {
        0% {
            transform: translateX(0%);
        }
        100% {
            transform: translateX(-50%);
        }
    }
    .animate-marquee {
        animation: marquee 40s linear infinite;
    }
    .animate-marquee:hover {
        transform: translateX(0%);
        animation-play-state: paused;
    }
</style>
