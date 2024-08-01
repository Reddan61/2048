const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isDev = process.env.NODE_ENV === "development";

const devServerOption = (isDev) => {
    return isDev
        ? {
              devServer: {
                  port: 8080,
                  hot: true,
              },
          }
        : {};
};

module.exports = {
    entry: path.resolve(__dirname, "src", "index.ts"),
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "build"),
        clean: true,
    },
    mode: isDev ? "development" : "production",
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    devtool: isDev ? "inline-source-map" : false,
    ...devServerOption(isDev),
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "index.html"),
        }),
    ],
    module: {
        rules: [
            {
                test: /\.css/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.tsx?$/,
                exclude: path.resolve(__dirname, "node_modules"),
                use: ["ts-loader"],
            },
        ],
    },
};
