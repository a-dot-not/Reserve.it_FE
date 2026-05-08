<script lang="ts">
    import type { PageProps } from "./$types";
    import { resolve } from "$app/paths";

    let { data }: PageProps = $props();
</script>

<h1>My Restaurants</h1>
{#if data.restaurants}
    <div
        class="relative w-full h-128 grid grid-cols-3 justify-center gap-2 hover:cursor-pointer"
    >
        {#each data.restaurants as restaurant (restaurant.id)}
            <div
                class="w-104 h-114 bg-white m-auto mt-5 p-2 border-full border-1 border-s-slate"
            >
                <a href={resolve(`/dashboard/restaurant/${restaurant.id}`)}>
                    <img
                        class="w-300 h-70 object-cover"
                        src={restaurant.imageUrl}
                    />
                    <h1 class="ml-2 mt-2">{restaurant.restaurantName}</h1>
                    <p class="ml-2 mt-1">{restaurant.description}</p>
                </a>
                <div class="flex justify-center mb-30">
                    <a
                        href={resolve(
                            `/dashboard/restaurant/editor/${restaurant.id}`,
                        )}
                        class="group relative flex justify-center rounded-lg bg-[#2300B0] font-sans text-white transition-transform active:scale-95 shadow-sm h-20"
                    >
                        <div
                            class="flex items-center px-6 transition-colors"
                        ></div>
                        <div
                            class="flex flex-1 items-center py-3 text-lg font-medium tracking-wide"
                        >
                            Edit Layout
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
                </div>
            </div>
        {/each}
        <div
            class="w-104 h-114 bg-white m-auto mt-5 p-2 border-full border-1 border-s-slate-950"
        >
            <a href={resolve(`/dashboard/restaurant/new`)}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="160"
                    height="160"
                    fill="black"
                    class="bi bi-plus m-auto"
                    viewBox="0 0 16 16"
                >
                    <path
                        d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"
                    />
                </svg>
            </a>
        </div>
    </div>
{:else}
    <p>No restaurants found.</p>
{/if}
