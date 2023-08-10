<script lang="ts">
  import "@skeletonlabs/skeleton/themes/theme-rocket.css";
  import "@skeletonlabs/skeleton/styles/all.css";
  import "../app.postcss";
  import { AppShell, Modal } from "@skeletonlabs/skeleton";

  import { page } from "$app/stores";

  // import logo from "$lib/assets/domz.png";
  let title = "MNTE"; //todo dynamically pull from $page
  $: showTitleHeader = $page.data.title ? $page.data.title : null;
</script>

<svelte:head><title>{title}</title></svelte:head>
<Modal />

<!-- App Shell -->
<AppShell>
  {#if showTitleHeader}
    <h2 class="m-8">{title}</h2>
  {/if}
  <slot />
</AppShell>

<style>
  .title {
    font-family: "lilita_one", sans-serif !important;
  }

  .regular-nav {
    display: block;
  }
  .mobile {
    display: none;
  }

  @media only screen and (max-width: 480px) {
    .regular-nav {
      display: none;
    }
    .mobile {
      display: block;
    }
  }
</style>
