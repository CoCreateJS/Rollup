import fs from 'fs';
import { promisify } from 'util';
const writeFileAsync = promisify(fs.writeFile);

import CoCreateConfig from './CoCreate.config.js';

/**
 * Create a Rollup plugin that generates CoCreate lazy-loading and dependency registrations from CoCreate.config.
 *
 * @public
 * @environment tooling
 */
export default function CoCreateLazyLoader() {
    let modulesGenerated = false;

    return {
        name: 'CoCreateLazyLoader',
        async buildStart() {
            if (modulesGenerated) return;

            // Retrieve output path and prepare module content string
            let outputPath = CoCreateConfig.modules.outputPath || './modules.js';
            let moduleContent = `import { dependency, lazyLoad } from '@cocreate/lazy-loader';\n\n`;

            // Collect all dynamically imported modules
            let dynamicImports = [];

            Object.entries(CoCreateConfig.modules).forEach(([moduleName, moduleInfo]) => {
                if (moduleName === 'outputPath' || typeof moduleInfo !== 'object') return;

                let importPath = `'${moduleInfo.import}'`;
                dynamicImports.push(importPath); // Collect for Rollup configuration

                if (moduleInfo.selector) {
                    moduleContent += `lazyLoad('${moduleName}', '${moduleInfo.selector}', () => import(${importPath}));\n`;
                } else {
                    moduleContent += `dependency('${moduleName}', import(${importPath}));\n`;
                }
            });

            // Write the generated module.js file
            await writeFileAsync(outputPath, moduleContent);
            console.log(`${outputPath} generated successfully.`);
            modulesGenerated = true;

            // Update the Rollup input configuration with dynamic imports
            if (dynamicImports.length) {
                this.emitFile({
                    type: 'chunk',
                    id: dynamicImports.join(','),
                });
            }
        },
    };
}

/**
 * A Rollup integration tool for CoCreate applications, enabling file watching, automated chunking, lazy loading, and file uploading. It leverages CoCreate.config for streamlined project builds and development workflows.
 *
 * @module rollup
 * @environment tooling
 */
