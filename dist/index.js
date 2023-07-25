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
const path_1 = __importDefault(require("path"));
const core = __importStar(require("@actions/core"));
const fs_1 = require("fs");
function getArgs() {
    const args = {
        api_url: core.getInput('api_url'),
        api_key: core.getInput('api_key'),
        dogefile: core.getInput('dogefile') || "Dogefile",
        event: process.env.GITHUB_EVENT_NAME || "",
        repo: process.env.GITHUB_WORKSPACE || process.cwd(),
        ref: process.env.GITHUB_REF_NAME || "",
        verbose: core.getInput('verbose') === "true" || false,
    };
    if (args.repo) {
        args.repo = path_1.default.resolve(args.repo);
    }
    args.dogefile = path_1.default.resolve(args.repo, args.dogefile);
    if (!(0, fs_1.existsSync)(args.dogefile)) {
        throw new Error(`Dogefile not found: ${args.dogefile}`);
    }
    return args;
}
const args = getArgs();
function run(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = new context_1.Context({
            event: args.event,
            repo: args.repo,
            ref: args.ref,
            dogefile: args.dogefile,
        });
    });
}
run(args).then(res => {
    core.info(JSON.stringify(res));
}).catch(err => {
    core.error(err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map