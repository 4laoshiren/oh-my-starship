import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { parseAnsiLines } from '../../utils/ansi.js';
import { buildFastPreviewLines, renderStarshipPreview } from '../../utils/starship-preview.js';

function StatusPreview({ settings, terminalWidth, fastMode = false }) {
    const preview = useMemo(
        () =>
            fastMode
                ? {
                      lines: buildFastPreviewLines(settings),
                      source: 'draft',
                  }
                : renderStarshipPreview(settings, { width: terminalWidth }),
        [fastMode, settings, terminalWidth]
    );
    const previewLines = preview.lines || parseAnsiLines(preview.text);

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="cyan"
            paddingX={1}
            titles={['Preview']}
        >
            {fastMode ? <Text dimColor>Live draft preview while moving rows.</Text> : null}
            <Box flexDirection="column">
                {previewLines.map((line, index) => (
                    <Text key={index}>
                        {line.length === 0
                            ? ' '
                            : line.map((segment, segmentIndex) => (
                                  <Text
                                      key={`${segmentIndex}-${segment.text}`}
                                      color={segment.color}
                                      backgroundColor={segment.backgroundColor}
                                      bold={segment.bold}
                                  >
                                      {segment.text}
                                  </Text>
                              ))}
                    </Text>
                ))}
            </Box>
        </TitledBox>
    );
}

export { StatusPreview };
