import type { Actions } from "./$types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {};

export const actions = {
  connect: async ({}) => {},
} satisfies Actions;
