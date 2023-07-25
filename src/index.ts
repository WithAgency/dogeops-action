import path from "path";
import * as core from '@actions/core'
import {existsSync} from "fs";

import {Context, getContext} from "./context";
import {Commit, Author, GitRepo} from "./git";

interface Args {
    api_url: string,
    api_key: string,
    dogefile: string,
    event: string,
    repo: string,
    ref: string,
    verbose: boolean,
}

function getArgs(): Args {
    let repoDir = process.env.GITHUB_WORKSPACE || process.cwd();
    if (repoDir) {
        repoDir = path.resolve(repoDir);
    }

    const args: Args = {
        api_url: core.getInput('api_url'),
        api_key: core.getInput('api_key'),
        dogefile: core.getInput('dogefile') || "Dogefile",
        event: process.env.GITHUB_EVENT_NAME || "",
        repo: repoDir,
        ref: process.env.GITHUB_REF_NAME || "",
        verbose: core.getInput('verbose') === "true" || false,
    }

    args.dogefile = path.resolve(repoDir, args.dogefile);
    if (!existsSync(args.dogefile)) {
        throw new Error(`Dogefile not found: ${args.dogefile}`);
    }

    return args;
}

const args: Args = getArgs();

async function run(args: Args) {
    const repo = new GitRepo(args.repo);

    const context: Context = await getContext(args);


    return context;
}

run(args).then(res => {
    core.info(JSON.stringify(res));
}).catch(err => {
    core.error(err);
    process.exit(1);
});

export {Args, run};
