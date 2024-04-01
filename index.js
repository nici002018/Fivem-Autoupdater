const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const { exec } = require('child_process');


const ARTIFACT_FOLDER = __dirname;
const FILTER = ["*.cfg", "*.cmd", "*.bat", "*.zip", "*.crt", "*.key", "resources", "cache", "*.tar.xz", "current-version", "*.json", "node_modules", "*.js"];

async function getLatestRelease() {
    try {
        const response = await axios.get("https://api.github.com/repos/citizenfx/fivem/git/refs/tags", {
            headers: { "accept": "application/vnd.github.v3+json" }
        });

        const refs = response.data;
        const latestRef = refs.filter(ref => ref.ref.includes("refs/tags/v1.0.0")).pop();

        if (!latestRef) {
            throw new Error("Could not find latest release.");
        }

        const tagResponse = await axios.get(latestRef.object.url, {
            headers: { "accept": "application/vnd.github.v3+json" }
        });

        const version = tagResponse.data.tag.replace("v1.0.0.", "");
        const hash = tagResponse.data.object.sha;
        const uri = `https://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/${version}-${hash}/fx.tar.xz`;

        return {
            uri,
            version
        };
    } catch (error) {
        throw new Error(`Error fetching latest release: ${error.message}`);
    }
}

async function updateServer() {
    console.log("### FiveM Automatic Updater ###");

    let currentVersion = 0;

    try {
        const currentVersionPath = path.join(ARTIFACT_FOLDER, "current-version");
        if (fs.existsSync(currentVersionPath)) {
            currentVersion = parseInt(await fs.readFile(currentVersionPath, 'utf8'), 10);
        }
    } catch (error) {
        console.error(`Error reading current version: ${error.message}`);
    }

    console.log(`Detected version is ${currentVersion}...`);

    let latestRelease;
    try {
        latestRelease = await getLatestRelease();
    } catch (error) {
        console.error(`Error fetching latest release: ${error.message}`);
        return;
    }

    console.log(`The current version on server is ${latestRelease.version}. Checking the artifacts server.`);

    if (latestRelease.version !== currentVersion) {
        const dest = path.join(ARTIFACT_FOLDER, `${latestRelease.version}.tar.xz`);

        console.log(`Downloading artifact ${latestRelease.version} located at ${latestRelease.uri}`);

        try {
            await downloadFile(latestRelease.uri, dest);
            console.log("Removing old files");
            await removeOldFiles(ARTIFACT_FOLDER, FILTER);
            console.log("Extracting new artifact");
            await extractArchive(dest, ARTIFACT_FOLDER);
            await fs.writeFile(path.join(ARTIFACT_FOLDER, "current-version"), latestRelease.version.toString());
            await fs.remove(dest);
            console.log("Update completed.");
        } catch (error) {
            console.error(`Error during update: ${error.message}`);
        }
    } else {
        console.log("FXServer is up to date.");
    }
}

async function extractArchive(src, dest) {
    try {
        await execCommand(`tar -xJf "${src}" -C "${dest}"`);
    } catch (error) {
        throw new Error(`Error extracting .tar.xz archive: ${error.message}`);
    }
}

function execCommand(command) {
    console.log(`Executing command: ${command}`);

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                reject(error);
                return;
            }

            console.log(`Command output: ${stdout.trim()}`);
            resolve(stdout.trim());
        });
    });
}

cron.schedule('0 2 * * *', async () => {
    console.log('Running the FiveM Automatic Updater...');
    await updateServer();
});

console.log('FiveM Automatic Updater scheduled to run every day at 2:00 AM.');

async function downloadFile(url, dest) {
    const writer = fs.createWriteStream(dest);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}


async function removeOldFiles(dir, filterPatterns) {
    const files = await fs.readdir(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
            await removeOldFiles(filePath, filterPatterns);
        } else {
            if (!filterPatterns.some(pattern => {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(filePath);
            })) {
                console.log(`Removing old file: ${filePath}`);
                await fs.unlink(filePath);
            }
        }
    }
}

updateServer().catch(error => {
    console.error(`An error occurred: ${error.message}`);
});