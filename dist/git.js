"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRepo = void 0;
const logging_1 = require("./logging");
const getRepoInfo = require('git-repo-info');
const logger = (0, logging_1.getLogger)("git");
class GitRepo {
    constructor(repoDir) {
        this.info = getRepoInfo(repoDir);
    }
    splitAuthor(author) {
        const [name, email] = author.split(" <");
        return [name, email.slice(0, -1)];
    }
    getAuthor() {
        const [name, email] = this.splitAuthor(this.info.author);
        const author = {
            name: name,
            email: email,
        };
        logger.debug(`author: ${JSON.stringify(author)}`);
        return author;
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