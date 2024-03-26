const path = require('path')

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js',
        login: './src/login.js',
        dashboard: './src/dashboard.js',
        module: './src/module.js',
        exam: './src/exam.js',
        profile: './src/profile.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundles/[name].bundle.js'
    },
    devtool: 'inline-source-map',
    watch: true
}