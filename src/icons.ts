import * as icons from 'lucide-static';

export interface LucideIcon {
    name: string;
    slug: string;
    svg: string;
}

export function getAllIcons(): LucideIcon[] {
    return Object.entries(icons)
        .filter(([, value]) => typeof value === 'string' && value.trimStart().startsWith('<svg'))
        .map(([key, value]) => ({
            name: key,
            slug: key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase(),
            svg: value as string,
        }));
}
