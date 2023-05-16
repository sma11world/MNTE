<script lang="ts">
  import { page } from "$app/stores";
  import logo from "$lib/assets/mnt.png";
  import WalletConnection from "$lib/wallet-connection";
  import { Toast, toastStore } from "@skeletonlabs/skeleton";
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
  let showBurn = false;
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

  async function setRoyalty() {
    let walletId = $page.params.wallet;
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

  async function burnToken() {
    let walletId = $page.params.wallet;
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
        // .collectFrom(
        //   await (await activeUser.newConnection(bFKey)).wallet.getUtxos()
        // )
        .validTo(expiration)
        .attachMintingPolicy(mintingPolicy)
        .complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      if (txHash) {
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
    let walletId = $page.params.wallet;

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

      artname = artname.trim();

      let supply = 2n;
      supply = BigInt(temp);

      let metaRecord: Record<string, any> = {};
      metaRecord = { [policy]: { [artname]: undefined }, version: "1.0" };
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
        artist: artistname,
      };

      metaRecord[artname] = meta;

      record[unit] = supply;

      // const chainMetadata = {
      //   [policy]: meta,
      //   version: "1.0",
      // };

      const tx = await (await activeUser.newConnection(bFKey))
        .newTx()
        .mintAssets(record)
        .payToAddress(usr, {})
        .payToAddress("", record)
        .payToAddress("", record)
        .attachMetadata(721, metaRecord)
        .validTo(expiration)
        .attachMintingPolicy(mintingPolicy)
        .complete();

      // pinata
      //   .testAuthentication()
      //   .then((result) => {
      //     //handle successful authentication here
      //     console.log(result);
      //   })
      //   .catch((err) => {
      //     //handle error here
      //     console.log(err);
      //   });

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      if (txHash) {
        const t: ToastSettings = {
          message: "Successfully minted " + temp + " editions of " + artname,
          background: "variant-filled-tertiary",
        };
        toastStore.trigger(t);
        artname = "";
        temp = 0;
        desc = "";
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

  let isNft: boolean = false;
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <div class="text-center p-6 mx-auto">
    <h2 class="font-bold">MINT EDITIONS</h2>
    {#if hasBFKey}
      <p>ATTENTION: Website is in BETA mode.</p>
    {:else}
      <p>Add your API key and Image CID below.</p>
      <br />
    {/if}
    <span>{policy == null || policy == "" ? "" : "write this down!"}</span>
    <span
      ><h6>
        {policy == null || policy == "" ? "" : "POLICY ID: " + policy}
      </h6></span
    >
    <span
      ><h6>
        {policy == null || policy == ""
          ? ""
          : "Royalties: " + percentRoyalty + "%"}
      </h6></span
    >
    {#if imgUrl && hasRoyalties}
      <img
        src="https://ipfs.io/ipfs/{imgUrl}"
        alt=""
        class="w-20 h-20 p-0 mx-auto mb-1"
      />
    {/if}
    {#if !hasBFKey != null && !hasBFKey}
      <div class="input-group input-group-divider mb-4">
        <input
          type="text"
          placeholder="BlockFrost Api Key"
          bind:value={bFKey}
        />
      </div>

      <div class="input-group input-group-divider mb-4">
        <input type="text" placeholder="IPFS (CID)" bind:value={imgUrl} />
      </div>

      <button
        disabled={bFKey == null ||
          bFKey == "" ||
          imgUrl == null ||
          imgUrl == ""}
        class="btn variant-filled-primary"
        on:click={() => {
          showBurn = true;
          hasBFKey = !hasBFKey;
        }}>Submit</button
      >
    {/if}
    <br />
    {#if !hasRoyalties && hasBFKey}
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <input type="text" placeholder="Payout Address" bind:value={payout} />
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
    {/if}
    {#if showBurn && hasRoyalties}
      <button
        disabled={payout == null || percentRoyalty == ""}
        class="btn variant-filled-primary"
        on:click={() => {
          burnToken();
        }}>Burn Token</button
      >
    {/if}
    {#if hasRoyalties && !showBurn}
      <div class="card p-4 mt-12">
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
          <span>Additional Image IPFS CID</span>
          <input
            class="input items-center text-center"
            type="text"
            placeholder="IPFS (CID)"
            bind:value={imgUrl2}
          />
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
            imgUrl == ""}
          on:click={load}>Mint</button
        >
      </div>

      <Toast />
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
      fill="#e36414"
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
        Essentially you are minting a tokenized edition of your meta you create.
        Wallets may show this as coins or tokens but they are actually just
        digital numbers associated with blockchain addresses and custom
        metadata.
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
