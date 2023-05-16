import { Blockfrost, Lucid } from "lucid-cardano";

const initLucid = async (wallet: string, key: string) => {
  const api = await cardano[wallet.toLowerCase()].enable();

  const lucid = await Lucid.new(
    new Blockfrost("https://cardano-mainnet.blockfrost.io/api/v0", key),
    "Mainnet"
  );
  lucid.selectWallet(api);
  return lucid;
};

export default initLucid;
