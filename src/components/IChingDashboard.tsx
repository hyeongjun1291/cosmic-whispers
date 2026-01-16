
import { Paper, Title, Text, Group, Stack, Box, Divider } from '@mantine/core';
import { MeihuaResult } from '@/lib/iching';

const FRIENDLY_TRIGRAMS: Record<number, { label: string, desc: string, icon: string }> = {
    1: { label: '하늘 (건)', desc: '강한 힘/창조', icon: '☁️' },
    2: { label: '연못 (태)', desc: '기쁨/만족', icon: '💧' },
    3: { label: '불 (리)', desc: '열정/화려함', icon: '🔥' },
    4: { label: '번개 (진)', desc: '변화/움직임', icon: '⚡' },
    5: { label: '바람 (손)', desc: '유연함/침투', icon: '🍃' },
    6: { label: '물 (감)', desc: '지혜/험난함', icon: '🌊' },
    7: { label: '산 (간)', desc: '멈춤/신중함', icon: '⛰️' },
    8: { label: '땅 (곤)', desc: '포용/안정', icon: '🌍' }
};

export default function IChingDashboard({ data }: { data: MeihuaResult }) {
    // Determine structure (fallback if missing for safety)
    const structure = data.resultParam.structure || {
        original: { upperId: data.upper, lowerId: data.lower, upperName: '', lowerName: '' },
        changed: { upperId: 0, lowerId: 0, upperName: '', lowerName: '' }
    };

    // Helper to draw a single Trigram (3 lines)
    // lines array: [bottom, middle, top]
    const TrigramBlock = ({ lines, id, labelType }: { lines: number[], id: number, labelType: 'upper' | 'lower' }) => {
        // Safe lookup: 
        // If ID is valid (1-8), use it.
        // If ID is 0/undefined (legacy data fallback), force 8 or standard behavior.
        const safeId = id || 8;
        const info = FRIENDLY_TRIGRAMS[safeId] || FRIENDLY_TRIGRAMS[8];

        const label = labelType === 'upper' ? "나를 둘러싼 하늘 (외면)" : "내가 딛고 선 땅 (내면)";

        return (
            <Stack gap={4} align="center" style={{ width: '100%' }}>
                <Text size="xs" c="dimmed" mb={-2}>{label}</Text>
                <Group gap={6}>
                    <Text size="lg">{info.icon}</Text>
                    <Text size="sm" fw={700} c="gold">{info.label}</Text>
                </Group>
                <Text size="10px" c="dimmed" mb={4}>{info.desc}</Text>

                <Stack gap={3} w={60}>
                    {/* Draw Top to Bottom, so index 2 -> 1 -> 0 */}
                    {[...lines].reverse().map((val, idx) => (
                        <Box
                            key={idx}
                            h={8}
                            style={{
                                width: '100%',
                                display: 'flex',
                                gap: '4px'
                            }}
                        >
                            {val === 1 ? (
                                // Solid Yang
                                <Box style={{ flex: 1, backgroundColor: '#ffd43b', borderRadius: '2px', boxShadow: '0 0 4px rgba(255, 212, 59, 0.4)' }} />
                            ) : (
                                // Broken Yin
                                <>
                                    <Box style={{ flex: 1, backgroundColor: '#343a40', borderRadius: '2px' }} />
                                    <Box style={{ width: '6px' }} />
                                    <Box style={{ flex: 1, backgroundColor: '#343a40', borderRadius: '2px' }} />
                                </>
                            )}
                        </Box>
                    ))}
                </Stack>
            </Stack>
        );
    };

    // Full Hexagram Card Component
    const HexagramCard = ({ type, hexData, lines }: { type: 'original' | 'changed', hexData: any, lines: number[] }) => {
        const isOriginal = type === 'original';
        const title = isOriginal ? "현재의 기운" : "앞으로의 흐름";

        // Split 6 lines into Upper (3-5) and Lower (0-2)
        const lowerTrigramLines = lines.slice(0, 3);
        const upperTrigramLines = lines.slice(3, 6);

        return (
            <Paper
                p="md"
                bg="rgba(0,0,0,0.4)"
                style={{
                    border: isOriginal ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
                    minWidth: '140px',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}
            >
                <Text size="md" fw={700} c={isOriginal ? "gold" : "gray.3"}>{title}</Text>

                {/* Upper Trigram */}
                <TrigramBlock
                    lines={upperTrigramLines}
                    id={hexData.upperId}
                    labelType="upper"
                />

                <Divider w="100%" color="rgba(255,255,255,0.1)" />

                {/* Lower Trigram */}
                <TrigramBlock
                    lines={lowerTrigramLines}
                    id={hexData.lowerId}
                    labelType="lower"
                />
            </Paper>
        );
    };

    return (
        <Stack gap="xl" align="center" w="100%" py="md">
            <Title order={3} c="white" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                매화역수(梅花易數)
            </Title>
            <Text size="xs" c="dimmed">지금 당신을 둘러싼 우주의 기운</Text>

            <Group align="center" justify="center" gap="lg" wrap="nowrap">
                <HexagramCard
                    type="original"
                    hexData={structure.original}
                    lines={data.resultParam.original}
                />

                <Text size="xl" c="dimmed">→</Text>

                <HexagramCard
                    type="changed"
                    hexData={structure.changed}
                    lines={data.resultParam.changed}
                />
            </Group>

            <Box p="md" bg="rgba(255,255,255,0.05)" style={{ borderRadius: '8px', width: '90%', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Text size="sm" c="gray.5" ta="center" mb="xs">- 운세 풀이 -</Text>
                <Text size="md" c="white" style={{ whiteSpace: 'pre-line', lineHeight: 1.6, textAlign: 'center' }}>
                    {data.meaning.split('\n').filter(line => !line.includes('매화역수')).join('\n').trim()}
                </Text>
            </Box>
        </Stack>
    );
}
