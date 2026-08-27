import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useSafePress } from '@/hooks/useSafePress';

type Props = TouchableOpacityProps & {
  onPress?: () => Promise<any> | void;
  delayMs?: number;
};

export const SafeTouchable: React.FC<Props> = ({ onPress, delayMs = 700, disabled, ...rest }) => {
  const { safePress } = useSafePress(delayMs);

  return (
    <TouchableOpacity
      {...rest}
      disabled={disabled}
      onPress={onPress ? () => safePress(onPress) : undefined}
    />
  );
};
