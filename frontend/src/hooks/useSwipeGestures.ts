import { useSwipeable, SwipeableHandlers, SwipeableProps } from 'react-swipeable';

export interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  background: string;
  action: () => void;
}

export interface SwipeGestureConfig {
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

export const useSwipeGestures = (config: SwipeGestureConfig): SwipeableHandlers => {
  const {
    leftAction,
    rightAction,
    threshold = 50,
    preventDefaultTouchmoveEvent = true,
  } = config;

  const swipeableProps: SwipeableProps = {
    onSwipedLeft: () => {
      if (leftAction) {
        leftAction.action();
      }
    },
    onSwipedRight: () => {
      if (rightAction) {
        rightAction.action();
      }
    },
    delta: threshold,
    preventDefaultTouchmoveEvent,
    trackTouch: true,
    trackMouse: false, // Disable mouse tracking for mobile-only experience
  };

  return useSwipeable(swipeableProps);
};

export default useSwipeGestures;