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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContext = void 0;
const github = __importStar(require("@actions/github"));
const git_1 = require("./git");
const logging_1 = require("./logging");
const fs_1 = require("fs");
const yaml = require('js-yaml');
const logger = (0, logging_1.getLogger)("context");
function getContext(args) {
    return __awaiter(this, void 0, void 0, function* () {
        let author;
        let payload;
        let commit;
        const githubContext = github.context;
        // no payload means we're running locally
        if (githubContext.payload.head_commit !== undefined) {
            logger.debug("getting context from github");
            payload = githubContext.payload;
            commit = {
                ref: githubContext.ref,
                sha: githubContext.sha,
                message: githubContext.payload.head_commit.message,
            };
            author = {
                name: githubContext.payload.head_commit.author.name,
                email: githubContext.payload.head_commit.author.email,
            };
        }
        else {
            logger.debug("getting context from git repo");
            const repo = new git_1.GitRepo(args.repo);
            const ref = args.ref;
            payload = {};
            commit = repo.getCommit();
            author = repo.getAuthor();
        }
        const dogefile = loadDogefile(args.dogefile);
        return {
            event: args.event,
            repo: args.repo,
            commit,
            author,
            dogefile,
            payload,
        };
    });
}
exports.getContext = getContext;
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
//# sourceMappingURL=context.js.map