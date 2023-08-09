<script lang="ts">
  import { page } from "$app/stores";
  import { env } from "$env/dynamic/public";
  import ImageCard from "$lib/ImageCard.svelte";
  import {
    Avatar,
    Toast,
    toastStore,
    type ToastSettings,
  } from "@skeletonlabs/skeleton";
  import { Contract } from "@spacebudz/nebula";
  import {
    Constr,
    Data,
    Emulator,
    fromText,
    Lucid,
    toUnit,
    type SpendingValidator,
    type WalletApi,
    Blockfrost,
    type Script,
  } from "lucid-cardano";

  //build stages
  let currentStep = 0;
  let totalSteps = 2;

  //asset
  let files: any = [];
  let title = "";
  let desc = "";
  let percentRoyalty = "";
  let payoutAddy =
    "addr_test1qpwzwpv7yawrpdes0wn56zprupy6ddjz78df58yhx2jyl953l2vnvgm387wmseau0zqp8a239a8q8x0jcrwsl3yssevs7gjydh";

  //idk
  let imgUrl = "QmQPWqbefNjWn55M5s3AMAsHNMMo28mUZAQDhTqeEjNfDu";
  let imgUrl2 = "QmeorbDDeVrRR8Z4YmcWfVYLCMyBFoyBCbvyCpTGgNSMKm";
  let temp = 10;

  //contract/lucid
  let policy = "";
  let walletId = "";

  function handleNext() {
    if (currentStep == totalSteps) {
      currentStep = 0;
    } else {
      currentStep++;
    }
  }

  async function create() {
    walletId = $page.params.id;

    if (cardano && cardano[walletId]) {
      const connector = cardano[walletId];
      // Attempt to fetch connector API
      let wallet: WalletApi;
      try {
        wallet = await connector.enable();
        // const activeUser = new WalletConnection(wallet);

        // let usr = await (await activeUser.newConnection()).wallet.address();
        const bFKey = env?.PUBLIC_BLOCKFROST_API;
        // const emulator = new Emulator([{ address: usr, assets: {} }]);
        const lucid = await Lucid.new(
          new Blockfrost(
            "https://cardano-preprod.blockfrost.io/api/v0",
            bFKey as string
          ),
          "Preprod"
        );

        const liveConnection = await lucid.selectWallet(wallet);
        const griffAddress = await liveConnection.wallet.address();
        console.log(lucid);

        const { paymentCredential } =
          lucid.utils.getAddressDetails(griffAddress);

        const mintingPolicy = liveConnection.utils.nativeScriptFromJson({
          type: "all",
          scripts: [
            { type: "sig", keyHash: paymentCredential?.hash },
            {
              type: "before",
              slot: liveConnection.utils.unixTimeToSlot(Date.now() + 1000000),
            },
          ],
        });

        const policyId = liveConnection.utils.mintingPolicyToId(mintingPolicy);

        const unspendableAddress =
          liveConnection.utils.validatorToAddress(mintingPolicy);

        let supply = 2n;
        supply = BigInt(temp);
        // console.log("unspendableAddress: " + unspendableAddress);
        console.log("policy: " + policyId);
        console.log("ref asset:" + [toUnit(policyId, fromText(title), 100)]);
        console.log("user asset:" + [toUnit(policyId, fromText(title), 444)]);

        const [utxo] = await liveConnection.wallet.getUtxos();

        const tx = await liveConnection
          .newTx()
          .collectFrom([utxo])
          .mintAssets({
            [toUnit(policyId, fromText(title), 100)]: 1n,
            [toUnit(policyId, fromText(title), 444)]: supply,
          })
          .payToContract(
            unspendableAddress,
            Data.to(
              new Constr(0, [
                Data.fromJson({
                  name: title,
                  image: !imgUrl.includes("ipfs://")
                    ? "ipfs://" + imgUrl
                    : imgUrl,
                  mediaType: "image/png",
                  description: desc,
                  files: [
                    {
                      mediaType: "image/png",
                      name: title,
                      image: !imgUrl2.includes("ipfs://")
                        ? "ipfs://" + imgUrl2
                        : imgUrl2 != ""
                        ? imgUrl2
                        : imgUrl,
                    },
                  ],
                  editions: temp,
                  royalties: percentRoyalty + "%",
                  artist: "testing 123",
                  standard: "cip68",
                  version: 1n,
                }),
                222,
                new Constr(0, []),
              ])
            ),
            {
              [toUnit(policyId, title, 100)]: 1n,
            }
          )
          .attachMintingPolicy(mintingPolicy)
          .complete()
          .then((tx) => tx.sign().complete());

        const mintHash = await tx.submit();

        if (mintHash) {
          const t: ToastSettings = {
            message: "Successfully minted " + temp + " editions of " + title,
            background: "variant-filled-tertiary",
          };
          toastStore.trigger(t);
          console.log("SUCCESS");
        } else {
          const t: ToastSettings = {
            message: "Failed to mint " + temp + " editions of " + title,
            background: "variant-filled-warning",
          };
          toastStore.trigger(t);
          title = "";
          temp = 1;
          console.log("FAILED");
        }

        await liveConnection.awaitTx(mintHash);

        // emulator.awaitBlock(50);
        let fee = +percentRoyalty / 100;
        console.log(fee);

        const { txHash, royaltyToken } = await Contract.createRoyalty(
          liveConnection,
          [
            {
              address: payoutAddy,
              fee,
            },
          ],
          griffAddress
        );

        console.log("Royassdssslties: " + royaltyToken);

        await liveConnection.awaitTx(txHash);

        const deployHash = await new Contract(liveConnection, {
          royaltyToken,
          owner: griffAddress,
          policyId: policy,
        }).deployScripts();

        console.log("deployjjjjjHash: " + deployHash);

        await liveConnection.awaitTx(deployHash);

        const contract = await new Contract(liveConnection, {
          royaltyToken,
          policyId: policy,
          owner: griffAddress,
          deployHash,
        });
        console.log("contract: " + contract);
        console.log("Royalties: " + contract.getRoyalty());
        console.log("Royalties: " + contract.getRoyaltyInfo());
        // console.log("Royalties: "+contract.sell(, ));
      } catch (e) {
        console.log("err:" + JSON.stringify(e));

        return null;
      }
    }
  }
