import {getLogger} from "./logging";
import {Deployment} from "./api";

const SUCCESS_DOGE: string = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⠀⣀⠀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⣠⡄⣶⡖⣿⣟⠀⢸⣿⣾⣿⢹⡟⢻⡷⣾⠿⣿⣴⣶⣄⡄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠶⣿⡟⢹⣷⢽⠷⠹⠗⠂⠀⢃⣉⣈⣀⣙⣋⣁⠙⠒⠋⠼⠛⡿⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⢰⡿⢿⡆⠀⠘⠓⠀⣁⣠⣤⣶⣦⡘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⡄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⡾⣿⡉⠻⠞⢃⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣦⡙⢿⣿⣿⣿⠇⠰⣦⠘⣿⣿⣿⠇⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⣤⣤⣤⣤⣤⠙⣃⣴⡾⣫⣭⡻⣿⣿⣿⡿⣟⣛⢿⣿⣿⣿⣆⠻⣿⣿⣇⣈⣁⣼⣿⣿⡟⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣾⣿⣿⣿⣿⣿⡿⢋⣠⣾⣿⣿⡇⡏⠈⢻⣜⣛⣫⡾⠋⢹⡏⣿⣿⣿⣿⣧⡘⣿⣿⣿⣿⢏⣾⡟⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢶⣌⠻⣿⣿⣿⣿⡿⢋⣴⣿⣿⣿⡿⣫⡵⠇⠀⠀⠉⠉⠉⠀⠀⢸⡇⣿⣿⣿⣿⣿⣷⡘⣿⣿⣷⣿⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣷⣌⠻⣿⠟⣰⣿⣿⣿⣿⡟⣼⠃⢠⡄⠀⠀⠀⠀⠀⠀⠀⠘⣷⢻⣿⣿⣿⣿⣿⣷⠘⣿⣿⠟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠷⢠⠸⣿⣿⣿⣿⣿⢸⠇⠀⣈⠀⠀⠐⠽⠃⠀⠀⠀⠀⠸⡇⣿⣿⣿⣿⣿⣿⣧⠹⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⢿⣧⠹⣿⣿⣿⣿⢿⠀⠈⠿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⡿⣿⣿⣿⣿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠒⠢⠍⠊⢿⣧⢻⣿⣿⣿⡼⣇⠀⠓⠒⠐⠂⠀⠀⠀⠀⠀⠀⣸⢇⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣿⣿⣿⣿⣿⠿⠶⠦⠄⠀⢻⣧⠹⣿⣿⣷⡝⣦⡀⠀⠀⠀⠀⠀⠀⠀⢀⣴⢫⣾⢟⣽⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣭⣤⣀⣀⠀⠀⠀⠀⠀⠹⣷⡙⣿⣿⣿⣮⣝⡷⢦⣤⣤⣤⡴⢾⣫⡵⢟⣵⡿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣼⣿⡿⠿⢿⣿⣿⣿⣿⣿⡿⠟⠋⠀⠀⠀⠀⠀⠘⢿⣎⠻⣿⣿⣿⣿⣿⣶⣶⣶⣿⠿⣫⣴⠿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠸⠋⠀⢀⣴⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠹⣷⣝⢿⣿⣿⣿⣿⣿⣿⣷⠿⠛⣡⣴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⠋⠀⠀⠀⢀⣀⣠⣤⣤⠀⠀⠀⢸⡆⠈⠻⣷⣝⠿⣿⠷⠟⣋⣥⣶⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⡏⢀⣠⣴⣾⣿⣿⣿⣿⣿⠀⠀⠀⣼⡇⠀⢠⠀⠉⣡⠀⣶⣿⣿⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⢀⣼⣿⡇⢠⠸⠀⠀⢹⣇⢹⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⢸⣿⣿⣴⣿⣿⡟⠀⡞⠀⠀⠀⠀⢻⣦⠻⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⣿⣿⣿⣿⣿⠟⢀⠞⠀⠀⠀⠀⠀⠀⠙⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⡿⠟⠉⠀⠀⢀⣼⣿⣿⡿⠟⠁⠔⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠐⠺⠿⠿⠿⠿⠟⠛⠋⠁⠀⠀⠀⠀⠐⠛⠛⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`
const CONCERNED_DOGE: string = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⠋⠈⠙⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠤⢤⡀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠈⢇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠞⠀⠀⢠⡜⣦⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡃⠀⠀⠀⠀⠈⢷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠊⣠⠀⠀⠀⠀⢻⡘⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⠀⠀⠀⠀⠀⠙⢶⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡠⠚⢀⡼⠃⠀⠀⠀⠀⠸⣇⢳
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠀⣀⠖⠀⠀⠀⠀⠉⠀⠀⠈⠉⠛⠛⡛⢛⠛⢳⡶⠖⠋⠀⢠⡞⠀⠀⠀⠐⠆⠀⠀⣿⢸
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣦⣀⣴⡟⠀⠀⢶⣶⣾⡿⠀⠀⣿⢸
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⡠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣏⠀⠀⠀⣶⣿⣿⡇⠀⠀⢏⡞
⠀⠀⠀⠀⠀⠀⢀⡴⠛⠀⠀⠀⠀⠀⠀⠀⠀⢀⢀⡾⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢦⣤⣾⣿⣿⠋⠀⠀⡀⣾⠁
⠀⠀⠀⠀⠀⣠⠟⠁⠀⠀⠀⣀⠀⠀⠀⠀⢀⡟⠈⢀⣤⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⣏⡁⠀⠐⠚⠃⣿⠀
⠀⠀⠀⠀⣴⠋⠀⠀⠀⡴⣿⣿⡟⣷⠀⠀⠊⠀⠴⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠀⠀⠀⠀⢹⡆
⠀⠀⠀⣴⠃⠀⠀⠀⠀⣇⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⡶⢶⣶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇
⠀⠀⣸⠃⠀⠀⠀⢠⠀⠊⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⢲⣾⣿⡏⣾⣿⣿⣿⣿⠖⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢧
⠀⢠⡇⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠈⠛⠿⣽⣿⡿⠏⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡜
⢀⡿⠀⠀⠀⠀⢀⣤⣶⣟⣶⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇
⢸⠇⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇
⣼⠀⢀⡀⠀⠀⢷⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡇
⡇⠀⠈⠀⠀⠀⣬⠻⣿⣿⣿⡿⠙⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⠁
⢹⡀⠀⠀⠀⠈⣿⣶⣿⣿⣝⡛⢳⠭⠍⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠃⠀
⠸⡇⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⣿⣷⣦⣀⣀⣀⣤⣤⣴⡶⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠇⠀⠀
⠀⢿⡄⠀⠀⠀⠀⠀⠙⣇⠉⠉⠙⠛⠻⠟⠛⠛⠉⠙⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡰⠋⠀⠀⠀
⠀⠈⢧⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠁⠀⠀⠀⠀
⠀⠀⠘⢷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠱⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡴⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠛⢦⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠴⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠲⠤⣤⣤⣤⣄⠀⠀⠀⠀⠀⠀⠀⢠⣤⣤⠤⠴⠒⠛⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`;


