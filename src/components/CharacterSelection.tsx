'use client';

import { SimpleGrid, Card, Text, Group, Badge, Button, Stack, Image, Box, ActionIcon } from '@mantine/core';
import { CHARACTERS } from '@/lib/characters';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface CharacterSelectionProps {
    onSelect: (characterId: string) => void;
}


export default function CharacterSelection({ onSelect }: CharacterSelectionProps) {
    const chars = Object.values(CHARACTERS);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % chars.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + chars.length) % chars.length);
    };

    const getCardStyle = (index: number) => {
        const length = chars.length;

        // Calculate shortest distance in circular list
        // Result range: -length/2 ... +length/2
        // e.g. length 5: -2, -1, 0, 1, 2
        let dist = (index - activeIndex) % length;
        if (dist > length / 2) dist -= length;
        if (dist < -length / 2) dist += length;

        // "3 items exposed" rule:
        // Only show if dist is -1, 0, or 1.
        // But for smoother animations during rapid switching, we might technically render others but hidden.
        // However, standard CoverFlow usually shows stack. User said "Expose only 3".
        const isActive = dist === 0;
        const isNeighbor = Math.abs(dist) === 1;
        const isVisible = isActive || isNeighbor;

        if (!isVisible) {
            return {
                x: 0,
                opacity: 0,
                scale: 0.5,
                zIndex: -1,
                rotateY: 0,
                display: 'none' // functional change to ensure they don't interfere
            };
        }

        const sign = Math.sign(dist); // -1 (Left), 0 (Center), 1 (Right)

        return {
            x: dist * 260, // Tighter overlap (Card width ~320) but rotated
            scale: isActive ? 1 : 0.8,
            zIndex: isActive ? 10 : 5,
            opacity: isActive ? 1 : 0.6,
            rotateY: 0, // Tilt removed as per request
            rotateZ: 0,
            display: 'block'
        };
    };

    return (
        <Stack align="center" gap="xl" py="xl" px={{ base: 'md', sm: 'xl' }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ width: '100%', maxWidth: '800px' }}
            >
                <Image
                    src="/images/characters/fullshot.jpeg"
                    alt="All Characters"
                    radius="md"
                    w="100%"
                    style={{ border: '1px solid rgba(212, 175, 55, 0.3)' }}
                />
            </motion.div>

            <Stack align="center" gap="xs" px="md">
                <Text
                    component="h1"
                    size="xl"
                    fw={300}
                    c="gold"
                    style={{ letterSpacing: '4px', textAlign: 'center' }}
                >
                    운명의 파트너 선택
                </Text>
                <Text size="sm" c="gray.3" ta="center">
                    당신의 운명을 함께할 단 한 명의 인연을 선택하십시오.
                </Text>
            </Stack>

            {/* 3D Cover Flow Container */}
            <Box
                w="100%"
                h={600}
                style={{ position: 'relative', perspective: '1000px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                onClick={(e) => {
                    const { clientX } = e;
                    const centerX = window.innerWidth / 2;
                    if (clientX > centerX + 100) { // Buffer for center card
                        handleNext();
                    } else if (clientX < centerX - 100) {
                        handlePrev();
                    }
                }}
            >
                {/* Cards Container */}
                <Box style={{ position: 'relative', width: '300px', height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                    <AnimatePresence initial={false}>
                        {chars.map((char, index) => {
                            const style = getCardStyle(index);
                            return (
                                <motion.div
                                    key={char.id}
                                    initial={false}
                                    animate={{
                                        x: style.x,
                                        scale: style.scale,
                                        zIndex: style.zIndex,
                                        opacity: style.opacity,
                                        rotateY: style.rotateY
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    style={{
                                        display: style.display,
                                        position: 'absolute',
                                        width: '320px',
                                        height: '500px',
                                        transformStyle: 'preserve-3d',
                                        pointerEvents: 'auto' // Re-enable pointer events for cards
                                    }}
                                >
                                    <Card
                                        padding="lg"
                                        radius="md"
                                        withBorder
                                        style={{
                                            borderColor: 'rgba(255, 215, 0, 0.5)',
                                            backgroundColor: 'rgba(20, 20, 30, 0.9)',
                                            backdropFilter: 'blur(10px)',
                                            height: '100%',
                                            boxShadow: style.zIndex === 10 ? '0 0 30px rgba(255,215,0,0.3)' : 'none'
                                        }}
                                        onClick={(e) => {
                                            // Only stop propagation for the active card, so clicking it doesn't trigger parent's Left/Right navigation.
                                            // Clicking neighbors should bubble up to parent's handler which detects side clicks.
                                            if (index === activeIndex) {
                                                e.stopPropagation();
                                            }
                                        }}
                                    >
                                        <Group justify="space-between" mb="xs">
                                            <Text fw={700} c="white" size="lg">{char.name}</Text>
                                            <Badge color={char.color} variant="filled">{char.title}</Badge>
                                        </Group>

                                        <Card.Section>
                                            <Image
                                                src={`/images/characters/${char.imageNumber}_default.jpg`}
                                                height={320}
                                                fit="cover"
                                                alt={char.name}
                                                style={{ objectPosition: 'top' }}
                                            />
                                        </Card.Section>

                                        <Text size="sm" c="gray.4" my="md" h={60} fw={500} lineClamp={3}>
                                            {char.description}
                                        </Text>

                                        <Button
                                            variant="filled"
                                            fullWidth
                                            radius="md"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent navigation
                                                onSelect(char.id);
                                            }}
                                            style={{
                                                backgroundColor: char.color,
                                                color: 'white',
                                                fontWeight: 700,
                                                opacity: index === activeIndex ? 1 : 0.5,
                                                marginTop: 'auto',
                                                display: index === activeIndex ? 'block' : 'none' // Hide button on non-active
                                            }}
                                        >
                                            인연 맺기
                                        </Button>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </Box>
            </Box>

            {/* Social Media Follow Section */}
            <Box mt="xl" p="xl" style={{ borderTop: '1px solid rgba(255,215,0,0.2)', width: '100%', maxWidth: '600px' }}>
                <Stack align="center" gap="md">
                    <Text c="gold" size="lg" fw={600}>공식 소식 받기</Text>
                    <Text size="sm" c="dimmed" ta="center">
                        업데이트 및 이벤트 소식을 가장 먼저 받아보세요
                    </Text>
                    <Group gap="lg" mt="sm">
                        {/* Instagram */}
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textDecoration: 'none',
                                transition: 'transform 0.2s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Box
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </Box>
                            <Text size="xs" c="dimmed" mt={4}>Instagram</Text>
                        </a>

                        {/* X (Twitter) */}
                        <a
                            href="https://x.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textDecoration: 'none',
                                transition: 'transform 0.2s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Box
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    background: '#000000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </Box>
                            <Text size="xs" c="dimmed" mt={4}>X</Text>
                        </a>

                        {/* Threads */}
                        <a
                            href="https://threads.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textDecoration: 'none',
                                transition: 'transform 0.2s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Box
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 192 192" fill="white">
                                    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.538-10.552 21.748-10.552h.24c6.606.016 12.082 2.068 16.262 6.1 3.755 3.617 6.193 8.682 7.253 15.06a119.814 119.814 0 0 0-15.366-1.014c-16.067 0-30.622 3.64-39.887 9.996-9.925 6.809-15.6 17.153-15.6 28.408 0 11.115 4.553 20.964 12.824 27.734 7.996 6.543 18.737 10.114 30.25 10.114 12.782 0 23.725-4.39 31.633-12.694 6.324-6.642 10.93-15.982 13.288-26.97 3.42 2.177 6.382 4.813 8.73 7.776 6.34 8.003 9.521 18.006 9.521 29.92 0 11.355-3.014 20.839-8.944 28.164-6.064 7.49-14.98 11.82-24.45 11.882h-.344c-9.553 0-18.516-4.448-24.578-12.207l-13.711 9.606c8.44 10.879 21.031 17.126 34.539 17.126h.34c14.358-.07 27.486-6.914 36.953-19.265 9.17-11.97 13.848-27.652 13.848-46.603 0-16.923-4.455-31.417-13.239-43.1-3.917-5.21-8.822-9.653-14.506-13.148z" />
                                </svg>
                            </Box>
                            <Text size="xs" c="dimmed" mt={4}>Threads</Text>
                        </a>
                    </Group>
                </Stack>
            </Box>
        </Stack>
    );
}
