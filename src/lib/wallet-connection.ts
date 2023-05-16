import { Blockfrost, Lucid, TxSigned } from "lucid-cardano";
import ShortUniqueId from "short-unique-id";
import type { WalletApi } from "lucid-cardano";
import { env } from "$env/dynamic/public";

export default class WalletConnection {
  private signedTx: TxSigned | undefined;

  private invoiceId = "";

  stakeAddresses: string = "";

  nfts: any[] = [];
  constructor(private readonly api: WalletApi) {}

  async newConnection(bFKey?: string): Promise<Lucid> {
    if (bFKey == null) {
      // bFKey = env.BLOCKFROST_API;
    }

    const lucid = await Lucid.new(
      new Blockfrost(
        "https://cardano-mainnet.blockfrost.io/api/v0",
        bFKey as string
      ),
      "Mainnet"
    );

    lucid.selectWallet(this.api);
    return lucid;
  }

  async getAssetArray(): Promise<any> {}
}
