import { execFile } from "node:child_process";
import { lstatSync } from "node:fs";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const execFileAsync = promisify(execFile);

export default function (pi: ExtensionAPI) {
  pi.registerCommand("clear", {
    description: "Move the current session to the trash and start a new one",
    async handler(_args, ctx) {
      if (!ctx.hasUI) return;
      const file = ctx.sessionManager.getSessionFile();

      await ctx.newSession({
        // Only touch the old file after the replacement succeeds and the old
        // runtime is closed
        withSession: async (nextCtx) => {
          if (!file) return;
          try {
            const stat = lstatSync(file, { throwIfNoEntry: false });
            // An empty session may not have been written to disk yet
            if (!stat) return;
            if (!stat.isFile()) {
              throw new Error("The session path does not point to a regular file");
            }
            await execFileAsync("/usr/bin/trash", [file]);
          } catch (error) {
            nextCtx.ui.notify(`Failed to move the old session to the trash: ${error}`, "error");
          }
        },
      });
    },
  });
}
