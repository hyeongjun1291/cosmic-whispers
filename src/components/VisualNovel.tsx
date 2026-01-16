'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Text, Stack, Group, ActionIcon, ScrollArea, Tooltip, Divider, Badge, Indicator } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { CHARACTERS } from '@/lib/characters';

interface Message {
    role: 'user' | 'model';
    text: string;
    emotion?: string;
    hidden?: boolean; // New: Support hidden context messages
}

interface VisualNovelProps {
    userName: string;
    history: Message[];
    onSendMessage: (msg: string) => void;
    onSwitchToCharacter: (id: string) => void;
    isTyping: boolean;
    characterId: string;
    dashboard?: React.ReactNode;
    notifications?: Record<string, boolean>;
    onTriggerTarot?: (topic?: string) => void;
    onTriggerAnu?: (query: string) => void;
}

export default function VisualNovel({
    userName,
    history,
    onSendMessage,
    isTyping,
    characterId,
    onSwitchToCharacter,
    dashboard,
    notifications = {},
    onTriggerTarot,
    onTriggerAnu
}: VisualNovelProps) {
    const [inputText, setInputText] = useState('');
    const lastMessage = history[history.length - 1];
    const scrollRef = useRef<HTMLDivElement>(null);
    const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
    const prevCharacterIdRef = useRef(characterId);

    // Track character context (Removed affection tracking)
    useEffect(() => {
        // If character changed, reset baselines
        if (characterId !== prevCharacterIdRef.current) {
            prevCharacterIdRef.current = characterId;
            return;
        }
    }, [characterId]);

    // Format text with line breaks
    const formatText = (text: string) => {
        if (!text) return '';
        return text
            .replace(/(\.{3}|[.!?。!?])\s*/g, '$1\n')
            .replace(/\n{3,}/g, '\n\n');
    };

    const character = CHARACTERS[characterId] || CHARACTERS['taeil'];

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

    // Handle image load to get aspect ratio
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const ratio = img.naturalWidth / img.naturalHeight;
        setImageAspectRatio(ratio);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleSend = () => {
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <Box h="100vh" w="100vw" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background */}
            <Box className="oriental-pattern" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

            {/* Top Controls */}
            {/* Top Controls - REMOVED per request */}
            {/* Main Layout: Desktop - 3 Columns, Mobile - Full Screen with Overlay */}
            <Box className="main-layout">
                {/* Left Side - Dashboard (Desktop Only) */}
                <Box className="dashboard-panel desktop-only">
                    <ScrollArea h="100%" type="hover" offsetScrollbars>
                        {dashboard}
                    </ScrollArea>
                </Box>
                {/* Center - Character Image & Viewport Overlay */}
                <Box className="character-panel">
                    {/* Floating Character Nav - Positioned inside Character Panel to avoid overlap with Dashboard */}
                    <Box style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 50 }} visibleFrom="sm">
                        <Stack gap="md" align="center" style={{ backgroundColor: 'transparent', padding: '10px' }}>
                            {Object.values(CHARACTERS).map((char) => (
                                <Tooltip key={char.id} label={char.name} position="right" withArrow>
                                    <Indicator
                                        color="red"
                                        withBorder
                                        processing
                                        disabled={!notifications[char.id]}
                                        offset={5}
                                    >
                                        <button
                                            onClick={() => onSwitchToCharacter(char.id)}
                                            className="nav-custom-btn"
                                            style={{
                                                opacity: characterId === char.id ? 1 : 0.6,
                                                filter: characterId === char.id ? 'drop-shadow(0 0 5px gold)' : 'grayscale(0.5)',
                                                border: notifications[char.id] ? '2px solid red' : 'none'
                                            }}
                                        >
                                            <img
                                                src={`/images/ui/nav_${char.id}.png`}
                                                alt={char.name}
                                                onError={(e) => {
                                                    e.currentTarget.src = `/images/characters/${char.imageNumber}_default.jpg`;
                                                    e.currentTarget.style.objectFit = 'cover';
                                                    e.currentTarget.style.borderRadius = '50%';
                                                }}
                                            />
                                        </button>
                                    </Indicator>
                                </Tooltip>
                            ))}
                        </Stack>
                    </Box>

                    {/* Character & Viewport Overlay */}
                    <Box className="viewport-overlay">
                        <Box className="viewport-hole">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={imagePath}
                                    src={imagePath}
                                    alt={character.name}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1.02 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="character-portrait"
                                    onLoad={handleImageLoad}
                                />
                            </AnimatePresence>

                            {/* Decorative Border for the hole */}
                            <Box className="hole-border" />
                        </Box>
                    </Box>

                    {/* Name Plate */}
                    <Box className="name-plate-overlay">
                        <Text c="white" size="lg" fw={700} ta="center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            {character.name}
                        </Text>
                        <Text c="gold" size="xs" ta="center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                            {character.title}
                        </Text>
                    </Box>
                </Box>

                {/* Right Side - Chat Log (Desktop) */}
                <Box className="chat-panel desktop-only">
                    <Paper className="chat-container" style={{ borderColor: `${character.color}80` }}>
                        {/* Chat Header */}
                        <Box className="chat-header" style={{ borderBottomColor: character.color }}>
                            <Text size="xl" fw={700} c={character.color}>
                                대화 기록
                            </Text>
                            <Text size="xs" c="dimmed">
                                {history.length}개의 메시지
                            </Text>
                        </Box>

                        {/* Chat Messages */}
                        <ScrollArea className="chat-messages" viewportRef={scrollRef}>
                            <Stack gap="md" p="md">
                                {history.filter(m => !m.hidden).map((msg, idx) => (
                                    <Box
                                        key={idx}
                                        className={msg.role === 'user' ? 'message-user' : 'message-model'}
                                    >
                                        <Text size="xs" c="dimmed" mb={4}>
                                            {msg.role === 'model' ? character.name : userName}
                                        </Text>
                                        <Paper
                                            p="md"
                                            className={msg.role === 'user' ? 'message-bubble-user' : 'message-bubble-model'}
                                            style={{
                                                backgroundColor: msg.role === 'user'
                                                    ? 'rgba(99, 102, 241, 0.2)'
                                                    : `rgba(${parseInt(character.color.slice(1, 3), 16)}, ${parseInt(character.color.slice(3, 5), 16)}, ${parseInt(character.color.slice(5, 7), 16)}, 0.15)`,
                                                borderLeft: `3px solid ${msg.role === 'user' ? '#6366f1' : character.color}`
                                            }}
                                        >
                                            <Text
                                                size="sm"
                                                style={{
                                                    whiteSpace: 'pre-line',
                                                    lineHeight: 1.8
                                                }}
                                            >
                                                {formatText(msg.text)}
                                                {isTyping && idx === history.length - 1 && msg.role === 'model' && (
                                                    <span className="fade-in">...</span>
                                                )}
                                            </Text>
                                        </Paper>
                                    </Box>
                                ))}
                            </Stack>
                        </ScrollArea>

                        {/* Input Area */}
                        <Box className="chat-input-area">
                            <Divider mb="md" color={character.color} opacity={0.3} />

                            {/* Quick Question Chips (Desktop) */}
                            <ScrollArea w="100%" type="never" offsetScrollbars={false} mb="sm">
                                <Group gap="xs" wrap="nowrap" pb={4}>
                                    {[
                                        { label: '🌟 올해 운세', query: '올해(2026년)의 총운과 흐름을 자세히 알려줘.' },
                                        { label: '📅 이달 총론', query: '이번 달의 전반적인 운세 흐름을 알려줘.' },
                                        { label: '💰 재물운', query: '나의 타고난 재물운과 현재 금전 흐름을 분석해줘.' },
                                        { label: '💘 애정운', query: '나의 연애 성향과 애정운, 배우자운을 알려줘.' },
                                        { label: '💪 건강운', query: '주의해야 할 건강 문제나 신체 부위를 알려줘.' },
                                        { label: '🍀 길일택일', query: '중요한 일을 하기에 좋은 길일을 추천해줘.' },
                                        { label: '💼 직업운', query: '나에게 맞는 직업 적성과 진로를 알려줘.' },
                                    ].map((chip) => (
                                        <Badge
                                            key={chip.label}
                                            size="sm"
                                            variant="outline"
                                            color="gray"
                                            style={{
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                borderColor: `${character.color}60`,
                                                color: 'var(--mantine-color-gray-5)',
                                                backgroundColor: 'rgba(255,255,255,0.05)'
                                            }}
                                            onClick={() => {
                                                if (!isTyping) {
                                                    // [TAROT TRIGGER]
                                                    if (characterId === 'claire' && onTriggerTarot) {
                                                        onTriggerTarot(chip.query); // Pass full query
                                                    } else if (characterId === 'anu' && onTriggerAnu) {
                                                        onTriggerAnu(chip.query);
                                                    } else {
                                                        onSendMessage(chip.query);
                                                    }
                                                }
                                            }}
                                        >
                                            {chip.label}
                                        </Badge>
                                    ))}
                                </Group>
                            </ScrollArea>

                            <Group gap="xs">
                                <input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={`${character.name}에게 말을 걸어보세요...`}
                                    className="chat-input"
                                    style={{
                                        borderBottomColor: `${character.color}80`
                                    }}
                                    disabled={isTyping}
                                />
                                <ActionIcon
                                    variant="filled"
                                    color={character.color}
                                    onClick={handleSend}
                                    disabled={isTyping || !inputText.trim()}
                                    size="lg"
                                >
                                    <IconSend size={18} />
                                </ActionIcon>
                            </Group>
                        </Box>
                    </Paper>
                </Box>

                {/* Mobile Overlay Chat */}
                <MobileChatOverlay
                    history={history}
                    character={character}
                    userName={userName}
                    onSend={onSendMessage}
                    isTyping={isTyping}
                    lastMessage={lastMessage}
                    formatText={formatText}
                    onTriggerTarot={onTriggerTarot}
                    onTriggerAnu={onTriggerAnu}
                    characterId={characterId}
                />
            </Box>
        </Box >
    );
}

