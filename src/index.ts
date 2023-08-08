import path from "path";
import * as core from '@actions/core'
import {existsSync, readFileSync} from "fs";
const yaml = require('js-yaml');

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
        ref: process.env.GITHUB_REF || "",
    }

    args.dogefile = path.resolve(repoDir, args.dogefile);
    if (!existsSync(args.dogefile)) {
        throw new Error(`Dogefile not found: ${args.dogefile}`);
    }

    return args;
}

export type Deployment = {
    id: number,
    status: string,
    progress_url: string,
}


function loadDogefile(dogefile: string): unknown {
    try {
        const data = yaml.load(readFileSync(dogefile, {encoding: 'utf-8'}));
        logger.debug(`dogefile: ${JSON.stringify(data)}`);
        return data;
    }
    catch (e) {
        logger.error(`failed to load ${dogefile}: ${e}`);
        throw e;
    }
}


export async function run(args: Args): Promise<[Deployment, number]> {
    const context: Context = await getContext(args);
    const dogefile = loadDogefile(args.dogefile);

    const requestData = {
        context,
        dogefile,
    }
    logger.debug(`context: ${JSON.stringify(context, null, 2)}`);
    const [response, statusCode] = (await post('/back/api/paas/deployment/', requestData)) as [Deployment, number];

    return [response, statusCode];
}

async function main(args: Args) {
    try {
        const [res, statusCode] : [Deployment, number] = await run(args);
        logger.debug(`response: ${JSON.stringify(res)}`);
        if (res.status === "succeeded") {
                if (statusCode === 201) {
                    // 201 Created : new deployment triggered and taken into account
                    success(res)
                } else {
                    // 200 OK : busy with another deployment of the same context
                    warning(res);
                }
            } else if (res.status === "failed") {
                // RIP
                failure(statusCode);
                core.setFailed("Deployment failed");
            }
    } catch (e) {
        const err = e as Error;
        failure(null);
        logger.error(err);
        core.setFailed(err.message)
    }
}

main(getArgs()).catch(e => {
    failure(null);
    logger.error(e);
    core.setFailed(e.message);
});
