import { Blockfrost, Emulator, Lucid, TxSigned } from "lucid-cardano";
import type { WalletApi } from "lucid-cardano";
import { env } from "$env/dynamic/public";

export default class WalletConnection {
  constructor(private readonly api: WalletApi) {}

  async newConnection(bFKey?: string): Promise<Lucid> {
    if (bFKey === null || bFKey === "" || bFKey === undefined) {
      bFKey = env?.PUBLIC_BLOCKFROST_API;
    }
    const lucid = await Lucid.new(
      new Blockfrost(
        "https://cardano-preprod.blockfrost.io/api/v0",
        bFKey as string
      ),
      "Preprod"
    );

    lucid.selectWallet(this.api);

    return lucid;
  }
}
