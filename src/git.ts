import {GitRepoInfo} from "git-repo-info";
import {getLogger} from "./logging";

const {execSync} = require('child_process');

/**
 * Run a shell command in a given directory
 * @param cwd - working directory
 * @param cmd - command to run
 */
const shell = (cwd: string, cmd: string) => {
    const command = `cd ${cwd} && ${cmd}`;
    return execSync(command, {encoding: 'utf8'}).trimEnd();
}

const getRepoInfo = require('git-repo-info');

const logger = getLogger("git");

/**
 * Git commit author
 */
export type Author = {
    name: string,
    email: string,
}

/**
 * Git commit
 */
export type Commit = {
    ref: string,
    sha: string,
    message: string,
}

/**
 * Git repository helper
 */
export class GitRepo {
    private readonly info: GitRepoInfo;
    private readonly repoDir: string;

    constructor(repoDir: string) {
        this.repoDir = repoDir;
        this.info = getRepoInfo(repoDir);
        logger.debug(`repo info: ${JSON.stringify(this.info)}`);
    }

    /**
     * Split the author string into name and email
     * @param author
     * @private
     */
    private splitAuthor(author: string): [string, string] {
        const [name, email] = author.split(" <");
        return [name, email.slice(0, -1)];
    }

    /**
     * Get the remote URL of the repository
     */
    public getRemoteUrl(): string {
        const remote = shell(this.repoDir, "git config --get remote.origin.url");
        return remote.trim();
    }

    /**
     * Get the author of the last commit
     */
    public getAuthor(): Author {
        logger.debug(`author: ${JSON.stringify(this.info.committer)}`)

        let name: string, email: string;
        if (this.info?.committer) {
            [name, email] = this.splitAuthor(this.info.committer);
        } else {
            name = shell(this.repoDir, "git --no-pager log -1 --pretty=format:'%an'");
            email = shell(this.repoDir, "git --no-pager log -1 --pretty=format:'%ae'");
        }

        const author: Author = {
            name,
            email,
        }
        logger.debug(`computed author: ${JSON.stringify(author)}`);
        return author;
    }

    /**
     * Get the last commit
     */
    public getCommit(): Commit {
        // return the full refs/heads/branch_name
        const ref = shell(this.repoDir, "git symbolic-ref HEAD");
        const message = shell(this.repoDir, "git --no-pager log -1 --pretty=format:'%B'");

        return {
            ref,
            sha: this.info.sha,
            message,
        }
    }
}
