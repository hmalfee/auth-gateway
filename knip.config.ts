import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    exclude: ['optionalPeerDependencies'], // Allows setting peer dependencies as optional
    treatConfigHintsAsErrors: true,
    treatTagHintsAsErrors: true,
};

export default config;
