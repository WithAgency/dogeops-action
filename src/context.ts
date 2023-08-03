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
    let author: Author;
    let payload: unknown;
    let commit: Commit;
    let remoteUrl: string;

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
        remoteUrl = githubContext.repo.repo;
    } else {
        const repo: GitRepo = new GitRepo(args.repo);
        logger.debug("getting context from git repo")

        const ref = args.ref;
        payload = {};
        commit = repo.getCommit();
        author = repo.getAuthor();
        remoteUrl = repo.getRemoteUrl();
    }


    return {
        event: args.event,
        repo: remoteUrl,
        commit,
        author,
        payload,
    };
}
