<script lang="ts">
    //Application
    import { enhance } from "$app/forms";
    import { onMount } from "svelte";
    import { deserialize } from "$app/forms";
    import type { ActionResult } from "@sveltejs/kit";

    //Loaded data
    let { data, form } = $props();
    const restaurant = data.restaurant;
    let isSubmitting = $state(false);

    let floorPlan = $state({ walls: [], floors: [], tables: [], plants: [] });

    if (restaurant?.layoutJson) {
        try {
            const parsed = JSON.parse(restaurant.layoutJson);
            floorPlan = {
                walls: parsed.walls || [],
                floors: parsed.floors || [],
                tables: parsed.tables || [],
                plants: parsed.plants || [],
            };
        } catch (error) {
            console.error("Failed to parse layout JSON from database:", error);
        }
    }

    //Viewer
    const GRID_SIZE = 50;
    let selectedObject = $state<{ type: string; id: string } | null>(null);
    let liveTableData = $state<any>(null);
    let isFetchingTable = $state(false);
    let fetchError = $state<string | null>(null);

    //Canvas
    let svgRef = $state<SVGSVGElement>();
    let viewBox = $state({ x: 0, y: 0, width: 800, height: 600 });
    let isPanning = $state(false);
    let panStartPoint = $state({ x: 0, y: 0 });

    const DEFAULTS = {
        wall: "#334155",
        floor: "#f1f5f9",
        table: "#d4a373",
        plant: "#78350f",
    };

    let selectedData = $derived(
        selectedObject
            ? floorPlan[selectedObject.type + "s"]?.find(
                  (o) => o.id === selectedObject.id,
              )
            : null,
    );

    //Interactions
    const getTableLayout = (capacity: number) => {
        const cap = Math.max(1, capacity || 4);
        let width = 32;
        let height = 32;
        let chairs = [];

        const chairOffset = 17;

        if (cap === 1) {
            chairs.push({ x: 0, y: -chairOffset });
        } else if (cap === 2) {
            chairs.push({ x: -chairOffset, y: 0 });
            chairs.push({ x: chairOffset, y: 0 });
        } else if (cap === 3) {
            chairs.push({ x: 0, y: -chairOffset });
            chairs.push({ x: -chairOffset, y: 0 });
            chairs.push({ x: chairOffset, y: 0 });
        } else if (cap === 4) {
            chairs.push({ x: 0, y: -chairOffset });
            chairs.push({ x: 0, y: chairOffset });
            chairs.push({ x: -chairOffset, y: 0 });
            chairs.push({ x: chairOffset, y: 0 });
        } else {
            const sideChairsTotal = cap - 2;
            const topCount = Math.ceil(sideChairsTotal / 2);
            const botCount = Math.floor(sideChairsTotal / 2);

            const spacing = 20;
            width = Math.max(32, topCount * spacing + 12);
            const currentXOffset = width / 2 + 1;

            chairs.push({ x: -currentXOffset, y: 0 });
            chairs.push({ x: currentXOffset, y: 0 });

            const startXTop = (-(topCount - 1) * spacing) / 2;
            for (let i = 0; i < topCount; i++) {
                chairs.push({ x: startXTop + i * spacing, y: -chairOffset });
            }

            const startXBot = (-(botCount - 1) * spacing) / 2;
            for (let i = 0; i < botCount; i++) {
                chairs.push({ x: startXBot + i * spacing, y: chairOffset });
            }
        }

        return { width, height, chairs };
    };
    //Fetching tables from db
    const fetchLiveTableData = async (editorId: string) => {
        isFetchingTable = true;
        liveTableData = null;
        fetchError = null;

        try {
            const formData = new FormData();
            formData.append("editorId", editorId);

            const response = await fetch("?/fetchTable", {
                method: "POST",
                body: formData,
            });

            //Deserialize converts the raw text payload back into a standard SvelteKit action result object
            const result: ActionResult = deserialize(await response.text());

            if (result.type === "success" && result.data) {
                liveTableData = result.data.tableData;
            } else if (result.type === "failure" && result.data) {
                fetchError = result.data.fetchError as string;
            } else {
                fetchError = "An unexpected error occurred.";
            }
        } catch (error) {
            console.error(
                "Failed to fetch table data via server action:",
                error,
            );
            fetchError = "Network error occurred.";
        } finally {
            isFetchingTable = false;
        }
    };
    //Fetch table on click
    const handleObjectClick = async (type: string, id: string) => {
        if (type === "table") {
            selectedObject = { type, id };
            await fetchLiveTableData(id);
        }
    };

    //Pan and Zoom
    const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 0 || e.button === 1) {
            isPanning = true;
            panStartPoint = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }
    };
    //Mouse pan
    const handleMouseMove = (e: MouseEvent) => {
        if (isPanning && svgRef) {
            const dx = e.clientX - panStartPoint.x;
            const dy = e.clientY - panStartPoint.y;
            const scale = viewBox.width / svgRef.clientWidth;
            viewBox.x -= dx * scale;
            viewBox.y -= dy * scale;
            panStartPoint = { x: e.clientX, y: e.clientY };
        }
    };
    //Mouse is not clicking
    const handleMouseUp = () => {
        isPanning = false;
    };
    const handleMouseLeave = () => {
        isPanning = false;
    };
    //Mouse zoom
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!svgRef) return;

        const zoomFactor = 1.1;
        const { x, y, width, height } = viewBox;
        const pt = svgRef.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const mouse = pt.matrixTransform(svgRef.getScreenCTM()!.inverse());

        const newWidth = e.deltaY < 0 ? width / zoomFactor : width * zoomFactor;
        const newHeight =
            e.deltaY < 0 ? height / zoomFactor : height * zoomFactor;
        const dx = mouse.x - x;
        const dy = mouse.y - y;

        viewBox = {
            x: mouse.x - dx * (newWidth / width),
            y: mouse.y - dy * (newHeight / height),
            width: newWidth,
            height: newHeight,
        };
    };
    //Deselect object
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            selectedObject = null;
        }
    };

    //Define canvas
    onMount(() => {
        if (svgRef) {
            viewBox.width = svgRef.clientWidth;
            viewBox.height = svgRef.clientHeight;
        }
    });
    //Floor points
    const formatPoints = (pointsArray: any[]) =>
        pointsArray.map((p) => `${p.x},${p.y}`).join(" ");
