// @ts-nocheck
import { browser } from "$app/environment";
import type { Actions } from "./$types";
import { env } from "$env/dynamic/private";
import type { PageServerLoad } from "./$types";
import { Blockfrost, Lucid } from "lucid-cardano";
import initLucid from "$lib/lucid";
import { redirect } from "@sveltejs/kit";

export const load = async ({ params }: Parameters<PageServerLoad>[0]) => {};

export const actions = {
  connect: async ({}) => {},
} satisfies Actions;
