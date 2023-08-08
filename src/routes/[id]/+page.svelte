<script lang="ts">
  import { page } from "$app/stores";
  import ImageCard from "$lib/ImageCard.svelte";
  import WalletConnection from "$lib/wallet-connection";
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
        const activeUser = new WalletConnection(wallet);

        let usr = await (await activeUser.newConnection()).wallet.address();

        const emulator = new Emulator([{ address: usr, assets: {} }]);
        const lucid = await Lucid.new(emulator);

        lucid.selectWallet(wallet);

        const { paymentCredential } = await lucid.utils.getAddressDetails(
          await usr
        );

        const script = await lucid.utils.nativeScriptFromJson({
          type: "all",
          scripts: [
            { type: "after", slot: 10 },
            { type: "sig", keyHash: paymentCredential?.hash! },
          ],
        });

        emulator.awaitBlock(10);

        policy = lucid.utils.mintingPolicyToId(script);

        const unspendableScript: SpendingValidator = {
          type: "PlutusV2",
          script: "54530100003222233335734600893124c4c9312501",
        };
        const unspendableAddress =
          lucid.utils.validatorToAddress(unspendableScript);

        let supply = 2n;
        supply = BigInt(temp);
        console.log("unspendableAddress: " + unspendableAddress);
        console.log("policy: " + policy);
        console.log("ref asset:" + [toUnit(policy, fromText(title), 100)]);
        console.log("user asset:" + [toUnit(policy, fromText(title), 444)]);

        const tx = await lucid
          .newTx()
          .mintAssets({
            [toUnit(policy, fromText(title), 100)]: 1n,
            [toUnit(policy, fromText(title), 444)]: supply,
          })
          .payToContract(
            unspendableAddress,
            Data.to(
              new Constr(0, [
                Data.fromJson({
                  files_details: {
                    name: title,
                    mediaType: "image/png",
                    src: !imgUrl.includes("ipfs://")
                      ? "ipfs://" + imgUrl
                      : imgUrl,
                  },
                  metadata: {
                    mediaType: "image/png",
                    name: title,
                    image: !imgUrl2.includes("ipfs://")
                      ? "ipfs://" + imgUrl2
                      : imgUrl2 != ""
                      ? imgUrl2
                      : imgUrl,
                  },
                  description: desc,
                  editions: temp,
                  royalties: percentRoyalty + "%",
                }),
                supply,
                new Constr(0, []),
              ])
            ),
            { [toUnit(policy, fromText(title), 100)]: 1n }
          )
          .validFrom(emulator.now())
          .attachMintingPolicy(script)
          .complete();

        console.log("Minted Assets!");

        const signedTx = await tx.sign().complete();
        const mintHash = await signedTx.submit();

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

        await lucid.awaitTx(mintHash);

        emulator.awaitBlock(50);
        let fee = +percentRoyalty / 100;
        console.log(fee);

        const { txHash, royaltyToken } = await Contract.createRoyalty(
          lucid,
          [
            {
              address: payoutAddy,
              fee,
            },
          ],
          usr
        );
        console.log("Royassdssslties: " + royaltyToken);

        await lucid.awaitTx(txHash);

        const deployHash = await new Contract(lucid, {
          royaltyToken,
          owner: usr,
          policyId: policy,
        }).deployScripts();

        console.log("deployjjjjjHash: " + deployHash);

        await lucid.awaitTx(deployHash);

        const contract = await new Contract(lucid, {
          royaltyToken,
          policyId: policy,
          owner: usr,
          deployHash,
        });
        console.log("contract: " + contract);
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
        <button
          class="btn variant-filled-primary input-group"
          disabled={title == null ||
            title == "" ||
            temp == null ||
            temp <= 0 ||
            payoutAddy == "" ||
            percentRoyalty == "" ||
            desc == null ||
            desc == "" ||
            imgUrl == null ||
            imgUrl == ""}
          on:click={create}>Mint</button
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
