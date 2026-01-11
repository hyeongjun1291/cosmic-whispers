'use client';

import { SimpleGrid, Card, Text, Group, Badge, Button, Stack, Image, Box, ActionIcon, TextInput } from '@mantine/core';
import { CHARACTERS } from '@/lib/characters';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMail, IconCheck } from '@tabler/icons-react';
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

            {/* Email Subscription Section */}
            <Box mt="xl" p="xl" style={{ borderTop: '1px solid rgba(255,215,0,0.2)', width: '100%', maxWidth: '600px' }}>
                <Stack align="center" gap="sm">
                    <Text c="gold" size="lg" fw={600}>정식 출시 알림 받기</Text>
                    <EmailSubscription />
                </Stack>
            </Box>
        </Stack>
    );
}

function EmailSubscription() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!email.includes('@')) return;
        console.log('[Email Sub]', email);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <Group gap="xs" c="green.4">
                    <IconCheck size={20} />
                    <Text fw={700}>감사합니다! 소식을 꼭 전해드릴게요.</Text>
                </Group>
            </motion.div>
        );
    }

    return (
        <Group w="100%">
            <TextInput
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                leftSection={<IconMail size={16} />}
                styles={{ input: { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,215,0,0.3)', color: 'white' } }}
                style={{ flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button variant="outline" color="gold" onClick={handleSubmit}>신청</Button>
        </Group>
    );
}
