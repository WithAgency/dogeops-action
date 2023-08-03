import * as core from '@actions/core';
import chalk from "chalk";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogInterface {
    debug: (message: string, ...supportingData: unknown[]) => void;
    info: (message: string, ...supportingData: unknown[]) => void;
    warn: (message: string, ...supportingData: unknown[]) => void;
    error: (error: string | Error, ...supportingData: unknown[]) => void;
}

function verbose() {
    return core.getInput('VERBOSE') === "true";
}

export function getLogger(name: string): LogInterface {
    return new Log(name, verbose());
}

const logColors = {
    debug: chalk.gray,
    info: chalk.white,
    warn: chalk.yellow,
    error: chalk.red,
}

const logPrefixes = {
    debug: "[DBG]",
    info: "[INF]",
    warn: "[WRN]",
    error: "[ERR]",
}

function splitLines(t: string) {
    return t.split(/\r\n|\r|\n/);
}

export class Log implements LogInterface {
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
        let msg = `${logPrefixes[level]} ${message}`;
        return msg;
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
        if (supportingData.length > 0) {
            console[level](msg, ...supportingData);
        } else {
            console[level](msg);
        }
    }

    public debug(message: string, ...supportingData: unknown[]) {
        if (this.verbose) {
            this.logMessage("debug", message, ...supportingData);
        }
    }

    public info(message: string, ...supportingData: unknown[]) {
        this.logMessage("info", message, ...supportingData);
    }

    public warn(message: string, ...supportingData: unknown[]) {
        this.logMessage("warn", message, ...supportingData);
    }

    public error(message: string | Error, ...supportingData: unknown[]) {
        if (message instanceof Error) {
            message = message.stack || message.message;
        }
        this.logMessage(
            "error",
            message as string,
            ...supportingData
        );
    }
}
