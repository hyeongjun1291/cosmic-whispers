'use client';

import { SajuData, Ohaeng, getOhaengPercentages, calculateShinsal } from '@/lib/saju';
import { Paper, Grid, Text, Title, Stack, Group, Box, Divider, RingProgress, Badge, Card, ScrollArea } from '@mantine/core';

const OHAENG_COLORS: Record<Ohaeng, string> = {
    '木': '#409c5a', // Rich Forest Green
    '火': '#e03131', // Vivid Fire Red
    '土': '#b0833a', // Earthy Gold/Brown
    '金': '#dee2e6', // Bright Silver/White
    '水': '#2b4b7d', // Deep Ocean Blue
};

const OHAENG_LABELS: Record<string, string> = {
    '木': '목 (Tree)',
    '火': '화 (Fire)',
    '土': '토 (Earth)',
    '金': '금 (Metal)',
    '水': '수 (Water)',
};

export default function SajuDashboard({ data }: { data: SajuData }) {
    const pillars = [
        { label: '시주 (Time)', data: data.time || { ganji: '??', ohaeng: '土', sibsin: '미정' } },
        { label: '일주 (Day)', data: data.day },
        { label: '월주 (Month)', data: data.month },
        { label: '연주 (Year)', data: data.year },
    ];

    const { percentages } = getOhaengPercentages(data);
    const shinsal = calculateShinsal(data);

    return (
        <ScrollArea h="100%" type="scroll" offsetScrollbars>
            <Stack gap="lg" pb="xl"> {/* Added padding bottom for better scroll feel */}
                {/* Main Container */}
                <Paper
                    p="md"
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        // Removed fixed height 100% to allow content to flow naturally
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Title order={3} fw={300} ta="center" c="gold" mb="xl" className="title-glow">
                        당신의 사주 원국
                    </Title>

                    {/* Saju Pillars Grid */}
                    <Grid gutter="md" align="center" justify="center" style={{ flex: 1 }}>
                        {pillars.map((p, i) => {
                            const isUnknown = p.data.ganji === '??';
                            // Use Dark Gray for Unknown, Elemental Color for others
                            const color = isUnknown ? '#343a40' : OHAENG_COLORS[p.data.ohaeng];
                            // Text color: Dark for Bright Metal, White for others/Unknown (since Unknown is dark)
                            const textColor = !isUnknown && ['金', '土'].includes(p.data.ohaeng) ? '#1a1b26' : '#fff';

                            return (
                                <Grid.Col span={3} key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                                    <Stack
                                        align="center"
                                        justify="center"
                                        gap="lg"
                                        w="100%"
                                        p="sm"
                                        style={{
                                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                            borderRadius: '12px',
                                            border: `1px solid ${isUnknown ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
                                            backdropFilter: 'blur(4px)'
                                        }}
                                    >
                                        <Text size="xs" c="gray.3" ta="center" fw={600}>{p.label}</Text>

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
                                                    backgroundColor: color,
                                                    color: textColor,
                                                    boxShadow: `0 0 15px ${color}40`,
                                                    fontSize: '24px',
                                                    fontWeight: 700,
                                                    fontFamily: "'Noto Serif KR', serif",
                                                    border: isUnknown ? '1px dashed #ced4da' : 'none'
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
                                                    backgroundColor: color,
                                                    color: textColor,
                                                    boxShadow: `0 0 15px ${color}40`,
                                                    fontSize: '24px',
                                                    fontWeight: 700,
                                                    fontFamily: "'Noto Serif KR', serif",
                                                    border: isUnknown ? '1px dashed #ced4da' : 'none'
                                                }}
                                            >
                                                {p.data.ganji.split('')[1]}
                                            </Box>
                                        </Stack>

                                        <Divider w="50%" color="rgba(255,255,255,0.1)" />

                                        <Text size="xs" c={isUnknown ? "dimmed" : "gold"} opacity={0.8}>
                                            {isUnknown ? '(미정)' : p.data.ohaeng}
                                        </Text>
                                    </Stack>
                                </Grid.Col>
                            );
                        })}
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

                {/* Analysis Section */}
                <Paper p="md" radius="md" style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Stack gap="md">
                        <Title order={5} ta="center" c="gray.1">오행 분포 (Element Balance)</Title>
                        <Group justify="center">
                            <RingProgress
                                size={140}
                                thickness={16}
                                roundCaps
                                sections={[
                                    { value: percentages['木'], color: OHAENG_COLORS['木'], tooltip: '목 (Wood)' },
                                    { value: percentages['火'], color: OHAENG_COLORS['火'], tooltip: '화 (Fire)' },
                                    { value: percentages['土'], color: OHAENG_COLORS['土'], tooltip: '토 (Earth)' },
                                    { value: percentages['金'], color: OHAENG_COLORS['金'], tooltip: '금 (Metal)' },
                                    { value: percentages['水'], color: OHAENG_COLORS['水'], tooltip: '수 (Water)' },
                                ]}
                                label={
                                    <Text ta="center" size="xs" fw={700} c="white">
                                        Balance
                                    </Text>
                                }
                            />
                            <Stack gap={4}>
                                {Object.entries(percentages).map(([key, val]) => (
                                    <Group key={key} gap="xs">
                                        <Box w={10} h={10} style={{ backgroundColor: OHAENG_COLORS[key as Ohaeng], borderRadius: '50%', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }} />
                                        <Text size="sm" c="gray.1" fw={500}>{key}: {val}%</Text>
                                    </Group>
                                ))}
                            </Stack>
                        </Group>

                        <Divider color="rgba(255,255,255,0.2)" />

                        <Title order={5} ta="center" c="gray.1">신살 & 길성 (Divine Stars)</Title>
                        {shinsal.length > 0 ? (
                            <Stack gap="sm">
                                {shinsal.map((s, idx) => (
                                    <Card key={idx} padding="sm" radius="md" withBorder style={{ backgroundColor: 'rgba(30,30,30,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}>
                                        <Group justify="space-between">
                                            <Badge variant="filled" color="yellow" c="dark.9">{s.star}</Badge>
                                            <Text size="xs" c="gray.4" fw={600}>{s.pillar}</Text>
                                        </Group>
                                        <Text size="sm" mt="xs" c="white" style={{ lineHeight: 1.4 }}>{s.description}</Text>
                                    </Card>
                                ))}
                            </Stack>
                        ) : (
                            <Text size="sm" ta="center" c="gray.5">특이한 신살이 감지되지 않았습니다.</Text>
                        )}
                    </Stack>
                </Paper>
            </Stack>
        </ScrollArea>
    );
}
