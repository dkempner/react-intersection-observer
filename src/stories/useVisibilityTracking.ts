import { useCallback, useRef, useEffect, useState } from 'react';
import { InViewHookResponse } from '..';

export const HALF_VISIBLE_THRESHOLD = 0.5;
const VISIBLE_TIME_MS = 1000; // Considered visible if it is in view port for 1000ms

interface UseVisibleTrackingOptions {
  firstPixelTrackingEventName: string;
  viewableTrackingEventName: string;
  trackingProperties?: any;
  inViewResponse: InViewHookResponse;
  topMargin: number
}

const useTrackOnce = (eventName: string) => {
  const called = useRef(0);
  return useCallback(() => {
    if (called.current) return;
    console.log(eventName);
    called.current++;
  }, [eventName]);
};

export function useVisibleTracking(options: UseVisibleTrackingOptions): void {
  const {
    firstPixelTrackingEventName,
    viewableTrackingEventName,
    inViewResponse,
    topMargin,
  } = options;
  const [, inView, entry] = inViewResponse;
  const trackFirstPixel = useTrackOnce(`${firstPixelTrackingEventName}`);
  const trackVisible = useTrackOnce(`${viewableTrackingEventName}`);
  const [productInView, setProductInView] = useState(false);

  const [threshold, setThreshold] = useState(0);

  const isLeavingVisible = entry?.isIntersecting === false;

  const onePixViz = isOnePixelVisible(entry, topMargin)

  if (
    firstPixelTrackingEventName.length !== 0 &&
    viewableTrackingEventName.length !== 0
  ) {
    if (inView && !productInView && onePixViz) {
      trackFirstPixel();
      setThreshold(HALF_VISIBLE_THRESHOLD);
      setProductInView(true);
    }
  }
  const halfVisible = isHalfVisible(entry, topMargin);

  // because we want to use a timer
  useEffect(() => {
    let timeout: number | undefined;

    // if element is not leaving visibility
    if (!isLeavingVisible && halfVisible) {
      // after visible for VISIBLE_TIME_MS
      timeout = setTimeout(() => {
        // track visible
        trackVisible();
        // fudge type to solve nodejs type confusion
      }, VISIBLE_TIME_MS) as unknown as number;
    }
    // an unsubscribe fn for cleanup
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
    // timer will get reset on any dependency change
  }, [halfVisible, isLeavingVisible, threshold, trackVisible]);
}

function isOnePixelVisible(entry: InViewHookResponse['entry'], topMargin: number) {
  if (!entry) {
    return false;
  }

  const { height, top, bottom} = entry.boundingClientRect;
  const intersectionRectHeight = entry.intersectionRect.height
  const modifiedIntersectionRectHeight = intersectionRectHeight - (top < topMargin ? topMargin : 0)
  const answer = modifiedIntersectionRectHeight > 0

  console.log({ intersectionRectHeight, modifiedIntersectionRectHeight, height, top, bottom, topMargin, answer });

  return answer
}

function isHalfVisible(entry: InViewHookResponse['entry'], topMargin: number) {
  if (!entry) {
    return false;
  }

  const { height, top, bottom} = entry.boundingClientRect;
  const intersectionRectHeight = entry.intersectionRect.height
  const modifiedIntersectionRectHeight = intersectionRectHeight - (top < topMargin ? topMargin : 0)
  const answer = modifiedIntersectionRectHeight >= height / 2;

  // console.log({ intersectionRectHeight, modifiedIntersectionRectHeight, height, top, bottom, topMargin, answer });

  return answer
}
