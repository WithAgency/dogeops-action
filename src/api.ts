import fetch from "node-fetch";
import {getLogger} from "./logging";
import {Context} from "./context";

const logger = getLogger("api");

/**
 * Deployment status
 */
export type Deployment = {
    id: number,
    status: string,
    progress_url: string,
}


export class DogeApi {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(baseUrl: string, apiKey: string) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    /**
    * Set the API headers.
    */
    private apiHeaders(otherHeaders: Record<string, string> = {}) {
        return {
            'Content-Type': 'application/json',
            'X-Api-Key': this.apiKey,
            ...otherHeaders,
        };
    }

    /**
     * Create a deployment with the given context and Dogefile
     * @param context
     * @param dogefile
     */
    public async createDeployment(
        context: Context,
        dogefile: unknown,
    ): Promise<[unknown, number]> {
        const url = new URL("/back/api/paas/deployment/", this.baseUrl);
        const href = url.href;
        const data = {
            context,
            dogefile,
        }
        const body = JSON.stringify(data);
        const res = await fetch(url, {
            method: 'POST',
            body,
            headers: this.apiHeaders(),
        });

        const plainResponse = await res.text();
        try{
            const json = JSON.parse(plainResponse);
            logger.debug(`POST ${href} ${res.status} ${JSON.stringify(json)}`);
            return [json, res.status];
        }catch (e) {
            logger.error(`POST ${href} ${res.status} ${plainResponse}`);
            return [null, res.status];
        }
    }
}
