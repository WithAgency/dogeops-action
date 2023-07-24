import path from "path";
import * as core from '@actions/core'
import * as github from '@actions/github'
import {existsSync} from "fs";

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
    core.info(JSON.stringify(process.env));
    const args = {
        api_url: core.getInput('api_url'),
        api_key: core.getInput('api_key'),
        dogefile: core.getInput('dogefile') || "Dogefile",
        event: github.context.eventName,
        repo: core.getInput("repo") || process.env.GITHUB_WORKSPACE || process.cwd(),
        ref: core.getInput('ref') || process.env.GITHUB_REF || "",
        verbose: core.getInput('verbose') === "true" || false,
    }

    if (args.repo) {
        args.repo = path.resolve(args.repo);
    }

    args.dogefile = path.resolve(args.repo, args.dogefile);
    if (!existsSync(args.dogefile)) {
        throw new Error(`Dogefile not found: ${args.dogefile}`);
    }

    return args;
}

const args: Args = getArgs();

async function run(args: Args) {
    return args;
}

run(args).then(res => {
    core.info(JSON.stringify(res));
}).catch(err => {
    core.error(err);
    process.exit(1);
});
