module.exports = {
    entry: "./main.ts",
    output: {
        filename: "bundle.js",
    },
    resolve: {
        extensions: ['.ts']
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: "ts-loader"}
        ]
    }
};
