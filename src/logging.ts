import * as core from '@actions/core';
import chalk from "chalk";
import {isGitHubAction} from "./utils";

export type LogLevel = "debug" | "info" | "warning" | "warn" | "error";

let _VERBOSE = false;

export function setVerbose(v: boolean) {
    _VERBOSE = v;
}

export interface LogInterface {
    debug: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (error: string | Error) => void;
}

/**
 * Get a logger for the given name. If running in a GitHub Action, the logger
 * will use the GitHub Actions logging API.
 * @param name - logger name
 */
export function getLogger(name: string): LogInterface {
    if (isGitHubAction()) {
        return new GitHubActionLog(name);
    }
    return new Log(name);
}

/**
 * Log messages are colored based on their level
 */
const logColors = {
    debug: chalk.gray,
    info: chalk.white,
    warn: chalk.yellow,
    warning: chalk.yellow,
    error: chalk.red,
}

/**
 * Log messages are prefixed based on their level
 */
const logPrefixes = {
    debug: "[DBG]",
    info: "[INF]",
    warn: "[WRN]",
    warning: "[WRN]",
    error: "[ERR]",
}

class Log implements LogInterface {
    private readonly name: string;

    constructor(
        name: string,
    ) {
        this.name = name;
    }

    private formatMessage(
        level: LogLevel,
        message: string,
    ): string {
        return `${logPrefixes[level]} ${message}`;
    }

    private logMessage(
        level: LogLevel,
        message: string,
        ...supportingData: unknown[]
    ) {

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

    public debug(message: string) {
        if (_VERBOSE) {
            this.logMessage("debug", message);
        }
    }

    public info(message: string) {
        this.logMessage("info", message);
    }

    public warn(message: string) {
        this.logMessage("warn", message);
    }

    public error(message: string | Error) {
        if (message instanceof Error) {
            message = message.stack || message.message;
        }
        this.logMessage(
            "error",
            message as string
        );
    }
}

class GitHubActionLog implements LogInterface {
    private readonly name: string;

    constructor(
        name: string,
    ) {
        this.name = name;
    }

    private formatMessage(
        level: LogLevel,
        message: string,
    ): string {
        return `${logPrefixes[level]} ${message}`;
    }

    private logMessage(
        level: LogLevel,
        message: string,
    ) {
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

    public debug(message: string) {
        if (_VERBOSE) {
            this.logMessage("debug", message);
        }
    }

    public info(message: string) {
        this.logMessage("info", message);
    }

    public warn(message: string) {
        this.logMessage("warn", message);
    }

    public error(message: string | Error) {
        if (message instanceof Error) {
            message = message.stack || message.message;
        }
        this.logMessage(
            "error",
            message as string
        );
    }
}
