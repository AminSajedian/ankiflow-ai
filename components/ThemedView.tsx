import React from 'react';
import { Text, View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, children, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const textColor = useThemeColor({}, 'text');

  // Ensure any raw string/number children are wrapped in <Text> so RN doesn't complain.
  // This handles strings inside arrays or mixed children while preserving existing elements.
  const renderedChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return <Text style={{ color: textColor }}>{String(child)}</Text>;
    }
    return child;
  });

  return <View style={[{ backgroundColor }, style]} {...otherProps}>{renderedChildren}</View>;
}
