import * as github from '@actions/github';
import {Args} from "."

import {Author, Commit, GitRepo} from "./git";
import {getLogger} from "./logging";

const logger = getLogger("context");

/**
 * Action context
 */
export type Context = {
    event: string,
    repo: string,
    author: Author,
    commit: Commit,
    payload: unknown,
}

/**
 * Get the action context from the project's git repository. If the action is
 * running in a GitHub workflow, the context is also populated with the GitHub
 * event payload.
 * @param args
 */
export async function getContext(args: Args): Promise<Context> {

    const githubContext = github.context;

    const repo: GitRepo = new GitRepo(args.repo);
    const commit: Commit = repo.getCommit();
    const author: Author = repo.getAuthor();
    const remoteUrl: string = repo.getRemoteUrl();

    let payload: unknown = {};
    if (githubContext.payload.head_commit !== undefined) {
        logger.debug("getting context from github")
        payload = githubContext.payload;
    }

    return {
        event: args.event,
        repo: remoteUrl,
        commit,
        author,
        payload,
    };
}
