import path from "path";
import * as core from '@actions/core'
import {existsSync, readFileSync} from "fs";
import {getLogger, setVerbose} from "./logging";

const logger = getLogger("index");

const yaml = require('js-yaml');
const {Command} = require("commander");

import {Context, getContext} from "./context";
import {Deployment, DogeApi} from "./api";
import {failure, success, warning} from "./outcome";
import {OptionValues} from "commander";

/**
 * Action arguments
 */
export interface Args {
    api_url: string,
    api_key: string,
    dogefile: string,
    event: string,
    repo: string,
    ref: string,
}

const program = new Command();


/**
 * Retrieve the version of the package from the package.json file
 */
function getPackageVersion() {
    const packageJson = require("../package.json");
    return packageJson.version;
}

program
    .version(getPackageVersion())
    .description("A CLI to start a DogeOps deployment")
    .option("--api-url <url>", "URL of the DogeOps API")
    .option("--api-key <key>", "API key to use")
    .option("--dogefile [filename]", "Path to the Dogefile to use", "Dogefile")
    .option("-v, --verbose", "Verbose output")
    .option("--repo <path>", "Path to the git repository")
    .option("--event <name>", "Name of the GitHub event")
    .option("--ref <ref>", "Git ref of the commit being deployed")
    .parse(process.argv);


const options = program.opts();
setVerbose(options.verbose);


/**
 * Get the action arguments from the environment and CLI options.
 */
function getArgs(options: OptionValues): Args {
    logger.info(`options: ${JSON.stringify(options)}`);

    let repoDir = options.repo;
    logger.debug(`repo dir: ${repoDir}`)
    if (repoDir) {
        repoDir = path.resolve(repoDir);
    } else {
        throw new Error("repository path not set");
    }

    const args: Args = {
        api_url: options.apiUrl,
        api_key: options.apiKey,
        dogefile: options.dogefile,
        event: options.event || "",
        repo: repoDir,
        ref: options.ref || "",
    }

    logger.info(`args: ${JSON.stringify(args)}`);

    args.dogefile = path.resolve(repoDir, args.dogefile);
    if (!existsSync(args.dogefile)) {
        throw new Error(`Dogefile not found: ${args.dogefile}`);
    }

    return args;
}


/**
 * Load the dogefile
 * @param dogefile - path to the dogefile
 */
function loadDogefile(dogefile: string): unknown {
    try {
        const data = yaml.load(readFileSync(dogefile, {encoding: 'utf-8'}));
        logger.debug(`dogefile: ${JSON.stringify(data)}`);
        return data;
    } catch (e) {
        logger.error(`failed to load ${dogefile}: ${e}`);
        throw e;
    }
}

/**
 * Run the action
 * @param args - action arguments
 */
export async function run(args: Args): Promise<[Deployment, number]> {
    const context: Context = await getContext(args);
    const dogefile = loadDogefile(args.dogefile);

    const api = new DogeApi(args.api_url, args.api_key);

    logger.debug(`context: ${JSON.stringify(context)}`);
    const [response, statusCode] = (await api.createDeployment(context, dogefile)) as [Deployment, number];

    return [response, statusCode];
}

/**
 * Main entry point
 * @param args - action arguments
 */
async function main(args: Args) {
    const [res, statusCode]: [Deployment, number] = await run(args);
    if (statusCode === 201) {
        // 201 Created : new deployment triggered and taken into account
        success(res)
    } else if (statusCode === 200) {
        // 200 OK : busy with another deployment of the same context
        warning(res);
    } else {
        // 400 Bad Request : invalid request
        // 401 Unauthorized : invalid api key
        // 404 Not Found : invalid api url
        // 500 Internal Server Error : internal error
        failure(statusCode);

        switch (statusCode) {
            case 400:
                core.setFailed("Invalid request");
                break;
            case 401:
                core.setFailed("Invalid API key");
                break;
            case 404:
                core.setFailed("Invalid API URL");
                break;
            case 500:
                core.setFailed("Internal error");
                break;
            default:
                core.setFailed("Unknown error "+ statusCode);
                break;
        }
    }
}

main(getArgs(options)).catch(e => {
    failure(undefined, e);
    // logger.error(e);
    core.setFailed("Failed to trigger deployment");
});
