<script lang="ts">
    //Application
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import type { PageProps } from "./$types";

    //Loaded data
    let { data }: PageProps = $props();
    let message = data.message;
    let isSuccess = data.isSuccess;

    $effect(() => {
        if (isSuccess) {
            setTimeout(() => {
                goto(resolve("/login"));
            }, 3000);
        }
    });
</script>

<!-- Email verification status -->
<div class="flex justify-center text-2xl mt-50">
    <h2 class={isSuccess ? "success" : "error"}>{message}</h2>
</div>

<style>
    .success {
        color: #2300b0;
    }
    .error {
        color: red;
    }
</style>
