'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Text, Stack, Group, ActionIcon, ScrollArea, Tooltip } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSettings, IconSend, IconUsers } from '@tabler/icons-react';
import { CHARACTERS } from '@/lib/characters';

interface Message {
    role: 'user' | 'model';
    text: string;
    emotion?: string;
}

interface VisualNovelProps {
    userName: string;
    history: Message[];
    onSendMessage: (msg: string) => void;
    onOpenSettings: () => void;
    isTyping: boolean;
    characterId: string;
    onChangeCharacter: () => void;
}

export default function VisualNovel({
    userName,
    history,
    onSendMessage,
    onOpenSettings,
    isTyping,
    characterId,
    onChangeCharacter
}: VisualNovelProps) {
    const [inputText, setInputText] = useState('');
    const lastMessage = history[history.length - 1];
    const [displayedText, setDisplayedText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const character = CHARACTERS[characterId] || CHARACTERS['cheongsan'];

    // Determine Logic for Image
    let currentEmotion = 'default';
    if (isTyping) {
        currentEmotion = 'magic';
    } else if (lastMessage?.role === 'model' && lastMessage.emotion) {
        currentEmotion = lastMessage.emotion;
    }

    // Handle extension quirk for Zion (4_magic.png)
    let extension = 'jpg';
    if (character.imageNumber === 4 && currentEmotion === 'magic') {
        extension = 'png';
    }

    const imagePath = `/images/characters/${character.imageNumber}_${currentEmotion}.${extension}`;

    useEffect(() => {
        if (lastMessage?.role === 'model') {
            let i = 0;
            setDisplayedText('');
            // Faster text speed
            const interval = setInterval(() => {
                setDisplayedText(prev => prev + lastMessage.text[i]);
                i++;
                if (i >= lastMessage.text.length) clearInterval(interval);
            }, 20);
            return () => clearInterval(interval);
        } else if (lastMessage?.role === 'user') {
            setDisplayedText('');
        }
    }, [lastMessage]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, displayedText]);

    const handleSend = () => {
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <Box h="100vh" w="100vw" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background & Patterns */}
            <Box className="oriental-pattern" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

            {/* Character Illustration Area */}
            <motion.div
                key={characterId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: '800px',
                    height: '100%',
                    zIndex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'none'
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.img
                        key={imagePath}
                        src={imagePath}
                        alt={character.name}
                        initial={{ opacity: 0.8, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.8 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: 'center bottom', // Anchor to bottom
                            maxHeight: '90vh', // Don't overflow too much
                            marginTop: '10vh'
                        }}
                    />
                </AnimatePresence>
            </motion.div>

            {/* Character Info Overlay (Top Center) - Optional */}
            <Stack align="center" style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 2, pointerEvents: 'none' }}>
                <Text c="white" size="lg" fw={700} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {character.name}
                </Text>
            </Stack>


            {/* Top Right Controls */}
            <Group style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }} gap="xs">
                <Tooltip label="상대 변경">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={onChangeCharacter}
                        size="lg"
                    >
                        <IconUsers size={24} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="설정">
                    <ActionIcon
                        variant="subtle"
                        color="gold"
                        onClick={onOpenSettings}
                        size="lg"
                    >
                        <IconSettings size={24} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            {/* Dialogue Area */}
            <Box
                style={{
                    position: 'absolute',
                    bottom: 40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    maxWidth: '800px',
                    zIndex: 5
                }}
            >
                <Paper p="xl" className="dialogue-box" style={{ border: `1px solid ${character.color}80`, backdropFilter: 'blur(10px)' }}>
                    <Stack gap="xs">
                        <Group justify="space-between" mb="xs">
                            <Text fw={700} c={character.color} size="xl" style={{ borderBottom: `2px solid ${character.color}` }}>
                                {lastMessage?.role === 'model' ? character.name.split(' ')[0] : userName}
                            </Text>
                        </Group>

                        <Box h={100}>
                            <ScrollArea h="100%" viewportRef={scrollRef}>
                                <Text size="lg" style={{ lineHeight: 1.6, minHeight: '60px' }}>
                                    {lastMessage?.role === 'model' ? displayedText : lastMessage?.text}
                                    {isTyping && <span className="fade-in">...</span>}
                                </Text>
                            </ScrollArea>
                        </Box>

                        <Group mt="md">
                            <input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={`${character.name}에게 말을 걸어보세요...`}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: `1px solid ${character.color}80`,
                                    color: 'white',
                                    padding: '8px',
                                    outline: 'none',
                                    fontSize: '16px'
                                }}
                            />
                            <ActionIcon variant="filled" color={character.color} onClick={handleSend} disabled={isTyping || !inputText.trim()}>
                                <IconSend size={18} />
                            </ActionIcon>
                        </Group>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}
