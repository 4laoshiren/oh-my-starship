import React from 'react';
import { Box, Text } from 'ink';

import { buildPromptFormat, renderPreviewLine } from '../../utils/renderer.js';

export function StatusPreview({ settings, dirty }) {
    const preview = renderPreviewLine(settings);
    const format = buildPromptFormat(settings);

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
            <Text bold>oh-my-starship / react-ink</Text>
            <Text color={dirty ? 'yellow' : 'green'}>
                {dirty ? '● Unsaved changes' : '✓ Saved'}
            </Text>
            <Text>
                {'$ '}
                {preview || '(empty preview)'}
            </Text>
            <Text dimColor>format: {format}</Text>
        </Box>
    );
}
