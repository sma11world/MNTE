<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { env } from "$env/dynamic/public";
  import WalletConnection from "$lib/wallet-connection";
  import {
    Avatar,
    FileDropzone,
    Toast,
    toastStore,
  } from "@skeletonlabs/skeleton";
  import type { ToastSettings } from "@skeletonlabs/skeleton";
  // import { Contract } from "https://deno.land/x/nebula@1.0.3/mod.ts";

  import {
    fromText,
    toHex,
    type MintingPolicy,
    type PolicyId,
    type TxHash,
    type Unit,
    type Wallet,
    type WalletApi,
  } from "lucid-cardano";
  let burnt = false;
  let showBurn = false;
  let lastHash = "";
  let isMinted = false;

  let hasBFKey = false;
  let bFKey = "";
  let policy = "";
  let usr: string = "";
  let artname = "";
  let artistname = "";
  let desc = "";
  let imgUrl = "";
  let imgUrl2 = "";
  let expiration: any;
  let payout: any = "";
  let mintingPolicy: MintingPolicy;
  let temp = 0;
  let percentRoyalty = "";
  $: royalties = percentRoyalty;
  $: activeAddress = usr;
  let hasRoyalties = false;
  let walletId = "";
  async function setRoyalty() {
    let walletId = $page.params.id;
    console.log(walletId);

    if (cardano && cardano[walletId]) {
      const connector = cardano[walletId];
      // Attempt to fetch connector API
      let wallet: WalletApi;
      try {
        wallet = await connector.enable();
      } catch (e) {
        return null;
      }

      const activeUser = new WalletConnection(wallet);
      usr = await (await activeUser.newConnection(bFKey)).wallet.address();

      const { paymentCredential } = await (
        await activeUser.newConnection(bFKey)
      ).utils.getAddressDetails(await usr);

      //todo: set from ui
      expiration = Date.now() + 1000000;

      mintingPolicy = await (
        await activeUser.newConnection(bFKey)
      ).utils.nativeScriptFromJson({
        type: "all",
        scripts: [
          { type: "sig", keyHash: paymentCredential?.hash! },
          {
            type: "before",
            slot: await (
              await activeUser.newConnection(bFKey)
            ).utils.unixTimeToSlot(expiration),
          },
        ],
      });

      var middle = Math.floor(payout.length / 2);
      var before = payout.lastIndexOf("", middle + 1);
      var after = payout.indexOf("", middle);

      if (middle - before < after - middle) {
        middle = before;
      } else {
        middle = after;
      }

      var payout1 = payout.substr(0, middle);
      var payout2 = payout.substr(middle);

      console.log(payout1);
      console.log(payout2);

      const policyId: PolicyId = await (
        await activeUser.newConnection(bFKey)
      ).utils.mintingPolicyToId(mintingPolicy);
      console.log(percentRoyalty);
      const rate = (+percentRoyalty / 100).toFixed(5);
      console.log(percentRoyalty);

      policy = policyId;
      console.log(rate);
      const tx = await (
        await activeUser.newConnection(bFKey)
      )
        .newTx()
        .mintAssets({ [policy]: 1n })
        .attachMetadata(777, {
          rate: rate,
          addr: [payout1, payout2],
        })
        .validTo(expiration)
        .attachMintingPolicy(mintingPolicy)
        .complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      if (txHash) {
        lastHash = txHash;
        const t: ToastSettings = {
          message: "Successfully set royalties",
          background: "variant-filled-tertiary",
        };
        toastStore.trigger(t);
        console.log("SUCCESS");
        hasRoyalties = true;
      } else {
        const t: ToastSettings = {
          message: "Failed to set royalties",
          background: "variant-filled-warning",
        };
        toastStore.trigger(t);
        console.log("FAILED");
      }
    }
  }

  async function getAddy() {
    let walletId = $page.params.id;
    console.log(walletId);

    if (cardano && cardano[walletId]) {
      const connector = cardano[walletId];
      // Attempt to fetch connector API
      let wallet: WalletApi;
      try {
        wallet = await connector.enable();
      } catch (e) {
        return null;
      }
      const activeUser = new WalletConnection(wallet);
      usr = await (await activeUser.newConnection(bFKey)).wallet.address();
      payout = usr;
    }
  }

  async function burnToken() {
    let walletId = $page.params.id;
    console.log(walletId);

    if (cardano && cardano[walletId]) {
      const connector = cardano[walletId];
      // Attempt to fetch connector API
      let wallet: WalletApi;
      try {
        wallet = await connector.enable();
      } catch (e) {
        return null;
      }

      const activeUser = new WalletConnection(wallet);
      usr = await (await activeUser.newConnection(bFKey)).wallet.address();

      const tx = await (
        await activeUser.newConnection(bFKey)
      )
        .newTx()
        .mintAssets({ [policy]: -1n })
        .validTo(expiration)
        .readFrom(await (await activeUser.newConnection(bFKey)).utxosAt(usr))
        .attachMintingPolicy(mintingPolicy)
        .complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      if (txHash) {
        burnt = true;
        const t: ToastSettings = {
          message: "Successfully set royalties",
          background: "variant-filled-tertiary",
        };
        toastStore.trigger(t);
        console.log("SUCCESS");
        showBurn = false;
      } else {
        const t: ToastSettings = {
          message: "Failed to set royalties",
          background: "variant-filled-warning",
        };
        toastStore.trigger(t);
        showBurn = false;
        console.log("FAILED");
      }
    }
  }

  function getImgUrl() {
    console.log(imgUrl);
    console.log("ipfs://" + imgUrl);

    if (!imgUrl.includes("ipfs://")) return "ipfs://" + imgUrl;
    else return imgUrl;
  }
  function getImgUrl2() {
    if (imgUrl2 == null || imgUrl2 == "" || imgUrl2 == undefined) return null;

    if (!imgUrl2.includes("ipfs://")) return "ipfs://" + imgUrl2;
    else return imgUrl2;
  }

  async function load() {
    walletId = $page.params.id;

    if (cardano && cardano[walletId]) {
      const connector = cardano[walletId];
      // Attempt to fetch connector API
      let wallet: WalletApi;
      try {
        wallet = await connector.enable();
      } catch (e) {
        return null;
      }

      const activeUser = new WalletConnection(wallet);
      usr = await (await activeUser.newConnection(bFKey)).wallet.address();

      let supply = 2n;
      supply = BigInt(temp);

      const record: Record<Unit | "lovelace", bigint> = {};
      const unit: Unit = policy + fromText(artname);

      //721 NFT
      const meta = {
        name: artname,
        image: getImgUrl(),
        mediaType: "image/png",
        description: desc,
        files: [
          {
            mediaType: "image/png",
            name: artname,
            src: getImgUrl2() ?? getImgUrl(),
          },
        ],
        editions: temp,
        royalties: percentRoyalty + "%",
        artist: artistname,
      };

      record[unit] = supply;

      const tx = await (
        await activeUser.newConnection(bFKey)
      )
        .newTx()
        .mintAssets(record)
        .payToAddress(usr, {})
        .attachMetadataWithConversion(721, {
          [policy]: { [artname]: meta },
          version: "1.0",
        })
        .validTo(expiration)
        .attachMintingPolicy(mintingPolicy)
        .complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      if (txHash) {
        const t: ToastSettings = {
          message: "Successfully minted " + temp + " editions of " + artname,
          background: "variant-filled-tertiary",
        };
        toastStore.trigger(t);
        isMinted = true;
        console.log("SUCCESS");
      } else {
        const t: ToastSettings = {
          message: "Failed to mint " + temp + " editions of " + artname,
          background: "variant-filled-warning",
        };
        toastStore.trigger(t);
        artname = "";
        temp = 1;
        console.log("FAILED");
      }
    }
  }

  let files: FileList;
  let files2: FileList;

  let isNft: boolean = false;
  let editName = false;
  let editAmt = false;
  let editDesc = false;
  let editArtist = false;

  function handleNew() {
    goto("/mint/" + walletId);
  }

  async function onChangeHandler(e: Event): Promise<void> {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([e.target?.files[0] ?? ""], {
        type: e.target?.files[0].type ?? "",
      }),
      artname + "_" + new Date().toDateString()
    );
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          pinata_api_key: (env?.PUBLIC_API_KEY as string) ?? "",
          pinata_secret_api_key: (env?.PUBLIC_API_SECRET as string) ?? "",
        },
        body: formData,
      }
    );

    const data = await response.json();
    imgUrl = data.IpfsHash;
  }

  async function onChangeHandler2(e: Event): Promise<void> {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([e.target?.files[0] ?? ""], {
        type: e.target?.files[0].type ?? "",
      }),
      artname + "_" + new Date().toDateString()
    );
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          pinata_api_key: (env?.PUBLIC_API_KEY as string) ?? "",
          pinata_secret_api_key: (env?.PUBLIC_API_SECRET as string) ?? "",
        },
        body: formData,
      }
    );

    const data = await response.json();
    imgUrl2 = data.IpfsHash;
  }
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <div>
    <div class="text-center p-6 mx-auto">
      <h2 class="font-bold">MINT {isNft ? "ASSET" : "EDITIONS"}</h2>
      <p>ATTENTION: Website is in BETA mode.</p>
      <br />
      {#if !hasRoyalties}
        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
          <input
            type="text"
            placeholder="Royalty Address"
            bind:value={payout}
          />
          <input
            type="number"
            min="0"
            max="100"
            class="p-4"
            placeholder="%"
            bind:value={percentRoyalty}
          />
          <button
            disabled={payout == null || percentRoyalty == ""}
            class="variant-filled-primary"
            on:click={() => {
              setRoyalty();
            }}>Save</button
          >
        </div>
        <div class="p-6 pt-0 ml-6 mr-6">
          <button
            class="float-left p-2 m-2 underline"
            on:click={() => {
              getAddy();
            }}>active wallet</button
          >
          <button
            class="float-right p-2 m-2"
            on:click={() => {
              payout = "";
              percentRoyalty = "";
            }}>clear</button
          >
        </div>
      {/if}
      {#if !burnt}
        {#if hasRoyalties}
          <div class="card p-4 mt-12 resize-none">
            <label class="label">
              <span>Thumbnail Image</span>
              <FileDropzone name="files" bind:files on:change={onChangeHandler}>
                <svelte:fragment slot="meta"
                  >congrats image has been added to ipfs</svelte:fragment
                >
              </FileDropzone>
            </label>
            <br />
            <label class="label">
              <span>Artwork Name</span>
              <input
                class="input items-center text-center"
                type="text"
                placeholder="Artwork Name"
                bind:value={artname}
              />
            </label>
            <br />
            <label class="label">
              <span>Number of Editions</span>
              <input
                class="input items-center text-center"
                type="number"
                min="0"
                placeholder="Total Editions"
                bind:value={temp}
              />
            </label>
            <br />
            <label class="label">
              <span>Additional Image</span>
              {#if files}
                <FileDropzone
                  name="files"
                  bind:files2
                  on:change={onChangeHandler2}
                >
                  <svelte:fragment slot="meta"
                    >congrats image has been added to ipfs</svelte:fragment
                  >
                </FileDropzone>
              {:else}
                <FileDropzone
                  name="files"
                  bind:files2
                  on:change={onChangeHandler2}
                >
                  <svelte:fragment slot="meta">PNG, JPG, GIFs</svelte:fragment>
                </FileDropzone>
              {/if}
            </label>

            <br />
            <label class="label">
              <span>Artist Name</span>
              <input
                class="input items-center text-center"
                type="text"
                placeholder="Artist Name"
                bind:value={artistname}
              />
            </label>
            <br />
            <label class="label">
              <span>Description</span>
              <textarea
                class="textarea"
                rows="4"
                placeholder="This is a tokenized piece of digital art!"
                bind:value={desc}
              />
            </label>
            <br />
            <button
              disabled={payout == null ||
                percentRoyalty == "" ||
                artistname == "" ||
                artname == "" ||
                imgUrl == null ||
                imgUrl == ""}
              class="btn variant-filled-primary"
              on:click={() => {
                burnToken();
              }}>Burn Token</button
            >
            <br />
          </div>
        {/if}
      {/if}

      {#if burnt}
        <div class="card p-4 mt-12 resize-none">
          <div class="container justify-center flex">
            {#if imgUrl}
              <Avatar
                src="https://ipfs.io/ipfs/{imgUrl}"
                width="w-32 justify-center flex"
                rounded="rounded-md"
              />
            {/if}
            {#if !imgUrl}
              <img src={logo} alt="" class="w-20 h-20 p-0 mx-auto" />
            {/if}
          </div>
          <label class="label">
            {#if !editName}
              <h4>{artname}</h4>
            {:else}
              <input
                class="input items-center text-center"
                type="text"
                placeholder="Artwork Name"
                bind:value={artname}
              />
            {/if}
          </label>
          <br />
          <label class="label pb-2">
            <span>Royalties: {percentRoyalty}%</span>
          </label>
          <label class="label mb-2">
            {#if !editAmt}
              <span>Editions: {temp}</span>
            {:else}
              <div
                class="input-group input-group-divider grid-cols-[auto_1fr_auto]"
              >
                <input
                  class="input items-center text-center"
                  type="number"
                  min="0"
                  placeholder="Total Editions"
                  bind:value={temp}
                />

                <button
                  class="variant-filled-primary"
                  on:click={() => {
                    editAmt = false;
                  }}>Save</button
                >
              </div>
            {/if}
          </label>
          <label class="label mb-2">
            {#if !editArtist}
              <span>Artist: {artistname}</span>
            {:else}
              <input
                class="input items-center text-center"
                type="text"
                placeholder="Artist Name"
                bind:value={artistname}
              />
            {/if}
          </label>
          <label class="label mb-2">
            {#if !editDesc}
              <span>"{desc}"</span>
            {:else}
              <textarea
                class="textarea"
                rows="4"
                placeholder="This is a tokenized piece of digital art!"
                bind:value={desc}
              />
            {/if}
          </label>

          {#if isMinted}
            <button
              class="btn variant-filled-primary input-group"
              on:click={handleNew}>New</button
            >{:else}
            <button
              class="btn variant-filled-primary input-group"
              disabled={artistname == null ||
                artistname == "" ||
                artname == null ||
                artname == "" ||
                temp == null ||
                temp <= 0 ||
                desc == null ||
                desc == "" ||
                imgUrl == null ||
                imgUrl == "" ||
                !burnt}
              on:click={load}>Mint</button
            >
          {/if}
          <br />
        </div>
      {/if}

      <Toast />
    </div>
    {#if policy}
      <span class="p-8"
        ><h12>
          {policy == null || policy == ""
            ? ""
            : "POLICY ID: " + policy.substring(0, 30)}
        </h12></span
      >
      <br />
      <span class="p-8"
        ><h12>
          {policy == null || policy == "" ? "" : policy.substring(30)}
        </h12></span
      >
    {/if}
  </div>
</div>
<div class="-mt-12 justify-center text-center flex items-center">
  <p>FAQ</p>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 512 512"
    id="down-arrow"
    class="float-right text-white"
    ><path
      fill="#eee"
      d="M98.9 184.7l1.8 2.1 136 156.5c4.6 5.3 11.5 8.6 19.2 8.6 7.7 0 14.6-3.4 19.2-8.6L411 187.1l2.3-2.6c1.7-2.5 2.7-5.5 2.7-8.7 0-8.7-7.4-15.8-16.6-15.8H112.6c-9.2 0-16.6 7.1-16.6 15.8 0 3.3 1.1 6.4 2.9 8.9z"
    /></svg
  >
</div>
<div class="container mx-auto flex justify-center items-center">
  <div class="text-center p-6 mx-auto">
    <div>
      <br />
      <h2>What Am I Making?</h2>
      <br />
      <br />
      <p>
        Essentially you are minting a tokenized edition of artwork. Wallets may
        show this as coins or tokens but they are actually just digital numbers
        associated with blockchain addresses and custom metadata.
      </p>
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
  /* @keyframes glow {
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
  } */
</style>
