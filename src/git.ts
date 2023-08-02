import {GitRepoInfo} from "git-repo-info";
import {getLogger} from "./logging";

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
    private info: GitRepoInfo;

    constructor(repoDir: string) {
        this.info = getRepoInfo(repoDir);
    }

    private splitAuthor(author: string): [string, string] {
        const [name, email] = author.split(" <");
        return [name, email.slice(0, -1)];
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
        return {
            ref: this.info.branch,
            sha: this.info.sha,
            message: this.info.commitMessage,
        }
    }
}
