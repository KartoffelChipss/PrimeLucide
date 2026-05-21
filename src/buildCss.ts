import fs from 'fs';
import path from 'path';
import { formatSize } from './util/formatSize';
import { transform } from 'lightningcss';
import { getAllIcons, LucideIcon } from './icons';

function getBaseCss() {
    const cssPath = path.join(__dirname, 'base.css');
    return fs.readFileSync(cssPath, 'utf-8');
}

function getCdnIconCss(icon: LucideIcon) {
    return `.pl-${icon.slug} { --icon-url: url("https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${icon.slug}.svg"); }`;
}

function getLocalRessourceIconCss(icon: LucideIcon, jsfResourceName: string) {
    return `.pl-${icon.slug} { --icon-url: url("#{resource['${jsfResourceName}:icons/${icon.slug}.svg']}"); }`;
}

function minifyCss(css: string): string {
    const placeholders: string[] = [];
    const masked = css.replace(/#\{[^}]+\}/g, (match) => {
        const idx = placeholders.push(match) - 1;
        return `__EL_PLACEHOLDER_${idx}__`;
    });

    const result = transform({
        filename: 'styles.css',
        code: Buffer.from(masked),
        minify: true,
    });

    let output = result.code.toString();
    placeholders.forEach((expr, idx) => {
        output = output.replace(`__EL_PLACEHOLDER_${idx}__`, expr);
    });

    return output;
}

interface BuildCssOptions {
    outDir: string;
    outBasename: string;
    useCdn: boolean;
    jsfResourceName: string;
}

export function buildCss({ outDir, outBasename, useCdn, jsfResourceName }: BuildCssOptions) {
    fs.mkdirSync(outDir, { recursive: true });

    let fullCss = getBaseCss();

    for (const icon of getAllIcons()) {
        if (!icon || !icon.slug || !icon.svg) continue;
        const iconCss = useCdn
            ? getCdnIconCss(icon)
            : getLocalRessourceIconCss(icon, jsfResourceName);
        if (!iconCss) continue;
        fullCss += '\n' + iconCss;
    }

    const minifiedCss = minifyCss(fullCss);

    const normalOutName = useCdn ? `${outBasename}.css` : `${outBasename}_local.css`;
    const outputPath = path.join(outDir, normalOutName);

    const minifiedOutName = useCdn ? `${outBasename}.min.css` : `${outBasename}_local.min.css`;
    const minifiedOutputPath = path.join(outDir, minifiedOutName);

    fs.writeFileSync(outputPath, fullCss, 'utf-8');
    fs.writeFileSync(minifiedOutputPath, minifiedCss, 'utf-8');

    const normalBytes = Buffer.byteLength(fullCss, 'utf-8');
    const minifiedBytes = Buffer.byteLength(minifiedCss, 'utf-8');

    console.log(`CSS file generated successfully at ${outputPath} (${formatSize(normalBytes)})`);
    console.log(
        `Minified CSS file generated successfully at ${minifiedOutputPath} (${formatSize(minifiedBytes)})`
    );
}
