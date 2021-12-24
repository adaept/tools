import { SVG } from '../../lib/svg';
import { blankIconSet } from '../../lib/icon-set';
import { checkBadTags } from '../../lib/svg/cleanup/bad-tags';
import { loadFixture } from '../load';

const goodExamples: string[] = [
	'animate.svg',
	'animateMotion.svg',
	'animateTransform.svg',
	'clipPath.svg',
	'clipPath2.svg',
	'defs.svg',
	'desc.svg',
	'feColorMatrix.svg',
	'inline-style/feComponentTransfer.svg',
	'feDiffuseLighting.svg',
	'inline-style/feDisplacementMap.svg',
	'inline-style/feFlood.svg',
	'feGaussianBlur.svg',
	'inline-style/feMerge.svg',
	'feOffset.svg',
	'inline-style/feSpecularLighting.svg',
	'inline-style/feTurbulence.svg',
	'linearGradient.svg',
	'marker.svg',
	'mask.svg',
	'mpath.svg',
	'pattern.svg',
	'style/set.svg',
	'stop.svg',
	'style/style.svg',
	'symbol.svg',
	'use.svg',
];

const badExamples: Record<string, string> = {
	'bad/feBlend.svg': 'image',
	'bad/feConvolveMatrix.svg': 'image',
	'bad/fePointLight.svg': 'image',
	'bad/feSpotLight.svg': 'image',
	'bad/feTile.svg': 'image',
	'bad/a.svg': 'a',
	'bad/foreignObject.svg': 'foreignObject',
	'bad/script.svg': 'script',
	'bad/svg.svg': 'svg',
};

describe('Checking tags tree', () => {
	goodExamples.forEach((name) => {
		test(name, async () => {
			const content = await loadFixture('elements/' + name);
			const svg = new SVG(content);
			await checkBadTags(svg);
		});
	});

	// Bad elements
	Object.keys(badExamples).forEach((name) => {
		test(name, async () => {
			const content = await loadFixture('elements/' + name);
			const svg = new SVG(content);
			try {
				await checkBadTags(svg);
			} catch (err) {
				const error = err as Error;
				expect(error.message).toBe(
					`Unexpected element: <${badExamples[name]}>`
				);
				return;
			}
			throw new Error(`Expected exception in ${name}`);
		});
	});

	// Run same test using icon set's forEach function
	test('forEach', async () => {
		// Load all icons
		const iconSet = blankIconSet('');
		const toTest: Set<string> = new Set();
		const names = Object.keys(badExamples);
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			const content = await loadFixture('elements/' + name);
			const svg = new SVG(content);
			toTest.add(name);
			iconSet.fromSVG(name, svg);
		}

		// Run test
		let isAsync = true;
		await iconSet.forEach(async (name, type) => {
			expect(type).toBe('icon');
			expect(isAsync).toBe(true);
			toTest.delete(name);

			const svg = iconSet.toSVG(name) as SVG;
			expect(svg).not.toBeNull();

			try {
				await checkBadTags(svg);
			} catch (err) {
				const error = err as Error;
				expect(error.message).toBe(
					`Unexpected element: <${badExamples[name]}>`
				);
				return;
			}
			throw new Error(`Expected exception in ${name}`);
		});

		isAsync = false;
		expect(toTest.size).toBe(0);
	});
});
