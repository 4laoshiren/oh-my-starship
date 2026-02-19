export function parse_toml_section(toml, section_name) {
    const result = {};
    const lines = toml.split('\n');

    let in_section = false;
    const section_header = `[${section_name}]`;

    for (const line of lines) {
        const trimmed_line = line.trim();

        if (trimmed_line.startsWith('[') && trimmed_line.endsWith(']')) {
            in_section = trimmed_line === section_header;
            continue;
        }

        if (!in_section || !trimmed_line || trimmed_line.startsWith('#')) {
            continue;
        }

        const eq_index = trimmed_line.indexOf('=');
        if (eq_index === -1) continue;

        const key = trimmed_line.substring(0, eq_index).trim();
        let value = trimmed_line.substring(eq_index + 1).trim();

        result[key] = parse_toml_value(value);
    }

    return result;
}

function parse_toml_value(value) {
    const comment_index = value.indexOf('#');
    if (comment_index !== -1 && !value.startsWith('"') && !value.startsWith("'")) {
        value = value.substring(0, comment_index).trim();
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

function to_toml_value(value) {
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
    return String(value);
}

export function update_toml_section(toml, section_name, data) {
    const lines = toml.split('\n');
    const section_header = `[${section_name}]`;

    let section_start_index = -1;
    let section_end_index = -1;

    for (let i = 0; i < lines.length; i++) {
        const trimmed_line = lines[i].trim();

        if (trimmed_line === section_header) {
            section_start_index = i;
        } else if (
            section_start_index !== -1 &&
            trimmed_line.startsWith('[') &&
            trimmed_line.endsWith(']')
        ) {
            section_end_index = i;
            break;
        }
    }

    const new_section_lines = [section_header];
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null && value !== '') {
            new_section_lines.push(`${key} = ${to_toml_value(value)}`);
        }
    }

    if (section_start_index !== -1) {
        if (section_end_index === -1) {
            section_end_index = lines.length;
            while (
                section_end_index > section_start_index &&
                !lines[section_end_index - 1].trim()
            ) {
                section_end_index--;
            }
            section_end_index++;
        }

        const before_section = lines.slice(0, section_start_index);
        const after_section = lines.slice(section_end_index);

        return [...before_section, ...new_section_lines, '', ...after_section].join('\n');
    }

    const trimmed_toml = toml.trimEnd();
    return trimmed_toml + '\n\n' + new_section_lines.join('\n') + '\n';
}
