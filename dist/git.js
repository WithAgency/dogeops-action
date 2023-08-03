"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRepo = void 0;
const logging_1 = require("./logging");
const { execSync } = require('child_process');
const shell = (cwd, cmd) => {
    const command = `cd ${cwd} && ${cmd}`;
    return execSync(command, { encoding: 'utf8' }).trimEnd();
};
const getRepoInfo = require('git-repo-info');
const logger = (0, logging_1.getLogger)("git");
class GitRepo {
    constructor(repoDir) {
        this.repoDir = repoDir;
        this.info = getRepoInfo(repoDir);
        logger.debug(`repo info: ${JSON.stringify(this.info)}`);
    }
    splitAuthor(author) {
        const [name, email] = author.split(" <");
        return [name, email.slice(0, -1)];
    }
    getRemoteUrl() {
        const remote = shell(this.repoDir, "git config --get remote.origin.url");
        return remote.trim();
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
        // return the full refs/heads/branch name
        const ref = shell(this.repoDir, "git symbolic-ref HEAD");
        return {
            ref,
            sha: this.info.sha,
            message: this.info.commitMessage,
        };
    }
}
exports.GitRepo = GitRepo;
//# sourceMappingURL=git.js.map