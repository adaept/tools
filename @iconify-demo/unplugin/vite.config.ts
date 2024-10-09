import type { UserConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';
import { promises as fs } from 'fs';
import { compareColors, stringToColor } from '@iconify/utils/lib/colors';
import {
	SVG,
	cleanupSVG,
	parseColors,
	runSVGO,
	deOptimisePaths,
	importDirectorySync,
} from '@iconify/tools';

const assetsRootDir = 'assets';

const config: UserConfig = {
	plugins: [
		Vue(),
		Icons({
			compiler: 'vue3',
			scale: 1.5,
			customCollections: {
				// Load an entire icon set
				'svg-animated': () => {
					// Load icons
					const iconSet = importDirectorySync(
						assetsRootDir + '/svg-animated',
						{
							prefix: 'svg-animated',
						}
					);

					// Clean up each icon
					iconSet.forEachSync((name) => {
						const svg = iconSet.toSVG(name);
						if (!svg) {
							return;
						}

						// Change color to `currentColor`
						const blackColor = stringToColor('black');

						parseColors(svg, {
							defaultColor: 'currentColor',
							callback: (attr, colorStr, color) => {
								// console.log('Color:', colorStr, color);

								// Change black to 'currentColor'
								if (color && compareColors(color, blackColor)) {
									return 'currentColor';
								}

								switch (color?.type) {
									case 'none':
									case 'current':
										return color;
								}

								throw new Error(
									`Unexpected color "${colorStr}" in attribute ${attr}`
								);
							},
						});

						// Optimise, but do not change shapes because they are animated
						runSVGO(svg, {
							keepShapes: true,
						});

						// Update icon in icon set
						iconSet.fromSVG(name, svg);
					});

					// Export as IconifyJSON
					return iconSet.export();
				},

				// Load icon one by one on demand
				'svg-ion': async (name) => {
					// Load icon
					const filename = `${assetsRootDir}/svg-ion/${name}.svg`;
					const content = await fs.readFile(filename, 'utf8');
					const svg = new SVG(content);

					// Clean up icon
					cleanupSVG(svg);

					// Change color to `currentColor`
					const blackColor = stringToColor('black');

					parseColors(svg, {
						defaultColor: 'currentColor',
						callback: (attr, colorStr, color) => {
							// console.log('Color:', colorStr, color);

							// Change black to 'currentColor'
							if (color && compareColors(color, blackColor)) {
								return 'currentColor';
							}

							switch (color?.type) {
								case 'none':
								case 'current':
									return color;
							}

							throw new Error(
								`Unexpected color "${colorStr}" in attribute ${attr}`
							);
						},
					});

					// Optimise
					runSVGO(svg);

					// Update paths for compatibility with old software
					deOptimisePaths(svg);

					// Return icon
					// First parameter must be set to change height to '1em' !
					return svg.toMinifiedString({});
				},
			},
			// TypeScript shenanigans
		}) as ReturnType<typeof Vue>,
	],
};

export default config;
