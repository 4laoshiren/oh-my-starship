export function parseTomlSection<T>(toml: string, sectionName: string): Partial<T> {
    const result: Record<string, unknown> = {};
    const lines = toml.split('\n');

    let inSection = false;
    const sectionHeader = `[${sectionName}]`;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
            inSection = trimmedLine === sectionHeader;
            continue;
        }

        if (!inSection || !trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        const eqIndex = trimmedLine.indexOf('=');
        if (eqIndex === -1) continue;

        const key = trimmedLine.substring(0, eqIndex).trim();
        let value = trimmedLine.substring(eqIndex + 1).trim();

        result[key] = parseTomlValue(value);
    }

    return result as Partial<T>;
}

function parseTomlValue(value: string): unknown {
    const commentIndex = value.indexOf('#');
    if (commentIndex !== -1 && !value.startsWith('"') && !value.startsWith("'")) {
        value = value.substring(0, commentIndex).trim();
    }

    if (value === 'true') return true;
    if (value === 'false') return false;

    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1);
    }

    return value;
}

function toTomlValue(value: unknown): string {
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
    return String(value);
}

export function updateTomlSection(
    toml: string,
    sectionName: string,
    data: Record<string, unknown>
): string {
    const lines = toml.split('\n');
    const sectionHeader = `[${sectionName}]`;

    let sectionStartIndex = -1;
    let sectionEndIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();

        if (trimmedLine === sectionHeader) {
            sectionStartIndex = i;
        } else if (
            sectionStartIndex !== -1 &&
            trimmedLine.startsWith('[') &&
            trimmedLine.endsWith(']')
        ) {
            sectionEndIndex = i;
            break;
        }
    }

    const newSectionLines = [sectionHeader];
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null && value !== '') {
            newSectionLines.push(`${key} = ${toTomlValue(value)}`);
        }
    }

    if (sectionStartIndex !== -1) {
        if (sectionEndIndex === -1) {
            sectionEndIndex = lines.length;
            while (sectionEndIndex > sectionStartIndex && !lines[sectionEndIndex - 1].trim()) {
                sectionEndIndex--;
            }
            sectionEndIndex++;
        }

        const beforeSection = lines.slice(0, sectionStartIndex);
        const afterSection = lines.slice(sectionEndIndex);

        return [...beforeSection, ...newSectionLines, '', ...afterSection].join('\n');
    }

    const trimmedToml = toml.trimEnd();
    return trimmedToml + '\n\n' + newSectionLines.join('\n') + '\n';
}
