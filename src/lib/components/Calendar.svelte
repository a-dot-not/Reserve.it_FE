<script>
    //This element is not actively being used in this version
    import { SvelteDate } from "svelte/reactivity";

    export let selectedDate = new SvelteDate();
    let viewDate = selectedDate
        ? new SvelteDate(selectedDate)
        : new SvelteDate();

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    // Reactive variables for the calendar grid
    $: viewYear = viewDate.getFullYear();
    $: viewMonth = viewDate.getMonth();
    $: startingDay = new SvelteDate(viewYear, viewMonth, 1).getDay();
    $: daysInMonth = new SvelteDate(viewYear, viewMonth + 1, 0).getDate();

    // Reactive formatted string for the input display
    $: formattedDate = selectedDate
        ? selectedDate.toLocaleDateString("en-GB") // DD/MM/YYYY format
        : "";

    function prevMonth() {
        viewDate = new SvelteDate(viewYear, viewMonth - 1, 1);
    }

    function nextMonth() {
        viewDate = new SvelteDate(viewYear, viewMonth + 1, 1);
    }

    function setDate(day) {
        selectedDate = new SvelteDate(viewYear, viewMonth, day);
    }

    function setToday() {
        selectedDate = new SvelteDate();
        viewDate = new SvelteDate(selectedDate);
    }

    // Helpers to determine date highlighting
    $: isSelectedDay = (day) => {
        if (!selectedDate) return false;
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getFullYear() === viewYear
        );
    };

    $: isToday = (day) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === viewMonth &&
            today.getFullYear() === viewYear
        );
    };
</script>

<div class="space-y-2.5 flex flex-col w-full min-w-[280px]">
    <label class="text-black/70 text-sm font-medium">Select Date</label>

    <div
        class="flex items-center border rounded-md py-3 px-3.5 border-black/10 bg-slate-50 shadow-sm text-black/70"
    >
        <input
            type="text"
            placeholder="DD/MM/YYYY"
            readonly
            value={formattedDate}
            class="w-full bg-transparent outline-none text-black/70 text-base select-none pointer-events-none"
        />
    </div>

    <div class="border border-black/10 bg-white rounded-md p-4">
        <div class="flex justify-between items-center mb-4">
            <button
                on:click={prevMonth}
                type="button"
                class="p-1 border border-black/10 rounded-md hover:bg-gray-100"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-black/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                </svg>
            </button>

            <div class="text-center font-semibold text-black/80 text-base">
                {monthNames[viewMonth]}
                {viewYear}
            </div>

            <button
                on:click={nextMonth}
                type="button"
                class="p-1 border border-black/10 rounded-md hover:bg-gray-100"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-black/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                </svg>
            </button>
        </div>

        <div
            class="grid grid-cols-7 text-center text-sm font-medium mb-2 text-black/80"
        >
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
        </div>

        <div class="grid grid-cols-7 text-center text-sm">
            {#each Array(startingDay) as day}
                <div></div>
            {/each}

            {#each Array(daysInMonth) as _, i}
                {@const day = i + 1}
                <button
                    on:click={() => setDate(day)}
                    class="p-2 w-10 h-10 mx-auto rounded-md transition-colors {isSelectedDay(
                        day,
                    )
                        ? 'bg-[#2300B0] text-white font-semibold shadow-md'
                        : isToday(day)
                          ? 'text-[#2300B0] font-bold bg-purple-50 hover:bg-purple-100'
                          : 'hover:bg-gray-100 text-black/80'}"
                >
                    {day}
                </button>
            {/each}
        </div>

        <div class="flex justify-end mt-4 pt-3 border-t border-slate-100">
            <button
                on:click={setToday}
                type="button"
                class="bg-[#2300B0] px-3 py-1.5 text-white rounded-md text-xs font-medium hover:bg-black shadow-sm transition-colors"
            >
                Jump to Today
            </button>
        </div>
    </div>
</div>
