'use client';

import { SajuData, Ohaeng } from '@/lib/saju';
import { Paper, Grid, Text, Title, Stack, Group, Badge, Box } from '@mantine/core';

const OHAENG_COLORS: Record<Ohaeng, string> = {
    '木': '#2f9e44', // Green
    '火': '#e03131', // Red
    '土': '#f59f00', // Yellow/Gold
    '金': '#f8f9fa', // White/Light
    '水': '#212529', // Black/Dark
};

const OHAENG_TEXT_COLORS: Record<Ohaeng, string> = {
    '木': '#fff',
    '火': '#fff',
    '土': '#000',
    '金': '#000',
    '水': '#fff',
};

export default function SajuDashboard({ data }: { data: SajuData }) {
    const pillars = [
        { label: '시주', data: data.time },
        { label: '일주', data: data.day },
        { label: '월주', data: data.month },
        { label: '연주', data: data.year },
    ];

    return (
        <Stack gap="xl" p="md">
            <Title order={3} fw={300} ta="center" c="gold">당신의 사주 원국</Title>
            <Grid gutter="xs">
                {pillars.map((p, i) => (
                    <Grid.Col span={3} key={i}>
                        <Paper
                            p="xs"
                            className="saju-card"
                            style={{
                                backgroundColor: OHAENG_COLORS[p.data.ohaeng],
                                color: OHAENG_TEXT_COLORS[p.data.ohaeng],
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <Stack gap={2}>
                                <Text size="xs" opacity={0.7}>{p.label}</Text>
                                <Text size="xl" fw={700} style={{ letterSpacing: 4 }}>{p.data.ganji}</Text>
                                <Badge variant="outline" size="xs" color={OHAENG_TEXT_COLORS[p.data.ohaeng]}>
                                    {p.data.sibsin}
                                </Badge>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                ))}
            </Grid>
            <Group justify="center">
                {Object.entries(OHAENG_COLORS).map(([k, v]) => (
                    <Group gap={4} key={k}>
                        <Box w={10} h={10} style={{ backgroundColor: v, borderRadius: '50%' }} />
                        <Text size="xs" c="dimmed">{k}</Text>
                    </Group>
                ))}
            </Group>
        </Stack>
    );
}