</script>

<svelte:window onkeydown={handleKeyDown} />

<main class="flex-grow flex flex-col h-screen">
    <div class="flex-grow relative overflow-hidden bg-slate-50">
        <div class="flex h-full w-full overflow-hidden">
            <aside
                class="w-80 flex-shrink-0 bg-white border-r border-slate-200 shadow-[2px_0_8px_rgba(0,0,0,0.05)] p-4 overflow-y-auto z-10"
            >
                <div class="space-y-6">
                    <div>
                        <h3
                            class="text-sm font-bold uppercase tracking-wider mb-2"
                        >
                            Details
                        </h3>
                        <p class="text-lg font-semibold text-black">
                            {restaurant.restaurantName}
                        </p>
                        {#if restaurant.description}
                            <p class="text-sm mt-2">
                                {restaurant.description}
                            </p>
                        {/if}
                    </div>
                </div>
            </aside>

            <div
                class="flex-grow relative flex flex-col h-full overflow-hidden"
            >
                <svg
                    bind:this={svgRef}
                    class="w-full h-full cursor-grab active:cursor-grabbing"
                    onmousedown={handleMouseDown}
                    onmouseleave={handleMouseLeave}
                    onmousemove={handleMouseMove}
                    onmouseup={handleMouseUp}
                    onwheel={handleWheel}
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                >
                    <defs>
                        <pattern
                            id="grid"
                            width={GRID_SIZE}
                            height={GRID_SIZE}
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                                fill="none"
                                stroke="#E2E8F0"
                                stroke-width="1"
                                vector-effect="non-scaling-stroke"
                            />
                        </pattern>
                        <g id="asset-potted_plant">
                            <circle r="18" fill="#84cc16" opacity="0.6" />
                            <circle r="12" fill="#65a30d" opacity="0.8" />
                            <circle
                                r="8"
                                fill="currentColor"
                                stroke="rgba(0,0,0,0.2)"
                                stroke-width="1.5"
                            />
                        </g>
                        <g id="asset-fern">
                            <path
                                d="M0 12 V -12 M -10 0 C -5 -10, 5 -10, 10 0 M -8 6 C -4 -2, 4 -2, 8 6 M -6 12 C -2 4, 2 4, 6 12"
                                stroke="currentColor"
                                stroke-width="2"
                                fill="none"
                                stroke-linecap="round"
                            />
                        </g>
                        <g id="asset-cactus">
                            <circle
                                r="8"
                                fill="#10b981"
                                stroke="#047857"
                                stroke-width="2"
                            />
                            <path
                                d="M-5 -5 L-2 -2 M5 -5 L2 -2 M-5 5 L-2 2 M5 5 L2 2"
                                stroke="#d1fae5"
                                stroke-width="2"
                                stroke-linecap="round"
                            />
                        </g>
                        <g id="asset-snake_plant">
                            <path
                                d="M-4,8 Q-12,-15 -4,-20 Q0,-5 0,8"
                                fill="#16a34a"
                                stroke="#14532d"
                                stroke-width="1"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M0,8 Q0,-20 4,-24 Q8,-5 4,8"
                                fill="#15803d"
                                stroke="#14532d"
                                stroke-width="1"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M4,8 Q10,-10 10,-16 Q14,-5 8,8"
                                fill="#22c55e"
                                stroke="#14532d"
                                stroke-width="1"
                                stroke-linejoin="round"
                            />
                            <rect
                                x="-8"
                                y="8"
                                width="16"
                                height="8"
                                rx="2"
                                fill="currentColor"
                                stroke="rgba(0,0,0,0.2)"
                                stroke-width="1"
                            />
                        </g>
                        <g id="asset-bush">
                            <path
                                d="M-12,0 C-20,-10 -5,-25 0,-15 C5,-25 20,-10 12,0 C20,10 5,25 0,15 C-5,25 -20,10 -12,0"
                                fill="#65a30d"
                                opacity="0.9"
                            />
                            <circle r="10" fill="#4d7c0f" />
                        </g>
                        <g id="asset-flower">
                            <circle r="12" fill="#fbcfe8" />
                            <circle r="8" fill="#ec4899" />
                            <circle r="4" fill="#fbbf24" />
                            <circle r="1.5" fill="currentColor" opacity="0.5" />
                        </g>
                    </defs>

                    <rect
                        x={viewBox.x}
                        y={viewBox.y}
                        width={viewBox.width}
                        height={viewBox.height}
                        fill="url(#grid)"
                    />

                    {#each floorPlan.floors as floor (floor.id)}
                        <polygon
                            points={formatPoints(floor.points)}
                            fill={floor.color || DEFAULTS.floor}
                            class="transition-opacity"
                        />
                    {/each}

                    {#each floorPlan.walls as wall (wall.id)}
                        <line
                            x1={wall.x1}
                            y1={wall.y1}
                            x2={wall.x2}
                            y2={wall.y2}
                            stroke={wall.color || DEFAULTS.wall}
                            stroke-width="3"
                            stroke-linecap="round"
                        />
                    {/each}

                    {#each floorPlan.tables as table (table.id)}
                        {@const layout = getTableLayout(table.capacity)}
                        {@const isSelected = selectedObject?.id === table.id}

                        <g
                            onclick={() => handleObjectClick("table", table.id)}
                            class="cursor-pointer transition-all hover:opacity-80"
                            style="color: {table.color || DEFAULTS.table}"
                            transform={`translate(${table.x}, ${table.y}) rotate(${table.rotation || 0}) scale(${table.scale || 1})`}
                        >
                            {#if isSelected}
                                <rect
                                    x={-layout.width / 2 - 4}
                                    y={-layout.height / 2 - 4}
                                    width={layout.width + 8}
                                    height={layout.height + 8}
                                    rx="6"
                                    fill="none"
                                    stroke="#2300B0"
                                    stroke-width="2"
                                />
                            {/if}

                            {#each layout.chairs as chair}
                                <circle
                                    cx={chair.x}
                                    cy={chair.y}
                                    r="6"
                                    fill="#e5e5e5"
                                    stroke="#a3a3a3"
                                    stroke-width="1"
                                />
                            {/each}
                            <rect
                                x={-layout.width / 2}
                                y={-layout.height / 2}
                                width={layout.width}
                                height={layout.height}
                                rx="4"
                                fill="currentColor"
                                stroke="rgba(0,0,0,0.2)"
                                stroke-width="2"
                            />
                            {#if table.identification}
                                <text
                                    x="0"
                                    y="4"
                                    text-anchor="middle"
                                    font-size="10"
                                    fill="white"
                                    style="pointer-events:none;"
                                    >{table.identification}</text
                                >
                            {/if}
                        </g>
                    {/each}

                    {#each floorPlan.plants as plant (plant.id)}
                        <g
                            style="color: {plant.color || DEFAULTS.plant}"
                            transform={`translate(${plant.x}, ${plant.y}) scale(${plant.scale || 1})`}
                        >
                            <use href={`#asset-${plant.plantType}`} />
                        </g>
                    {/each}
                </svg>
            </div>

            {#if selectedObject && selectedObject.type === "table" && selectedData}
                <aside
                    class="w-80 flex-shrink-0 bg-white border-l border-slate-200 shadow-[-2px_0_8px_rgba(0,0,0,0.05)] p-4 overflow-y-auto z-10 transition-all duration-300"
                >
                    <div class="space-y-4">
                        <div
                            class="flex justify-between items-center pb-2 border-b border-slate-100"
                        >
                            <h3 class="text-lg font-bold text-[#2300B0]">
                                Table {selectedData.identification || "Details"}
                            </h3>
                            <button
                                onclick={() => (selectedObject = null)}
                                class="text-slate-400 hover:text-black transition-colors"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"
                                    ></line><line x1="6" y1="6" x2="18" y2="18"
                                    ></line>
                                </svg>
                            </button>
                        </div>

                        <div
                            class="bg-slate-50 p-3 rounded-md border border-slate-100"
                        >
                            <span
                                class="text-xs text-slate-500 font-medium uppercase tracking-wider"
                                >Capacity</span
                            >
                            <p class="font-semibold text-lg">
                                {selectedData.capacity || 4} Seats
                            </p>
                        </div>

                        <div class="pt-2">
                            <h4 class="text-sm font-bold text-slate-700 mb-3">
                                Live Status
                            </h4>

                            {#if isFetchingTable}
                                <div class="flex justify-center py-6">
                                    <div
                                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2300B0]"
                                    ></div>
                                </div>
                            {:else if fetchError}
                                <div
                                    class="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100"
                                >
                                    {fetchError}
                                </div>
                            {:else if liveTableData}
                                <div class="space-y-3">
                                    <div
                                        class="flex justify-between items-center py-2 border-b border-slate-50"
                                    >
                                        <span
                                            class="text-sm font-medium text-slate-500"
                                            >Status</span
                                        >
                                        <span
                                            class="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider {liveTableData.status ===
                                            'Occupied'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'}"
                                        >
                                            {liveTableData.status ||
                                                "Available"}
                                        </span>
                                    </div>

                                    {#if liveTableData.reservationName}
                                        <div
                                            class="flex flex-col py-2 border-b border-slate-50"
                                        >
                                            <span
                                                class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1"
                                                >Reserved For</span
                                            >
                                            <span
                                                class="text-sm font-bold text-black"
                                                >{liveTableData.reservationName}</span
                                            >
                                        </div>
                                    {/if}

                                    {#if liveTableData.partySize}
                                        <div
                                            class="flex justify-between items-center py-2 border-b border-slate-50"
                                        >
                                            <span
                                                class="text-sm font-medium text-slate-500"
                                                >Current Party Size</span
                                            >
                                            <span
                                                class="text-sm font-bold text-black"
                                                >{liveTableData.partySize}</span
                                            >
                                        </div>
                                    {/if}
                                    {#if data.locals.user}
                                        <form
                                            method="POST"
                                            action="?/userReserveTable"
                                            use:enhance={() => {
                                                isSubmitting = true;
                                                return async ({ update }) => {
                                                    await update();
                                                    isSubmitting = false;
                                                };
                                            }}
                                            class="max-w-md mx-auto space-y-4 p-4 bg-white shadow rounded-md"
                                        >
                                            <input
                                                type="hidden"
                                                name="restaurantId"
                                                value={restaurant.id}
                                                required
                                                hidden
                                            />
                                            <input
                                                type="hidden"
                                                name="tableId"
                                                value={liveTableData.id}
                                                required
                                                hidden
                                            />

                                            <div>
                                                <label
                                                    class="block text-sm font-medium"
                                                    for="numberOfGuests"
                                                    >Number Of Guests</label
                                                >
                                                <input
                                                    class="border p-2 w-full rounded"
                                                    type="number"
                                                    id="numberOfGuests"
                                                    name="numberOfGuests"
                                                    min="1"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    class="block text-sm font-medium"
                                                    for="dateOfReservation"
                                                    >Time</label
                                                >
                                                <input
                                                    class="border p-2 w-full rounded"
                                                    type="datetime-local"
                                                    id="dateOfReservation"
                                                    name="dateOfReservation"
                                                    required
                                                />
                                            </div>

                                            {#if form?.error}
                                                <p class="text-red-500 text-sm">
                                                    {form.error}
                                                </p>
                                            {/if}

                                            {#if form?.success}
                                                <p
                                                    class="text-green-600 text-sm font-bold"
                                                >
                                                    Reservation confirmed!
                                                </p>
                                            {/if}

                                            <button
                                                disabled={isSubmitting}
                                                class="w-full bg-[#2300B0] text-white p-2 rounded disabled:opacity-50"
                                            >
                                                {isSubmitting
                                                    ? "Reserving..."
                                                    : "Reserve Table"}
                                            </button>
                                        </form>
                                    {:else}
                                        <form
                                            method="POST"
                                            action="?/reserveTable"
                                            use:enhance={() => {
                                                isSubmitting = true;
                                                return async ({ update }) => {
                                                    await update();
                                                    isSubmitting = false;
                                                };
                                            }}
                                            class="max-w-md mx-auto space-y-4 p-4 bg-white shadow rounded-md"
                                        >
                                            <input
                                                type="hidden"
                                                name="restaurantId"
                                                value={restaurant.id}
                                                required
                                                hidden
                                            />
                                            <input
                                                type="hidden"
                                                name="tableId"
                                                value={liveTableData.id}
                                                required
                                                hidden
                                            />

                                            <div>
                                                <label
                                                    class="block text-sm font-medium"
                                                    for="firstName"
                                                >
                                                    FirstName</label
                                                >
                                                <input
                                                    class="border p-2 w-full rounded"
                                                    type="text"
                                                    id="firstName"
                                                    name="firstName"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    class="block text-sm font-medium"
                                                    for="lastName"
                                                >
                                                    LastName</label
                                                >
                                                <input
                                                    class="border p-2 w-full rounded"
                                                    type="text"
                                                    id="lastName"
                                                    name="lastName"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    class="block text-sm font-medium"
                                                    for="email"
                                                >
                                                    Email</label
                                                >
                                                <input
                                                    class="border p-2 w-full rounded"
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    class="block text-sm font-medium"
                                                    for="numberOfGuests"
                                                    >Number Of Guests</label
                                                >
                                                <input
                                                    class="border p-2 w-full rounded"
                                                    type="number"
                                                    id="numberOfGuests"
                                                    name="numberOfGuests"
                                                    min="1"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    class="block text-sm font-medium"
                                                    for="dateOfReservation"
                                                    >Time</label
                                                >
                                                <input
                                                    class="border p-2 w-full rounded"
                                                    type="datetime-local"
                                                    id="dateOfReservation"
                                                    name="dateOfReservation"
                                                    required
                                                />
                                            </div>

                                            {#if form?.error}
                                                <p class="text-red-500 text-sm">
                                                    {form.error}
                                                </p>
                                            {/if}

                                            {#if form?.success}
                                                <p
                                                    class="text-green-600 text-sm font-bold"
                                                >
                                                    Reservation confirmed!
                                                </p>
                                            {/if}

                                            <button
                                                disabled={isSubmitting}
                                                class="w-full bg-[#2300B0] text-white p-2 rounded disabled:opacity-50"
                                            >
                                                {isSubmitting
                                                    ? "Reserving..."
                                                    : "Reserve Table"}
                                            </button>
                                        </form>
                                    {/if}
                                </div>
                            {:else}
                                <p class="text-sm text-slate-500 italic">
                                    No live data available.
                                </p>
                            {/if}
                        </div>
                    </div>
                </aside>
            {/if}
        </div>
    </div>
</main>
