// @ts-nocheck
import type { Actions } from "./$types";
import type { PageServerLoad } from "./$types";

export const load = async ({ params }: Parameters<PageServerLoad>[0]) => {};

export const actions = {
  connect: async ({}) => {},
} satisfies Actions;
