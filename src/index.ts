import path from "path";
import * as core from '@actions/core'
import {existsSync} from "fs";

import {Context, getContext} from "./context";
import {getLogger} from "./logging";
import {post} from "./api";
import {failure, success, warning} from "./outcome";


const logger = getLogger("index");

export interface Args {
    api_url: string,
    api_key: string,
    dogefile: string,
    event: string,
    repo: string,
    ref: string,
}

function getArgs(): Args {
    let repoDir = process.env.GITHUB_WORKSPACE;
    logger.debug(`GITHUB_WORKSPACE: ${repoDir}`)
    if (repoDir) {
        repoDir = path.resolve(repoDir);
    } else {
        throw new Error("GITHUB_WORKSPACE not set");
    }

    const args: Args = {
        api_url: core.getInput('api_url'),
        api_key: core.getInput('api_key'),
        dogefile: core.getInput('dogefile') || "Dogefile",
        event: process.env.GITHUB_EVENT_NAME || "",
        repo: repoDir,
        ref: process.env.GITHUB_REF_NAME || "",
    }

    args.dogefile = path.resolve(repoDir, args.dogefile);
    if (!existsSync(args.dogefile)) {
        throw new Error(`Dogefile not found: ${args.dogefile}`);
    }

    return args;
}

const args: Args = getArgs();

export type Deployment = {
    id: number,
    status: string,
    progress_url: string,
}

export async function run(args: Args): Promise<[Deployment, number]> {
    const context: Context = await getContext(args);
    logger.debug(`context: ${JSON.stringify(context, null, 2)}`);
    const [response, statusCode] = await post('/back/api/deployment/', context) as [Deployment, number];

    return [response, statusCode];
}

run(args).then(([res, statusCode]) => {
    logger.debug(JSON.stringify(res, null, 2));
    if (res.status === "succeeded") {
        if (statusCode === 201) {
            success(res)
        } else {
            warning(res);
        }
    } else if (res.status === "failed") {
        failure(statusCode);
        core.setFailed("Deployment failed");
    }
}).catch(err => {
    logger.error(err);
    process.exit(1);
});
