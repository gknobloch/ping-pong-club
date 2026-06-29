// Metro is configured to also watch the repo's ../src tree so the mobile app
// can import shared, platform-agnostic domain logic from src/lib (aliased as
// @shared/lib). node_modules still resolve from mobile/ only, so this does not
// pull web dependencies (and can't create a duplicate React).
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const sharedRoot = path.resolve(projectRoot, '..', 'src')

const config = getDefaultConfig(projectRoot)
config.watchFolders = [sharedRoot]
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')]

module.exports = config
