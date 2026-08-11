import os from 'node:os';

import type { NextConfig } from 'next';

const lanIp =
    Object.values(os.networkInterfaces())
        .flat()
        .find((iface) => iface?.family === 'IPv4' && !iface.internal)
        ?.address ?? '127.0.0.1';

const nextConfig: NextConfig = {
    allowedDevOrigins: [lanIp, `${lanIp}.sslip.io`],
};

export default nextConfig;