const logger = getLogger("outcome");

/**
 * Log a successful deployment
 * @param deployment Deployment object
 */
export function success(deployment: Deployment) {
    logger.info(`Deployment ${deployment.id} started`);
    logger.info(SUCCESS_DOGE);
    logger.info("");
    logger.info("Wow! Such success!");
    logger.info(`View progress at: ${deployment.progress_url}`);
}

/**
 * Log a deployment that succeeded with warnings
 * @param deployment Deployment object
 */
export function warning(deployment: Deployment) {
    logger.warn(`Deployment ${deployment.id} was already started`);
    logger.warn(CONCERNED_DOGE);
    logger.warn("");
    logger.warn(`There is a deployment for this Dogefile already running in this environment, with status ${deployment.status}`);
    logger.warn(`View progress at: ${deployment.progress_url}`)
}

/**
 * Log a deployment that failed
 * @param code HTTP status code
 * @param err Error object
 */
export function failure(code?: number, err?: Error) {
    logger.error("Deployment failed");
    logger.error(CONCERNED_DOGE);
    logger.error("");
    logger.error(`Dogefile failed to deploy`);
    if (code !== undefined) {
        logger.error(`Request failed with code ${code}`);
    }
    if (err !== undefined) {
        logger.error("Error message:");
        logger.error(err);
    }
}
