import * as core from '@actions/core';
import chalk from "chalk";

export interface LogInterface {
    debug: (message: string, ...supportingData: any[]) => void;
    info: (message: string, ...supportingData: any[]) => void;
    warn: (message: string, ...supportingData: any[]) => void;
    error: (message: string, ...supportingData: any[]) => void;
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

    private logMessage(msgType: "debug" | "info" | "warn" | "error", message: string, ...supportingData: any[]) {
        let msg = `${this.name} - ${message}`;

        msg = logColors[msgType](msg);
        if (supportingData.length > 0) {
            console[msgType](msg, ...supportingData);
        } else {
            console[msgType](msg);
        }
    }

    public debug(message: string, ...supportingData: any[]) {
        if (this.verbose) {
            this.logMessage("debug", message, ...supportingData);
        }
    }

    public info(message: string, ...supportingData: any[]) {
        this.logMessage("info", message, ...supportingData);
    }

    public warn(message: string, ...supportingData: any[]) {
        this.logMessage("warn", message, ...supportingData);
    }

    public error(message: string, ...supportingData: any[]) {
        this.logMessage("error", message, ...supportingData);
    }
}
