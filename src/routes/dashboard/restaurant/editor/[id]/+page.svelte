<script lang="ts">
    //Application
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "./$types";
    import { onMount } from "svelte";

    //Components
    import { SvelteDate } from "svelte/reactivity";
    import Calendar from "$lib/components/Calendar.svelte";
    import { resolve } from "$app/paths";

    //Loaded data
    let { data } = $props();
    const restaurant = data.restaurant;
    console.log("Loaded Restaurant:", restaurant);

    let initialLayout = { walls: [], floors: [], tables: [], plants: [] };

    if (restaurant?.layoutJson) {
        try {
            const parsed = JSON.parse(restaurant.layoutJson);
            initialLayout = {
                walls: parsed.walls || [],
                floors: parsed.floors || [],
                tables: parsed.tables || [],
                plants: parsed.plants || [],
            };
        } catch (error) {
            console.error("Failed to parse layout JSON from database:", error);
        }
    }

    let Date = $state(new SvelteDate());

    //Viewer
    const GRID_SIZE = 50;
    let isSyncing = $state(false);
    let resultStatus = $state<{
        text: string;
    } | null>(null);

    //Data
    let restaurantName = $state(restaurant.restaurantName);
    let restaurantDescription = $state(restaurant.description);

    //Editor and viewer mode
    let appMode = $state("editor");
    let editMode = $state("cursor");

    let floorPlan = $state(initialLayout);
    let selectedObject = $state(null);

    let isDrawing = $state(false);
    let startPoint = $state(null);
    let previewElement = $state(null);

    let currentPolygonPoints = $state([]);
    let currentMousePos = $state({ x: 0, y: 0 });

    let svgRef = $state();

    let viewBox = $state({ x: 0, y: 0, width: 800, height: 600 });
    let isPanning = $state(false);
    let panStartPoint = $state({ x: 0, y: 0 });

    let ghostTable = $state(null);
    let tablePlacementRotation = $state(0);
    let ghostPlant = $state(null);
    let selectedPlantType = $state("potted_plant");

    const DEFAULTS = {
        wall: "#334155",
        floor: "#f1f5f9",
        table: "#d4a373",
        plant: "#78350f",
    };

    let isEditorMode = $derived(appMode === "editor");
    let selectedData = $derived(
        selectedObject
            ? floorPlan[selectedObject.type + "s"]?.find(
                  (o) => o.id === selectedObject.id,
              )
            : null,
    );

    //Interactions
    $effect(() => {
        //Clear ghost tools if mode changes
        if (editMode !== "table" && editMode !== "plants") {
            ghostTable = null;
            ghostPlant = null;
        }

        //Clear polygon drawing array if user switches tools mid-draw
        if (editMode !== "floors") {
            currentPolygonPoints = [];
        }
    });

    //Logic
    function snapToGridLine(value) {
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    }

    function snapToGridCenter(value) {
        return Math.floor(value / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    }

    const getTableLayout = (capacity) => {
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

    const getMousePos = (e) => {
        if (!svgRef) return { x: 0, y: 0 };
        const CTM = svgRef.getScreenCTM().inverse();
        const pt = svgRef.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const transformedPt = pt.matrixTransform(CTM);

        if (editMode === "table" || editMode === "plants") {
            return {
                x: snapToGridCenter(transformedPt.x),
                y: snapToGridCenter(transformedPt.y),
            };
        } else if (editMode === "floors") {
            const SNAP_RADIUS = 20;
            let closest = null;
            let minDist = SNAP_RADIUS;

            floorPlan.walls.forEach((wall) => {
                const d1 = Math.hypot(
                    wall.x1 - transformedPt.x,
                    wall.y1 - transformedPt.y,
                );
                if (d1 < minDist) {
                    minDist = d1;
                    closest = { x: wall.x1, y: wall.y1 };
                }

                const d2 = Math.hypot(
                    wall.x2 - transformedPt.x,
                    wall.y2 - transformedPt.y,
                );
                if (d2 < minDist) {
                    minDist = d2;
                    closest = { x: wall.x2, y: wall.y2 };
                }
            });

            if (currentPolygonPoints.length >= 3) {
                const startPt = currentPolygonPoints[0];
                const dStart = Math.hypot(
                    startPt.x - transformedPt.x,
                    startPt.y - transformedPt.y,
                );
                if (dStart < SNAP_RADIUS && dStart < minDist) return startPt;
            }

            if (closest) return closest;

            return {
                x: snapToGridLine(transformedPt.x),
                y: snapToGridLine(transformedPt.y),
            };
        } else {
            return {
                x: snapToGridLine(transformedPt.x),
                y: snapToGridLine(transformedPt.y),
            };
        }
    };
    //Pan and Zoom
    const handleMouseDown = (e) => {
        if (e.button === 1) {
            isPanning = true;
            panStartPoint = { x: e.clientX, y: e.clientY };
            e.preventDefault();
            return;
        }

        if (editMode === "cursor" || e.button !== 0) return;

        const pos = getMousePos(e);

        if (editMode === "floors") {
            if (currentPolygonPoints.length >= 3) {
                const startPt = currentPolygonPoints[0];
                if (pos.x === startPt.x && pos.y === startPt.y) {
                    const newElement = {
                        id: crypto.randomUUID(),
                        type: "floor",
                        color: DEFAULTS.floor,
                        points: [...currentPolygonPoints],
                    };
                    floorPlan.floors.push(newElement);
                    currentPolygonPoints = [];
                    return;
                }
            }
            currentPolygonPoints.push(pos);
            return;
        }

        if (editMode === "walls") {
            isDrawing = true;
            startPoint = pos;
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            const dx = e.clientX - panStartPoint.x;
            const dy = e.clientY - panStartPoint.y;
            const scale = viewBox.width / svgRef.clientWidth;
            viewBox.x -= dx * scale;
            viewBox.y -= dy * scale;
            panStartPoint = { x: e.clientX, y: e.clientY };
            return;
        }

        const pos = getMousePos(e);
        currentMousePos = pos;

        if (editMode === "table") {
            ghostTable = {
                x: pos.x,
                y: pos.y,
                rotation: tablePlacementRotation,
            };
        }
        if (editMode === "plants") {
            ghostPlant = { x: pos.x, y: pos.y, plantType: selectedPlantType };
        }

        if (!isDrawing) return;

        if (editMode === "walls") {
            previewElement = {
                type: "line",
                x1: startPoint.x,
                y1: startPoint.y,
                x2: pos.x,
                y2: pos.y,
            };
        }
    };

    const handleMouseUp = (e) => {
        if (e.button === 1) {
            isPanning = false;
            return;
        }

        if (editMode === "floors") return;
        if (!isDrawing && editMode !== "table" && editMode !== "plants") return;

        const pos = getMousePos(e);
        let newElement;

        if (isDrawing && editMode === "walls") {
            if (startPoint.x !== pos.x || startPoint.y !== pos.y) {
                newElement = {
                    id: crypto.randomUUID(),
                    type: "wall",
                    color: DEFAULTS.wall,
                    x1: startPoint.x,
                    y1: startPoint.y,
                    x2: pos.x,
                    y2: pos.y,
                };
                floorPlan.walls.push(newElement);
            }
        } else if (!isDrawing) {
            switch (editMode) {
                case "table":
                    newElement = {
                        id: crypto.randomUUID(),
                        type: "table",
                        color: DEFAULTS.table,
                        x: pos.x,
                        y: pos.y,
                        rotation: tablePlacementRotation,
                        scale: 1,
                        identification: `T-${floorPlan.tables.length + 1}`,
                        capacity: 4,
                    };
                    floorPlan.tables.push(newElement);
                    break;
                case "plants":
                    newElement = {
                        id: crypto.randomUUID(),
                        type: "plant",
                        color: DEFAULTS.plant,
                        plantType: selectedPlantType,
                        scale: 1,
                        x: pos.x,
                        y: pos.y,
                    };
                    floorPlan.plants.push(newElement);
                    break;
            }
        }

        isDrawing = false;
        startPoint = null;
        previewElement = null;
    };

    const handleMouseLeave = () => {
        isPanning = false;
        isDrawing = false;
        previewElement = null;
        ghostTable = null;
        ghostPlant = null;
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const { x, y, width, height } = viewBox;
        const pt = svgRef.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const mouse = pt.matrixTransform(svgRef.getScreenCTM().inverse());
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

    const resetView = () => {
        if (svgRef) {
            viewBox = {
                x: 0,
                y: 0,
                width: svgRef.clientWidth,
                height: svgRef.clientHeight,
            };
        }
    };

    const handleObjectClick = (type, id) => {
        if (isEditorMode && editMode === "cursor") {
            selectedObject = { type, id };
        } else if (!isEditorMode && type === "table") {
            selectedObject = { type, id };
        }
    };

    const handlePropertyChange = (property, value, type = "number") => {
        if (!selectedObject) return;
        const { type: objType, id } = selectedObject;
        const parsedValue = type === "number" ? Number(value) : value;

        floorPlan[objType + "s"] = floorPlan[objType + "s"].map((obj) =>
            obj.id === id ? { ...obj, [property]: parsedValue } : obj,
        );
    };

    const handleSync: SubmitFunction = ({ formData, cancel }) => {
        if (isSyncing) {
            cancel();
            return;
        }
        isSyncing = true;
        resultStatus = null;

        formData.append("restaurantId", restaurant.id);
        formData.append("floorPlan", JSON.stringify(floorPlan));

        return async ({ result, update }) => {
            isSyncing = false;

            if (result.type === "success") {
                resultStatus = {
                    text:
                        result.data?.message ||
                        "Layout synchronized successfully",
                };
                setTimeout(() => {
                    resultStatus = null;
                }, 3000);
            } else if (result.type === "failure") {
                resultStatus = {
                    text: result.data?.error || "An unexpected error occurred",
                };
            }
            await update({ reset: false });
        };
    };

    const toggleAppMode = () => {
        selectedObject = null;
        appMode = appMode === "editor" ? "user" : "editor";
    };

    const handleDelete = () => {
        if (!selectedObject) return;
        const { type, id } = selectedObject;
        floorPlan[`${type}s`] = floorPlan[`${type}s`].filter(
            (obj) => obj.id !== id,
        );
        selectedObject = null;
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            currentPolygonPoints = [];
            isDrawing = false;
            previewElement = null;
            selectedObject = null;
        }

        if (
            isEditorMode &&
            editMode === "table" &&
            event.key.toLowerCase() === "r"
        ) {
            event.preventDefault();
            tablePlacementRotation = (tablePlacementRotation + 45) % 360;
            if (ghostTable) ghostTable.rotation = tablePlacementRotation;
        }

        if (isEditorMode && editMode === "cursor" && selectedObject) {
            if (event.key === "Delete" || event.key === "Backspace")
                handleDelete();
        }
    };

    //Define canvas
    onMount(() => {
        if (svgRef) {
            viewBox.width = svgRef.clientWidth;
            viewBox.height = svgRef.clientHeight;
        }
    });

    const formatPoints = (pointsArray) =>
        pointsArray.map((p) => `${p.x},${p.y}`).join(" ");
</script>

<svelte:window onkeydown={handleKeyDown} />

<main class="flex-grow flex flex-col h-screen">
    <header
        class="flex justify-between items-center p-3 bg-white shadow-md z-20"
    >
        <a
            href={resolve(`/dashboard/restaurant/${restaurant.id}`)}
            class="ml-5 text-2xl font-poppins-bold"
        >
            <span>{restaurantName}</span>
        </a>
        <div class="flex items-center gap-4">
            {#if isEditorMode}
                <form
                    method="POST"
                    action="?/sync"
                    use:enhance={handleSync}
                    class="flex items-center"
                >
                    {#if resultStatus}
                        <div
                            class="pr-2 text-sm font-medium {resultStatus.text.includes(
                                'error',
                            )
                                ? 'text-red-600'
                                : 'text-green-600'}"
                        >
                            {resultStatus.text}
                        </div>
                    {/if}
                    <button
                        type="submit"
                        disabled={isSyncing}
                        class="bg-[#2300B0] text-white px-4 py-2 rounded-md hover:bg-black disabled:opacity-50 transition-colors text-sm font-bold flex items-center gap-2"
                    >
                        {#if isSyncing}
                            <svg
                                class="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Syncing...
                        {:else}
                            Save
                        {/if}
                    </button>
                </form>
            {/if}
            <button
                onclick={toggleAppMode}
                class="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-[#2300B0] transition-colors"
            >
                {isEditorMode ? "User Mode" : "Editor Mode"}
            </button>
        </div>
    </header>

    <div class="flex-grow relative overflow-hidden bg-slate-50">
        <div class="flex h-full w-full overflow-hidden">
            <aside
                class="w-80 flex-shrink-0 bg-white border-r border-slate-200 shadow-[2px_0_8px_rgba(0,0,0,0.05)] p-4 overflow-y-auto z-10"
            >
                <div class="space-y-4">
                    <h3 class="text-lg font-bold text-[#2300B0]">
                        Restaurant Details
                    </h3>
                    <div class="space-y-3 pt-2">
                        <label class="flex flex-col text-sm font-medium">
                            Restaurant Name
                            <input
                                type="text"
                                bind:value={restaurantName}
                                placeholder="e.g. The Grand Cafe"
                                class="border p-2 rounded mt-1 font-normal focus:ring-1 focus:ring-[#2300B0] outline-none"
                            />
                        </label>
                        <label class="flex flex-col text-sm font-medium">
                            Description
                            <textarea
                                bind:value={restaurantDescription}
                                placeholder="Add general description..."
                                class="border p-2 rounded mt-1 font-normal h-32 resize-none focus:ring-1 focus:ring-[#2300B0] outline-none"
                            ></textarea>
                        </label>

                        <Calendar bind:selectedDate={Date} />
                    </div>
                </div>
            </aside>

            <div
                class="flex-grow relative flex flex-col h-full overflow-hidden"
            >
                <svg
                    bind:this={svgRef}
                    class="w-full h-full"
                    class:cursor-crosshair={isEditorMode &&
                        editMode !== "cursor" &&
                        !isPanning}
                    class:cursor-grab={isPanning}
                    class:cursor-grabbing={isPanning}
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
                            onclick={() => handleObjectClick("floor", floor.id)}
                            class:cursor-pointer={isEditorMode &&
                                editMode === "cursor"}
                            class="hover:opacity-90 transition-opacity"
                        />
                    {/each}

                    {#if editMode === "floors" && currentPolygonPoints.length > 0}
                        <polygon
                            points={formatPoints([
                                ...currentPolygonPoints,
                                currentMousePos,
                            ])}
                            fill="rgba(35, 0, 176, 0.1)"
                            stroke="rgba(35, 0, 176, 0.3)"
                            stroke-dasharray="5,5"
                        />
                        <polyline
                            points={formatPoints([
                                ...currentPolygonPoints,
                                currentMousePos,
                            ])}
                            fill="none"
                            stroke="#2300B0"
                            stroke-width="2"
                        />
                        {#each currentPolygonPoints as pt, idx}
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={idx === 0 && currentPolygonPoints.length >= 3
                                    ? "6"
                                    : "4"}
                                fill={idx === 0 &&
                                currentPolygonPoints.length >= 3
                                    ? "#10b981"
                                    : "#2300B0"}
                            />
                            {#if idx === 0 && currentPolygonPoints.length >= 3}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="10"
                                    fill="none"
                                    stroke="#10b981"
                                    stroke-width="2"
                                    opacity="0.5"
                                />
                            {/if}
                        {/each}
                    {/if}

                    {#each floorPlan.walls as wall (wall.id)}
                        <line
                            x1={wall.x1}
                            y1={wall.y1}
                            x2={wall.x2}
                            y2={wall.y2}
                            stroke={wall.color || DEFAULTS.wall}
                            stroke-width="3"
                            stroke-linecap="round"
                            onclick={() => handleObjectClick("wall", wall.id)}
                            class:cursor-pointer={isEditorMode &&
                                editMode === "cursor"}
                        />
                    {/each}

                    {#each floorPlan.tables as table (table.id)}
                        {@const layout = getTableLayout(table.capacity)}
                        <g
                            onclick={() => handleObjectClick("table", table.id)}
                            class:cursor-pointer={!isEditorMode ||
                                editMode === "cursor"}
                            class="hover:opacity-80 transition-opacity"
                            style="color: {table.color || DEFAULTS.table}"
                            transform={`translate(${table.x}, ${table.y}) rotate(${table.rotation || 0}) scale(${table.scale || 1})`}
                        >
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
                            onclick={() => handleObjectClick("plant", plant.id)}
                            class:cursor-pointer={isEditorMode &&
                                editMode === "cursor"}
                            class="hover:opacity-80 transition-opacity"
                            style="color: {plant.color || DEFAULTS.plant}"
                            transform={`translate(${plant.x}, ${plant.y}) scale(${plant.scale || 1})`}
                        >
                            <use href={`#asset-${plant.plantType}`} />
                        </g>
                    {/each}

                    {#if previewElement && previewElement.type === "line"}
                        <line
                            x1={previewElement.x1}
                            y1={previewElement.y1}
                            x2={previewElement.x2}
                            y2={previewElement.y2}
                            stroke="#64748b"
                            stroke-width="4"
                            stroke-dasharray="8,4"
                        />
                    {/if}

                    {#if ghostTable}
                        {@const layout = getTableLayout(4)}
                        <g
                            transform={`translate(${ghostTable.x}, ${ghostTable.y}) rotate(${ghostTable.rotation})`}
                            opacity="0.5"
                            style="pointer-events: none; color: {DEFAULTS.table}"
                        >
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
                        </g>
                    {/if}
                    {#if ghostPlant}
                        <g
                            transform={`translate(${ghostPlant.x}, ${ghostPlant.y})`}
                            opacity="0.5"
                            style="pointer-events: none; color: {DEFAULTS.plant}"
                        >
                            <use href={`#asset-${ghostPlant.plantType}`} />
                        </g>
                    {/if}
                </svg>

                {#if isEditorMode}
                    <div
                        class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg border border-slate-200 p-2 flex items-center gap-2 z-20"
                    >
                        <button
                            onclick={() => (editMode = "cursor")}
                            class:bg-[#2300B0]={editMode === "cursor"}
                            class:text-white={editMode === "cursor"}
                            class="p-2 rounded-md transition-colors text-slate-500 hover:bg-slate-100 flex items-center justify-center w-10 h-10"
                            ><svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                    d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
                                /><path d="M13 13l6 6" /></svg
                            ></button
                        >
                        <div class="w-px h-8 bg-slate-200 mx-1"></div>
                        <button
                            onclick={() => (editMode = "walls")}
                            class:bg-[#2300B0]={editMode === "walls"}
                            class:text-white={editMode === "walls"}
                            class="p-2 rounded-md transition-colors text-slate-500 hover:bg-slate-100 flex items-center justify-center w-10 h-10"
                            ><svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><rect
                                    x="2"
                                    y="2"
                                    width="20"
                                    height="20"
                                    rx="2"
                                    ry="2"
                                /><path d="M2 8h20" /><path d="M2 16h20" /><path
                                    d="M8 2v6"
                                /><path d="M16 8v8" /><path d="M10 16v6" /></svg
                            ></button
                        >
                        <button
                            onclick={() => (editMode = "floors")}
                            class:bg-[#2300B0]={editMode === "floors"}
                            class:text-white={editMode === "floors"}
                            class="p-2 rounded-md transition-colors text-slate-500 hover:bg-slate-100 flex items-center justify-center w-10 h-10"
                            ><svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path d="M3 12h6l3 9 6-18 3 9h3" /></svg
                            ></button
                        >
                        <button
                            onclick={() => (editMode = "table")}
                            class:bg-[#2300B0]={editMode === "table"}
                            class:text-white={editMode === "table"}
                            class="p-2 rounded-md transition-colors text-slate-500 hover:bg-slate-100 flex items-center justify-center w-10 h-10"
                            ><svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><rect
                                    width="18"
                                    height="18"
                                    x="3"
                                    y="3"
                                    rx="2"
                                    ry="2"
                                /></svg
                            ></button
                        >
                        <button
                            onclick={() => (editMode = "plants")}
                            class:bg-[#2300B0]={editMode === "plants"}
                            class:text-white={editMode === "plants"}
                            class="p-2 rounded-md transition-colors text-slate-500 hover:bg-slate-100 flex items-center justify-center w-10 h-10"
                            ><svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><circle cx="12" cy="12" r="3" /><path
                                    d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"
                                /></svg
                            ></button
                        >

                        {#if editMode === "plants"}
                            <div
                                class="flex items-center gap-1 p-1 rounded-lg bg-slate-100 ml-2"
                            >
                                <button
                                    title="Potted Plant"
                                    onclick={() =>
                                        (selectedPlantType = "potted_plant")}
                                    class:bg-[#2300B0]={selectedPlantType ===
                                        "potted_plant"}
                                    class:text-white={selectedPlantType ===
                                        "potted_plant"}
                                    class="p-1 rounded-md transition-colors flex items-center justify-center w-8 h-8 text-slate-500 hover:text-[#2300B0]"
                                    ><svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><circle cx="12" cy="12" r="3" /><path
                                            d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"
                                        /></svg
                                    ></button
                                >
                                <button
                                    title="Fern"
                                    onclick={() => (selectedPlantType = "fern")}
                                    class:bg-[#2300B0]={selectedPlantType ===
                                        "fern"}
                                    class:text-white={selectedPlantType ===
                                        "fern"}
                                    class="p-1 rounded-md transition-colors flex items-center justify-center w-8 h-8 text-slate-500 hover:text-[#2300B0]"
                                    ><svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><path d="M12 2v20" /><path
                                            d="M12 22s-4-4-4-9 4-9 4-9"
                                        /><path
                                            d="M12 22s4-4 4-9-4-9-4-9"
                                        /></svg
                                    ></button
                                >
                                <button
                                    title="Cactus"
                                    onclick={() =>
                                        (selectedPlantType = "cactus")}
                                    class:bg-[#2300B0]={selectedPlantType ===
                                        "cactus"}
                                    class:text-white={selectedPlantType ===
                                        "cactus"}
                                    class="p-1 rounded-md transition-colors flex items-center justify-center w-8 h-8 text-slate-500 hover:text-[#2300B0]"
                                    ><svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><path
                                            d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
                                        /><path d="M2 22l10-10" /></svg
                                    ></button
                                >
                                <button
                                    title="Bush"
                                    onclick={() => (selectedPlantType = "bush")}
                                    class:bg-[#2300B0]={selectedPlantType ===
                                        "bush"}
                                    class:text-white={selectedPlantType ===
                                        "bush"}
                                    class="p-1 rounded-md transition-colors flex items-center justify-center w-8 h-8 text-slate-500 hover:text-[#2300B0]"
                                    ><svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><path
                                            d="M12 22v-4M8 18c-4-2-4-8 0-10 2-2 6-2 8 0 4 2 4 8 0 10"
                                        /></svg
                                    ></button
                                >
                            </div>
                        {/if}

                        <div class="w-px h-8 bg-slate-200 mx-1"></div>
                        {#if editMode === "table"}
                            <div
                                class="text-xs font-medium text-[#2300B0] pr-2 whitespace-nowrap"
                            >
                                Rotation: 'R' | {tablePlacementRotation}°
                            </div>
                        {/if}
                        <button
                            onclick={resetView}
                            class="p-2 rounded-md transition-colors text-slate-500 hover:bg-slate-100 flex items-center justify-center w-10 h-10"
                            title="Reset View"
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
                                <path d="M15 3h6v6" /><path
                                    d="M9 21H3v-6"
                                /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                            </svg>
                        </button>
                    </div>
                {/if}
            </div>

            {#if selectedData}
                <aside
                    class="w-80 flex-shrink-0 bg-white border-l border-slate-200 shadow-[-2px_0_8px_rgba(0,0,0,0.05)] p-4 overflow-y-auto z-10 transition-all duration-300"
                >
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <h3
                                class="text-lg font-bold capitalize text-[#2300B0]"
                            >
                                {selectedData.type} Details
                            </h3>
                            <button
                                onclick={() => (selectedObject = null)}
                                class="text-slate-400 hover:text-black"
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

                        {#if isEditorMode}
                            <div class="space-y-2">
                                <label
                                    class="text-sm font-medium flex items-center gap-2"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <circle
                                            cx="13.5"
                                            cy="6.5"
                                            r=".5"
                                        /><circle
                                            cx="17.5"
                                            cy="10.5"
                                            r=".5"
                                        /><circle
                                            cx="8.5"
                                            cy="7.5"
                                            r=".5"
                                        /><circle
                                            cx="6.5"
                                            cy="12.5"
                                            r=".5"
                                        /><path
                                            d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"
                                        />
                                    </svg>
                                    Color
                                </label>
                                <div class="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={selectedData.color ||
                                            DEFAULTS[selectedData.type] ||
                                            "#000000"}
                                        oninput={(e) =>
                                            handlePropertyChange(
                                                "color",
                                                e.target.value,
                                                "string",
                                            )}
                                        class="h-10 w-full cursor-pointer rounded border border-slate-300 bg-white p-1"
                                    />
                                </div>
                            </div>

                            {#if selectedData.type === "table"}
                                <div
                                    class="space-y-2 pt-2 border-t border-slate-200 mt-4"
                                >
                                    <h4 class="text-sm font-bold">
                                        Reservation Settings
                                    </h4>
                                    <div class="grid gap-2 text-sm">
                                        <label class="flex flex-col font-medium"
                                            >Identification:
                                            <input
                                                type="text"
                                                value={selectedData.identification ||
                                                    ""}
                                                oninput={(e) =>
                                                    handlePropertyChange(
                                                        "identification",
                                                        e.target.value,
                                                        "string",
                                                    )}
                                                class="border p-1.5 rounded mt-1 font-normal focus:ring-1 focus:ring-[#2300B0] outline-none"
                                            />
                                        </label>
                                        <label class="flex flex-col font-medium"
                                            >Capacity (Seats):
                                            <input
                                                type="number"
                                                min="1"
                                                value={selectedData.capacity ||
                                                    4}
                                                oninput={(e) =>
                                                    handlePropertyChange(
                                                        "capacity",
                                                        e.target.value,
                                                        "number",
                                                    )}
                                                class="border p-1.5 rounded mt-1 font-normal focus:ring-1 focus:ring-[#2300B0] outline-none"
                                            />
                                        </label>
                                    </div>
                                </div>
                            {/if}

                            {#if selectedData.type !== "floor"}
                                <div
                                    class="space-y-2 pt-2 border-t border-slate-200 mt-4"
                                >
                                    <h4 class="text-sm font-bold">Geometry</h4>
                                    <div class="grid grid-cols-2 gap-2 text-sm">
                                        {#if selectedData.type === "wall"}
                                            <label class="flex flex-col"
                                                >X1: <input
                                                    type="number"
                                                    value={selectedData.x1}
                                                    oninput={(e) =>
                                                        handlePropertyChange(
                                                            "x1",
                                                            e.target.value,
                                                        )}
                                                    class="border p-1 rounded"
                                                /></label
                                            >
                                            <label class="flex flex-col"
                                                >Y1: <input
                                                    type="number"
                                                    value={selectedData.y1}
                                                    oninput={(e) =>
                                                        handlePropertyChange(
                                                            "y1",
                                                            e.target.value,
                                                        )}
                                                    class="border p-1 rounded"
                                                /></label
                                            >
                                            <label class="flex flex-col"
                                                >X2: <input
                                                    type="number"
                                                    value={selectedData.x2}
                                                    oninput={(e) =>
                                                        handlePropertyChange(
                                                            "x2",
                                                            e.target.value,
                                                        )}
                                                    class="border p-1 rounded"
                                                /></label
                                            >
                                            <label class="flex flex-col"
                                                >Y2: <input
                                                    type="number"
                                                    value={selectedData.y2}
                                                    oninput={(e) =>
                                                        handlePropertyChange(
                                                            "y2",
                                                            e.target.value,
                                                        )}
                                                    class="border p-1 rounded"
                                                /></label
                                            >
                                        {:else if selectedData.type === "table" || selectedData.type === "plant"}
                                            <label class="flex flex-col"
                                                >X: <input
                                                    type="number"
                                                    value={selectedData.x}
                                                    oninput={(e) =>
                                                        handlePropertyChange(
                                                            "x",
                                                            e.target.value,
                                                        )}
                                                    class="border p-1 rounded"
                                                /></label
                                            >
                                            <label class="flex flex-col"
                                                >Y: <input
                                                    type="number"
                                                    value={selectedData.y}
                                                    oninput={(e) =>
                                                        handlePropertyChange(
                                                            "y",
                                                            e.target.value,
                                                        )}
                                                    class="border p-1 rounded"
                                                /></label
                                            >
                                            <label class="flex flex-col"
                                                >Scale: <input
                                                    type="number"
                                                    step="0.1"
                                                    value={selectedData.scale ||
                                                        1}
                                                    oninput={(e) =>
                                                        handlePropertyChange(
                                                            "scale",
                                                            e.target.value,
                                                        )}
                                                    class="border p-1 rounded"
                                                /></label
                                            >
                                            {#if selectedData.type === "table"}
                                                <label class="flex flex-col"
                                                    >Rotation (°): <input
                                                        type="number"
                                                        value={selectedData.rotation ||
                                                            0}
                                                        oninput={(e) =>
                                                            handlePropertyChange(
                                                                "rotation",
                                                                e.target.value,
                                                            )}
                                                        class="border p-1 rounded"
                                                    /></label
                                                >
                                            {/if}
                                        {/if}
                                    </div>
                                </div>
                            {/if}

                            <button
                                onclick={handleDelete}
                                class="w-full bg-black hover:bg-red-600 text-white px-4 py-2 rounded mt-4 transition-colors"
                                >Delete Object</button
                            >
                        {/if}
                    </div>
                </aside>
            {/if}
        </div>
    </div>
</main>
