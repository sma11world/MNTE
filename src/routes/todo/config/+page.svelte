<script lang="ts">
  import { page } from "$app/stores";
  import { env } from "$env/dynamic/public";
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

  //build stages
  $: currentStep = STEP_UPLOAD;
  let totalSteps = 2;

  //asset
  let files: any = [];
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

  async function mint() {
    walletId = "nami";

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
        const griffAddress = await liveConnection.wallet.address();

        const { paymentCredential } =
          lucid.utils.getAddressDetails(griffAddress);
        console.log("P " + paymentCredential);

        const mintingPolicy = liveConnection.utils.nativeScriptFromJson({
          type: "all",
          scripts: [
            { type: "sig", keyHash: paymentCredential?.hash },
            {
              type: "before",
              slot: lucid.utils.unixTimeToSlot(Date.now() + 10000000),
            },
          ],
        });
        console.log("hash");
        console.log(paymentCredential?.hash);

        const policyId = liveConnection.utils.mintingPolicyToId(mintingPolicy);

        const controlAddress =
          liveConnection.utils.validatorToAddress(mintingPolicy);

        controlAddy = controlAddress;

        let supply = 2n;
        supply = BigInt(temp);
        console.log("updateableAddress: " + controlAddress);
        console.log("policy: " + policyId);

        const [utxo] = await lucid.utxosAt(controlAddress);

        const [referenceUtxo] = await lucid.utxosAtWithUnit(
          controlAddress,
          toUnit(policyId, fromText(title), 100)
        );

        const royaltyInfo: any = {
          address: payoutAddy,
          fee: percentRoyalty,
          // minFee: recipient.minFee || null,
          // maxFee: recipient.maxFee || null,
          version: 1n,
          extra: Data.from<Data>(Data.void()),
        };

        // console.log([referenceUtxo]);
        const tx = await liveConnection
          .newTx()
          // .collectFrom([referenceUtxo])
          .mintAssets({
            [toUnit(policyId, fromText(token), 100)]: 1n,
            [toUnit(policyId, fromText(token), 500)]: 1n,
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
                  image: files[0]["ipfs"],
                  mediaType: "image/png",
                  description: desc,
                  // files: [
                  //   {
                  //     mediaType: "image/png",
                  //     name: "STAGE #1",
                  //     image: !imgUrl.includes("ipfs://")
                  //       ? "ipfs://" + imgUrl
                  //       : imgUrl != ""
                  //       ? imgUrl
                  //       : imgUrl,
                  //   },
                  //   {
                  //     mediaType: "image/png",
                  //     name: "STAGE #2",
                  //     image: !imgUrl2.includes("ipfs://")
                  //       ? "ipfs://" + imgUrl2
                  //       : imgUrl2 != ""
                  //       ? imgUrl2
                  //       : imgUrl2,
                  //   },
                  // ],
                }),
                1n,
                new Constr(0, []),
              ])
            ),
            {
              [toUnit(policyId, fromText(token), 100)]: 1n,
            }
          )
          .validTo(Date.now() + 10000000)
          .attachMintingPolicy(mintingPolicy)
          .complete();

        const signedTx = await tx.sign().complete();
        const mintHash = await signedTx.submit();

        if (mintHash) {
          const t: ToastSettings = {
            message: "Successfully minted " + temp + " editions of " + title,
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

<div class="container mt-32 mx-auto p-4 md:p-0">
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
            on:click={mint}
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
            class="flex flex-row w-full rounded-lg relative bg-transparent justify-center items-center mt-12"
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
            Total Number of Editions
          </p>
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
  <h1 class="text-center mt-16">MINT EDITIONS</h1>
  <!-- <p class="text-center mt-6" style="font-size:.9em;">
    learn about <a
      href="https://www.worlddomz.net"
      style="text-decoration: none;">world domination</a
    >
  </p> -->
</div>

<Toast />
