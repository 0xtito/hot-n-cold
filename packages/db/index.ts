import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

import * as friendships from "./schema/friendships";
import * as games from "./schema/games";
import * as users from "./schema/users";

export * from "drizzle-orm";
export const schema = { ...friendships, ...users, ...games };

export const db = drizzle(
  new Client({
    url: process.env.DATABASE_URL,
  }).connection(),
  { schema },
);