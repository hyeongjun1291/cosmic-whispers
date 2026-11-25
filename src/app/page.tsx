'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { calculateSaju, type SajuData } from '@/lib/saju';
import { LAST_VISIT, clearChatHistory, readBrowserData, resetBrowserData } from '@/lib/browser-data';
import { ChatClientError, useChatClient } from '@/lib/chat-client';
import { getAffectionScore, isEmotion, isRecord, MAX_HISTORY_MESSAGE_LENGTH, MAX_USER_NAME_LENGTH, type ChatMessage } from '@/lib/chat-contract';
import { shuffleTarotDeck, type TarotCard } from '@/lib/tarotData';
import Onboarding from '@/components/Onboarding';
import SajuForm, { type SajuFormData } from '@/components/SajuForm';
import TarotCardSelection from '@/components/TarotCardSelection';
import PungryuGate from '@/components/PungryuGate';
import VisualNovel from '@/components/VisualNovel';
import SajuDashboard from '@/components/SajuDashboard';
import SettingsModal from '@/components/SettingsModal';
import CharacterSelection from '@/components/CharacterSelection';
import CharacterNavImage from '@/components/CharacterNavImage';
import TitleScreen from '@/components/TitleScreen';
import { saveEpisode, getRelevantEpisodes } from '@/lib/memory';
import { CHARACTERS } from '@/lib/characters';
import { Box, Drawer, ActionIcon, Modal, Text, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLayoutDashboard, IconSettings } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

