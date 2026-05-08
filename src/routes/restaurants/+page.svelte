<script lang="ts">
    //Application
    import type { PageProps } from "./$types";
    import { resolve } from "$app/paths";

    //Loaded data
    let { data }: PageProps = $props();

    //Properties
    import { t } from "../../i18n";
</script>

<div class="bg-[#2300B0] flex h-500">
    <div class="w-84 bg-white">
        <div>
            <h2>Filters</h2>
        </div>
    </div>
    {#if data.restaurants}
        <div
            class="relative w-full h-128 grid grid-cols-3 justify-center gap-2 hover:cursor-pointer"
        >
            {#each data.restaurants as restaurant (restaurant.id)}
                <div class="w-104 h-114 bg-white m-auto mt-5 p-2">
                    <a
                        href={resolve(
                            `/restaurants/${restaurant.restaurantCode}`,
                        )}
                    >
                        <img
                            class="w-300 h-70 object-cover"
                            src={restaurant.imageUrl}
                            alt="Restaurant"
                        />
                        <h1 class="ml-2 mt-2">{restaurant.restaurantName}</h1>
                        <p class="ml-2 mt-1">{restaurant.description}</p>
                    </a>
                    <div class="flex justify-center gap-6 mt-4">
                        <a
                            href={resolve("/menu")}
                            class=" p-2 border border-black rounded-lg text-black font-medium hover:bg-black hover:text-white
                            transition hover:rounded-none hover:cursor-pointer"
                            >Menu</a
                        >
                        <p class="m-auto block">
                            {restaurant.openingHourAndMinute} - {restaurant.closingHourAndMinute}
                        </p>
                        <p class="m-auto">{restaurant.priceRange}</p>
                        <a
                            href={resolve(
                                `/restaurants/${restaurant.restaurantCode}/reserve`,
                            )}
                            class="p-2 border border-black rounded-lg text-black font-medium hover:bg-black hover:text-white
                            transition hover:rounded-none hover:cursor-pointer"
                            >Reserve</a
                        >
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p class="text-white">Could not load restaurants error: {data.error}</p>
    {/if}
</div>
