import * as core from '@actions/core';
import chalk from "chalk";
import {isGitHubAction} from "./utils";

export type LogLevel = "debug" | "info" | "warning" | "warn" | "error";


export interface LogInterface {
    debug: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (error: string | Error) => void;
}

//*
// * Returns true if verbose logging is enabled
// */
function verbose() {
    return core.getInput('VERBOSE') === "true" || process.env.ACTIONS_STEP_DEBUG === "true";
}

//*
// * Returns true if running in a GitHub Action
// */
export function getLogger(name: string): LogInterface {
    if (isGitHubAction()) {
        return new GitHubActionLog(name, verbose());
    }
    return new Log(name, verbose());
}

const logColors = {
    debug: chalk.gray,
    info: chalk.white,
    warn: chalk.yellow,
    warning: chalk.yellow,
    error: chalk.red,
}

const logPrefixes = {
    debug: "[DBG]",
    info: "[INF]",
    warn: "[WRN]",
    warning: "[WRN]",
    error: "[ERR]",
}

class Log implements LogInterface {
    private readonly verbose: boolean;
    private readonly name: string;

    constructor(
        name: string,
        verbose: boolean,
    ) {
        this.verbose = verbose;
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
        if (supportingData.length > 0) {
            console[level](msg);
        } else {
            console[level](msg);
        }
    }

    public debug(message: string) {
        if (this.verbose) {
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
    private readonly verbose: boolean;

    constructor(
        name: string,
        verbose: boolean,
    ) {
        this.name = name;
        this.verbose = verbose;
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
        if (this.verbose) {
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
