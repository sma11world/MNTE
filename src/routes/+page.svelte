<script lang="ts">
  import { goto } from "$app/navigation";
  import WalletConnection from "$lib/wallet-connection";
  import {
    ListBox,
    ListBoxItem,
    type PopupSettings,
    storePopup,
    popup,
  } from "@skeletonlabs/skeleton";

  import { type WalletApi } from "lucid-cardano";

  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";
  let isConnected = false;
  let comboboxValue: string;

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  let popupCombobox: PopupSettings = {
    event: "focus-click",
    target: "combobox",
    placement: "auto",
    // Close the popup when the item is clicked
    closeQuery: ".listbox-item",
  };

  async function sync(walletId: string) {
    if (cardano && cardano[walletId]) {
      const connector = cardano[walletId];
      // Attempt to fetch connector API
      let wallet: WalletApi;
      try {
        wallet = await connector.enable();
        isConnected = true;
      } catch (e) {
        return null;
      }

      const activeUser = new WalletConnection(wallet);
      //todo: save {connected:true. address:"addy12435"} and pull for next page
      const lucid = activeUser.newConnection();
      goto("/" + walletId);
    }
  }
  import logo from "$lib/assets/mnt.png";
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <div class="text-center p-6 mx-auto">
    <h1 class="text-64">MINT EDITIONS</h1>
    <br />
    <div class="regular-nav">
      <button
        class="btn btn-sm variant-ghost-error w-48"
        use:popup={popupCombobox}
      >
        {comboboxValue ?? "Sync Wallet"}
      </button>

      <div class="card w-48 shadow-xl py-2 f12" data-popup="combobox">
        <!-- Listbox -->
        <ListBox>
          <ListBoxItem
            on:click={() => {
              sync("nami");
            }}
            bind:group={comboboxValue}
            name="medium"
            value="NAMI"
          >
            NAMI
          </ListBoxItem>
          <ListBoxItem
            on:click={() => {
              sync("eternl");
            }}
            bind:group={comboboxValue}
            name="medium"
            value="ETERNL"
          >
            ETERNL
          </ListBoxItem>
          <ListBoxItem
            on:click={() => {
              sync("yoroi");
            }}
            bind:group={comboboxValue}
            name="medium"
            value="YOROI"
          >
            YOROI
          </ListBoxItem>
          <ListBoxItem
            on:click={() => {
              sync("flint");
            }}
            bind:group={comboboxValue}
            name="medium"
            value="FLINT"
          >
            FLINT
          </ListBoxItem>
          <ListBoxItem
            on:click={() => {
              sync("lace");
            }}
            bind:group={comboboxValue}
            name="medium"
            value="LACE"
          >
            LACE
          </ListBoxItem>

          <ListBoxItem
            on:click={() => {
              sync("vesper");
            }}
            bind:group={comboboxValue}
            name="medium"
            value="VESPER"
          >
            VESPER
          </ListBoxItem>
        </ListBox>
        <!-- Arrow -->
        <div class="arrow bg-surface-100-800-token" />
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  figure {
    @apply flex relative flex-col;
  }
  figure img,
  .img-bg {
    @apply w-64 h-64 md:w-80 md:h-80;
  }
  .img-bg {
    @apply absolute z-[-1] rounded-full blur-[50px] transition-all;
    animation: pulse 5s cubic-bezier(0, 0, 0, 0.5) infinite,
      glow 5s linear infinite;
  }
  @keyframes glow {
    0% {
      @apply bg-primary-400/50;
    }
    33% {
      @apply bg-secondary-400/50;
    }
    66% {
      @apply bg-tertiary-400/50;
    }
    100% {
      @apply bg-primary-400/50;
    }
  }
  @keyframes pulse {
    50% {
      transform: scale(1.5);
    }
  }
</style>
