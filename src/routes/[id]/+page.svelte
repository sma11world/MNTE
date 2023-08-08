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

  let files: any = [];

  let artname = "MeBaby";
  let artistname = "Artist name";
  let desc = "Test";
  let imgUrl = "QmeorbDDeVrRR8Z4YmcWfVYLCMyBFoyBCbvyCpTGgNSMKm";
  let imgUrl2 = "";
  let temp = 10;
  let percentRoyalty = "10";
  let isNft = false;
  let policy = "";
  let walletId = "";
  let payoutAddy =
    "addr_test1qpwzwpv7yawrpdes0wn56zprupy6ddjz78df58yhx2jyl953l2vnvgm387wmseau0zqp8a239a8q8x0jcrwsl3yssevs7gjydh";
  let currentStep = 0;
  let totalSteps = 2;
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
        console.log("policy: " + policy);

        //todo: if i got bugs i need to use unspendableAddress instead of usr (it neeeds a script addy not users)
        const tx = await lucid
          .newTx()
          .mintAssets({
            [toUnit(policy, fromText(artname), 100)]: 1n,
            [toUnit(policy, fromText(artname), 222)]: supply,
          })
          .payToContract(
            unspendableAddress,
            Data.to(
              new Constr(0, [
                Data.fromJson({
                  name: artname,
                  image: !imgUrl.includes("ipfs://")
                    ? "ipfs://" + imgUrl
                    : imgUrl,
                  mediaType: "image/png",
                  description: desc,
                  files: [
                    {
                      mediaType: "image/png",
                      name: artname,
                      image: !imgUrl2.includes("ipfs://")
                        ? "ipfs://" + imgUrl2
                        : imgUrl2 != ""
                        ? imgUrl2
                        : imgUrl,
                    },
                  ],
                  editions: temp,
                  royalties: percentRoyalty + "%",
                  artist: artistname,
                  imageHash: "sha256",
                  standard: "cip68",
                }),
                supply,
                new Constr(0, []),
              ])
            ),
            { [toUnit(policy, fromText(artname), 100)]: 1n }
          )
          .validFrom(emulator.now())
          .attachMintingPolicy(script)
          .complete();

        console.log("Minted Assets!");

        const signedTx = await tx.sign().complete();
        const mintHash = await signedTx.submit();

        if (mintHash) {
          const t: ToastSettings = {
            message: "Successfully minted " + temp + " editions of " + artname,
            background: "variant-filled-tertiary",
          };
          toastStore.trigger(t);
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

<div class="container h-full mx-auto flex justify-center items-center">
  <div>
    <div class="text-center p-6 mx-auto">
      <h2 class="font-bold">MINT {isNft ? "ASSET" : "EDITIONS"}</h2>
      <p>ATTENTION: Website is in BETA mode.</p>
      <br />
      {#if currentStep == 0}
        <ImageCard data={"Create"} bind:files />
      {:else if currentStep == 1}
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
        <br />
        <button
          class="btn variant-filled-primary input-group"
          disabled={artistname == null ||
            artistname == "" ||
            artname == null ||
            artname == "" ||
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
      {:else}
        <p>Oops!</p>
      {/if}
      <br />
      <button
        class="btn variant-filled-surface input-group"
        on:click={handleNext}
        >{currentStep == totalSteps ? "Restart" : "Continue"}</button
      >
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
  <!-- <p>FAQ</p>
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
  > -->
</div>
<div class="container mx-auto flex justify-center items-center">
  <div class="text-center p-6 mx-auto">
    <div>
      <br />
      <h2>What Am I Making?</h2>
      <br />
      <br />
      {#if !files}
        <div class="card">
          <div>
            <img
              class="card-img"
              src="https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Prescription01&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Twinkle&skinColor=Light"
            />
          </div>
          <div class="card-text">
            <h2 class="card-title">Gaurav Gawade</h2>
            <p class="card-description">
              <span
                >Lorem ipsum dolor sit amet consectetur, adipisicing eli.</span
              >
            </p>
            <ul class="card-skills">
              <li class="skill">UI Designer.</li>
              <li class="skill">UX Designer.</li>
              <li class="skill">Web Developer.</li>
            </ul>
            <a href="#" class="card-link">Read More</a>
          </div>
        </div>
      {:else}
        <p>
          Essentially you are minting a tokenized edition of artwork. Wallets
          may show this as coins or tokens but they are actually just digital
          numbers associated with blockchain addresses and custom metadata.
        </p>
      {/if}
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
