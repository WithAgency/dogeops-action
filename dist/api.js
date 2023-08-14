"use strict";
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
exports.DogeApi = exports.setBaseUrl = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const logging_1 = require("./logging");
const logger = (0, logging_1.getLogger)("api");
let _BASE_URL = undefined;
function setBaseUrl(url) {
    _BASE_URL = url;
}
exports.setBaseUrl = setBaseUrl;
class DogeApi {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    /**
    * Get the authentication headers
    * @param otherHeaders - additional headers to include
    */
    authHeaders(otherHeaders = {}) {
        return Object.assign(Object.assign({}, otherHeaders), { 'X-Api-Key': this.apiKey });
    }
    /**
     * Create a deployment with the given context and Dogefile
     * @param context
     * @param dogefile
     */
    createDeployment(context, dogefile) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = new URL("/back/api/paas/deployment/", this.baseUrl);
            const href = url.href;
            const data = {
                context,
                dogefile,
            };
            const body = JSON.stringify(data);
            const res = yield (0, node_fetch_1.default)(url, {
                method: 'POST',
                body,
                headers: this.authHeaders({ 'Content-Type': 'application/json' }),
            });
            const json = yield res.json();
            logger.debug(`POST ${href} ${res.status} ${JSON.stringify(json)}`);
            return [json, res.status];
        });
    }
}
exports.DogeApi = DogeApi;
//# sourceMappingURL=api.js.map