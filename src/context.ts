import * as github from '@actions/github';
import {Args} from "."

import {Author, Commit, GitRepo} from "./git";
import {getLogger} from "./logging";

const logger = getLogger("context");


export type Context = {
    event: string,
    repo: string,
    author: Author,
    commit: Commit,
    payload: unknown,
}

export async function getContext(args: Args): Promise<Context> {
    let payload: unknown;

    const githubContext = github.context;

    const repo: GitRepo = new GitRepo(args.repo);
    const commit: Commit = repo.getCommit();
    const author: Author = repo.getAuthor();
    const remoteUrl: string = repo.getRemoteUrl();

    // no payload means we're running locally
    if (githubContext.payload.head_commit !== undefined) {
        logger.debug("getting context from github")
        payload = githubContext.payload;
    } else {
        logger.debug("getting context from git repo")

        const ref = args.ref;
        payload = {};
    }


    return {
        event: args.event,
        repo: remoteUrl,
        commit,
        author,
        payload,
    };
}