// Mobile Chat Overlay Component
function MobileChatOverlay({
    history,
    character,
    onSend,
    isTyping,
    lastMessage,
    formatText,
    userName,
    onTriggerTarot,
    onTriggerAnu,
    characterId
}: {
    history: Message[];
    character: any;
    onSend: (text: string) => void;
    isTyping: boolean;
    lastMessage: Message | undefined;
    formatText: (text: string) => string;
    userName: string;
    onTriggerTarot?: (topic?: string) => void;
    onTriggerAnu?: (query: string) => void;
    characterId?: string;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputText, setInputText] = useState('');
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll on new message
    useEffect(() => {
        if (scrollRef.current && isExpanded) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isExpanded]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        onSend(inputText);
        setInputText('');
    };

    // Helper for chips
    const handleSendMessage = (text: string) => {
        onSend(text);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setCurrentY(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        const diff = startY - currentY;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && !isExpanded && !isMinimized) {
                setIsExpanded(true); // Swipe Up -> Expand
            } else if (diff < 0) {
                if (isExpanded) {
                    setIsExpanded(false); // Swipe Down (from expanded) -> Collapse
                } else {
                    // Swipe Down (from collapsed) -> Minimize? Maybe just button for now to be safe
                }
            }
        }
        setStartY(0);
        setCurrentY(0);
    };

    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
        if (isMinimized) {
            // Restoring
            // keep isExpanded as is?
        } else {
            // Minimizing
            setIsExpanded(false); // Collapse if expanded
        }
    };

    return (
        <Box className="mobile-chat-overlay" style={{ pointerEvents: 'none' }}> {/* Container passes clicks */}
            <motion.div
                className={`mobile-chat-container ${isExpanded ? 'expanded' : ''}`}
                initial={{ y: 0 }}
                animate={{
                    y: isMinimized ? 'calc(100% - 48px)' : (isExpanded ? 0 : 0)
                    // If minimized, push down leaving only header. If expanded/collapsed, handled by CSS height usually, or we can animate height here
                    // Actually existing CSS handles height for expanded class.
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ pointerEvents: 'auto' }}
            >
                {/* Drag Handle & Toggle */}
                <Box
                    className="drag-handle"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => !isMinimized && setIsExpanded(!isExpanded)}
                    style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                    <Box className="drag-indicator" />

                    {/* Minimize/Restore Button */}
                    <ActionIcon
                        variant="transparent"
                        color="gray"
                        size="sm"
                        style={{ position: 'absolute', right: 10 }}
                        onClick={toggleMinimize}
                    >
                        {isMinimized ? <IconChevronUp /> : <IconChevronDown />}
                    </ActionIcon>

                    {!isExpanded && !isMinimized && (
                        <Text size="xs" c="dimmed" ta="center" mt={4} style={{ display: 'none' }}>
                            {/* Hiding text to clean up UI */}
                        </Text>
                    )}
                </Box>

                {/* Chat Content - Hidden if minimized */}
                {!isMinimized && (
                    <>
                        {isExpanded ? (
                            // Full Chat History
                            <ScrollArea className="mobile-full-chat" viewportRef={scrollRef}>
                                <Stack gap="md" p="md">
                                    <Group justify="space-between" mb="sm">
                                        <Text size="lg" fw={700} c={character.color}>
                                            대화 기록
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {history.length}개
                                        </Text>
                                    </Group>
                                    {history.filter(m => !m.hidden).map((msg: any, idx: number) => (
                                        <Box
                                            key={idx}
                                            className={msg.role === 'user' ? 'message-user' : 'message-model'}
                                        >
                                            <Text size="xs" c="dimmed" mb={4}>
                                                {msg.role === 'model' ? character.name : userName}
                                            </Text>
                                            <Paper
                                                p="sm"
                                                className={msg.role === 'user' ? 'message-bubble-user' : 'message-bubble-model'}
                                                style={{
                                                    backgroundColor: msg.role === 'user'
                                                        ? 'rgba(99, 102, 241, 0.3)'
                                                        : `rgba(${parseInt(character.color.slice(1, 3), 16)}, ${parseInt(character.color.slice(3, 5), 16)}, ${parseInt(character.color.slice(5, 7), 16)}, 0.25)`,
                                                    borderLeft: `3px solid ${msg.role === 'user' ? '#6366f1' : character.color}`
                                                }}
                                            >
                                                <Text
                                                    size="sm"
                                                    style={{
                                                        whiteSpace: 'pre-line',
                                                        lineHeight: 1.7
                                                    }}
                                                >
                                                    {formatText(msg.text)}
                                                </Text>
                                            </Paper>
                                        </Box>
                                    ))}
                                </Stack>
                            </ScrollArea>
                        ) : (
                            // Latest Message Only
                            <Box className="mobile-latest-message" p="md">
                                {lastMessage && (
                                    <Box className={lastMessage.role === 'user' ? 'message-user' : 'message-model'}>
                                        <Text size="xs" c="dimmed" mb={4}>
                                            {lastMessage.role === 'model' ? character.name : userName}
                                        </Text>
                                        <Paper
                                            p="sm"
                                            className={lastMessage.role === 'user' ? 'message-bubble-user' : 'message-bubble-model'}
                                            style={{
                                                backgroundColor: lastMessage.role === 'user'
                                                    ? 'rgba(99, 102, 241, 0.3)'
                                                    : `rgba(${parseInt(character.color.slice(1, 3), 16)}, ${parseInt(character.color.slice(3, 5), 16)}, ${parseInt(character.color.slice(5, 7), 16)}, 0.25)`,
                                                borderLeft: `3px solid ${lastMessage.role === 'user' ? '#6366f1' : character.color}`
                                            }}
                                        >
                                            <Text
                                                size="sm"
                                                style={{
                                                    whiteSpace: 'pre-line',
                                                    lineHeight: 1.7
                                                }}
                                            >
                                                {formatText(lastMessage.text)}
                                                {isTyping && <span className="fade-in">...</span>}
                                            </Text>
                                        </Paper>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Input Area */}
                        <Box className="mobile-input-area" style={{ borderTopColor: `${character.color}40`, flexDirection: 'column', gap: '8px' }}>
                            {/* Quick Question Chips */}
                            <ScrollArea w="100%" type="never" offsetScrollbars={false}>
                                <Group gap="xs" wrap="nowrap" px={4} pb={4}>
                                    {[
                                        { label: '🌟 올해 운세', query: '올해(2026년)의 총운과 흐름을 자세히 알려줘.' },
                                        { label: '📅 이달 총론', query: '이번 달의 전반적인 운세 흐름을 알려줘.' },
                                        { label: '💰 재물운', query: '나의 타고난 재물운과 현재 금전 흐름을 분석해줘.' },
                                        { label: '💘 애정운', query: '나의 연애 성향과 애정운, 배우자운을 알려줘.' },
                                        { label: '💪 건강운', query: '주의해야 할 건강 문제나 신체 부위를 알려줘.' },
                                        { label: '🍀 길일택일', query: '중요한 일을 하기에 좋은 길일을 추천해줘.' },
                                        { label: '💼 직업운', query: '나에게 맞는 직업 적성과 진로를 알려줘.' },
                                    ].map((chip) => (
                                        <Badge
                                            key={chip.label}
                                            size="sm"
                                            variant="outline"
                                            color="gray"
                                            style={{
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                borderColor: `${character.color}60`,
                                                color: 'var(--mantine-color-gray-3)',
                                                backgroundColor: 'rgba(0,0,0,0.2)'
                                            }}
                                            onClick={() => {
                                                if (!isTyping) {
                                                    // [TAROT TRIGGER]
                                                    if (character.id === 'claire' && onTriggerTarot) { // Use character.id from prop
                                                        onTriggerTarot(chip.query); // Pass full query
                                                    } else if (character.id === 'anu' && onTriggerAnu) {
                                                        onTriggerAnu(chip.query);
                                                    } else {
                                                        handleSendMessage(chip.query);
                                                    }
                                                }
                                            }}
                                        >
                                            {chip.label}
                                        </Badge>
                                    ))}
                                </Group>
                            </ScrollArea>

                            <Group gap="xs">
                                <input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={`${character.name}에게 말을 걸어보세요...`}
                                    className="chat-input"
                                    style={{
                                        borderBottomColor: `${character.color}80`
                                    }}
                                    disabled={isTyping}
                                />
                                <ActionIcon
                                    variant="filled"
                                    color={character.color}
                                    onClick={handleSend}
                                    disabled={isTyping || !inputText.trim()}
                                    size="lg"
                                >
                                    <IconSend size={18} />
                                </ActionIcon>
                            </Group>
                        </Box>
                    </>
                )}
            </motion.div>
        </Box >
    );
}
