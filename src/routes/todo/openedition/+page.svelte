<script lang="ts">
  import { page } from "$app/stores";
  import { env } from "$env/dynamic/public";
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
  let temp = 1;

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
            {
              type: "sig",
              keyHash: paymentCredential?.hash, //"c2e877fc6edfefbdc3cf3aa4ebc522e80eb6cecbef17917a0f6e6dd4",
            },
          ],
        });
        console.log("mintingPolicy");
        console.log(mintingPolicy);
        // let mintingPolicy = null;
        const policyId = liveConnection.utils.mintingPolicyToId(mintingPolicy);

        const controlAddress =
          liveConnection.utils.validatorToAddress(mintingPolicy);

        controlAddy = controlAddress;

        let supply = 2n;
        supply = BigInt(temp);

        // console.log([referenceUtxo]);
        const tx = await liveConnection
          .newTx()
          .mintAssets({
            [toUnit(policyId, fromText(title), 444)]: supply,
          })
          // .payToAddress(
          //   "addr_test1qzrkmkyzpd5mxw058j4anx2pq6j6wan6zlcjpa36lv3g5xqjelcg7casn9edxzea3neuyqnla3nmnau24rrty8y4gyss5avap5",
          //   { [toUnit(policyId, fromText(title), 444)]: 1n }
          // )
          // .payToAddress(
          //   "addr_test1qr3mz0qxa5ndvcv0tac7jqz7pc4c9j7rc6gh8j0xtmvjjmr687fe2yft906tnzdscp8wkhrq3mgmhdxvqtjgk0lhkrwqdpvcm7",
          //   { [toUnit(policyId, fromText(title), 444)]: 1n }
          // )
          // .payToAddress(
          //   "addr_test1qpg06wpu36w3fz7e93gywjqppm0cvwtndfm8pqezrec9e5l2lu23mpwnk8chc9rqmlkpwg2w7k2pqs6jlt0cqrrxp9eqtwl2dc",
          //   // griffAddress,
          //   { [toUnit(policyId, fromText(title), 444)]: 1n }
          // )
          // .payToAddress(
          //   "addr_test1qzl0txr074ekh57xgpv4l9vtrwnhjfffyavdn0nrl8g00zc7hyfnas0v5c6t3e2g0glmwx823a699dutwpvwy22d9k8ssdm5tp",
          //   { [toUnit(policyId, fromText(title), 444)]: 1n }
          // )
          // .payToAddress(
          //   "addr_test1qqsa6nlhv8gd2k6eqpejjp4wm8kvlx9znmcez66jfdnrfx05fd0nyfg2h7gcmtujasqjj89zj79mszd37dt527j4v5uq7jf9zr",
          //   { [toUnit(policyId, fromText(title), 444)]: 1n }
          // )
          // .payToAddress(
          //   "addr_test1qr5882s0r2gfqpkeer70mxkz7jaejy8h3xxgt3r9sffqyly3s3cs757n0jlgtjywtv075fmnucx3qy3c0mwp65c6alvqy7p342",
          //   { [toUnit(policyId, fromText(title), 444)]: 1n }
          // )
          .validTo(Date.now() + 1000000)
          //   .attachMintingPolicy(mintingPolicy)
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

        // await liveConnection.awaitTx(mintHash);

        // // emulator.awaitBlock(50);
        // let fee = +percentRoyalty / 100;
        // console.log(fee);

        // const { txHash, royaltyToken } = await Contract.createRoyalty(
        //   liveConnection,
        //   [
        //     {
        //       address: payoutAddy,
        //       fee,
        //     },
        //   ],
        //   griffAddress
        // );

        // console.log("Royassdssslties: " + royaltyToken);

        // await liveConnection.awaitTx(txHash);

        // const deployHash = await new Contract(liveConnection, {
        //   royaltyToken,
        //   owner: griffAddress,
        //   policyId: policy,
        // }).deployScripts();

        // console.log("deployjjjjjHash: " + deployHash);

        // await liveConnection.awaitTx(deployHash);

        // const contract = await new Contract(liveConnection, {
        //   royaltyToken,
        //   policyId: policy,
        //   owner: griffAddress,
        //   deployHash,
        // });
        // console.log("contract: " + contract);
        // console.log("Royalties: " + contract.getRoyalty());
        // console.log("Royalties: " + contract.getRoyaltyInfo());
      } catch (e) {
        console.log("err:" + e);
        console.log("err:" + JSON.stringify(e));

        return null;
      }
    }
  }
</script>

<div class="container mx-auto p-4 md:p-0">
  <h1 class="text-center mt-16">OPEN EDITION</h1>
  <br /><br />
  <div class="shadow-lg flex flex-wrap max-w-lg mx-auto border-none">
    <img
      src="https://ipfs.io/ipfs/QmQnGRZFCatcvcLVTUaESCiemikd6ai1ncpkXCnrC5DE36"
      alt=""
      class="max-w-lg h-auto mx-auto object-contain"
    />
  </div>
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
  <p class="text-center mt-6" style="font-size:.9em;">
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam quis
    reiciendis laborum molestiae reprehenderit provident excepturi beatae porro
    itaque delectus. Adipisci expedita ad, itaque harum magni dolores nulla
    placeat quos.
  </p>
  <div class="flex p-3">
    <button
      class="btn variant-filled-surface m-2 mx-auto text-center"
      on:click={mint}>Purchase</button
    >
  </div>
</div>

<Toast />