export default function Home() {
  const [userData, setUserData] = useState<{ name: string } | null>(null);
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [sajuBirthTimeKnown, setSajuBirthTimeKnown] = useState(false);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const resetWidget = useCallback(() => turnstileRef.current?.reset(), []);
  const { request: requestChat, ready: chatReady, setToken, cancel: cancelChat } = useChatClient(resetWidget);

  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [dashboardOpened, { toggle: toggleDashboard }] = useDisclosure(false);
  const [sajuModalOpened, { open: openSajuModal, close: closeSajuModal }] = useDisclosure(false);
  const [pendingCharacterId, setPendingCharacterId] = useState<string | null>(null);
  const [tarotModalOpened, { open: openTarotModal, close: closeTarotModal }] = useDisclosure(false);
  const [pungryuModalOpened, { open: openPungryuModal, close: closePungryuModal }] = useDisclosure(false);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [tarotDeck, setTarotDeck] = useState<TarotCard[]>([]);

  const [changeCharModalOpened, { open: openChangeCharModal, close: closeChangeCharModal }] = useDisclosure(false);
  const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
  const [alertModalOpened, { open: openAlertModal, close: closeAlertModal }] = useDisclosure(false);

  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: () => { } });
  const [alertMessage, setAlertMessage] = useState('');
  const [clearHistoryOnSwitch, setClearHistoryOnSwitch] = useState(false);
  const [affectionScores, setAffectionScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const savedUser = readBrowserData('cosmic_user');
      const savedHistory = readBrowserData('cosmic_history');
      const savedAffection = readBrowserData('cosmic_affection');

      if (isRecord(savedUser) && typeof savedUser.name === 'string' && savedUser.name.trim()) {
        setUserData({ name: savedUser.name.trim().slice(0, MAX_USER_NAME_LENGTH) });
      }
      if (Array.isArray(savedHistory)) {
        const restored: ChatMessage[] = [];
        for (const entry of savedHistory) {
          if (!isRecord(entry) || (entry.role !== 'user' && entry.role !== 'model')
            || typeof entry.text !== 'string' || !entry.text.trim()) continue;
          restored.push({ role: entry.role, text: entry.text.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
            emotion: isEmotion(entry.emotion) ? entry.emotion : undefined });
        }
        setHistory(restored);
      }
      if (isRecord(savedAffection)) {
        setAffectionScores(Object.fromEntries(Object.keys(CHARACTERS)
          .map(id => [id, getAffectionScore(savedAffection[id])])));
      }
      setIsInitialized(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleOnboardingComplete = (data: { name: string }) => {
    setUserData(data);
    localStorage.setItem('cosmic_user', JSON.stringify(data));
  };

  const calculateAndSetSaju = (data: SajuFormData) => {
    const calculated = calculateSaju(
      dayjs(data.birthDate).year(),
      dayjs(data.birthDate).month() + 1,
      dayjs(data.birthDate).date(),
      (() => {
        if (data.birthTime === 'unknown') return 12;
        const timeStr = data.birthTime.replace(':', '');
        let h = 0;
        if (timeStr.length === 4) h = parseInt(timeStr.substring(0, 2));
        else if (data.birthTime.includes(':')) h = parseInt(data.birthTime.split(':')[0]);
        else h = parseInt(data.birthTime);
        return isNaN(h) ? 0 : h;
      })(),
      (() => {
        if (data.birthTime === 'unknown') return 0;
        const timeStr = data.birthTime.replace(':', '');
        let m = 0;
        if (timeStr.length === 4) m = parseInt(timeStr.substring(2, 4));
        else if (data.birthTime.includes(':') && data.birthTime.split(':')[1]) m = parseInt(data.birthTime.split(':')[1]);
        return isNaN(m) ? 0 : m;
      })(),
      data.calendarType === 'lunar',
      data.isLeap === 'true'
    );
    setSaju(calculated);
    return calculated;
  };

  const handleSajuComplete = (data: SajuFormData) => {
    if (!data.birthDate) return;
    try {
      calculateAndSetSaju(data);
    } catch {
      setAlertMessage('사주를 계산할 수 없어요. 생년월일과 윤달 여부를 다시 확인해 주세요.');
      openAlertModal();
      return;
    }
    setSajuBirthTimeKnown(data.birthTime !== 'unknown');
    closeSajuModal();

    // Proceed to chat with pending character (Cheongsan)
    if (pendingCharacterId) {
      setCharacterId(pendingCharacterId);
      localStorage.setItem('cosmic_character', pendingCharacterId);
      const char = CHARACTERS[pendingCharacterId];
      const newHistory: ChatMessage[] = [{ role: 'model', text: char.greeting, emotion: 'default' }];
      setHistory(newHistory);
      localStorage.setItem('cosmic_history', JSON.stringify(newHistory));
      setPendingCharacterId(null);
    }
  };

  const handleTarotComplete = (card: TarotCard) => {
    setSelectedCard(card);
    closeTarotModal();

    if (pendingCharacterId) {
      setCharacterId(pendingCharacterId);
      localStorage.setItem('cosmic_character', pendingCharacterId);
      initializeZionChat(pendingCharacterId, card);
      setPendingCharacterId(null);
    }
  };

  const initializeZionChat = async (charId: string, card: TarotCard) => {
    setIsTyping(true);
    setHistory([]);
    localStorage.setItem(LAST_VISIT, String(Date.now()));

    try {
      const response = await requestChat({
        message: '행운의 카드를 뽑았습니다. 해석해주세요.',
        characterId: charId,
        userName: userData?.name || 'User',
        context: `User drew the Tarot card: ${card.name}.\nMeaning: ${card.meaning}\n\nInterpret this card for the user as your first greeting.`,
        history: [],
        affectionScore: getAffectionScore(affectionScores[charId]),
      });
      const newHistory: ChatMessage[] = [{ role: 'model', text: response.text, emotion: response.emotion }];
      setHistory(newHistory);
      localStorage.setItem('cosmic_history', JSON.stringify(newHistory));
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setAlertMessage(error instanceof ChatClientError ? error.message : '지금은 카드 해석을 가져올 수 없어요.');
        openAlertModal();
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handlePungryuEnter = () => {
    closePungryuModal();
    if (pendingCharacterId) {
      setCharacterId(pendingCharacterId);
      localStorage.setItem('cosmic_character', pendingCharacterId);
      const char = CHARACTERS[pendingCharacterId];
      const newHistory: ChatMessage[] = [{ role: 'model', text: char.greeting, emotion: 'default' }];
      setHistory(newHistory);
      localStorage.setItem('cosmic_history', JSON.stringify(newHistory));
      setPendingCharacterId(null);
    }
  };

  const handleCharacterSelect = (id: string) => {
    if (isTyping) return;
    cancelChat();
    if (id === 'cheongsan' && !saju) {
      setPendingCharacterId(id);
      openSajuModal();
    } else if (id === 'zion') {
      setPendingCharacterId(id);
      setTarotDeck(shuffleTarotDeck());
      openTarotModal();
    } else if (id === 'pungryu') {
      setPendingCharacterId(id);
      openPungryuModal();
    } else {
      setCharacterId(id);
      localStorage.setItem('cosmic_character', id);
      const char = CHARACTERS[id];
      const newHistory: ChatMessage[] = [{ role: 'model', text: char.greeting, emotion: 'default' }];
      setHistory(newHistory);
      localStorage.setItem('cosmic_history', JSON.stringify(newHistory));
    }
  };


  useEffect(() => {
    if (!userData || !characterId || history.length === 0 || !chatReady || isTyping) return;
    const storedLastVisit = Number(localStorage.getItem(LAST_VISIT));
    const now = Date.now();
    if (!storedLastVisit) {
      localStorage.setItem(LAST_VISIT, String(now));
      return;
    }
    if (now - storedLastVisit <= 86_400_000) return;

    localStorage.setItem(LAST_VISIT, String(now));
    const memories = getRelevantEpisodes(3);
    void requestChat({
      message: '오랜만에 돌아왔습니다. 먼저 인사를 건네고 안부를 물어봐 주세요.',
      characterId,
      userName: userData.name,
      context: memories ? `[PAST MEMORIES]\n${memories}` : '',
      history,
      affectionScore: getAffectionScore(affectionScores[characterId]),
    }).then(response => {
      const updated: ChatMessage[] = [...history, { role: 'model', text: response.text, emotion: response.emotion }];
      setHistory(updated);
      localStorage.setItem('cosmic_history', JSON.stringify(updated));
    }).catch(() => {
      // A failed optional greeting does not change the conversation.
    });
  }, [affectionScores, characterId, chatReady, history, isTyping, requestChat, userData]);

  const handleSendMessage = async (text: string): Promise<boolean> => {
    if (!characterId || isTyping) return false;
    localStorage.setItem(LAST_VISIT, String(Date.now()));
    setIsTyping(true);

    try {
      let context = '';
      if (characterId === 'cheongsan' && saju) {
        const time = sajuBirthTimeKnown ? saju.time.ganji + '시생' : '생시 모름';
        context = `${saju.year.ganji}년 ${saju.month.ganji}월 ${saju.day.ganji}일 ${time} (${saju.day.sibsin}격)`;
      } else if (characterId === 'zion' && selectedCard) {
        context = `Selected Tarot Card: ${selectedCard.name}\nMeaning: ${selectedCard.meaning}`;
      }
      const memories = getRelevantEpisodes(3);
      if (memories) context += `\n\n[PAST MEMORIES]\n${memories}`;

      const currentScore = getAffectionScore(affectionScores[characterId]);
      const response = await requestChat({
        message: text,
        characterId,
        userName: userData?.name || 'User',
        context,
        history,
        affectionScore: currentScore,
      });

      const updatedHistory: ChatMessage[] = [...history, { role: 'user', text },
        { role: 'model', text: response.text, emotion: response.emotion }];
      setHistory(updatedHistory);
      localStorage.setItem('cosmic_history', JSON.stringify(updatedHistory));

      const delta = response.affectionScore;
      if (Math.abs(delta) >= 2) saveEpisode(text, response.text, response.emotion, delta);
      if (delta !== 0) {
        const updatedScores = { ...affectionScores, [characterId]: Math.min(100, Math.max(0, currentScore + delta)) };
        setAffectionScores(updatedScores);
        localStorage.setItem('cosmic_affection', JSON.stringify(updatedScores));
      }
      return true;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setAlertMessage(error instanceof ChatClientError ? error.message : '운명의 흐름에 일시적인 장애가 발생했어요.');
        openAlertModal();
      }
      return false;
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    closeSettings();
    setConfirmConfig({
      title: '데이터 초기화',
      message: '정말로 모든 데이터를 삭제하고 처음으로 돌아가시겠습니까?',
      action: () => {
        cancelChat();
        resetBrowserData(localStorage);
        setUserData(null);
        setSaju(null);
        setSajuBirthTimeKnown(false);
        setHistory([]);
        setCharacterId(null);
        setSelectedCard(null);
        setAffectionScores({});
        closeConfirmModal();
      }
    });
    openConfirmModal();
  };

  const handleChangeCharacterRequest = () => {
    closeSettings();
    openChangeCharModal();
  };

  const confirmChangeCharacter = () => {
    cancelChat();
    if (clearHistoryOnSwitch) {
      setHistory([]);
      clearChatHistory(localStorage);
      setSelectedCard(null);
    }
    setCharacterId(null);
    localStorage.removeItem('cosmic_character');
    closeChangeCharModal();
  };

  if (!isInitialized) return null;

  const DashboardContent = (
    <>
      <Text size="xl" fw={700} c="gold" mb="md">{characterId === 'zion' ? "당신의 타로 카드" : "당신의 운명 원국"}</Text>
      {characterId === 'cheongsan' && (saju ? <SajuDashboard data={saju} /> : <Box p="md">사주 정보가 없습니다.</Box>)}
      {characterId === 'zion' && (selectedCard ? (
        <Box p="md" ta="center">
          <Box pos="relative" h={300} mb={20}>
            <Image
              src={selectedCard.image}
              alt={selectedCard.name}
              fill
              sizes="(max-width: 768px) 80vw, 320px"
              style={{ objectFit: 'contain', borderRadius: '12px' }}
            />
          </Box>
          <Text size="xl" fw={700} c="gold">{selectedCard.name}</Text>
          <Text size="sm" mt="md">{selectedCard.meaning.split('/')[1]}</Text>
        </Box>
      ) : <Box p="md">선택된 카드가 없습니다.</Box>)}
    </>
  );

  return (
    <Box mih="100vh" style={{ position: 'relative' }}>
      <div className="starfield" />

      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
        <Box style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999 }}>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            options={{ appearance: 'interaction-only' }}
            onSuccess={setToken}
            onExpire={() => {
              setToken();
              resetWidget();
            }}
            onError={() => setToken()}
          />
        </Box>
      ) : null}

      {showTitle ? (
        <TitleScreen onEnter={() => setShowTitle(false)} />
      ) : (
        <>
          {/* Global Modals */}
          <Modal opened={alertModalOpened} onClose={closeAlertModal} title="알림" centered overlayProps={{ blur: 3 }} styles={{ content: { background: 'rgba(30, 35, 50, 0.95)', border: '1px solid gold' } }}>
            <Text mb="lg">{alertMessage}</Text>
            <Group justify="flex-end">
              <ActionIcon size="xl" color="gold" variant="filled" onClick={closeAlertModal}>확인</ActionIcon>
            </Group>
          </Modal>

          <Modal opened={confirmModalOpened} onClose={closeConfirmModal} title={confirmConfig.title} centered overlayProps={{ blur: 3 }} styles={{ content: { background: 'rgba(30, 35, 50, 0.95)', border: '1px solid gold' } }}>
            <Text mb="lg">{confirmConfig.message}</Text>
            <Group justify="flex-end">
              <ActionIcon color="gray" size="xl" variant="subtle" onClick={closeConfirmModal}>취소</ActionIcon>
              <ActionIcon color="red" size="xl" variant="filled" onClick={confirmConfig.action}>확인</ActionIcon>
            </Group>
          </Modal>

          <Modal opened={changeCharModalOpened} onClose={closeChangeCharModal} title="대화 상대 변경" centered overlayProps={{ blur: 3 }} styles={{ content: { background: 'rgba(30, 35, 50, 0.95)', border: '1px solid gold' } }}>
            <Stack gap="md">
              <Text>대화 상대를 변경하시겠습니까?</Text>
              <Stack gap="sm">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
                  <input type="checkbox" checked={clearHistoryOnSwitch} onChange={(e) => setClearHistoryOnSwitch(e.target.checked)} />
                  <Text size="sm">기존 대화 내용 지우기</Text>
                </label>

              </Stack>
              <Group justify="flex-end" mt="md">
                <ActionIcon color="gray" size="xl" variant="subtle" onClick={closeChangeCharModal}>취소</ActionIcon>
                <ActionIcon color="gold" size="xl" variant="filled" onClick={confirmChangeCharacter}>변경</ActionIcon>
              </Group>
            </Stack>
          </Modal>

          {!userData ? (
            <Onboarding onComplete={handleOnboardingComplete} />
          ) : !characterId ? (
            <CharacterSelection onSelect={handleCharacterSelect} />
          ) : (
            <>
              <VisualNovel
                userName={userData.name}
                history={history}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                characterId={characterId}
                affectionScore={getAffectionScore(affectionScores[characterId])}
                onSwitchToCharacter={(id) => {
                  if (id === characterId) return;
                  handleCharacterSelect(id);
                }}
                dashboard={DashboardContent}
              />

              {/* Mobile Only Dashboard Button and Drawer */}
              <Box hiddenFrom="sm">
                <ActionIcon
                  variant="filled"
                  color="indigo"
                  size="xl"
                  onClick={toggleDashboard}
                  style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, borderRadius: '50%' }}
                >
                  <IconLayoutDashboard size={24} />
                </ActionIcon>

                <Drawer
                  opened={dashboardOpened}
                  onClose={toggleDashboard}
                  title={characterId === 'zion' ? "당신의 타로 카드" : "당신의 운명 원국"}
                  position="left"
                  size="md"
                  styles={{ content: { background: 'var(--background)', color: 'white' } }}
                >
                  {/* Character Navigation - Mobile Dashboard */}
                  <Box mb="lg" pb="md" style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.2)' }}>
                    <Text size="sm" c="dimmed" mb="sm">대화 상대 선택</Text>
                    <Stack gap="sm">
                      {Object.values(CHARACTERS).map((char) => {
                        const affection = getAffectionScore(affectionScores[char.id]);
                        return (
                          <Box
                            key={char.id}
                            onClick={() => {
                              handleCharacterSelect(char.id);
                              toggleDashboard();
                            }}
                            style={{
                              cursor: 'pointer',
                              background: characterId === char.id
                                ? 'rgba(255, 215, 0, 0.15)'
                                : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              border: characterId === char.id
                                ? '1px solid rgba(255, 215, 0, 0.5)'
                                : '1px solid rgba(255, 255, 255, 0.05)',
                              transition: 'all 0.2s ease',
                              padding: '12px'
                            }}
                          >
                            <Group gap="md" wrap="nowrap">
                              <Box
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  flexShrink: 0
                                }}
                              >
                                <CharacterNavImage character={char} size={40} />
                              </Box>
                              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Text size="sm" fw={characterId === char.id ? 700 : 500} c={characterId === char.id ? 'gold' : 'white'}>
                                  {char.name}
                                </Text>
                                <Text size="xs" c="dimmed" truncate>{char.title}</Text>
                              </Stack>
                              <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
                                <Group gap={4}>
                                  <Text size="xs" c="pink" fw={500}>
                                    {affection}%
                                  </Text>
                                </Group>
                                <Box
                                  style={{
                                    width: '50px',
                                    height: '3px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <Box
                                    style={{
                                      width: `${affection}%`,
                                      height: '100%',
                                      background: affection >= 70
                                        ? 'linear-gradient(90deg, #ff6b6b, #ff8787)'
                                        : affection >= 40
                                          ? 'linear-gradient(90deg, #ffa8a8, #ffb3b3)'
                                          : 'linear-gradient(90deg, #868e96, #adb5bd)',
                                      transition: 'width 0.3s ease'
                                    }}
                                  />
                                </Box>
                              </Stack>
                            </Group>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>

                  {DashboardContent}
                </Drawer>
              </Box>

            </>
          )}

          {userData && (
            <>
              <ActionIcon
                aria-label="시스템 설정"
                onClick={openSettings}
                variant="light"
                color="gray"
                size="lg"
                style={{ position: 'absolute', top: 12, right: 12, zIndex: 70 }}
              >
                <IconSettings size={20} />
              </ActionIcon>
              <SettingsModal
                opened={settingsOpened}
                onClose={closeSettings}
                onReset={handleReset}
                onChangeCharacter={characterId ? handleChangeCharacterRequest : undefined}
              />
            </>
          )}

          <Modal opened={sajuModalOpened} onClose={closeSajuModal} title="운명 데이터 입력" centered overlayProps={{ blur: 3 }}>
            <SajuForm onComplete={handleSajuComplete} onCancel={closeSajuModal} />
          </Modal>

          <Modal opened={tarotModalOpened} onClose={closeTarotModal} fullScreen withCloseButton={false} styles={{ content: { background: 'rgba(0,0,0,0.9)' } }}>
            <TarotCardSelection deck={tarotDeck} onSelect={handleTarotComplete} />
          </Modal>

          <Modal opened={pungryuModalOpened} onClose={closePungryuModal} fullScreen withCloseButton={false} styles={{ content: { background: '#000' } }}>
            <PungryuGate onEnter={handlePungryuEnter} onCancel={closePungryuModal} />
          </Modal>
        </>
      )}
    </Box>
  );
}
