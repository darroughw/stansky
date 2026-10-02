import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '983tg09r',
    dataset: 'production'
  },
  // Hosted Studio address: https://stansky.sanity.studio
  studioHost: 'stansky',
  deployment: {
    appId: 'yapubr26h9vd1r1egumr4ifo',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
