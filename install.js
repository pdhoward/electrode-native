const child_process = require('child_process');
const execSync = child_process.execSync;
const fs = require('fs');

//
// Directory structure (stored in user home folder)
//
// .ern
// |_ ern-platform (git)
// |_ cache
//   |_ v1
//   |_ v2
// ....
// |_ .ernrc

// Path to ern platform root folder
const ERN_PATH = `${process.env['HOME']}/.ern`;
// Path to ern platform cloned git repo
const ERN_PLATFORM_REPO_PATH = `${ERN_PATH}/ern-platform`;
// Path to ern platform cache folder (containing all installed cached versions of the platform)
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/cache`;
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = `${ERN_PATH}/.ernrc`;

exports.install = () => {
  // Platform version (retrieved from the platform manifest)
  const PLATFORM_VERSION =
    JSON.parse(fs.readFileSync(`${ERN_PLATFORM_REPO_PATH}/manifest.json`, 'utf-8')).platformVersion;

  // Path to cached platform at this version
  const PLATFORM_VERSION_PATH = `${ERN_VERSIONS_CACHE_PATH}/v${PLATFORM_VERSION}`;

  if (fs.existsSync(PLATFORM_VERSION_PATH)) {
    return console.log(`Version ${PLATFORM_VERSION} already installed`);
  }

  console.log('=== Starting platform installation');
  execSync(`cp -rf ${ERN_PLATFORM_REPO_PATH} ${PLATFORM_VERSION_PATH}`);
  console.log('=> Installing ern-cauldron-api');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-cauldron-api`);
  execSync(`yarn install`);
  console.log('=> Installing ern-cauldron-cli');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-cauldron-cli`);
  execSync(`yarn install`);
  console.log('=> Installing ern-api-gen');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-api-gen`);
  execSync(`yarn install`);
  console.log('=> Installing ern-container-gen');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-container-gen`);
  execSync(`yarn install`);
  console.log('=> Installing ern-local-cli');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-local-cli`);
  execSync(`npm install`);

  // Remove .git as he takes unnecessary disk space (we don't need it in the cached version folder)
  execSync(`rm -rf ${PLATFORM_VERSION_PATH}/.git`);

  // Generate initial ernrc file, if it doesnt already exists (i.e if this is not a first time platform install)
  if (!fs.existsSync(ERN_RC_GLOBAL_FILE_PATH)) {
    console.log (`=> Creating initial .ernrc configuration file`);
    const ernRc = {
      platformVersion: PLATFORM_VERSION,
      cauldronUrl: "http://localhost:3000",
      libgen: {
        android: {
          generator: {
            platform: "android",
            name: "maven"
          }
        }
      }
    }
    fs.writeFileSync(ERN_RC_GLOBAL_FILE_PATH, JSON.stringify(ernRc, null, 2));
  } else {
    // TODO : Handle case where .ernrc global file already exists if needed
    // (meaning that at least one version of ern platform) is already installled.
    // We should probably just patch the .ernrc file with any new configuration data introduced in this version
  }

  console.log(`=== Hurray ! Platform installed @ v${PLATFORM_VERSION}`);
}