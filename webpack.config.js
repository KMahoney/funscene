module.exports = {
    entry: "./src/funscene.ts",
    output: {
        filename: "dist/funscene.js",
        library: "funscene"
    },
    resolve: {
        extensions: ['.ts']
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: "ts-loader" }
        ]
    }
};
