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
const yaml = require('js-yaml');
const context_1 = require("./context");
const logging_1 = require("./logging");
const api_1 = require("./api");
const outcome_1 = require("./outcome");
const logger = (0, logging_1.getLogger)("index");
function getArgs() {
    let repoDir = process.env.GITHUB_WORKSPACE;
    logger.debug(`GITHUB_WORKSPACE: ${repoDir}`);
    if (repoDir) {
        repoDir = path_1.default.resolve(repoDir);
    }
    else {
        throw new Error("GITHUB_WORKSPACE not set");
    }
    const args = {
        api_url: core.getInput('api_url'),
        api_key: core.getInput('api_key'),
        dogefile: core.getInput('dogefile') || "Dogefile",
        event: process.env.GITHUB_EVENT_NAME || "",
        repo: repoDir,
        ref: process.env.GITHUB_REF || "",
    };
    args.dogefile = path_1.default.resolve(repoDir, args.dogefile);
    if (!(0, fs_1.existsSync)(args.dogefile)) {
        throw new Error(`Dogefile not found: ${args.dogefile}`);
    }
    return args;
}
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
function run(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = yield (0, context_1.getContext)(args);
        const dogefile = loadDogefile(args.dogefile);
        const requestData = {
            context,
            dogefile,
        };
        logger.debug(`context: ${JSON.stringify(context, null, 2)}`);
        const [response, statusCode] = (yield (0, api_1.post)('/back/api/paas/deployment/', requestData));
        return [response, statusCode];
    });
}
exports.run = run;
function main(args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const [res, statusCode] = yield run(args);
            if (res.status === "succeeded") {
                if (statusCode === 201) {
                    // 201 Created : new deployment triggered and taken into account
                    (0, outcome_1.success)(res);
                }
                else {
                    // 200 OK : busy with another deployment of the same context
                    (0, outcome_1.warning)(res);
                }
            }
            else if (res.status === "failed") {
                // RIP
                (0, outcome_1.failure)(statusCode);
                core.setFailed("Deployment failed");
            }
        }
        catch (e) {
            const err = e;
            (0, outcome_1.failure)(null);
            logger.error(err);
            core.setFailed(err.message);
        }
    });
}
main(getArgs()).catch(e => {
    (0, outcome_1.failure)(null);
    logger.error(e);
    core.setFailed(e.message);
});
//# sourceMappingURL=index.js.map