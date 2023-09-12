<script lang="ts">
  import { page } from "$app/stores";
  import { env } from "$env/dynamic/public";
  import AirdropCard from "$lib/AirdropCard.svelte";
  import ImageCard from "$lib/ImageCard.svelte";
  import {
    Toast,
    toastStore,
    type ToastSettings,
  } from "@skeletonlabs/skeleton";
  import {
    Constr,
    Data,
    fromText,
    Lucid,
    toUnit,
    type WalletApi,
    Blockfrost,
  } from "lucid-cardano";

  const STEP_UPLOAD = "image";
  const STEP_META = "metadata";
  const STEP_EDITION = "editions";
  const STEP_ROYALTIES = "royalties";

  let airDropWallets = "";
  let isAirdrop = false;
  // airDropWallets.indexOf(",") > -1
  //   ? airDropWallets.split(",")
  //   : airDropWallets.split(" ");

  //build stages
  $: currentStep = STEP_UPLOAD;

  //asset
  let files: any = [];
  let airdropFiles: any = [];
  let controlAddy = "";
  let token = "";
  let title = "";
  let artist = "";
  let desc = "";
  let percentRoyalty = "";
  let payoutAddy = "";

  //editions
  let temp = 0;

  //contract/lucid
  let policy = "";
  let walletId = "";

  function handleNext(step: string) {
    currentStep = step;
  }

  async function create() {
    walletId = $page.params.id;

    if (cardano && cardano[walletId]) {
      const connector = cardano[walletId];
      // Attempt to fetch connector API
      let wallet: WalletApi;
      try {
        wallet = await connector.enable();

        const bFKey = env?.PUBLIC_BLOCKFROST_API;

        const lucid = await Lucid.new(
          new Blockfrost(
            "https://cardano-preprod.blockfrost.io/api/v0",
            bFKey as string
          ),
          "Preprod"
        );

        const liveConnection = await lucid.selectWallet(wallet);
        const connectedWalletAddress = await liveConnection.wallet.address();

        const { paymentCredential } = lucid.utils.getAddressDetails(
          connectedWalletAddress
        );

        const mintingPolicy = liveConnection.utils.nativeScriptFromJson({
          type: "all",
          scripts: [{ type: "sig", keyHash: paymentCredential?.hash }],
        });

        // {
        //       type: "before",
        //       slot: lucid.utils.unixTimeToSlot(Date.now() + 10000000),
        //     },

        const policyId = liveConnection.utils.mintingPolicyToId(mintingPolicy);

        const controlAddress =
          liveConnection.utils.validatorToAddress(mintingPolicy);

        controlAddy = controlAddress;

        let addys = [connectedWalletAddress];

        let supply = 2n;
        supply = BigInt(temp);

        const [utxo] = await lucid.utxosAt(controlAddress);

        const [referenceUtxo] = await lucid.utxosAtWithUnit(
          controlAddress,
          toUnit(policyId, fromText(title), 100)
        );
        console.log(files[0].ipfs);
        const imgUrl = files[0].ipfs;

        const royaltyInfo: any = {
          address: payoutAddy,
          fee: percentRoyalty,
          // minFee: recipient.minFee || null,
          // maxFee: recipient.maxFee || null,
          version: 1n,
          extra: Data.from<Data>(Data.void()),
        };

        const txBuilder = await liveConnection
          .newTx()
          // .collectFrom([referenceUtxo])
          .mintAssets({
            [toUnit(policyId, fromText(token), 100)]: 1n,
            // [toUnit(policyId, fromText(title), 222)]: 1n,
            [toUnit(policyId, fromText(token), 444)]: supply,
            [toUnit(policyId, fromText(token), 500)]: 1n,
            // [toUnit(policyId, fromText(title + "#2"), 100)]: -1n,
          })
          .payToAddressWithData(
            controlAddress,
            Data.to(
              new Constr(0, [Data.fromJson(royaltyInfo), 1n, new Constr(0, [])])
            ),
            { [toUnit(policyId, fromText(token), 500)]: 1n }
          )
          .payToContract(
            controlAddress,
            Data.to(
              new Constr(0, [
                Data.fromJson({
                  name: title,
                  image: imgUrl.includes("ipfs://")
                    ? imgUrl
                    : "ipfs://" + imgUrl,
                  mediaType: "image/png",
                  description: desc,
                  // archive: { image: imgUrl, mediaType: "image/png" },
                }),
                1n,
                new Constr(0, []),
              ])
            ),
            {
              [toUnit(policyId, fromText(token), 100)]: 1n,
            }
          )
          .validTo(Date.now() + 100000)
          .attachMintingPolicy(mintingPolicy);

        for (let i = 0; i < addys.length; i++) {
          txBuilder.payToAddress(addys[i], {
            [toUnit(policyId, fromText(token), 444)]: 1n,
          });
        }

        const tx = await txBuilder.complete();

        const txSigned = await tx.sign().complete();
        const mintHash = await txSigned.submit();

        if (mintHash) {
          const t: ToastSettings = {
            message: "Successfully created " + temp + " editions of " + title,
            background: "variant-secondary-primary",
          };
          toastStore.trigger(t);
          console.log("SUCCESS");
        } else {
          const t: ToastSettings = {
            message: "Failed to mint " + temp + " editions of " + title,
            background: "variant-filled-tertiary",
          };
          toastStore.trigger(t);
          title = "";
          temp = 1;
          console.log("FAILED");
        }
      } catch (e) {
        console.log("err:" + e);
        console.log("err:" + JSON.stringify(e));

        return null;
      }
    }
  }
