import React, { useMemo } from 'react';
import { Box, Text } from 'ink';

import { parseAnsiLines } from '../../utils/ansi.js';
import { renderStarshipPreview } from '../../utils/starship-preview.js';

function StatusPreview({ settings, terminalWidth }) {
    const preview = useMemo(
        () => renderStarshipPreview(settings, { width: terminalWidth }),
        [settings, terminalWidth]
    );
    const previewLines = parseAnsiLines(preview.text);

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
            <Text bold>Preview</Text>
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
        </Box>
    );
}

export { StatusPreview };
