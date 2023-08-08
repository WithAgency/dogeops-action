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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.getLogger = void 0;
const core = __importStar(require("@actions/core"));
const chalk_1 = __importDefault(require("chalk"));
function verbose() {
    return core.getInput('VERBOSE') === "true" || process.env.ACTIONS_STEP_DEBUG === "true";
}
function getLogger(name) {
    return new Log(name, verbose());
}
exports.getLogger = getLogger;
const logColors = {
    debug: chalk_1.default.gray,
    info: chalk_1.default.white,
    warn: chalk_1.default.yellow,
    error: chalk_1.default.red,
};
const logPrefixes = {
    debug: "[DBG]",
    info: "[INF]",
    warn: "[WRN]",
    error: "[ERR]",
};
function splitLines(t) {
    return t.split(/\r\n|\r|\n/);
}
class Log {
    constructor(name, verbose) {
        this.verbose = verbose;
        this.name = name;
    }
    formatMessage(level, message) {
        let msg = `${logPrefixes[level]} ${message}`;
        return msg;
    }
    logMessage(level, message, ...supportingData) {
        const lines = [];
        for (let line of message.split("\n")) {
            lines.push(this.formatMessage(level, line));
        }
        const color = logColors[level];
        const msg = color(lines.join("\n"));
        if (supportingData.length > 0) {
            console[level](msg, ...supportingData);
        }
        else {
            console[level](msg);
        }
    }
    debug(message, ...supportingData) {
        if (this.verbose) {
            this.logMessage("debug", message, ...supportingData);
        }
    }
    info(message, ...supportingData) {
        this.logMessage("info", message, ...supportingData);
    }
    warn(message, ...supportingData) {
        this.logMessage("warn", message, ...supportingData);
    }
    error(message, ...supportingData) {
        if (message instanceof Error) {
            message = message.stack || message.message;
        }
        this.logMessage("error", message, ...supportingData);
    }
}
exports.Log = Log;
//# sourceMappingURL=logging.js.map