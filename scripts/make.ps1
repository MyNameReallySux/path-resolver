# .\scripts\install.ps1

function writeIfNotExists($uri, $content) {
    if (!(Test-Path $uri)){
        $Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
        [System.IO.File]::WriteAllLines($uri, $content, $Utf8NoBomEncoding)
    }
}

function makeDirIfNotExists($dir) {
    if (!(Test-Path $dir)){
        mkdir $dir
    }
}

$babelrc = @" 
{
    "presets": ["env"],
    "plugins": ["transform-class-properties"]
}
"@


$webpack = @"
'use strict'

// Import 'node.js' packages
import path from 'path'

// Import 'npm' packages
import webpack from 'webpack'

// Import local packages
// - None at the moment!

export default {
    entry: {
        main: 'src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: '[name].js',
    },
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
    }
}
"@


$index = @"
    'use strict'
    const print = console.log

    print("Hello")
"@

makeDirIfNotExists src

writeIfNotExists .babelrc $babelrc
writeIfNotExists webpack.config.babel.js $webpack
writeIfNotExists src/index.js $index

webpack