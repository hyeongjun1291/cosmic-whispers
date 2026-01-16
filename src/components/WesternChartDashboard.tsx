'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Box, Text, Group, Stack, ThemeIcon } from '@mantine/core';
import { IconMoonStars, IconSunHigh } from '@tabler/icons-react';
import { calculateAstroState } from '@/lib/astrology';

interface WesternChartDashboardProps {
    birthDate: string | Date;
}

export default function WesternChartDashboard({ birthDate }: WesternChartDashboardProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const astro = useMemo(() => {
        const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
        return calculateAstroState(date);
    }, [birthDate]);

    useEffect(() => {
        if (!chartRef.current || !astro.planets) return;

        const loadChart = async () => {
            try {
                // Dynamic import to avoid SSR issues with canvas/window
                if (!chartRef.current || !astro?.planets) return;

                const { Chart } = await import('@astrodraw/astrochart');
                if (!chartRef.current) return;

                // Clear previous chart
                chartRef.current.innerHTML = '';

                // Preparing data for AstroChart
                // Each planet needs an array of [degree]
                const data = {
                    planets: {
                        Sun: [astro.planets.Sun],
                        Moon: [astro.planets.Moon],
                        Mercury: [astro.planets.Mercury],
                        Venus: [astro.planets.Venus],
                        Mars: [astro.planets.Mars],
                        Jupiter: [astro.planets.Jupiter],
                        Saturn: [astro.planets.Saturn],
                        Uranus: [astro.planets.Uranus],
                        Neptune: [astro.planets.Neptune],
                        Pluto: [astro.planets.Pluto]
                    },
                    cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] // Equal House
                };

                // Responsive Sizing: Fit to container
                const containerWidth = chartRef.current.clientWidth || 300;
                const size = Math.min(containerWidth, 500); // Cap at 500 but fit container

                const chartInstance = new Chart(chartRef.current.id, size, size, {
                    // "Perfect Port" of Library Look:
                    // 1. Use White Background (Library default)
                    COLOR_BACKGROUND: "#ffffff",

                    // 2. Use Standard Colors (Black/Dark Grey) for visibility on White
                    POINTS_COLOR: "#000000",
                    SIGNS_COLOR: "#000000",
                    CIRCLE_COLOR: "#333333",
                    LINE_COLOR: "#333333",
                    CUSPS_FONT_COLOR: "#000000",

                    MARGIN: 30,
                    SYMBOL_SCALE: 1.0,

                    // 3. Standard + Sextile Configuration (Mimicking perceived demo density)
                    ASPECTS: {
                        conjunction: { degree: 0, orbit: 10, color: '#ffd700' }, // Gold, Standard Orbit
                        sextile: { degree: 60, orbit: 10, color: '#87CEEB' },    // Blue, Standard Orbit
                        square: { degree: 90, orbit: 10, color: '#FF4500' },     // Red, Standard Orbit
                        trine: { degree: 120, orbit: 10, color: '#27AE60' },     // Green, Standard Orbit
                        opposition: { degree: 180, orbit: 10, color: '#27AE60' } // Green, Standard Orbit
                    }
                });

                // 4. Implement exact calls from 'radix.html' logic
                const radix = chartInstance.radix(data);

                // Add Angles (Ascendant/Midheaven) as Points of Interest for Aspects
                // This creates the "web" effect connecting planets to chart angles
                radix.addPointsOfInterest({
                    "As": [data.cusps[0]],
                    "Ic": [data.cusps[3]],
                    "Ds": [data.cusps[6]],
                    "Mc": [data.cusps[9]]
                });

                radix.aspects();
            } catch (e) {
                console.error("Failed to load AstroChart", e);
            }
        };

        loadChart();
    }, [astro]);

    return (
        <Box p="md" w="100%">
            <Stack gap="xl">
                <Box>
                    <Text size="xl" fw={700} c="gold" mb={4}>천궁도 (Natal Chart)</Text>
                    <Text size="xs" c="dimmed">당신이 태어난 순간의 별들의 기록</Text>
                </Box>

                {/* AstroChart Container - Center aligned */}
                <Box
                    id="astro-chart-container"
                    ref={chartRef}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                />

                {/* Legend / Guide */}
                <Box p="sm" bg="rgba(255,255,255,0.03)" style={{ borderRadius: '8px' }}>
                    <Text size="xs" c="dimmed" mb="xs" ta="center">💡 차트 가이 (Legend)</Text>
                    <Group justify="center" gap="lg">
                        <Stack gap={2} align="center"><Text size="lg">☉</Text><Text size="xs" c="dimmed">태양(자아)</Text></Stack>
                        <Stack gap={2} align="center"><Text size="lg">☽</Text><Text size="xs" c="dimmed">달(내면)</Text></Stack>
                        <Stack gap={2} align="center"><Text size="lg">☿</Text><Text size="xs" c="dimmed">수성(지성)</Text></Stack>
                        <Stack gap={2} align="center"><Text size="lg">♀</Text><Text size="xs" c="dimmed">금성(사랑)</Text></Stack>
                        <Stack gap={2} align="center"><Text size="lg">♂</Text><Text size="xs" c="dimmed">화성(행동)</Text></Stack>
                    </Group>
                </Box>

                {/* Detail Cards */}
                <Stack gap="md">
                    <Box p="md" bg="rgba(255, 215, 0, 0.05)" style={{ borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                        <Group mb="xs">
                            <IconSunHigh size={18} color="gold" />
                            <Text size="sm" fw={700} c="gold">태양: {astro.sunSign}</Text>
                        </Group>
                        <Text size="xs" c="dimmed">당신의 본질적인 성격과 자아를 나타냅니다.<br />지배행성: {astro.sunRuler}</Text>
                    </Box>

                    <Box p="md" bg="rgba(255, 255, 255, 0.05)" style={{ borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <Group mb="xs">
                            <IconMoonStars size={18} color="lightgray" />
                            <Text size="sm" fw={700} c="gray">달: {astro.moonSign}</Text>
                        </Group>
                        <Text size="xs" c="dimmed">당신의 감정과 무의식을 나타냅니다.<br />지배행성: {astro.moonRuler}</Text>
                    </Box>
                </Stack>

                {/* Retrograde Warning */}
                {astro.mercuryRetro && (
                    <Box p="xs" bg="rgba(255, 100, 100, 0.1)" style={{ borderRadius: '8px', border: '1px solid rgba(255, 100, 100, 0.3)' }}>
                        <Text size="xs" c="red.3" ta="center">⚠️ 수성 역행 (Mercury Retrograde)</Text>
                        <Text size="xs" c="dimmed" ta="center">깊은 사고력이 있지만, 통신 오류에 주의하세요.</Text>
                    </Box>
                )}
            </Stack>
        </Box>
    );
}
