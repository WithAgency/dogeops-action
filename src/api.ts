import fetch from "node-fetch";
import * as core from '@actions/core';
import {getLogger} from "./logging";

const logger = getLogger("api");

function getBaseUrl() {
    let baseUrl = core.getInput('api_url');
    if (!baseUrl) {
        throw new Error("api_url not set");
    }
    if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
    }
    return baseUrl;
}

export function getApiUrl(path: string) {
    return `${getBaseUrl()}${path}`;
}

function authHeaders(otherHeaders: Record<string, string> = {}) {
    const apiKey = core.getInput('api_key');
    if (!apiKey) {
        throw new Error("api_key not set");
    }
    return {
        ...otherHeaders,
        'X-Api-Key': apiKey,
    };
}

export const post = async (path: string, data: unknown) => {

    const body = JSON.stringify(data);
    logger.debug(`POST ${path} ${body}`);

    const res = await fetch(getApiUrl(path), {
        method: 'POST',
        body,
        headers: authHeaders({'Content-Type': 'application/json'}),
    });
    const json = await res.json();
    logger.debug(`POST ${path} ${res.status} ${JSON.stringify(json)}`);
    return [json, res.status];
}
