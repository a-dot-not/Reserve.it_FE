<script lang="ts">
    //Properties
    import { t } from "../../i18n";
    let email = $state("");
    let password = $state("");
    let generalErrors = $state("");
    let fieldErrors = $state("");
</script>

<main class="overflow-hidden">
    <div
        class="bg-cover bg-center bg-fixed"
        style="background-image: url('https://picsum.photos/1920/1080')"
    >
        <div class=" h-screen flex justify-center items-center">
            <div
                class="bg-white mx-4 p-8 rounded shadow-md w-full md:w-1/2 lg:w-1/3"
            >
                <h1 class="text-3xl font-bold mb-8 text-center">
                    {$t("login.welcome")}
                </h1>
                <form method="POST" action="/login?/login">
                    <label class="block">
                        <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            required
                            bind:value={email}
                            class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#2300B0] focus:outline-none"
                        />
                    </label>
                    <label class="block">
                        <input
                            name="password"
                            type="password"
                            placeholder={$t("login.password")}
                            class="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#2300B0] focus:outline-none"
                            bind:value={password}
                            required
                        />
                    </label>
                    <button
                        class="group relative inline-flex items-stretch overflow-hidden bg-[#2300B0] font-sans text-white transition-transform active:scale-98 shadow-sm rounded-lg hover:transition hover:rounded-none w-full"
                    >
                        <div
                            class="flex items-center px-6 py-3 font-medium text-lg tracking-wide"
                        >
                            <slot>{$t("login.login")}</slot>
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
                    </button>

                    {#if generalErrors || fieldErrors}
                        <span>{generalErrors}, {fieldErrors}</span>
                    {/if}
                </form>
            </div>
        </div>
    </div>
</main>
