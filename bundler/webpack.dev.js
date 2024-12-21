const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const commonConfiguration = require('./webpack.common.js');
const portFinderSync = require('portfinder-sync');

const infoColor = (_message) => {
    return `\u001b[1m\u001b[34m${_message}\u001b[39m\u001b[22m`;
};

module.exports = merge(commonConfiguration, {
    stats: 'errors-warnings',
    mode: 'development',
    devServer: {
        host: '0.0.0.0',
        port: portFinderSync.getPort(8080),
        open: true,
        allowedHosts: 'all',
        hot: true,
        static: {
            directory: path.join(__dirname, '../static'),
            watch: true,
        },
        client: {
            logging: 'none',
            overlay: true,
            progress: false,
        },
        setupMiddlewares: (middlewares, devServer) => {
            const port = devServer.options.port;
            const protocol = devServer.options.server?.type === 'https' ? 'https' : 'http';
            const domain1 = `${protocol}://localhost:${port}`;

            console.log(`Project running at: ${infoColor(domain1)}`);

            return middlewares;
        },
    },
    
});
