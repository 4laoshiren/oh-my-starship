import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { parseAnsiLines } from '../../utils/ansi.js';
import { buildFastPreviewLines, renderStarshipPreview } from '../../utils/starship-preview.js';

const PREVIEW_BOX_CHROME_WIDTH = 4;

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
    const previewLines = useMemo(() => preview.lines || parseAnsiLines(preview.text), [preview]);
    const wrappedPreviewLines = useMemo(
        () => wrapPreviewLines(previewLines, getPreviewContentWidth(terminalWidth)),
        [previewLines, terminalWidth]
    );

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="cyan"
            paddingX={1}
            titles={['Preview']}
        >
            {fastMode ? <Text dimColor>Fast local preview.</Text> : null}
            <Box flexDirection="column">
                {wrappedPreviewLines.map((line, index) => (
                    <Text key={index}>
                        {line.length === 0
                            ? ' '
                            : line.map((segment, segmentIndex) => (
                                  <Text
                                      key={`${segmentIndex}-${segment.text}`}
                                      color={segment.color}
                                      backgroundColor={segment.backgroundColor}
                                      bold={segment.bold}
                                      dimColor={segment.dimColor}
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

function getPreviewContentWidth(terminalWidth) {
    return Math.max(1, Number(terminalWidth || 120) - PREVIEW_BOX_CHROME_WIDTH);
}

function wrapPreviewLines(lines, width) {
    return lines.flatMap((line) => wrapPreviewLine(line, width));
}

function wrapPreviewLine(line, width) {
    if (!line.length) {
        return [[]];
    }

    const wrappedLines = [];
    let currentLine = [];
    let currentWidth = 0;

    const flushLine = () => {
        wrappedLines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
    };

    for (const segment of line) {
        let chunk = '';

        for (const grapheme of splitGraphemes(segment.text)) {
            const graphemeWidth = getGraphemeWidth(grapheme);

            if (currentWidth > 0 && currentWidth + graphemeWidth > width) {
                appendSegment(currentLine, segment, chunk);
                chunk = '';
                flushLine();
            }

            chunk += grapheme;
            currentWidth += graphemeWidth;

            if (currentWidth >= width) {
                appendSegment(currentLine, segment, chunk);
                chunk = '';
                flushLine();
            }
        }

        appendSegment(currentLine, segment, chunk);
    }

    if (currentLine.length > 0) {
        wrappedLines.push(currentLine);
    }

    return wrappedLines.length > 0 ? wrappedLines : [[]];
}

function appendSegment(line, segment, text) {
    if (!text) {
        return;
    }

    const lastSegment = line[line.length - 1];

    if (lastSegment && hasSameStyle(lastSegment, segment)) {
        lastSegment.text += text;
        return;
    }

    line.push({ ...segment, text });
}

function hasSameStyle(left, right) {
    return (
        left.color === right.color &&
        left.backgroundColor === right.backgroundColor &&
        left.bold === right.bold &&
        left.dimColor === right.dimColor
    );
}

function splitGraphemes(value) {
    const text = String(value ?? '');

    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
        return Array.from(new Intl.Segmenter().segment(text), (part) => part.segment);
    }

    return Array.from(text);
}

function getGraphemeWidth(grapheme) {
    if (!grapheme) {
        return 0;
    }

    if (/^[\p{Mark}\u200d\ufe00-\ufe0f]+$/u.test(grapheme)) {
        return 0;
    }

    const codePoint = grapheme.codePointAt(0);

    if (isWideCodePoint(codePoint)) {
        return 2;
    }

    return 1;
}

function isWideCodePoint(codePoint) {
    return (
        codePoint >= 0x1100 &&
        (codePoint <= 0x115f ||
            codePoint === 0x2329 ||
            codePoint === 0x232a ||
            (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
            (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
            (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
            (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
            (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
            (codePoint >= 0xff00 && codePoint <= 0xff60) ||
            (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
            (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
            (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
            (codePoint >= 0x20000 && codePoint <= 0x3fffd))
    );
}

export { StatusPreview };
