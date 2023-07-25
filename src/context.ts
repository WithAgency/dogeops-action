import * as github from '@actions/github';

type Author = {
    name: string,
    email: string,
    username: string,
}

type Commit = {
    ref: string,
    sha: string,
    message: string,
}

type Context = {
    event: string,
    repo: string,
    author: Author,
    commit: Commit,
    payload: unknown,
    dogefile: unknown,
}

async function getContext(args: unknown): Promise<Context> {
    const githubContext = github.context;
    const payload = githubContext.payload;
    const commit : Commit = {
        ref: githubContext.ref,
        sha: githubContext.sha,
        message: githubContext.payload.head_commit.message,
    }
    const author : Author = {
        name: githubContext.payload.head_commit.author.name,
        email: githubContext.payload.head_commit.author.email,
        username: githubContext.payload.head_commit.author.username,
    }

    const ctx: Context = {
        event: args.event,
        repo: args.repo,
        commit: commit,
        payload: payload,
        dogefile: args.dogefile,
        author: author,
    }
    return ctx;
}

export { Author, Commit, Context, getContext };
