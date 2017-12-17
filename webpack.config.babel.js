'use strict'

// Import 'node.js' packages
import path from 'path'

// Import 'npm' packages
import webpack from 'webpack'

// Import local packages
// - None at the moment!

const common = {
    module: {
        rules: [
            // Javascript ES6
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader'
                }
            }
            // Sass
        ]
    },
    resolve: {
        alias: {
            '@lib': path.resolve(__dirname, 'lib')
        }
    }
}

const node = {
    entry: {
        'main': path.resolve(__dirname, 'src/index.js'),

        'lib/ConsoleUtils': path.resolve(__dirname, 'lib/ConsoleUtils')
    },
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: '[name].js',
        libraryTarget: "umd"
    },
    target: 'node'
    
}

export default [
    Object.assign({}, common, node)
]
