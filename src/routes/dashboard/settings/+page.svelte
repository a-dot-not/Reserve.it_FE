<script lang="ts">
    import { enhance } from "$app/forms";
    let { data } = $props();

    let fileInput: HTMLInputElement;
    let previewUrl: string = data.locals.user?.profilePictureUrl;

    function handlePreview(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            previewUrl = URL.createObjectURL(file);
        }
    }
</script>

<div class="container">
    <img id="avatar" src={previewUrl} alt="Preview" />

    <form method="POST" enctype="multipart/form-data" use:enhance>
        <input
            class="hidden"
            name="avatar"
            type="file"
            accept="image/png, image/jpeg"
            bind:this={fileInput}
            on:change={handlePreview}
        />

        <button
            type="button"
            class="upload-btn"
            on:click={() => fileInput.click()}
        >
            Select Image
        </button>

        {#if previewUrl !== "avatar.png"}
            <button type="submit" class="upload-btn save-btn">
                Confirm & Upload
            </button>
        {/if}
    </form>
</div>

<style>
    .save-btn {
        margin-top: 10px;
        background-color: #22c55e;
    }
    .hidden {
        display: none;
    }
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    #avatar {
        border-radius: 50%;
        width: 128px;
        height: 128px;
        object-fit: cover;
    }
</style>
