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
exports.post = exports.setBaseUrl = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const core = __importStar(require("@actions/core"));
const logging_1 = require("./logging");
const logger = (0, logging_1.getLogger)("api");
let _BASE_URL = undefined;
function setBaseUrl(url) {
    _BASE_URL = url;
}
exports.setBaseUrl = setBaseUrl;
/**
 * Get the base URL for the API
 */
function getBaseUrl() {
    let baseUrl = _BASE_URL;
    if (!baseUrl) {
        throw new Error("api_url not set");
    }
    if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
    }
    return baseUrl;
}
/**
 * Get the full URL for the given path
 * @param path - path to the API endpoint
 */
function getApiUrl(path) {
    return `${getBaseUrl()}${path}`;
}
/**
 * Get the authentication headers
 * @param otherHeaders - additional headers to include
 */
function authHeaders(otherHeaders = {}) {
    const apiKey = core.getInput('api_key');
    if (!apiKey) {
        throw new Error("api_key not set");
    }
    return Object.assign(Object.assign({}, otherHeaders), { 'X-Api-Key': apiKey });
}
/**
 * Perform a POST request to the API
 * @param path
 * @param data
 */
const post = (path, data) => __awaiter(void 0, void 0, void 0, function* () {
    const body = JSON.stringify(data);
    logger.debug(`POST ${path} ${body}`);
    const res = yield (0, node_fetch_1.default)(getApiUrl(path), {
        method: 'POST',
        body,
        headers: authHeaders({ 'Content-Type': 'application/json' }),
    });
    const json = yield res.json();
    logger.debug(`POST ${path} ${res.status} ${JSON.stringify(json)}`);
    return [json, res.status];
});
exports.post = post;
//# sourceMappingURL=api.js.map