</script>

<!-- <p>{console.log(airDropWallets.includes(","))}</p> -->
<div class="container mt-32 mx-auto p-4 md:p-0">
  <h1 class="text-center mt-16">MINT EDITIONS</h1>
  <br />
  <div class="shadow-lg flex flex-wrap w-full lg:w-3/4 mx-auto border-none">
    <div
      class="w-full md:w-1/5 h-64 md:h-auto relative p-4 bg-black text-white"
    >
      <div class="text-xl text-center items-center justify-center">
        <ul class="mt-12 p-1">
          <li class="">
            <button
              class="focus:text-primary-500"
              on:click={() => {
                handleNext(STEP_UPLOAD);
              }}>upload</button
            >
          </li>
          <li class="">
            <button
              class="focus:text-secondary-500"
              on:click={() => {
                handleNext(STEP_META);
              }}>metadata</button
            >
          </li>
          <li class="">
            <button
              class="focus:text-tertiary-500"
              on:click={() => {
                handleNext(STEP_EDITION);
              }}>editions</button
            >
          </li>
          <li class="">
            <button
              class="focus:text-warning-500"
              on:click={() => {
                handleNext(STEP_ROYALTIES);
              }}>royalties</button
            >
          </li>
          <!-- disabled={files[0]?.ipfs == null || token == ""} -->
          <button
            on:click={create}
            class="bg-white hover:bg-grey-darker focus:text-error hover:text-white w-1/2 lg:w-full py-2 mx-auto mt-12 text-black"
            >MINT</button
          >
        </ul>
        <i
          class="fa fa-heart text-white hover:text-red-light ml-4 mt-4 cursor-pointer"
        />
      </div>
    </div>

    <div class="w-full md:w-3/4 ml-2" style="background-color:transparent;">
      <div class="h-full mx-auto px-6">
        {#if currentStep == STEP_UPLOAD}
          <ImageCard bind:files />
        {:else if currentStep == STEP_META}
          <div
            class="w-full lg:w-5/5 lg:border-right lg:border-solid text-center md:text-left"
          >
            <br />
            <label class="label p-2">
              <!-- <span>Token:</span> -->
              <input
                class="focus:border-secondary-500 input items-center text-center"
                type="text"
                placeholder="Token Name"
                bind:value={token}
              />
            </label>
            <label class="label p-2">
              <input
                class="focus:border-secondary-500 input items-center text-center"
                type="text"
                placeholder="Artwork Title"
                bind:value={title}
              />
            </label>

            <label class="label p-2">
              <input
                class="focus:border-secondary-500 input items-center text-center"
                type="text"
                placeholder="Artist Name"
                bind:value={artist}
              />
            </label>
          </div>

          <label class="label p-2">
            <input
              class="focus:border-secondary-500 input items-center text-center"
              type="text"
              placeholder="Description"
              bind:value={desc}
            />
          </label>
        {:else if currentStep == STEP_EDITION}
          <div
            class="flex flex-row w-full rounded-lg relative bg-transparent justify-center items-center mt-6"
          >
            <label class="label p-2">
              <input
                class="input items-center text-center focus:border-tertiary-500"
                type="number"
                placeholder="Total Editions"
                bind:value={temp}
              />
            </label>
          </div>
          <p class="mb-0 mt-4 text-grey-dark text-sm italic text-center">
            Set Number of Editions
          </p>

          <!-- <div class="container mx-auto flex justify-center items-center mt-6">
            <button
              class="variant-filled-tertiary p-2 text-center mx-auto"
              on:click={() => {
                isAirdrop = !isAirdrop;
              }}>Airdrop To Users</button
            >
            <br />
          </div> -->
          <!-- <p class="container mx-auto flex justify-center items-center mt-6">
            Airdrop: {isAirdrop ? "on" : "off"}
          </p> -->
        {:else if currentStep == STEP_ROYALTIES}
          <p class="mb-0 mt-3 text-grey-dark text-sm italic">Payout Wallet</p>

          <div
            class="block w-full rounded-lg relative bg-transparent justify-center items-center mt-12"
          >
            <label class="label p-2">
              <input
                class="input items-center text-center focus:border-warning-500"
                type="text"
                placeholder="Payout Address"
                bind:value={payoutAddy}
              />
            </label>
            <label class="label p-2">
              <input
                class="input items-center text-center focus:border-warning-500"
                type="number"
                placeholder="% Royalties"
                bind:value={percentRoyalty}
              />
            </label>
          </div>
        {:else}
          <p class="mb-0 mt-3 text-grey-dark text-sm italic">Minted Asset</p>
          <div
            class="block w-full rounded-lg relative bg-transparent justify-center items-center mt-12"
          >
            <p class="mb-0 mt-3 text-grey-dark text-sm italic">
              Token: {token}
            </p>
            <p class="mb-0 mt-3 text-grey-dark text-sm italic">
              Royalty Wallet: {payoutAddy}
            </p>
            <p class="mb-0 mt-3 text-grey-dark text-sm italic">
              Control Wallet: {controlAddy}
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
  <!-- {#if isAirdrop}
    {#each { length: temp } as _, i}
      <input
        class="input items-center text-center focus:border-tertiary-500 m-2"
        type="text"
        placeholder="Wallet Address"
      />
    {/each}
  {/if} -->
</div>

<Toast />
