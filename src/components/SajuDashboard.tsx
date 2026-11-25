'use client';

import { SajuData, Ohaeng } from '@/lib/saju';
import { Paper, Grid, Text, Title, Stack, Group, Box, Divider } from '@mantine/core';

const OHAENG_COLORS: Record<Ohaeng, string> = {
    '木': '#2f9e44', // Green
    '火': '#e03131', // Red
    '土': '#f59f00', // Yellow/Gold
    '金': '#f8f9fa', // White/Light
    '水': '#212529', // Black/Dark
};

export default function SajuDashboard({ data }: { data: SajuData }) {
    const pillars = [
        { label: '시주 (Time)', data: data.time },
        { label: '일주 (Day)', data: data.day },
        { label: '월주 (Month)', data: data.month },
        { label: '연주 (Year)', data: data.year },
    ];

    return (
        <Stack gap="lg" h="100%">
            {/* Main Container */}
            <Paper
                p="md"
                style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Title order={3} fw={300} ta="center" c="gold" mb="xl" className="title-glow">
                    당신의 사주 원국
                </Title>

                {/* Saju Pillars Grid */}
                <Grid gutter="md" align="center" justify="center" style={{ flex: 1 }}>
                    {pillars.map((p, i) => (
                        <Grid.Col span={3} key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                            <Stack
                                align="center"
                                justify="center"
                                gap="lg"
                                w="100%"
                                p="sm"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                            >
                                <Text size="xs" c="dimmed" ta="center" fw={500}>{p.label}</Text>

                                <Divider w="50%" color="rgba(255,255,255,0.1)" />

                                {/* Ganji Display */}
                                <Stack gap="md" align="center">
                                    {/* Ten Gods (Sibsin) */}
                                    <Text size="10px" c="gray.5">{p.data.sibsin}</Text>

                                    {/* Main Character */}
                                    <Box
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            backgroundColor: OHAENG_COLORS[p.data.ohaeng],
                                            color: ['金', '土'].includes(p.data.ohaeng) ? '#1a1b26' : '#fff',
                                            boxShadow: `0 0 15px ${OHAENG_COLORS[p.data.ohaeng]}40`,
                                            fontSize: '24px',
                                            fontWeight: 700,
                                            fontFamily: "var(--font-serif)"
                                        }}
                                    >
                                        {p.data.ganji.split('')[0]}
                                    </Box>
                                    <Box
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            backgroundColor: OHAENG_COLORS[p.data.ohaeng], // Note: Usually ji has its own element, simplifying here or should use distinct logic if data supports it. 
                                            // Ideally `p.data` should have separate Gan and Ji elements. 
                                            // Assuming current `data.ohaeng` applies to the pillar broadly or the top stem.
                                            // To be accurate, we might need separate colors if the data supports it.
                                            // For design simple upgrade, let's keep it unified but visually distinct.
                                            color: ['金', '土'].includes(p.data.ohaeng) ? '#1a1b26' : '#fff',
                                            boxShadow: `0 0 15px ${OHAENG_COLORS[p.data.ohaeng]}40`,
                                            fontSize: '24px',
                                            fontWeight: 700,
                                            fontFamily: "var(--font-serif)"
                                        }}
                                    >
                                        {p.data.ganji.split('')[1]}
                                    </Box>
                                </Stack>

                                <Divider w="50%" color="rgba(255,255,255,0.1)" />

                                <Text size="xs" c="gold" opacity={0.8}>{p.data.ohaeng}</Text>
                            </Stack>
                        </Grid.Col>
                    ))}
                </Grid>

                {/* Legend */}
                <Group justify="center" mt="xl" gap="md">
                    {Object.entries(OHAENG_COLORS).map(([k, v]) => (
                        <Group gap={6} key={k}>
                            <Box w={8} h={8} style={{ backgroundColor: v, borderRadius: '50%' }} />
                            <Text size="xs" c="dimmed">{k}</Text>
                        </Group>
                    ))}
                </Group>
            </Paper>
        </Stack>
    );
}
