
import { Paper, Title, Text, Stack, Box, Badge } from '@mantine/core';
import { ShamanResult } from '@/lib/shaman';

export default function ObanggiDashboard({ data }: { data: ShamanResult }) {
    if (!data) return null;

    const getFlagColor = (color: string) => {
        switch (color) {
            case 'blue': return '#00498c';
            case 'red': return '#d32f2f';
            case 'white': return '#f5f5f5';
            case 'green': return '#388e3c';
            case 'yellow': return '#fbc02d';
            default: return '#333';
        }
    };

    return (
        <Stack gap="lg" align="center" w="100%">
            <Title order={4} c="white">오늘의 신령님 점괘</Title>

            <Box
                style={{
                    width: 120,
                    height: 180,
                    backgroundColor: getFlagColor(data.flagColor),
                    borderRadius: '8px',
                    boxShadow: `0 0 20px ${getFlagColor(data.flagColor)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid gold'
                }}
            >
                <Text size="2rem" fw={900} c={data.flagColor === 'white' ? 'black' : 'white'} style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                    {data.flagName.split(' ')[0]}
                </Text>
            </Box>

            <Stack gap={0} align="center">
                <Text size="xl" fw={700} c={getFlagColor(data.flagColor) === '#f5f5f5' ? 'white' : getFlagColor(data.flagColor)}>
                    {data.flagName.split('(')[0]}
                </Text>
                <Text size="xs" c="dimmed">{data.direction}의 기운</Text>
            </Stack>

            <Paper p="md" bg="rgba(255,255,255,0.05)" w="100%" style={{ borderRadius: '8px' }}>
                <Text size="sm" c="white" style={{ lineHeight: 1.6 }}>
                    {data.description || data.meaning}
                </Text>
            </Paper>
        </Stack>
    );
}
