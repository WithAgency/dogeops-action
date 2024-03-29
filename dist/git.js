"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRepo = void 0;
const logging_1 = require("./logging");
const { execSync } = require('child_process');
/**
 * Run a shell command in a given directory
 * @param cwd - working directory
 * @param cmd - command to run
 */
const shell = (cwd, cmd) => {
    const command = `cd ${cwd} && ${cmd}`;
    return execSync(command, { encoding: 'utf8' }).trimEnd();
};
const getRepoInfo = require('git-repo-info');
const logger = (0, logging_1.getLogger)("git");
/**
 * Git repository helper
 */
class GitRepo {
    constructor(repoDir) {
        this.repoDir = repoDir;
        this.info = getRepoInfo(repoDir);
        logger.debug(`repo info: ${JSON.stringify(this.info)}`);
    }
    /**
     * Split the author string into name and email
     * @param author
     * @private
     */
    splitAuthor(author) {
        const [name, email] = author.split(" <");
        return [name, email.slice(0, -1)];
    }
    /**
     * Get the remote URL of the repository
     */
    getRemoteUrl() {
        const remote = shell(this.repoDir, "git config --get remote.origin.url");
        return remote.trim();
    }
    /**
     * Get the author of the last commit
     */
    getAuthor() {
        var _a;
        logger.debug(`author: ${JSON.stringify(this.info.committer)}`);
        let name, email;
        if ((_a = this.info) === null || _a === void 0 ? void 0 : _a.committer) {
            [name, email] = this.splitAuthor(this.info.committer);
        }
        else {
            name = shell(this.repoDir, "git --no-pager log -1 --pretty=format:'%an'");
            email = shell(this.repoDir, "git --no-pager log -1 --pretty=format:'%ae'");
        }
        const author = {
            name,
            email,
        };
        logger.debug(`computed author: ${JSON.stringify(author)}`);
        return author;
    }
    /**
     * Get the last commit
     */
    getCommit() {
        // return the full refs/heads/branch_name
        const ref = shell(this.repoDir, "git symbolic-ref HEAD");
        const message = shell(this.repoDir, "git --no-pager log -1 --pretty=format:'%B'");
        return {
            ref,
            sha: this.info.sha,
            message,
        };
    }
}
exports.GitRepo = GitRepo;
//# sourceMappingURL=git.js.map