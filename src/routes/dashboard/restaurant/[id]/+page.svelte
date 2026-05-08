<script lang="ts">
    //Application
    import type { SubmitFunction } from "@sveltejs/kit";
    import { enhance } from "$app/forms";
    import { resolve } from "$app/paths";

    //Loaded data
    let { data } = $props();
    const restaurant = data.restaurant;
    const filters = data.filters;
    const restaurantUsers = data.restaurantUsers;
    const reservations = data.reservations;

    // Image Upload State
    let fileInput: HTMLInputElement;
    let previewUrl: string = $state(
        restaurant.imageUrl || "/default-placeholder.png",
    );
    let hasNewImage: boolean = $state(false);

    function handlePreview(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            previewUrl = URL.createObjectURL(file);
            hasNewImage = true;
        }
    }

    //Date format
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    //Form properties
    let restaurantName = $state(restaurant.restaurantName);
    let restaurantCode = $state(restaurant.restaurantCode);
    let reservationsDuration = $state(restaurant.reservationsDuration);
    let openingHourAndMinute = $state(restaurant.openingHourAndMinute);
    let closingHourAndMinute = $state(restaurant.closingHourAndMinute);
    let priceRange = $state(restaurant.priceRange);
    let description = $state(restaurant.description);

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
                    text: "Restaurant details updated successfully.",
                };
            } else if (result.type === "failure") {
                resultStatus = {
                    type: "error",
                    text:
                        (result.data as any)?.error ??
                        "An unexpected error occurred.",
                };
            }
            await update({ reset: false });
            //Prevent form from resetting typed values
        };
    };
</script>

