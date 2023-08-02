import * as github from '@actions/github';
import {Args} from "."

import {Author, Commit, GitRepo} from "./git";
import {getLogger} from "./logging";
import {readFileSync} from "fs";
const yaml = require('js-yaml');

const logger = getLogger("context");


export type Context = {
    event: string,
    repo: string,
    author: Author,
    commit: Commit,
    payload: unknown,
    dogefile: unknown,
}

export async function getContext(args: Args): Promise<Context> {
    let author: Author;
    let payload: unknown;
    let commit: Commit;

    const githubContext = github.context;

    // no payload means we're running locally
    if (githubContext.payload.head_commit !== undefined) {
        logger.debug("getting context from github")
        payload = githubContext.payload;
        commit = {
            ref: githubContext.ref,
            sha: githubContext.sha,
            message: githubContext.payload.head_commit.message,
        }
        author = {
            name: githubContext.payload.head_commit.author.name,
            email: githubContext.payload.head_commit.author.email,
        }
    } else {
        logger.debug("getting context from git repo")
        const repo: GitRepo = new GitRepo(args.repo);

        const ref = args.ref;
        payload = {};
        commit = repo.getCommit();
        author = repo.getAuthor();
    }

    const dogefile = loadDogefile(args.dogefile);

    return {
        event: args.event,
        repo: args.repo,
        commit,
        author,
        dogefile,
        payload,
    };
}

function loadDogefile(dogefile: string): unknown {
    try {
        const data = yaml.load(readFileSync(dogefile, {encoding: 'utf-8'}));
        logger.debug(`dogefile: ${JSON.stringify(data)}`);
        return data;
    }
    catch (e) {
        logger.error(`failed to load ${dogefile}: ${e}`);
        throw e;
    }
}
