<script lang="ts">
    //Application
    import { resolve } from "$app/paths";

    //Loaded data
    let { data } = $props();
    const restaurant = data.restaurant;
    const filters = data.filters;
</script>

<div class="relative w-full h-80 md:h-96 bg-gray-900 shadow-xl">
    {#if restaurant.imageUrl}
        <img
            class="w-full h-full object-cover opacity-60"
            src={restaurant.imageUrl}
            alt={restaurant.restaurantName}
        />
    {/if}
    <div
        class="absolute inset-0 flex flex-col justify-end p-8 max-w-7xl mx-auto w-full"
    >
        <h1
            class="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-md"
        >
            {restaurant.restaurantName}
        </h1>
        <div class="flex flex-wrap items-center gap-3">
            <span
                class="bg-white text-black px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide shadow-sm"
            >
                {restaurant.restaurantCode}
            </span>
            {#if restaurant.published}
                <span
                    class="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm"
                >
                    Published
                </span>
            {/if}
            {#if filters}
                {#each data.filters as filter (filter.id)}
                    <span
                        class="bg-[#2300B0] text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm"
                    >
                        {filter.filterName}
                    </span>
                {/each}
            {/if}
        </div>
    </div>
</div>
<div class="bg-[#2300B0] text-white py-3 px-6">
    <h2 class="text-xl font-semibold">Description</h2>
</div>
<div class="p-6">
    {#if restaurant.description}
        <p class="text-lg leading-relaxed">
            {restaurant.description}
        </p>
    {:else}
        <p class="italic text-gray-400">
            No description provided for this restaurant.
        </p>
    {/if}
</div>
<section class="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
    <h3 class="text-xl font-semibold mb-6 border-b pb-2">Schedule Details</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-xl">
            <p class="text-sm mb-1">Opening Time</p>
            <p class="text-lg font-medium">
                {restaurant.openingHourAndMinute}
            </p>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl">
            <p class="text-sm mb-1">Closing Time</p>
            <p class="text-lg font-medium">
                {restaurant.closingHourAndMinute}
            </p>
        </div>
    </div>
</section>
<a
    href={resolve(`/restaurants/${restaurant.restaurantCode}/reserve`)}
    class="ml-50 mr-50 mt-20 mb-20 group relative flex justify-center rounded-lg bg-[#2300B0] font-sans text-white
    transition-transform active:scale-95 shadow-sm h-20"
>
    <div class="flex items-center px-6 transition-colors"></div>
    <div
        class="flex flex-1 items-center py-3 text-lg font-medium tracking-wide"
    >
        Reserve a table
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
</a>