<div class="p-12">
    <div class="mb-8 border-b pb-4 flex gap-5">
        <h1 class="text-3xl font-bold text-gray-900">
            Edit Restaurant: {restaurantName}
        </h1>
        <div>
            <p class="text-xs uppercase tracking-wider">Created At</p>
            <p class="text-sm mt-1">
                {formatDate(restaurant.createdAt)}
            </p>
        </div>
    </div>
    <section
        class="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden mb-8"
    >
        <div class="bg-gray-50 border-b border-gray-100 py-4 px-6">
            <h2 class="text-lg font-semibold text-gray-800">Cover Image</h2>
        </div>

        <div
            class="p-6 flex flex-col items-center sm:items-start sm:flex-row gap-8"
        >
            <div
                class="w-full sm:w-1/2 md:w-2/3 max-w-md aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200"
            >
                <img
                    id="avatar"
                    src={previewUrl}
                    alt="Restaurant Preview"
                    class="w-full h-full object-cover"
                />
            </div>

            <form
                method="POST"
                enctype="multipart/form-data"
                action="?/uploadResImage"
                use:enhance
                class="flex flex-col gap-4 w-full sm:w-auto flex-1 justify-center"
            >
                <input type="hidden" name="Id" value={restaurant.id} />

                <input
                    class="hidden"
                    name="avatar"
                    type="file"
                    accept="image/png, image/jpeg"
                    bind:this={fileInput}
                    onchange={handlePreview}
                />

                <p class="text-sm text-gray-500 mb-2">
                    Recommended format: 16:9 ratio, JPG or PNG, under 5MB.
                </p>

                <button
                    type="button"
                    class="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-colors"
                    onclick={() => fileInput.click()}
                >
                    Select New Image
                </button>

                {#if hasNewImage}
                    <button
                        type="submit"
                        class="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-colors"
                    >
                        Confirm & Upload
                    </button>
                {/if}
            </form>
        </div>
    </section>

    <form
        method="POST"
        action="?/updateRestaurant"
        use:enhance={handleSubmit}
        class="p-6 space-y-6"
    >
        <input type="hidden" name="Id" value={restaurant.id} />

        {#if resultStatus}
            <div
                class="p-4 rounded-lg text-sm font-medium {resultStatus.type ===
                'error'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-green-50 border border-green-200 text-green-700'}"
            >
                {resultStatus.text}
            </div>
        {/if}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="sm:col-span-2">
                <label
                    for="restaurantName"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Restaurant Name</label
                >
                <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    placeholder="e.g., Poppy Flowers"
                    required
                    class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow"
                    bind:value={restaurantName}
                />
            </div>

            <div>
                <label
                    for="restaurantCode"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Restaurant Code</label
                >
                <input
                    type="text"
                    id="restaurantCode"
                    name="restaurantCode"
                    required
                    class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow"
                    bind:value={restaurantCode}
                />
            </div>

            <div>
                <label
                    for="reservationsDuration"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Reservation Duration (mins)</label
                >
                <input
                    type="number"
                    id="reservationsDuration"
                    name="reservationsDuration"
                    required
                    class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow"
                    bind:value={reservationsDuration}
                />
            </div>

            <div>
                <label
                    for="openingHourAndMinute"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Opening Time</label
                >
                <input
                    type="text"
                    id="openingHourAndMinute"
                    name="openingHourAndMinute"
                    required
                    class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow"
                    bind:value={openingHourAndMinute}
                />
            </div>

            <div>
                <label
                    for="closingHourAndMinute"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Closing Time</label
                >
                <input
                    type="text"
                    id="closingHourAndMinute"
                    name="closingHourAndMinute"
                    required
                    class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow"
                    bind:value={closingHourAndMinute}
                />
            </div>
            <div>
                <label
                    for="priceRange"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Price Range</label
                >
                <input
                    type="text"
                    id="priceRange"
                    name="priceRange"
                    required
                    class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow"
                    bind:value={priceRange}
                />
            </div>

            <div class="sm:col-span-2">
                <label
                    for="description"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Description</label
                >
                <textarea
                    id="description"
                    name="description"
                    rows="4"
                    placeholder="Describe the restaurant..."
                    class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow resize-y"
                    bind:value={description}
                ></textarea>
            </div>
        </div>

        <div class="pt-4 border-t border-gray-100 flex justify-center gap-50">
            <a
                href={resolve(`/dashboard/restaurant/editor/${restaurant.id}`)}
                class="group relative flex justify-center rounded-lg bg-[#2300B0] font-sans text-white transition-transform active:scale-95 shadow-sm h-20"
            >
                <div class="flex items-center px-6 transition-colors"></div>
                <div
                    class="flex flex-1 items-center py-3 text-lg font-medium tracking-wide"
                >
                    Adjust layout
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
            <button
                class="group relative flex justify-center rounded-lg bg-[#2300B0] font-sans text-white transition-transform active:scale-95 shadow-sm h-20"
                type="submit"
            >
                <div class="flex items-center px-6 transition-colors"></div>
                <div
                    class="flex flex-1 items-center py-3 text-lg font-medium tracking-wide"
                >
                    Save changes
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
    </form>
    <h1 class="text-3xl font-bold text-gray-900">Edit Restaurant Filters</h1>
    <section class="p-5">
        <div class="mb-8 flex gap-2">
            {#if filters}
                {#each data.filters as filter (filter.id)}
                    <span
                        class="bg-[#2300B0] text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm"
                    >
                        {filter.filterName}
                    </span>
                {/each}
            {:else}
                <p>No filters found</p>
            {/if}
        </div>

        <h2>Create New Filter</h2>
        <form method="POST" action="?/createFilter" use:enhance>
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            <input name="filterName" placeholder="Filter Name" required />
            <button
                class="rounded-lg bg-[#2300B0] font-sans text-white transition-transform active:scale-95 shadow-sm p-4 m-2"
                type="submit">Create</button
            >
        </form>

        <hr />

        <h2>Attach Filter to Restaurant</h2>
        <form method="POST" action="?/addFilter" use:enhance>
            <input name="restaurantId" type="hidden" value={restaurant.id} />
            <input name="filterId" placeholder="Filter GUID" required />

            <button
                class="rounded-lg bg-[#2300B0] font-sans text-white transition-transform active:scale-95 shadow-sm p-4 m-2"
                type="submit">Link Filter</button
            >
        </form>
    </section>
    <section>
        {#if reservations}
            <div class="space-y-4 mb-8">
                {#each reservations as reservation (reservation.id)}
                    <div
                        class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl gap-4"
                    >
                        {reservation.tableid}, {reservation.numberOfGuests}, {reservation.firstName},
                        {reservation.lastName}, {reservation.email}
                    </div>
                {/each}
            </div>
        {:else}
            <p class="text-gray-500 mb-8">No reservations for restaurant yet</p>
        {/if}
    </section>
    <h1 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Manage Staff</h1>
    <section
        class="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden mb-8"
    >
        <div class="bg-gray-50 border-b border-gray-100 py-4 px-6">
            <h2 class="text-lg font-semibold text-gray-800">Current Users</h2>
        </div>

        <div class="p-6">
            {#if restaurantUsers}
                <div class="space-y-4 mb-8">
                    {#each restaurantUsers as user (user.id)}
                        <div
                            class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl gap-4"
                        >
                            <div>
                                <p class="font-semibold text-gray-900">
                                    {user.userName}
                                </p>
                                <p class="text-sm text-gray-500">
                                    {user.email}
                                </p>
                            </div>

                            <div class="flex items-center gap-3">
                                <form
                                    method="POST"
                                    action="?/updateUserRole"
                                    use:enhance
                                >
                                    <input
                                        type="hidden"
                                        name="restaurantId"
                                        value={restaurant.id}
                                    />
                                    <input
                                        type="hidden"
                                        name="userId"
                                        value={user.userId}
                                    />
                                    <select
                                        name="role"
                                        class="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] outline-none"
                                        onchange={this.form.submit()}
                                    >
                                        <option
                                            value="1"
                                            selected={user.role === 1}
                                            >Employee</option
                                        >
                                        <option
                                            value="2"
                                            selected={user.role === 2}
                                            >Manager</option
                                        >
                                        <option
                                            value="3"
                                            selected={user.role === 3}
                                            >Owner</option
                                        >
                                    </select>
                                    <button
                                        type="submit"
                                        class="text-[#2300B0] hover:bg-[#C6CDF5] p-2 rounded-lg font-medium text-sm transition-colors border border-transparent hover:border-[#2300B0]"
                                    >
                                        Save
                                    </button>
                                </form>

                                <form
                                    method="POST"
                                    action="?/removeUser"
                                    use:enhance
                                >
                                    <input
                                        type="hidden"
                                        name="restaurantId"
                                        value={restaurant.id}
                                    />
                                    <input
                                        type="hidden"
                                        name="userId"
                                        value={user.userId}
                                    />
                                    <button
                                        type="submit"
                                        class="text-red-600 hover:bg-red-50 p-2 rounded-lg font-medium text-sm transition-colors border border-transparent hover:border-red-200"
                                    >
                                        Remove
                                    </button>
                                </form>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="text-gray-500 mb-8">
                    No staff members assigned to this restaurant yet
                </p>
            {/if}

            <div class="border-t border-gray-100 pt-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    Add Staff Member
                </h3>
                <form
                    method="POST"
                    action="?/addUser"
                    use:enhance
                    class="flex flex-col sm:flex-row gap-4 items-end"
                >
                    <input
                        type="hidden"
                        name="restaurantId"
                        value={restaurant.id}
                    />

                    <div class="flex-1 w-full">
                        <label
                            for="newUserId"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >User GUID</label
                        >
                        <input
                            type="text"
                            id="newUserId"
                            name="userId"
                            required
                            placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                            class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow"
                        />
                    </div>

                    <div class="w-full sm:w-48">
                        <label
                            for="newUserRole"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Role</label
                        >
                        <select
                            id="newUserRole"
                            name="role"
                            class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#2300B0] focus:border-[#2300B0] focus:outline-none transition-shadow bg-white"
                        >
                            <option value="1">Employee</option>
                            <option value="2">Manager</option>
                            <option value="3">Owner</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        class="w-full sm:w-auto bg-[#2300B0] hover:bg-blue-800 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-colors"
                    >
                        Add User
                    </button>
                </form>
            </div>
        </div>
    </section>
</div>
