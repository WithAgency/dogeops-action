import {GitRepoInfo} from "git-repo-info";
import {getLogger} from "./logging";
const { execSync } = require('child_process');
const shell = (cwd: string, cmd: string) => {
    const command = `cd ${cwd} && ${cmd}`;
    return execSync(command, {encoding: 'utf8'}).trimEnd();
}

const getRepoInfo = require('git-repo-info');

const logger = getLogger("git");

export type Author = {
    name: string,
    email: string,
}

export type Commit = {
    ref: string,
    sha: string,
    message: string,
}

export class GitRepo {
    private readonly info: GitRepoInfo;
    private readonly repoDir: string;

    constructor(repoDir: string) {
        this.repoDir = repoDir;
        this.info = getRepoInfo(repoDir);
        logger.debug(`repo info: ${JSON.stringify(this.info)}`);
    }

    private splitAuthor(author: string): [string, string] {
        const [name, email] = author.split(" <");
        return [name, email.slice(0, -1)];
    }

    getRemoteUrl(): string {
        const remote = shell(this.repoDir, "git config --get remote.origin.url");
        return remote.trim();
    }

    getAuthor(): Author {
        const [name, email] = this.splitAuthor(this.info.author);

        const author: Author = {
            name: name,
            email: email,
        }
        logger.debug(`author: ${JSON.stringify(author)}`);
        return author;
    }

    getCommit(): Commit {
        // return the full refs/heads/branch name
        const ref = shell(this.repoDir, "git symbolic-ref HEAD");

        return {
            ref,
            sha: this.info.sha,
            message: this.info.commitMessage,
        }
    }
}
