<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    ListBox,
    ListBoxItem,
    type PopupSettings,
    storePopup,
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
    goto("/" + walletId);
  }
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <div class="text-center p-6 mx-auto">
    <h1 class="text-64">MINT EDITIONS</h1>
    <br />
    <div class="regular-nav">
      <button class="btn btn-sm variant-primary w-48" use:popup={popupCombobox}>
        {comboboxValue ?? "Select Wallet"}
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
            xX
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
