# FiveM Automatic Updater
This Node.js script provides an automatic updater for a FiveM FXServer. It checks for the latest release of FiveM, downloads the update if a new version is available, and updates the server accordingly. Additionally, it removes old files based on specified filter patterns.

## Features
- **Automatic Update:** The script automatically checks for the latest FiveM release and updates the server if a new version is available.
- **Scheduled Execution:** The script is scheduled to run every day at 2:00 AM using node-cron.
- **File Management:** It removes old files based on specified filter patterns to keep the server clean.

## Prerequisites
Before running the script, make sure you have the following installed:

## Node.js
- npm (Node.js package manager)
- axios (HTTP client)
- fs-extra (File system utilities)
- node-cron (Task scheduler)

You can install the required packages using the following command:

```bash
npm i
```
# Configuration
You can customize the following constants at the beginning of the script according to your server setup:

```javascript
const ARTIFACT_FOLDER = __dirname;
const FILTER = ["*.cfg", "*.cmd", "*.bat", "*.zip", "*.crt", "*.key", "resources", "cache", "*.tar.xz", "current-version", "*.json", "node_modules", "*.js"];
```
- ARTIFACT_FOLDER: The directory where the server artifacts and updates are stored.
- FILTER: An array of file patterns to filter and remove old files.
## Usage
1. Clone or download the script to your server.
2. Install the required packages as mentioned in the prerequisites section.
3. Customize the **ARTIFACT_FOLDER** and **FILTER** constants if necessary.
4. Run the script using the following command:
```bash
node index.js
```

# Scheduled Execution
The script is scheduled to run every day at 2:00 AM using node-cron. You can modify the cron schedule as per your requirements:

```javascript
cron.schedule('0 2 * * *', async () => {
    console.log('Running the FiveM Automatic Updater...');
    await updateServer();
});
```
# License
This project is licensed under the MIT License. See the **LICENSE** file for more details.

# Disclaimer
This script is provided as-is without any warranty. Use it at your own risk.