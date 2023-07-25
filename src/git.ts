import {GitRepoInfo} from "git-repo-info";

const getRepoInfo = require('git-repo-info');

export type Author = {
    name: string,
    email: string,
    username: string,
}

export type Commit = {
    ref: string,
    sha: string,
    message: string,
}

class GitRepo {
    private info: GitRepoInfo;

    constructor(repoDir: string) {
        this.info = getRepoInfo(repoDir);
    }

    getAuthor(): Author {
        return {
            name: this.info.author,
            email: this.info.committer,
            username: this.info.author,
        }
    }

    getCommit(): Commit {
        return {
            ref: this.info.branch,
            sha: this.info.sha,
            message: this.info.commitMessage,
        }
    }
}
