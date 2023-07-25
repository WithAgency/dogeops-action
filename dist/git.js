"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRepo = void 0;
const getRepoInfo = require('git-repo-info');
class GitRepo {
    constructor(repoDir) {
        this.info = getRepoInfo(repoDir);
    }
    getAuthor() {
        return {
            name: this.info.author,
            email: this.info.committer,
            username: this.info.author,
        };
    }
    getCommit() {
        return {
            ref: this.info.branch,
            sha: this.info.sha,
            message: this.info.commitMessage,
        };
    }
}
exports.GitRepo = GitRepo;
//# sourceMappingURL=git.js.map