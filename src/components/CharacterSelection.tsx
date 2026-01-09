'use client';

import { SimpleGrid, Card, Text, Group, Badge, Button, Stack, Image } from '@mantine/core';
import { CHARACTERS } from '@/lib/characters';
import { motion } from 'framer-motion';

interface CharacterSelectionProps {
    onSelect: (characterId: string) => void;
}

export default function CharacterSelection({ onSelect }: CharacterSelectionProps) {
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
                    size={{ base: 'lg', sm: 'xl' }}
                    fw={300}
                    c="gold"
                    style={{ letterSpacing: '4px', textAlign: 'center' }}
                >
                    운명의 파트너 선택
                </Text>
                <Text size={{ base: 'xs', sm: 'sm' }} c="gray.3" ta="center">
                    당신의 운명을 함께할 단 한 명의 인연을 선택하십시오.
                </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" w="100%" maw={800}>
                {Object.values(CHARACTERS).map((char, index) => (
                    <motion.div
                        key={char.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: 'rgba(255, 215, 0, 0.3)', backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                            <Group justify="space-between" mb="xs">
                                <Text fw={700} c="white" size="lg">{char.name}</Text>
                                <Badge color={char.color} variant="filled">{char.title}</Badge>
                            </Group>

                            <Card.Section>
                                <Image
                                    src={`/images/characters/${char.imageNumber}_default.jpg`}
                                    height={400}
                                    fit="contain"
                                    alt={char.name}
                                />
                            </Card.Section>

                            <Text size="sm" c="gray.2" my="md" h={40} fw={500}>
                                {char.description}
                            </Text>

                            <Button
                                variant="filled"
                                fullWidth
                                mt="md"
                                radius="md"
                                onClick={() => onSelect(char.id)}
                                style={{
                                    backgroundColor: char.color,
                                    color: 'white',
                                    fontWeight: 700,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    opacity: 0.9,
                                    transition: 'all 0.2s'
                                }}
                            >
                                인연 맺기
                            </Button>
                        </Card>
                    </motion.div>
                ))}
            </SimpleGrid>
        </Stack>
    );
}
