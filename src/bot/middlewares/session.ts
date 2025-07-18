import LocalSession from "telegraf-session-local";

export const session = new LocalSession({ database: "./session.json" });
