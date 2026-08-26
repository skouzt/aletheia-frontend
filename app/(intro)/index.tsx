import { ListeningArt, MemoryArt, SpaceArt } from '@/components/lily/IntroArt';
import { IntroScreen } from '@/components/lily/IntroScreen';
import { LilyColors } from '@/constants/lily';
import { markIntroSeen } from '@/state/intro';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';

/**
 * The three intro screens, as one horizontally paged surface.
 *
 * They used to be three stack routes. Moving between them meant mounting a fresh
 * SVG-and-reanimated tree in the middle of the transition, which is what made it
 * stutter — the work landed exactly where there were no spare frames. Paging keeps
 * all three mounted and hands the movement to the native scroller, so Continue and
 * a swipe cost the same as scrolling a list. `ArtActive` (see IntroArt) stops the
 * off-screen pages animating while they wait.
 */
const PAGES = [
  {
    art: <ListeningArt />,
    wash: { width: 460, height: 380, opacity: 0.13, top: '46%' },
    headline: 'You don’t have to have the words.',
    body: 'Start wherever you are. Lily will meet you there.',
    footnote: 'Your thoughts don’t have to be perfect.',
    cta: 'Continue',
    variant: 'link' as const,
    artPaddingTop: 0,
  },
  {
    art: <MemoryArt />,
    wash: { width: 480, height: 400, opacity: 0.13, top: '44%' },
    headline: 'You can come back to the conversation.',
    body: 'Lily remembers what matters, so you don’t have to start from zero.',
    footnote: 'You choose what stays and what fades.',
    cta: 'Continue',
    variant: 'link' as const,
    artPaddingTop: 0,
  },
  {
    art: <SpaceArt />,
    wash: { width: 520, height: 440, opacity: 0.16, top: '42%' },
    headline: 'A space where you can be completely yourself.',
    body: 'No judgment. No performance. Just a place to think, talk, and be heard.',
    footnote: 'You can always change how Lily talks to you.',
    cta: 'Begin with Lily',
    variant: 'primary' as const,
    artPaddingTop: 64,
  },
];

export default function Intro() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const begin = useCallback(async () => {
    await markIntroSeen();
    router.replace('/(auth)/auth');
  }, [router]);

  const goTo = useCallback(
    (next: number) => {
      if (next >= PAGES.length) {
        void begin();
        return;
      }
      // Set the index here rather than waiting for the scroll to settle, so the step
      // rail and the animations turn over with the gesture instead of after it.
      setPage(next);
      scrollRef.current?.scrollTo({ x: width * next, animated: true });
    },
    [begin, width],
  );

  // Swiping is the other way to move, and it reports only when it lands.
  const onSettled = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      setPage((current) => (next === current ? current : next));
    },
    [width],
  );

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onSettled}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {PAGES.map((p, i) => (
          <View key={p.headline} style={{ width }}>
            <IntroScreen
              art={p.art}
              wash={p.wash}
              headline={p.headline}
              body={p.body}
              footnote={p.footnote}
              cta={p.cta}
              variant={p.variant}
              artPaddingTop={p.artPaddingTop}
              step={i}
              active={page === i}
              onNext={() => goTo(i + 1)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
