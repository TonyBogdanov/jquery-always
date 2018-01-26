import typescript from 'rollup-plugin-typescript';

export default {
    input: './always.ts',
    output: {
        file: './always.js',
        format: 'iife'
    },
    plugins: [
        typescript({
            typescript: require('typescript'),
            allowSyntheticDefaultImports: true,
            declaration: true,
            disableSizeLimit: true,
            pretty: true,
            removeComments: true,
            stripInternal: true,
            target: "es5"
        })
    ]
}