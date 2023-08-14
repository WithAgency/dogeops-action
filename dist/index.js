"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path_1 = __importDefault(require("path"));
const core = __importStar(require("@actions/core"));
const fs_1 = require("fs");
const logging_1 = require("./logging");
const logger = (0, logging_1.getLogger)("index");
const yaml = require('js-yaml');
const { Command } = require("commander");
const context_1 = require("./context");
const api_1 = require("./api");
const outcome_1 = require("./outcome");
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
(0, logging_1.setVerbose)(options.verbose);
/**
 * Get the action arguments from the environment and CLI options.
 */
function getArgs(options) {
    logger.info(`options: ${JSON.stringify(options)}`);
    let repoDir = options.repo;
    logger.debug(`repo dir: ${repoDir}`);
    if (repoDir) {
        repoDir = path_1.default.resolve(repoDir);
    }
    else {
        throw new Error("repository path not set");
    }
    const args = {
        api_url: options.apiUrl,
        api_key: options.apiKey,
        dogefile: options.dogefile,
        event: options.event || "",
        repo: repoDir,
        ref: options.ref || "",
    };
    logger.info(`args: ${JSON.stringify(args)}`);
    args.dogefile = path_1.default.resolve(repoDir, args.dogefile);
    if (!(0, fs_1.existsSync)(args.dogefile)) {
        throw new Error(`Dogefile not found: ${args.dogefile}`);
    }
    return args;
}
/**
 * Load the dogefile
 * @param dogefile - path to the dogefile
 */
function loadDogefile(dogefile) {
    try {
        const data = yaml.load((0, fs_1.readFileSync)(dogefile, { encoding: 'utf-8' }));
        logger.debug(`dogefile: ${JSON.stringify(data)}`);
        return data;
    }
    catch (e) {
        logger.error(`failed to load ${dogefile}: ${e}`);
        throw e;
    }
}
/**
 * Run the action
 * @param args - action arguments
 */
function run(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = yield (0, context_1.getContext)(args);
        const dogefile = loadDogefile(args.dogefile);
        const api = new api_1.DogeApi(args.api_url, args.api_key);
        logger.debug(`context: ${JSON.stringify(context)}`);
        const [response, statusCode] = (yield api.createDeployment(context, dogefile));
        return [response, statusCode];
    });
}
exports.run = run;
/**
 * Main entry point
 * @param args - action arguments
 */
function main(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const [res, statusCode] = yield run(args);
        if (statusCode === 201) {
            // 201 Created : new deployment triggered and taken into account
            (0, outcome_1.success)(res);
        }
        else if (statusCode === 200) {
            // 200 OK : busy with another deployment of the same context
            (0, outcome_1.warning)(res);
        }
        else {
            // 400 Bad Request : invalid request
            // 401 Unauthorized : invalid api key
            // 404 Not Found : invalid api url
            // 500 Internal Server Error : internal error
            (0, outcome_1.failure)(statusCode);
        }
    });
}
main(getArgs(options)).catch(e => {
    (0, outcome_1.failure)(undefined, e);
    // logger.error(e);
    core.setFailed("Failed to trigger deployment");
});
//# sourceMappingURL=index.js.map