</script>

<div class="container justify-center text-center mx-auto items-center">
  <div class="flex">
    <div class="text-center p-6 mx-auto">
      {#if currentStep == 0}
        <ImageCard data={"Create"} bind:files />
      {:else if currentStep == 1}
        <label class="label">
          <span>Artwork Name</span>
          <input
            class="input items-center text-center"
            type="text"
            placeholder="Title"
            bind:value={title}
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
      {:else if currentStep == totalSteps}
        <label class="label">
          <span>Royalties</span>
          <input
            class="input items-center text-center"
            type="number"
            placeholder="4 = 4%"
            bind:value={percentRoyalty}
          />
        </label>
        <br />
        <label class="label">
          <span>Royalty Address</span>
          <input
            class="input items-center text-center"
            type="text"
            placeholder="Your Royalty Wallet"
            bind:value={payoutAddy}
          />
        </label>
      {:else}
        <p>Oops!</p>
      {/if}
      <br />

      <button
        class="btn variant-filled-surface input-group"
        on:click={handleNext}
        >{currentStep == totalSteps ? "Restart" : "Continue"}</button
      >
    </div>
  </div>
  <div class="">
    <div class="text-center p-6 mx-auto">
      {#if files.length > 0 && currentStep >= 1}
        <div class="card">
          <div class="flex mx-auto p-4">
            <img
              class="h-32 w-32 card-img h-full rounded"
              src={URL.createObjectURL(files[0])}
            />
            <h2 class="card-title p-4">{title.substring(0, 13)}</h2>
            <p class="card-description">
              <span>{desc.substring(0, 30)}</span>
            </p>
            {#if percentRoyalty}
              <ul class="">
                <li class="skill">Royalties: {percentRoyalty}%</li>
                <li class="skill">
                  Royalty Payout: {payoutAddy.substring(0, 13)}
                </li>
              </ul>
            {/if}
          </div>
        </div>
        <br />
        <button class="btn variant-filled-primary input-group" on:click={create}
          >Mint</button
        >
        <br />
      {/if}
    </div>
  </div>
</div>
<Toast />

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
</style>
