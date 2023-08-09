<script lang="ts">
  import "@skeletonlabs/skeleton/themes/theme-rocket.css";
  import "@skeletonlabs/skeleton/styles/all.css";
  import "../app.postcss";
  import "../app.postcss";
  import {
    AppShell,
    AppBar,
    localStorageStore,
    Modal,
    type PopupSettings,
    ListBox,
    ListBoxItem,
    popup,
  } from "@skeletonlabs/skeleton";

  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";

  import { storePopup } from "@skeletonlabs/skeleton";
  import { page } from "$app/stores";
  import type { PageData } from "./$types";
  import type { WalletApi } from "lucid-cardano";
  import { goto } from "$app/navigation";

  let comboboxValue: string;
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  let popupCombobox: PopupSettings = {
    event: "focus-click",
    target: "combobox",
    placement: "bottom",
    // Close the popup when the item is clicked
    closeQuery: ".listbox-item",
  };

  // import logo from "$lib/assets/domz.png";
  let title = "MNTE"; //todo dynamically pull from $page
  $: showTitleHeader = $page.data.title ? $page.data.title : null;

  let isConnected: boolean = false;

  let data: PageData;

  // async function sync(walletId: string) {
  //   if (cardano && cardano[walletId]) {
  //     const connector = cardano[walletId];
  //     // Attempt to fetch connector API
  //     let wallet: WalletApi;
  //     try {
  //       wallet = await connector.enable();
  //       isConnected = true;
  //     } catch (e) {
  //       return null;
  //     }

  //     const activeUser = new WalletConnection(wallet);
  //     //todo: save {connected:true. address:"addy12435"} and pull for next page
  //     const lucid = activeUser.newConnection();
  //     goto("/" + walletId);
  //   }
  // }

  // $: sync(comboboxValue as );
  //$:handle = getHandle(comboboxValue);
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
