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
exports.getLogger = void 0;
const core = __importStar(require("@actions/core"));
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("./utils");
const index_1 = require("./index");
/**
 * Returns true if verbose logging is enabled
 */
function verbose() {
    const isVerbose = index_1.options.verbose === "true" || process.env.ACTIONS_STEP_DEBUG === "true";
    console.log(`Verbose logging: ${isVerbose}`);
    return isVerbose;
}
/**
 * Get a logger for the given name. If running in a GitHub Action, the logger
 * will use the GitHub Actions logging API.
 * @param name - logger name
 */
function getLogger(name) {
    const verboseLogging = verbose();
    if ((0, utils_1.isGitHubAction)()) {
        return new GitHubActionLog(name, verboseLogging);
    }
    return new Log(name, verboseLogging);
}
exports.getLogger = getLogger;
/**
 * Log messages are colored based on their level
 */
const logColors = {
    debug: chalk_1.default.gray,
    info: chalk_1.default.white,
    warn: chalk_1.default.yellow,
    warning: chalk_1.default.yellow,
    error: chalk_1.default.red,
};
/**
 * Log messages are prefixed based on their level
 */
const logPrefixes = {
    debug: "[DBG]",
    info: "[INF]",
    warn: "[WRN]",
    warning: "[WRN]",
    error: "[ERR]",
};
class Log {
    constructor(name, verbose) {
        this.verbose = verbose;
        this.name = name;
    }
    formatMessage(level, message) {
        return `${logPrefixes[level]} ${message}`;
    }
    logMessage(level, message, ...supportingData) {
        const lines = [];
        for (let line of message.split("\n")) {
            lines.push(this.formatMessage(level, line));
        }
        const color = logColors[level];
        const msg = color(lines.join("\n"));
        if (level === "warning") {
            level = "warn";
        }
        console[level](msg);
    }
    debug(message) {
        if (this.verbose) {
            this.logMessage("debug", message);
        }
    }
    info(message) {
        this.logMessage("info", message);
    }
    warn(message) {
        this.logMessage("warn", message);
    }
    error(message) {
        if (message instanceof Error) {
            message = message.stack || message.message;
        }
        this.logMessage("error", message);
    }
}
class GitHubActionLog {
    constructor(name, verbose) {
        this.name = name;
        this.verbose = verbose;
    }
    formatMessage(level, message) {
        return `${logPrefixes[level]} ${message}`;
    }
    logMessage(level, message) {
        const lines = [];
        for (let line of message.split("\n")) {
            lines.push(this.formatMessage(level, line));
        }
        const msg = lines.join("\n");
        if (level === "warn") {
            level = "warning";
        }
        core[level](msg);
    }
    debug(message) {
        if (this.verbose) {
            this.logMessage("debug", message);
        }
    }
    info(message) {
        this.logMessage("info", message);
    }
    warn(message) {
        this.logMessage("warn", message);
    }
    error(message) {
        if (message instanceof Error) {
            message = message.stack || message.message;
        }
        this.logMessage("error", message);
    }
}
//# sourceMappingURL=logging.js.map